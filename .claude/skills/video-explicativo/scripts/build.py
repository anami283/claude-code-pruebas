#!/usr/bin/env python3
"""Orquestador: storyboard.json -> voz -> línea de tiempo -> render -> mezcla final (MP4).

Uso típico:
  python3 build.py storyboard.json --out video.mp4                  # voz auto (ElevenLabs > Piper > silencio)
  python3 build.py storyboard.json --tts none --stills              # sólo cuadros de control, sin voz
  python3 build.py storyboard.json --tts elevenlabs --voice <id>
  python3 build.py storyboard.json --tts dir:./audios               # audios ya generados beat_001.mp3...
  python3 build.py storyboard.json --music mi_musica.mp3 | --music none
"""
import argparse, hashlib, json, os, shutil, subprocess, sys, wave
from pathlib import Path

HERE = Path(__file__).resolve().parent
SKILL = HERE.parent
ENGINE = SKILL / "engine"
sys.path.insert(0, str(HERE))
import tts as TTS  # noqa: E402
import audio as AUD  # noqa: E402
from validate import validate  # noqa: E402

SR = 48000


def sh(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        raise SystemExit(f"Error ejecutando {' '.join(map(str, cmd[:3]))}...:\n{r.stderr[-2000:]}")
    return r.stdout


def ensure_engine():
    if not (ENGINE / "node_modules" / "playwright-core").exists():
        print("· instalando dependencias del motor (npm)...")
        sh(["npm", "install", "--silent"], cwd=ENGINE)


def flatten(sb):
    """Devuelve lista de escenas con su capítulo, y lista plana de beats."""
    scenes, beats = [], []
    chapters = sb["chapters"]
    for ci, ch in enumerate(chapters, 1):
        chap = {"num": ch.get("num", ci), "section": ch.get("section", ""), "fig": ch.get("fig", ""), "theme": ch.get("theme", "light")}
        for sc in ch["scenes"]:
            s = dict(sc)
            s["chapter"] = {**chap, **(sc.get("chapter") or {})}
            if "theme" in sc:
                s["chapter"]["theme"] = sc["theme"]
            s["beats"] = [dict(b) for b in sc.get("beats", [])]
            scenes.append(s)
            beats.extend(s["beats"])
    return scenes, beats


def build_timeline(sb, scenes, durations, gap):
    meta = sb.get("meta", {})
    t = float(meta.get("lead", 0.5))
    out = []
    for si, sc in enumerate(scenes):
        start = t if si else 0.0
        tr = sc.get("transition") or {}
        if si and tr.get("type") not in (None, "cut", "none"):
            t += float(sc.get("lead", 0.25))  # dejar respirar la transición antes de hablar
        bl = []
        for b in sc["beats"]:
            d = durations.get(id(b), 0.0)
            speech = d
            dur = max(float(b.get("min", 0.9)), speech + float(b.get("pause", gap))) if speech > 0 else float(b.get("dur", 1.6))
            bl.append({**{k: v for k, v in b.items() if k not in ("min", "pause", "dur")}, "start": round(t, 3), "end": round(t + dur, 3), "speech": round(speech, 3)})
            t += dur
        t += float(sc.get("hold", 0.15))
        if bl:
            bl[0]["start"] = round(start, 3) if not bl[0].get("say") else bl[0]["start"]
        s = {k: v for k, v in sc.items() if k not in ("beats", "lead", "hold")}
        s.update({"start": round(start, 3), "end": round(t, 3), "beats": bl})
        out.append(s)
    # el primer beat de cada escena empieza donde empieza la escena para los subtítulos/capas
    for s in out:
        if s["beats"] and not s["beats"][0].get("say"):
            s["beats"][0]["start"] = s["start"]
    meta_out = {**meta, "chapters": meta.get("chapters", len(sb["chapters"]))}
    return {"meta": meta_out, "duration": round(t, 3), "scenes": out}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("storyboard")
    ap.add_argument("--out", default=None)
    ap.add_argument("--work", default=None, help="carpeta de trabajo (por defecto junto al storyboard)")
    ap.add_argument("--tts", default="auto", help="auto | elevenlabs | piper | dir:<carpeta> | none")
    ap.add_argument("--voice", default=None, help="voice_id de ElevenLabs o nombre de voz Piper")
    ap.add_argument("--music", default="auto", help="auto (pista generada) | none | ruta a archivo")
    ap.add_argument("--no-sfx", action="store_true")
    ap.add_argument("--stills", action="store_true", help="sólo genera cuadros de control (1 por beat)")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--gap", type=float, default=0.28, help="silencio entre frases (s)")
    ap.add_argument("--list-beats", action="store_true", help="imprime las frases numeradas (para generar audios fuera, p.ej. con el conector MCP de ElevenLabs)")
    a = ap.parse_args()

    sb_path = Path(a.storyboard).resolve()
    sb = json.loads(sb_path.read_text(encoding="utf-8"))
    errs, warns = validate(sb)
    for w in warns:
        print("  aviso:", w)
    if errs:
        for e in errs:
            print("  ERROR:", e)
        raise SystemExit("El storyboard tiene errores; corrígelos antes de renderizar.")

    if a.list_beats:
        _, beats = flatten(sb)
        spoken = [TTS.normalize(b["say"]) for b in beats if (b.get("say") or "").strip()]
        print(json.dumps([{"file": f"beat_{i:03d}.mp3", "text": t} for i, t in enumerate(spoken, 1)], ensure_ascii=False, indent=1))
        return

    work = Path(a.work or sb_path.parent / (sb_path.stem + "_work")).resolve()
    (work / "audio").mkdir(parents=True, exist_ok=True)
    out = Path(a.out or sb_path.with_suffix(".mp4")).resolve()
    ensure_engine()

    scenes, beats = flatten(sb)
    meta = sb.get("meta", {})

    # ---------- voz ----------
    provider = TTS.pick(a.tts, meta.get("voice", {}), a.voice)
    print(f"· voz: {provider.describe()}")
    durations, clips = {}, []
    spoken = [b for b in beats if (b.get("say") or "").strip()]
    for i, b in enumerate(spoken, 1):
        text = TTS.normalize(b["say"])
        prev_t = TTS.normalize(spoken[i - 2]["say"]) if i > 1 else ""
        next_t = TTS.normalize(spoken[i]["say"]) if i < len(spoken) else ""
        wav = provider.synth(text, work / "audio", i, prev_t, next_t)
        if wav:
            durations[id(b)] = AUD.wav_duration(wav)
            clips.append((b, wav))
        else:
            durations[id(b)] = TTS.estimate(text)
        print(f"\r  frases: {i}/{len(spoken)}", end="", flush=True)
    print()

    tl = build_timeline(sb, scenes, durations, a.gap)
    (work / "timeline.json").write_text(json.dumps(tl, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"· duración: {tl['duration']:.1f}s en {len(tl['scenes'])} escenas")

    if a.stills:
        sd = work / "stills"
        if sd.exists():
            shutil.rmtree(sd)
        sh(["node", str(ENGINE / "render.mjs"), "--timeline", str(work / "timeline.json"), "--stills", str(sd)])
        AUD.contact_sheet(sd, work / "contact_sheet.jpg")
        print(f"· cuadros de control: {sd}  |  hoja de contacto: {work / 'contact_sheet.jpg'}")
        return

    # ---------- video mudo ----------
    silent = work / "video_mudo.mp4"
    print("· renderizando cuadros...")
    subprocess.run(["node", str(ENGINE / "render.mjs"), "--timeline", str(work / "timeline.json"), "--out", str(silent), "--workers", str(a.workers)], check=True)

    # ---------- pista de voz ----------
    # ubicar cada clip en el inicio de su beat (ya en la línea de tiempo)
    starts = {}
    for s in tl["scenes"]:
        for b in s["beats"]:
            if b.get("say"):
                starts.setdefault(b["say"], []).append(b["start"])
    placed = []
    for b, wav in clips:
        st = starts[b["say"]].pop(0)
        placed.append((st + float(b.get("delay", 0.0)), wav))
    voice = work / "voz.wav"
    AUD.assemble(placed, tl["duration"], voice)

    # ---------- música y efectos ----------
    music = None
    if a.music == "auto":
        music = work / "musica.wav"
        AUD.generate_music(tl["duration"], music, mood=meta.get("music", {}).get("mood", "tech"), bpm=meta.get("music", {}).get("bpm", 96))
    elif a.music != "none":
        music = Path(a.music).resolve()
    sfx = None
    if not a.no_sfx:
        sfx = work / "sfx.wav"
        AUD.generate_sfx(tl, sfx)

    print("· mezclando audio y exportando...")
    AUD.final_mix(silent, voice, music, sfx, tl["duration"], out)
    AUD.contact_sheet_from_video(out, work / "qa_contact_sheet.jpg")
    print(f"\n✔ Video listo: {out}\n  QA: {work / 'qa_contact_sheet.jpg'}")


if __name__ == "__main__":
    main()

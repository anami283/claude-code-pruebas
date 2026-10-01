"""Audio: ensamblado de voz, música ambiental generada, efectos de transición, mezcla final y hojas de QA."""
import subprocess, wave
from pathlib import Path

import numpy as np

SR = 48000


def wav_duration(p):
    with wave.open(str(p)) as w:
        return w.getnframes() / w.getframerate()


def read_wav(p):
    with wave.open(str(p)) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        if w.getnchannels() == 2:
            a = a.reshape(-1, 2).mean(axis=1)
    return a


def write_wav(p, a, ch=1):
    a = np.clip(a, -1, 1)
    with wave.open(str(p), "wb") as w:
        w.setnchannels(ch); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((a * 32767).astype(np.int16).tobytes())


def assemble(placed, duration, out):
    buf = np.zeros(int((duration + 1) * SR), dtype=np.float32)
    for st, wav in placed:
        a = read_wav(wav)
        i = int(st * SR)
        n = min(len(a), len(buf) - i)
        if n > 0:
            buf[i:i + n] += a[:n]
    write_wav(out, buf[: int(duration * SR)])


# ---------- música ----------
NOTE = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}


def hz(n, octv):
    return 440.0 * 2 ** ((NOTE[n] + 12 * (octv - 4) - 9) / 12)


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x); acc = 0.0
    # filtro de un polo (vectorizado por bloques sería más rápido; suficiente para < 3 min)
    from scipy.signal import lfilter  # type: ignore
    return lfilter([1 - a], [1, -a], x)


def _lp(x, cutoff):
    try:
        return lowpass(x, cutoff)
    except Exception:
        # respaldo sin scipy: media móvil
        k = max(1, int(SR / cutoff / 2))
        return np.convolve(x, np.ones(k) / k, mode="same")


def generate_music(duration, out, mood="tech", bpm=96):
    """Colchón ambiental 'tech/documental': pad de acordes + pulso suave + arpegio tenue."""
    rng = np.random.default_rng(7)
    prog = {
        "tech": [("A", "m"), ("F", ""), ("C", ""), ("G", "")],
        "calido": [("C", ""), ("A", "m"), ("F", ""), ("G", "")],
        "serio": [("D", "m"), ("A#", ""), ("F", ""), ("C", "")],
    }.get(mood, [("A", "m"), ("F", ""), ("C", ""), ("G", "")])
    beat = 60 / bpm
    bar = beat * 4
    n = int((duration + 2) * SR)
    t = np.arange(n) / SR
    pad = np.zeros(n, np.float32); arp = np.zeros(n, np.float32); pulse = np.zeros(n, np.float32)
    names = list(NOTE.keys())
    for bi in range(int(duration / (bar * 2)) + 2):
        root, q = prog[bi % len(prog)]
        r = NOTE[root]
        third = 3 if q == "m" else 4
        chord = [(names[r], 3), (names[(r + third) % 12], 3 + (r + third) // 12), (names[(r + 7) % 12], 3 + (r + 7) // 12), (names[r], 4)]
        s0, s1 = int(bi * bar * 2 * SR), int((bi + 1) * bar * 2 * SR)
        if s0 >= n:
            break
        s1 = min(s1, n)
        seg = t[s0:s1] - t[s0]
        L = s1 - s0
        env = np.minimum(1, seg / 1.2) * np.minimum(1, (seg[-1] - seg + 0.01) / 1.2)
        for (nn, oc) in chord:
            f0 = hz(nn, oc)
            for det in (-0.12, 0.12):
                f = f0 * 2 ** (det / 12)
                pad[s0:s1] += (np.sin(2 * np.pi * f * seg) * 0.6 + 0.4 * np.sign(np.sin(2 * np.pi * f * seg)) * 0.25) * env * 0.05
        # bajo
        fb = hz(names[r], 2)
        pad[s0:s1] += np.sin(2 * np.pi * fb * seg) * env * 0.09
        # arpegio en corcheas
        step = beat / 2
        for k in range(int((s1 - s0) / SR / step)):
            nn, oc = chord[[0, 1, 2, 3, 2, 1][k % 6]]
            f = hz(nn, oc + 1)
            a0 = s0 + int(k * step * SR); a1 = min(n, a0 + int(0.45 * SR))
            tt = t[a0:a1] - t[a0]
            arp[a0:a1] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 9) * 0.035
        # pulso (kick suave) en negras
        for k in range(int((s1 - s0) / SR / beat)):
            a0 = s0 + int(k * beat * SR); a1 = min(n, a0 + int(0.25 * SR))
            tt = t[a0:a1] - t[a0]
            pulse[a0:a1] += np.sin(2 * np.pi * (55 + 60 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 14) * (0.12 if k % 2 == 0 else 0.06)
            # hi-hat tenue
            h1 = min(n, a0 + int(0.04 * SR) + int(beat / 2 * SR))
            h0 = a0 + int(beat / 2 * SR)
            if h0 < h1:
                pulse[h0:h1] += rng.standard_normal(h1 - h0).astype(np.float32) * np.exp(-np.arange(h1 - h0) / SR * 90) * 0.012
    pad = _lp(pad, 1800)
    mix = pad + arp + pulse
    # entrada y salida
    fade = np.minimum(1, t / 1.5) * np.minimum(1, np.maximum(0, (duration + 0.2 - t) / 2.5))
    mix = mix * fade
    mix = mix / (np.max(np.abs(mix)) + 1e-6) * 0.8
    # estéreo con leve ensanche del arpegio
    left = mix + np.roll(arp, 240) * 0.3
    right = mix + np.roll(arp, -240) * 0.3
    st = np.stack([left, right], axis=1).reshape(-1)[: int(duration * SR) * 2]
    write_wav(out, st, ch=2)


def generate_sfx(tl, out):
    """Whoosh suave en transiciones de escena + 'tick' en cambios de capítulo."""
    dur = tl["duration"]
    buf = np.zeros(int((dur + 1) * SR), np.float32)
    rng = np.random.default_rng(3)
    prev_ch = None
    for s in tl["scenes"]:
        tr = (s.get("transition") or {}).get("type")
        st = int(s["start"] * SR)
        if tr in ("zoom", "wipe_up", "push_up", "slide_left", "wipe_left"):
            L = int(0.7 * SR)
            noise = rng.standard_normal(L).astype(np.float32)
            env = np.sin(np.linspace(0, np.pi, L)) ** 2
            w = _lp(noise, 1400) * env * 0.35
            a = max(0, st - int(0.15 * SR)); n = min(L, len(buf) - a)
            buf[a:a + n] += w[:n]
        ch = s["chapter"].get("num")
        if prev_ch is not None and ch != prev_ch:
            L = int(0.12 * SR); tt = np.arange(L) / SR
            tick = np.sin(2 * np.pi * 1800 * tt) * np.exp(-tt * 60) * 0.12
            n = min(L, len(buf) - st); buf[st:st + n] += tick[:n]
        prev_ch = ch
    write_wav(out, buf[: int(dur * SR)])


def final_mix(video, voice, music, sfx, duration, out):
    inputs = ["-i", str(video), "-i", str(voice)]
    fc = "[1:a]aformat=channel_layouts=stereo,highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=5:release=120,volume=1.0[vo];"
    mixes = ["[vo]"]
    idx = 2
    if music:
        inputs += ["-i", str(music)]
        fc += f"[{idx}:a]aformat=channel_layouts=stereo,volume=0.22[mu];[vo]asplit=2[vo1][vosc];[mu][vosc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[mud];"
        mixes = ["[vo1]", "[mud]"]
        idx += 1
    if sfx:
        inputs += ["-i", str(sfx)]
        fc += f"[{idx}:a]aformat=channel_layouts=stereo,volume=0.9[sf];"
        mixes.append("[sf]")
    fc += f"{''.join(mixes)}amix=inputs={len(mixes)}:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11[aout]"
    cmd = ["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", fc, "-map", "0:v", "-map", "[aout]",
           "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", f"{duration:.3f}", "-movflags", "+faststart", str(out)]
    subprocess.run(cmd, check=True)


def contact_sheet(stills_dir, out, cols=6):
    files = sorted(Path(stills_dir).glob("*.jpg"))
    if not files:
        return
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", "1", "-i", str(Path(stills_dir) / "%03d.jpg"),
                    "-vf", f"scale=270:-1,tile={cols}x{(len(files) + cols - 1) // cols}:padding=6:color=black", "-frames:v", "1", str(out)], check=True)


def contact_sheet_from_video(video, out, every=3, cols=6):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(video), "-vf", f"fps=1/{every},scale=240:-1,tile={cols}x5:padding=6",
                    "-frames:v", "1", str(out)], check=True)

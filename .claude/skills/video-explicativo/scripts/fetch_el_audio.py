#!/usr/bin/env python3
"""Descarga los audios generados con el conector MCP de ElevenLabs y los nombra beat_###.mp3.

Flujo (cuando no hay ELEVENLABS_API_KEY pero sí el conector):
  1. python3 build.py storyboard.json --list-beats > beats.json
  2. Por cada frase: creative_generate_speech(prompt=texto, generations_count=1, flow_id=<mismo flow>)
  3. creative_get_flow_run_status(...) -> guarda la respuesta JSON (o el archivo que el cliente guarde)
  4. python3 fetch_el_audio.py beats.json audios/ estado1.json [estado2.json ...]
  5. python3 build.py storyboard.json --tts dir:audios/

Empareja cada audio con su frase por el texto del prompt (normalizado), no por el orden.
"""
import json, sys, unicodedata, urllib.request
from pathlib import Path


def norm(s):
    return " ".join(unicodedata.normalize("NFC", str(s)).split()).strip().lower()


def main():
    if len(sys.argv) < 4:
        raise SystemExit(__doc__)
    beats = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out = Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
    urls = {}
    for f in sys.argv[3:]:
        d = json.loads(Path(f).read_text(encoding="utf-8"))
        for m in d.get("media", []):
            if m.get("kind", "audio") == "audio" and m.get("url"):
                urls[norm(m.get("prompt", ""))] = m["url"]
    missing = []
    for b in beats:
        dst = out / b["file"]
        if dst.exists():
            continue
        u = urls.get(norm(b["text"]))
        if not u:
            missing.append(b)
            continue
        urllib.request.urlretrieve(u, dst)
    ok = sum(1 for b in beats if (out / b["file"]).exists())
    print(f"{ok}/{len(beats)} audios listos en {out}")
    for b in missing:
        print(f"  falta {b['file']}: {b['text']}")
    sys.exit(1 if missing else 0)


if __name__ == "__main__":
    main()

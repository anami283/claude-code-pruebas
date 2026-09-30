#!/usr/bin/env bash
# Añade al final de un video (9:16 o 16:9) un cierre de marca en el estilo "caso de estudio",
# renderizado con el motor de la skill hermana `video-explicativo`.
#
# Uso: cierre_marca.sh entrada.mp4 salida.mp4 "Marca" "Tagline." ["marca.com"] ["Frase de cierre opcional."]
set -euo pipefail

IN="$1"; OUT="$2"; BRAND="$3"; TAGLINE="$4"; URL="${5:-}"; STATEMENT="${6:-}"
HERE="$(cd "$(dirname "$0")" && pwd)"
SIS="$HERE/../../video-explicativo"
[ -f "$SIS/scripts/build.py" ] || { echo "Falta la skill hermana video-explicativo en $SIS"; exit 1; }
[ -s "$IN" ] || { echo "No existe $IN"; exit 1; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# 1) storyboard del cierre (sin voz, sin marco)
python3 - "$WORK/cierre.json" "$BRAND" "$TAGLINE" "$URL" "$STATEMENT" <<'PY'
import json, sys
out, brand, tagline, url, statement = sys.argv[1:6]
scenes = []
if statement:
    scenes.append({"template": "statement", "noSection": True, "data": {"lines": [statement], "size": 58, "y": 600},
                   "beats": [{"dur": 2.6}]})
scenes.append({"template": "logo_end", "transition": {"type": "fade"} if statement else None,
               "data": {"brand": brand, "tagline": tagline, "url": url}, "beats": [{"dur": 4.2}]})
scenes = [{k: v for k, v in s.items() if v is not None} for s in scenes]
json.dump({"meta": {"noChrome": True, "lead": 0}, "chapters": [{"section": "", "theme": "dark", "scenes": scenes}]},
          open(out, "w"), ensure_ascii=False)
PY

# 2) renderizar el cierre (4:5, mudo)
python3 "$SIS/scripts/build.py" "$WORK/cierre.json" --tts none --music none --no-sfx --work "$WORK/w" --out "$WORK/cierre_45.mp4" >/dev/null

# 3) adaptar al tamaño del video de entrada (relleno azul marino) y concatenar con fundido
read -r W H FPS < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -of csv=p=0 "$IN" | tr ',' ' ')
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
HAS_AUDIO=$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$IN" | head -1)
OFF=$(python3 -c "print(max(0, float('$DUR') - 0.5))")

ffmpeg -y -loglevel error -i "$WORK/cierre_45.mp4" \
  -vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=#0E1628,fps=${FPS},format=yuv420p,setsar=1" \
  -an "$WORK/cierre.mp4"
CDUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$WORK/cierre.mp4")

if [ -n "$HAS_AUDIO" ]; then
  ffmpeg -y -loglevel error -i "$IN" -i "$WORK/cierre.mp4" -filter_complex \
    "[0:v]format=yuv420p,setsar=1[v0];[v0][1:v]xfade=transition=fade:duration=0.5:offset=${OFF}[v];[0:a]apad=pad_dur=${CDUR},afade=t=out:st=${OFF}:d=1.2[a]" \
    -map "[v]" -map "[a]" -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$OUT"
else
  ffmpeg -y -loglevel error -i "$IN" -i "$WORK/cierre.mp4" -filter_complex \
    "[0:v]format=yuv420p,setsar=1[v0];[v0][1:v]xfade=transition=fade:duration=0.5:offset=${OFF}[v]" \
    -map "[v]" -c:v libx264 -crf 18 -pix_fmt yuv420p -movflags +faststart "$OUT"
fi
echo "✔ $OUT"

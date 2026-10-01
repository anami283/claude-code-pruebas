#!/usr/bin/env bash
# Mezcla final: narración (ElevenLabs, voz "Lina") + música original con ducking, sobre el video mudo.
# Uso: ./mezcla.sh ../out/_mudo.mp4 ../out/intro-de-la-bandeja-al-reporte.mp4
set -euo pipefail
cd "$(dirname "$0")"
IN="$1"; OUT="$2"; TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
python3 musica.py "$TMP/musica.wav"
# Momento de entrada de cada frase (ms), alineado con timeline.js
D1=150; D2=6350; D3=14750; D4=20300; D5=33000
ffmpeg -y -loglevel error -i "$IN" -i "$TMP/musica.wav" \
  -i voz/escena1.mp3 -i voz/escena2.mp3 -i voz/escena3.mp3 -i voz/escena4.mp3 -i voz/escena5.mp3 \
  -filter_complex "
    [2:a]aresample=48000,adelay=${D1}|${D1}[v1];[3:a]aresample=48000,adelay=${D2}|${D2}[v2];
    [4:a]aresample=48000,adelay=${D3}|${D3}[v3];[5:a]aresample=48000,adelay=${D4}|${D4}[v4];
    [6:a]aresample=48000,adelay=${D5}|${D5}[v5];
    [v1][v2][v3][v4][v5]amix=inputs=5:normalize=0,aformat=channel_layouts=stereo,apad=whole_dur=40[voz];
    [voz]asplit=2[vmix][vsc];
    [1:a]aresample=48000,atrim=0:40,asetpts=N/SR/TB,apad=pad_dur=4,loudnorm=I=-30:TP=-8:LRA=11,aresample=48000,atrim=0:40,afade=t=in:st=0:d=1,afade=t=out:st=38:d=2[mus];
    [mus][vsc]sidechaincompress=threshold=0.02:ratio=6:attack=30:release=450:makeup=1[musd];
    [vmix][musd]amix=inputs=2:normalize=0,apad=pad_dur=4,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,atrim=0:40,apad=whole_dur=40[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 -t 40 -movflags +faststart "$OUT"
echo "✔ $OUT"

# Intro de marca con personaje (GSAP, 16:9, 40 s)

Una apertura animada para una clase, un evento o un lanzamiento: un personaje protagonista (Laura), problema → costo → pregunta → solución → título, con narración y música. Es la intro "De la bandeja al reporte" hecha para Enyoi, dejada como plantilla editable.

## Qué trae
- `index.html` + `styles.css`: composición de 1920×1080 con los colores de la marca como variables en `:root`.
- `timeline.js`: una sola línea de tiempo GSAP con los tiempos exactos de cada escena. Aquí se cambian los textos, las cifras y los pasos.
- `laura.js`: el personaje en SVG, con 7 poses (escribe, abrumada, cansada, pensativa, señala, orgullosa, saluda) que se cambian con `setPose(t, POSE.x)`.
- `render.mjs`: renderiza cuadro a cuadro con Playwright y ffmpeg (`--out video.mp4` o `--stills t:archivo.png,...`).
- `musica.py` + `mezcla.sh`: música original con *ducking* bajo la voz y normalización a −16 LUFS.

## Cómo adaptarla a otra empresa
1. `npm install` en esta carpeta (gsap + playwright-core).
2. Cambia el logo en `assets/` y la ruta en `index.html`; los colores en `styles.css` (`:root`) y en `laura.js` (blazer, blusa).
3. Reescribe los textos en `index.html` y `timeline.js`, y ajusta los tiempos si cambia la narración.
4. Narración: genera una frase por escena con ElevenLabs (voz colombiana recomendada: "Lina", `yfUfwZTRubVrsUZWqzwp`), guárdalas como `voz/escena1.mp3` … `escena5.mp3` y ajusta los momentos de entrada (`D1`…`D5`) en `mezcla.sh`.
5. Renderiza `node render.mjs --stills 5:s1.png,13:s2.png,...` para revisar y luego `node render.mjs --out ../_mudo.mp4 && ./mezcla.sh ../_mudo.mp4 final.mp4`.
6. Verifica con ffprobe que el video dura 40 s y mide 1920×1080.

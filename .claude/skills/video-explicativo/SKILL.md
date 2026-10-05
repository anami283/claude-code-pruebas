---
name: video-explicativo
description: Genera videos explicativos animados en español a partir de CUALQUIER archivo de contenido (PDF, DOCX, PPTX, MD, TXT, HTML), con varias opciones de formato. 1) AMAC (4:5, 60-95 s, brandbook azul marino / oro, fondo 3D, transiciones 3D y logo de la empresa cliente). 2) Caso (4:5, réplica del video de referencia). 3) Datos con bolitas (16:9, periodismo de datos dibujado a mano con personajes bolita, gráficos de unidades, líneas, barras, filas, monedas y líneas de tiempo). 4) Intro de marca con personaje (GSAP, 16:9, 40 s, con narración). Úsala cuando el usuario pida "hazme un video explicativo", "convierte este documento en video", "video animado de este caso", "explainer", "video tipo caso de estudio", "video para LinkedIn que explique esto", o adjunte un archivo pidiendo un video que lo explique. También cuando pida "video con datos", "explica estas cifras", "estilo periodismo de datos", "video con bolitas", "intro animada para mi clase" o "apertura con personaje".
---

# Video explicativo en español (varias opciones de formato)

Convierte un archivo de contenido en un video animado MP4 con la narrativa de 8 capítulos del video de referencia, pero con la identidad visual AMAC: paleta del brandbook, Poppins, fondo con profundidad y partículas, paneles de vidrio, cámara 3D, franja dorada y transiciones 3D. Todo va con subtítulos, voz en off y música ambiental. **El logo de la empresa para la que Ana Milena facilita se adjunta en cada video** (`--logo`).

## Opciones: elige según el contenido y el canal
Pregunta al inicio qué opción quiere si no está claro. Si el usuario no elige, recomienda según el contenido:

| # | Opción | Formato | Ideal para | Cómo se activa | Guía |
|---|---|---|---|---|---|
| 1 | **AMAC** (predeterminada) | 4:5 · 60-95 s | LinkedIn/Instagram, casos y propuestas con la marca AMAC y el logo del cliente | `--style amac` | `references/estilo-amac.md` |
| 2 | **Caso** | 4:5 · 60-95 s | Caso de estudio sobrio, réplica del video de referencia | `--style caso` | `references/guia-de-estilo.md` |
| 3 | **Datos con bolitas** | 16:9 · 90 s a 7 min | Informes, encuestas, diagnósticos, resultados: contenido con cifras contado con personajes | `--style datos` | `references/estilo-datos.md` |
| 4 | **Intro de marca con personaje** | 16:9 · 40 s | Abrir una clase, un taller o un evento con una protagonista, voz y título | carpeta `intro-marca/` (GSAP) | `intro-marca/README.md` |
| 5 | **Higgsfield** | 9:16 o 16:9 | Escenas generadas con IA y movimiento de cámara real (gasta créditos) | skill `video-explicativo-higgsfield` | su SKILL.md |

Las opciones 1 a 3 comparten el mismo flujo: storyboard JSON → `build.py`, con voz, música, subtítulos y control de calidad. Solo cambian el estilo y las plantillas. El render es 100 % por código (HTML/SVG + Playwright + ffmpeg): reproducible, unos 2-5 min por video, sin créditos de generación de video. La opción 4 es una composición GSAP editable; se adapta siguiendo su README.

Rutas relativas a esta carpeta (`.claude/skills/video-explicativo/`).

## Flujo de trabajo

### 0. Preparar el entorno (una sola vez por máquina)
```bash
command -v ffmpeg node python3            # requisitos
pip install -q numpy scipy pypdf python-docx python-pptx
(cd engine && npm install --silent)       # playwright-core + fuentes Inter / IBM Plex Mono
```
Chromium: el render busca `CHROMIUM_PATH`, luego `/opt/pw-browsers/chromium` y luego el Chrome del sistema. Si no hay ninguno: `npx playwright install chromium`.

### 0.5 Pedir el logo de la empresa
Antes de renderizar, pregunta para qué empresa es el video y pide su logo (PNG transparente idealmente) si no lo adjuntaron. Si no hay logo, el video sale sin él: el cierre usa el nombre en texto.

### 1. Leer el contenido
```bash
python3 scripts/extract.py <archivo> --out /tmp/contenido.txt
```
Lee el texto completo. Si faltan datos clave (marca, URL, público, tono), usa lo que diga el documento; pregunta solo si falta algo imprescindible, como el nombre de la marca para el cierre.

### 2. Escribir el storyboard (el paso que define la calidad)
Lee, EN ESTE ORDEN:
1. `references/guion.md`: cómo extraer la historia, reglas de redacción en español y mapa capítulo → plantilla.
2. `references/plantillas.md`: formato JSON, capas y datos de cada plantilla.
3. `references/estilo-amac.md`: el estilo AMAC, el logo por empresa y la escena `intro`. Para el estilo "caso", `references/guia-de-estilo.md`.

**Si es la opción 3 (datos con bolitas)**, en lugar de los puntos 2 y 3 lee `references/estilo-datos.md`: estructura narrativa, reglas y sus 13 plantillas propias (titulo, cifra, unidades, linea, barras, fila, monedas, linea_tiempo, puntos, comparacion, frase, escena, cierre). Pon `"style": "datos"` en `meta`. Modelo: `examples/demo_datos_bolitas.json`. En este estilo la regla de 140-230 palabras se relaja según la duración elegida.

Usa como modelo (opciones 1 y 2) `examples/ia_veterinaria_amac.json` (estilo AMAC con intro y logo), `examples/demo_ia_pymes.json` (contenido genérico) y `examples/caso_rumania.json` (recreación fiel del video de referencia). Guarda el resultado como `<nombre>.json` junto al archivo del usuario o en la carpeta de trabajo.

Reglas que no se negocian:
- De 140 a 230 palabras de voz, con frases de 4 a 12 palabras. Cada frase produce un cambio visual.
- Abre con `intro` (título, promesa y "Facilitado por Ana Milena Alonso Cantor"). Alterna capítulos claros y oscuros, y cierra con `statement` + `logo_end`.
- Cifras solo si están en el documento. Números en letras en `say` y en dígitos en `headline`/`caption`.

Valida:
```bash
python3 scripts/validate.py <storyboard>.json
```

### 3. Revisar con cuadros de control (sin gastar voz)
```bash
python3 scripts/build.py <storyboard>.json --tts none --stills
```
Abre `<storyboard>_work/contact_sheet.jpg` (un cuadro por frase) y revisa que no haya textos cortados, superpuestos o vacíos, y que cada frase muestre algo nuevo. Corrige y repite hasta que quede limpio.

### 4. Generar la voz (elige la primera opción disponible)
| Opción | Cuándo | Cómo |
|---|---|---|
| **A. API de ElevenLabs** | Existe `ELEVENLABS_API_KEY` y hay red hacia api.elevenlabs.io | `--tts elevenlabs --voice <voice_id>` (usa caché; aprovecha previous/next_text para una prosodia continua) |
| **B. Conector MCP de ElevenLabs** | No hay API key, pero existen las herramientas `mcp__ElevenLabs__*` | Ver el procedimiento abajo; después, `--tts dir:<carpeta>` |
| **C. Piper offline** | Sin ElevenLabs | `--tts piper` (voz neuronal local; baja una voz en español de HuggingFace y, si no puede, usa una de respaldo desde GitHub) |

Voz por defecto recomendada: **"Carlos – Clear and authoritative"** (`hVvlnh6pB9hT91DI7dXN`), masculina, español latino neutro, tono documental como el de la referencia. Voz femenina colombiana (acento paisa, cálida, educativa): **"Lina – Colombian Warm & Confident"** (`yfUfwZTRubVrsUZWqzwp`). Si el usuario tiene una voz propia o clonada, usa su `voice_id`. Para elegir otra, usa `creative_list_voices` con `languages:["es"]` y `use_cases:["informative_educational"]`.

**Procedimiento B (conector MCP):**
1. `python3 scripts/build.py <sb>.json --list-beats > beats.json`
2. Por cada frase, llama a `mcp__ElevenLabs__creative_generate_speech` con `prompt` = texto exacto, `model_id: "eleven_multilingual_v2"`, `generations_count: 1` y el MISMO `flow_id` para todas. La primera llamada crea el flow. Lanza las llamadas en paralelo, en lotes.
3. Llama a `mcp__ElevenLabs__creative_get_flow_run_status` con los `session_ids` (máximo 20 por llamada) hasta que `all_completed` sea true. Si la respuesta es muy grande, el cliente la guarda en un archivo; usa ese archivo.
4. `python3 scripts/fetch_el_audio.py beats.json audios/ <estado1.json> [<estado2.json> ...]` (empareja por texto).
5. Costo aproximado: 1 crédito por carácter (un guion de 1.300 caracteres cuesta unos 1.300 créditos). Avisa al usuario antes de gastar si el guion es largo.

### 5. Renderizar el video final
```bash
python3 scripts/build.py <sb>.json --tts <opción> --logo <logo_empresa.png> --out <salida>.mp4 [--style amac|caso|datos] [--workers 4] [--music auto|none|pista.mp3] [--no-sfx]
```
El comando hace todo esto:
- Arma la línea de tiempo según la duración real de cada frase.
- Renderiza los cuadros en paralelo.
- Ensambla la voz.
- Genera la música ambiental (acordes + pulso suave, que baja sola cuando habla la voz) y los efectos de transición.
- Normaliza a −14 LUFS y exporta en H.264 + AAC.

### 6. Control de calidad y entrega
- Revisa `<sb>_work/qa_contact_sheet.jpg`, un cuadro cada 3 s.
- Revisa la duración: `ffprobe -v error -show_entries format=duration -of csv=p=0 salida.mp4`.
- Entrega el MP4 al usuario (SendUserFile) con un resumen de 2 líneas: duración, voz usada y lo que conviene ajustar.

## Ajustes frecuentes
- **Más rápido o más lento**: `meta.voice.speed` (ElevenLabs, 0.9-1.1), `--gap 0.2` para menos pausa entre frases, o `pause` en un beat puntual.
- **Formato 16:9**: usa la opción 3 (`--style datos`, nativa en 1920×1080) o la 4 (intro de marca).
- **Formato 9:16**: las opciones 1 y 2 están diseñadas para 4:5. Para Reels, renderiza en 4:5 y encuadra con `ffmpeg -vf "pad=1080:1920:0:285:color=#0E1628"`.
- **Datos con la marca del cliente**: `meta.accent` cambia el color del marcador y `--logo` pone el logo en la esquina y en el `cierre`.
- **Otra empresa**: cambia `--logo`, `meta.kicker` y los textos de `intro`/`logo_end`. El estilo AMAC se mantiene. Las paletas están en `engine/figures.js` (`STYLES`).
- **Nueva plantilla**: agrégala en `engine/templates.js` (o en `engine/datos/templates.js` para el estilo de datos; devuelve SVG a partir de `ctx`) y regístrala en `scripts/validate.py`.

## Límites (dilos con honestidad si aplican)
- Los personajes son figuras de línea más simples que las ilustraciones hechas a mano del video original. El estilo, la composición, la tipografía, el ritmo y las transiciones sí se replican fielmente.
- La música se genera por código (es funcional y neutra). Para un acabado premium, pasa una pista con licencia usando `--music`.
- La voz de Piper (opción C) suena correcta pero claramente sintética. La calidad de la referencia requiere ElevenLabs.

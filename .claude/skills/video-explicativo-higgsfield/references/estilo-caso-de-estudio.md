# Estilo para Higgsfield: AMAC (predeterminado) y "caso"

Este archivo traduce el ADN visual del video de referencia (ver `../video-explicativo/references/guia-de-estilo.md`) al lenguaje que entienden los modelos generativos de Higgsfield.

## Donantes de estilo (imágenes de referencia)
`assets/estilo/estilo_1.png`, `estilo_2.png` y `estilo_3.png` son cuadros limpios, sin texto, renderizados con el motor de la skill hermana. Muestran el look exacto:
1. Fondo azul marino con grilla técnica, bloques isométricos, credencial roja, líneas rojas que conectan todo, una puerta blanca y una persona de línea.
2. Fondo blanco hueso con grilla: tres paneles de institución con puerta, formulario, servidor, conexiones rotas con X y credenciales rojas. Una madre con su hijo frente a la puerta.
3. Fondo claro: equipo en una mesa larga frente a un tablero con notas adhesivas, y dos facilitadores de pie.

En el flujo de Higgsfield son "user uploads (≤3)": son AUTORITATIVAS, se usan solas (sin mezclar un preset de la casa) y la ronda de galería se salta.

**Cómo subirlas** (usa la primera ruta que funcione):
1. **Desde la máquina del usuario** (Claude Code local): llama a `media_upload` con `files:[estilo_1.png, estilo_2.png, estilo_3.png]`. Por cada archivo, ejecuta `curl -f -X PUT -H "Content-Type: image/png" -H "If-None-Match: *" --upload-file <archivo> '<upload_url>'`, lee el código HTTP (debe ser 200) y luego llama a `media_confirm({type:"image", media_ids:[...]})`.
2. **Desde una URL pública** (por ejemplo, el archivo "raw" del repositorio si es público): usa `media_import_url` con cada URL.
3. **Si ninguna ruta funciona** (red bloqueada): abre la galería con `get_explainer_presets` y recomienda, en este orden, **Editorial Motion Graphics** (la más cercana en tono), **Isometric Flat Vector** o **Poster Vector**. Aplica igual la FÓRMULA de abajo como texto del estilo. Di en una línea que el look será una aproximación.

Guarda los `media_id` confirmados en `work/manifest.json` y reutilízalos en videos siguientes de la misma cuenta (no hace falta subirlas otra vez).

## FÓRMULA DE ESTILO — AMAC (predeterminada; pégala byte a byte en cada prompt de imagen y de video)
```
Premium 3D-dashboard explainer illustration. Deep navy (#0D1B4B) space with a soft radial
glow, drifting light orbs in electric blue (#2563EB) and violet, a faint connected-particle
network and a perspective floor grid receding into depth. Clean vector line art with
silver (#C0C8D8) strokes, translucent glassmorphism panels with luminous edges, simple
rounded human figures in white and royal blue (#1A3A8F). ONE accent color: executive gold
(#C9A84C) for highlights, ID cards and connecting lines. Smooth cinematic camera drift,
subtle depth and parallax. Elegant, modern, optimistic. No text, no letters, no numbers, no logos.
```
**PALETTE LOCK (brandbook AMAC)**: navy `#0D1B4B`, royal `#1A3A8F`, electric blue `#2563EB`, gold `#C9A84C`, silver `#C0C8D8`, blue-white `#F4F6FB`.

### Fórmula alternativa — "caso" (réplica del video de referencia)
```
Minimal technical-blueprint explainer illustration. Clean vector line art with uniform 3px
dark navy (#141B30) strokes, flat fills only (white, off-white #F5F6FA, deep navy #0E1628),
no gradients, no textures, no shadows. A faint square engineering grid covers every
background. Simple rounded human figures drawn as outlines. ONE accent color only: signal
red (#E5202B). Wide negative space, centered orthographic compositions. No text, no letters, no numbers, no logos.
```

**Negative prompt** (style key, assets y bloques): `text, letters, captions, numbers, logo, watermark, photorealistic, color palette strip, swatches, labels, reference sheet, multiple accent colors`.

## Logo de la empresa
El logo de la empresa cliente se adjunta en cada video: Ana Milena facilita para diferentes empresas. NO lo metas en los prompts de generación, porque los modelos deforman los logos. Agrégalo después con `scripts/cierre_marca.sh`, que pone el logo en el cierre (`--logo`).

## Traducción del lenguaje visual a tomas (para los bloques de 10 s)
| Recurso del video de referencia | Cómo pedirlo en un SHOT |
|---|---|
| Titular grande arriba | NO se pide (los modelos deforman el texto). El mensaje lo cargan la voz y los subtítulos del flujo |
| Paneles de institución en fila | `WIDE frontal orthographic shot of three identical service panels side by side, each with a closed white door` |
| Persona que repite trámites | `MEDIUM lateral tracking shot, the mother walks from one door to the next, a red ID card flashes above each counter` |
| Conexiones rotas | `CU on thin navy lines between two server racks snapping apart` (sin texto; la X se logra con líneas que se cortan) |
| Una sola puerta (la necesidad) | `LOW WIDE, a single white door drawn as a blueprint outline on the navy grid, dashed ghost doors fade away` |
| Hub que conecta todo | `HIGH angle overhead, three isometric navy blocks, red lines grow from a central red ID card to each block` |
| Equipo co-diseñando | `MEDIUM, four people at a long table facing a wall board full of sticky notes, two facilitators pointing` |
| Resultados | `CU, three isometric blocks light up one after another with small red check marks` (las cifras van en la voz) |
| Cierre | `slow push-in through the white door into clean navy space` |

**Objeto conductor sugerido (through-line)**: la **puerta blanca** o la **credencial roja**. Debe aparecer en todos los bloques, cambiar de estado de forma progresiva (cerrada → múltiple → dibujada → abierta → una sola) y resolverse en el cierre. Genera ese objeto como asset propio (prop) para que no cambie de forma.

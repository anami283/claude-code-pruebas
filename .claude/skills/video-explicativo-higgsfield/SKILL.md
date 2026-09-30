---
name: video-explicativo-higgsfield
description: Genera con Higgsfield (IA generativa de video) un video explicativo narrado en español, de 60-120 s y en 9:16 o 16:9, con el look "caso de estudio / plano técnico" del video de referencia (line-art azul marino, grilla técnica, acento rojo), a partir de CUALQUIER archivo de contenido (PDF, DOCX, PPTX, MD, TXT). Úsala cuando el usuario pida "hazlo con Higgsfield", "video explicativo con IA generativa", "versión Higgsfield del video", "clips animados con IA de este documento", o quiera movimiento de cámara y escenas generadas en lugar de animación por código. Para el render por código, exacto, barato y en 4:5, usa la skill hermana `video-explicativo`.
---

# Video explicativo en español con Higgsfield

Convierte un archivo de contenido en un video narrado de Higgsfield con el mismo ADN visual y narrativo del video de referencia. Esta skill **no reinventa** la producción: prepara la historia, el guion y el estilo, y luego delega en el flujo oficial `faceless-video` de Higgsfield, que se encarga de los clips, la voz, el ensamblado y los subtítulos en su sandbox.

## ¿Esta skill o la hermana `video-explicativo`?
| | `video-explicativo` (código) | `video-explicativo-higgsfield` (esta) |
|---|---|---|
| Look | réplica exacta del estilo, con titulares y cifras en pantalla | aproximación generativa, con escenas y cámaras "reales" y animación fluida |
| Texto en pantalla | titulares, etiquetas, cifras y subtítulos exactos | solo subtítulos (los modelos deforman el texto) |
| Formato | 4:5 (1080×1350) | 9:16 o 16:9 (el modelo no admite 4:5) |
| Costo | ~0 (solo la voz de ElevenLabs) | unos 200-230 créditos de Higgsfield por 90 s |
| Tiempo | unos 2-3 min | 15-30 min (generación en la nube) |
| Consistencia | determinista | variable: puede requerir regenerar bloques |

Si el usuario no especificó, y el contenido depende de cifras o textos exactos, recomienda la hermana. Si busca impacto cinematográfico, recomienda esta.

## Flujo de trabajo

### 1. Leer el contenido
```bash
python3 ../video-explicativo/scripts/extract.py <archivo> --out /tmp/contenido.txt
```
(Si la skill hermana no está, lee el archivo con las herramientas disponibles: PDF/DOCX/texto.)

### 2. Extraer la historia (misma metodología de la referencia)
Aplica la sección 1 de `../video-explicativo/references/guion.md` para obtener: protagonista, detonante, 3 síntomas del problema, necesidad, método, 3 cifras (solo si vienen del documento), idea fuerza y llamada a la acción.

### 3. Escribir el guion por bloques
Lee `references/guion-bloques.md` y escribe N bloques (9 para 90 s):
- Una línea de voz de **20-23 palabras** por bloque, en español.
- 5 tomas por bloque, sin texto en pantalla.
- Un objeto conductor: la puerta blanca o la credencial roja.

Este guion se entrega al flujo de Higgsfield como **guion pegado por el usuario** ("My topic → pasted script"). Así su redacción queda protegida (la excepción VERBATIM del flujo) y el título se toma de la primera línea `Title: …`.

### 4. Preparar el estilo
Lee `references/estilo-caso-de-estudio.md`:
- Sube las 3 imágenes de `assets/estilo/` como referencias de estilo del usuario (≤3, autoritativas). Así el flujo salta la galería y ancla el look del video de referencia. Hay 3 rutas de subida; con la de respaldo se usa el preset "Editorial Motion Graphics".
- Usa la FÓRMULA de estilo y el negative prompt de ese archivo, byte a byte.

### 5. Presupuesto (antes de gastar)
1. Llama a `balance`.
2. Estima el costo:

   | Concepto | Cálculo |
   |---|---|
   | Style key | 1 imagen × 1,25 créditos |
   | Assets | ~10-14 imágenes × 1,25 créditos |
   | Bloques de video | N × 20 créditos (`minimax_h3`, 2K, 10 s) |
   | Voz | según `get_cost` |
   | **Total aprox. para N = 9** | **200-230 créditos** |

   Confirma los valores con `get_cost:true` en una imagen, un bloque y una frase de voz.
3. Muéstrale al usuario el estimado en una línea y **pide confirmación antes de la primera generación**, salvo que ya haya dicho explícitamente "hazlo" o "adelante" con el costo a la vista.
4. Si el saldo no alcanza, ofrece: bajar a 60 s (N = 6), o usar la skill hermana.

### 6. Ejecutar el flujo oficial de Higgsfield
```
get_workflow_instructions({ workflow: "faceless-video" })
```
Síguelo AL PIE DE LA LETRA (sus reglas de oro mandan sobre esta skill en todo lo que sea mecánica: modelos, lotes de 12, `jobs_wait`, sandbox, ensamblado, subtítulos, entrega). Entra con la configuración inicial ya respondida a partir del pedido, para que solo pregunte lo que falte:

| Parámetro | Valor por defecto de esta skill |
|---|---|
| Tipo de canal | **Explainer** |
| Modo | **Animated** (clips en movimiento) |
| Estilo | **las 3 imágenes subidas** (custom) → fórmula de `estilo-caso-de-estudio.md` |
| Duración | 90 s (o la que pida el usuario) |
| Aspecto | **9:16** para LinkedIn móvil, Instagram y TikTok; **16:9** para YouTube o presentaciones |
| Subtítulos | **Sí**: en este estilo, los subtítulos son parte del ADN |
| Miniatura | No, salvo que la pida |
| Tema | **guion pegado** (el del paso 3), con la línea `Title:` |
| Voz | el flujo SIEMPRE abre el selector `list_voices`. Recomienda en una línea una voz masculina, calmada y documental en español latino de las que devuelva el selector. Si el usuario ya tiene una voz propia o clonada en Higgsfield, esa |

Recuerda: el flujo no deja escribir subtítulos ni ffmpeg a mano, y el aspecto es solo 16:9 o 9:16.

### 7. Cierre de marca (opcional, después de la entrega)
Los modelos no escriben bien logotipos ni textos. Si el usuario quiere el cierre con marca y tagline, usa el motor de la skill hermana: `scripts/cierre_marca.sh` renderiza `statement` + `logo_end` y lo concatena al final del MP4 descargado, adaptado al aspecto del video. Esto se hace fuera del sandbox de Higgsfield, sobre el archivo ya entregado.

### 8. Entrega
- Descarga el MP4 final desde la URL confirmada que entregó el flujo y envíalo con SendUserFile.
- Resume en 2 líneas: duración, voz, créditos gastados y lo que conviene ajustar (por ejemplo, "el bloque 4 quedó más lento; se puede regenerar").

## Límites (dilos con honestidad)
- La fidelidad del look es alta en paleta, trazo y composición, pero variable en detalles: los personajes y props pueden variar entre bloques pese a los assets.
- Sin cifras ni titulares en pantalla. Si son críticos, usa la skill hermana o combina las dos: el video de Higgsfield como "b-roll" y las escenas de cifras renderizadas por código.
- Solo 9:16 o 16:9. Para 4:5 exacto, usa la skill hermana.
- Gasta créditos reales. Nunca generes sin haber mostrado el estimado.

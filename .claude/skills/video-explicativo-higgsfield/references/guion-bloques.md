# Del documento al guion por bloques de 10 s (formato Higgsfield)

El flujo `faceless-video` de Higgsfield trabaja con **N bloques de 10 s**. Cada bloque tiene **una frase de voz** y **cinco tomas con corte seco** de unos 2 s cada una. Este archivo adapta la narrativa del video de referencia (8 capítulos) a ese formato.

## Duración → número de bloques
| Duración | N | Uso |
|---|---|---|
| 60 s | 6 | LinkedIn / Reels corto |
| 90 s (recomendado) | 9 | equivalente al video de referencia (81 s) |
| 120 s | 12 | caso con más evidencia |

## Mapa narrativo para N = 9 (ajusta proporcionalmente si N cambia)
| Bloque | Rol (`arc_role`) | Contenido (capítulo de la referencia) |
|---|---|---|
| 1 | hook | Contexto / detonante. Abre con una frase de ≤ 8 palabras terminada en punto |
| 2 | build | El problema: la persona choca con el sistema |
| 3 | build | El problema escala: silos, repetición, "la ayuda existía, pero no llegaba" |
| 4 | build | La necesidad: las 2 o 3 condiciones del ideal |
| 5 | build | Cómo se trabajó: personas y procesos primero |
| 6 | turn | La solución: todo se conecta (el giro de la historia) |
| 7 | build | Resultados: las 3 cifras, dichas con palabras |
| 8 | build | Por qué importa: el patrón generalizable |
| 9 | payoff | Cierre: llamada a la acción que resignifica el gancho |

En `script_manifest.json`:
```json
"arc": { "hook": 1, "build": [2,3,4,5,7,8], "turn": 6, "payoff": 9 }
```
(números enteros, no texto). `genre: "education"`, `channel_type: "Explainer"`, `animation_mode: "fully_animated"`.

## Reglas de la línea de voz (validadas por `validate_motion_script.py`)
- **De 20 a 23 palabras por bloque**, que equivalen a unos 7,8-9,5 s de voz. Si una frase sale larga al medirla, se reescribe; nunca se acelera el audio.
- Bloque 1: la primera oración tiene ≤ 8 palabras antes del primer punto ("Rumania abrió sus puertas.").
- Nada de muletillas ("básicamente", "o sea", "digamos"). Ninguna palabra con contenido puede repetirse a menos de 6 palabras de distancia.
- Ninguna frase de 5 o más palabras puede repetirse de forma idéntica entre bloques.
- Los números van escritos en letras ("sesenta por ciento"). Las cifras deben venir del documento: NUNCA inventes.
- Tono: explicador documental, en segunda persona cuando haya llamada a la acción, frases con sujeto y verbo, voz activa.
- `NARRATION_LANGUAGE = "es"`.

## Tomas (shots)
- Cinco por bloque, cada una con TAMAÑO y ÁNGULO distintos a la anterior (WIDE → CU → HIGH → MEDIUM → ECU…).
- Solo el primer bloque en cada locación abre con un WIDE de establecimiento.
- Máximo 2 bloques seguidos en la misma locación. Planifica 4 o 5 locaciones: sala de espera con paneles, fachada con puertas, mesa de trabajo, espacio azul marino abstracto con bloques isométricos y la puerta final.
- OTS (sobre el hombro) solo cuando se vea el hombro de un personaje con nombre.
- "Characters only emote and gesture, they do NOT talk."
- Sin texto en pantalla en ningún prompt.
- Máximo 7 referencias por bloque, en este orden: locación → personajes → props (incluido el objeto conductor).

## Fuentes (obligatorias en Explainer)
El validador rechaza un guion factual sin URLs absolutas en `sources`. Opciones, en orden:
1. Las URLs que el propio documento cite.
2. Sube el archivo del usuario como archivo general: `media_upload` con el nombre `.pdf`/`.docx` → PUT → `media_confirm({type:"file"})`. Usa la URL permanente que devuelve.
3. Si no hay ninguna, díselo al usuario y pídele una URL de referencia (la web de la empresa, un informe público).

## Ejemplo (bloques 1-2 del caso de referencia, en español)
```json
{ "n": 1, "arc_role": "hook",
  "vo_line": "Rumania abrió sus puertas. Tras la invasión de Ucrania, miles de familias cruzaron la frontera buscando refugio, trabajo y escuela.",
  "location": "border_night", "through_line_state": "door wide open",
  "shots": ["WIDE frontal: a thin vertical border line splits the navy grid, two flat flags above", "MEDIUM lateral tracking: a mother and her small son walk toward the line", "CU: the white door swings open on the right side", "HIGH angle: a small crowd of outline figures crosses the line", "LOW: the door frame towers, figures pass through it"],
  "assets_used": ["border_night", "mother", "son", "white_door"] }
{ "n": 2, "arc_role": "build",
  "vo_line": "Pero al llegar encontraron otra frontera: tres instituciones distintas, cada una con su propio formulario, su sistema y su idioma.",
  "location": "service_hall", "through_line_state": "one door becomes three closed doors",
  "shots": ["WIDE orthographic: three identical service panels, each with a closed white door", "MEDIUM: the mother stops before the first door holding a form", "ECU: a red ID card blinks above a navy server rack", "HIGH: thin navy lines between servers snap apart", "CU lateral: her son looks up at the closed doors"],
  "assets_used": ["service_hall", "mother", "son", "white_door", "red_id_card"] }
```
(Las `vo_line` de este ejemplo tienen 20 palabras cada una.)

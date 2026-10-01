# Cómo convertir un documento en guion + storyboard

## 1. Extraer la historia (antes de escribir una sola frase)
Del documento, identifica:
- **Protagonista**: quién sufre el problema (una persona concreta, no "los usuarios").
- **Detonante**: el hecho o contexto que abre la historia.
- **Problema en 3 síntomas** concretos y visualizables.
- **Necesidad**: 2 o 3 condiciones del ideal, que serán los checks.
- **Método / solución**: 3 a 5 pasos como máximo.
- **Evidencia**: 3 cifras. Si el documento no tiene cifras, NO las inventes: usa hitos cualitativos con `cards` o `before_after`.
- **Idea fuerza** (el "por qué importa") y una **llamada a la acción**.

Si el documento es largo, prioriza. Un video de 60 a 95 s aguanta como máximo 1 problema, 1 solución y 3 resultados.

## 2. Reglas de redacción de la voz (español)
- Escribe entre **140 y 230 palabras** en total, que equivalen a unos 60-95 s.
- Cada `say` debe ser una frase o fragmento de **4 a 12 palabras**. Puedes cortar una oración en varios beats usando comas: la voz la encadena.
- Escribe como se habla: frases con sujeto y verbo, voz activa y presente.
- **Números escritos en letras** en `say` ("sesenta por ciento"), para que la voz los lea bien. En `caption` y `headline` usa dígitos ("60%").
- Evita siglas que la voz no sepa leer, o escríbelas como se pronuncian.
- Usa tuteo o ustedeo de forma consistente en todo el guion. Si el público es corporativo LATAM, el tuteo cercano funciona bien.
- Nada de relleno ("en el mundo actual", "es importante destacar").
- Usa la regla del contraste: problema en oscuro, alivio en claro. Usa la repetición intencional ("Empieza por un proceso. Empieza esta semana.").

## 3. Titulares
- Tienen de 1 a 4 palabras y terminan en punto: "3 instituciones.", "Fuera de alcance.".
- La segunda línea opcional (`\n`) remata o contrasta: "3 áreas.\n0 datos conectados.".
- El titular se mantiene hasta que otro beat lo cambie. No lo cambies en cada beat: de 2 a 4 titulares por escena es lo ideal.
- Las etiquetas (`tags`) son rótulos mono de 1 a 3 palabras. Usa el prefijo `!` para ponerlas en rojo ("!× 3").

## 4. De la historia a escenas (mapa recomendado)
| Capítulo | Tema | Plantillas sugeridas |
|---|---|---|
| 1 Contexto | dark | `hero_split` (dos lados o países o mundos), `persona` (una persona saturada), `statement` |
| 2 Problema | light | `panels` (silos), `bars` (magnitud del problema), `persona` |
| 3 Necesidad | dark | `blueprint` (checks + una puerta) |
| 4 Cómo | light | `team_board`, `process` |
| 5 Solución | dark/light | `iso_hub` (conexión), `phone_ui` (producto en uso), `process` |
| 6 Resultados | light | `stats`, `before_after`, `bars` |
| 7 Por qué importa | dark | `network`, `quote`, `cards` |
| 8 Cierre | dark | `statement` + `logo_end` |

- Usa de 8 a 12 escenas y de 25 a 40 beats en total.
- Alterna claro y oscuro por capítulo, y cambia de plantilla en cada capítulo para que haya variedad visual.
- Primera escena: sin transición. Entre capítulos, usa `wipe_up` o `slide_left`, y `zoom` en 1 o 2 momentos clave, con el `origin` puesto sobre una puerta u objeto de la escena anterior. Para el cierre, usa `fade`.

## 5. Sincronía voz ↔ imagen
Cada beat revela lo que la frase nombra, justo cuando lo nombra:
```json
{ "say": "cada una con su propio proceso,", "show": ["process"], "tags": ["Proceso propio"] }
```
- Antes de narrar, deja que la escena "exista": usa `show` a nivel de escena para las capas base.
- Para mover algo (una persona que cambia de panel, el tab activo, el paso activo), usa `set`.
- Si una frase no tiene nada nuevo que mostrar, cambia el titular o agrega una etiqueta. Nunca dejes una frase sin cambio visual.

## 6. Checklist antes de renderizar
- [ ] `python3 scripts/validate.py storyboard.json` pasa sin errores.
- [ ] Duración estimada entre 60 y 95 s.
- [ ] Todas las cifras vienen del documento, sin inventos.
- [ ] Revisaste los cuadros de control (`--stills`): ningún texto se corta ni se superpone.

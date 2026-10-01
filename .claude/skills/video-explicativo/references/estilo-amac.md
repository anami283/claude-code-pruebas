# Estilo AMAC (predeterminado)

Es el estilo propio de Ana Milena Alonso Cantor. Aplica su brandbook con el lenguaje visual de sus tableros 3D: fondo con profundidad, paneles de vidrio, brillos y movimiento constante. Reemplaza la estética de "plano técnico" del video de referencia, aunque conserva la estructura narrativa que funciona: 8 capítulos, una frase por cambio visual y subtítulos.

Se activa con `meta.style: "amac"`, que es el valor por defecto. Para la réplica fiel del video de referencia se usa `meta.style: "caso"` o `--style caso`.

## Paleta (brandbook AMAC)
| Uso | Color |
|---|---|
| Fondo oscuro | Azul Marino `#0D1B4B`, con degradado hacia `#1E3F99` y `#060D2B` |
| Fondo claro | Blanco Azulado `#F4F6FB` |
| Líneas y estructuras (claro) | Azul Royal `#1A3A8F` |
| Líneas (oscuro) | Plata Metálica `#C0C8D8` |
| Acento único (jerarquía, alertas, checks, conexiones) | Oro Ejecutivo `#C9A84C` |
| Brillos, partículas y halos | Azul Eléctrico `#2563EB` + violeta del banner `#7B5BE6` |
| Texto | Índigo `#0F1C3F` en fondo claro, blanco en fondo oscuro, Gris `#4A5568` para secundarios |

Tipografía: **Poppins** en todo (títulos en 700, cuerpo en 400/500, rótulos en mayúsculas con tracking). Nunca Arial ni Times.

## Lenguaje visual
- **Fondo vivo**: degradado radial y 3 orbes de luz (azul, violeta, oro) que derivan lentamente. Tiene además una red de partículas conectadas y un piso en perspectiva con grilla que avanza, como en los tableros 3D.
- **Banner ondulado** azul-violeta-plata animado en la base de cada escena, como firma de marca.
- **Cámara 3D**: cada escena entra con profundidad (inclinación de 9° que se endereza) y luego se balancea suavemente en X/Y, con un acercamiento lento. El fondo se mueve en paralaje.
- **Paneles de vidrio**: rellenos translúcidos, bordes plata y un halo azul alrededor de toda la ilustración en escenas oscuras.
- **Titular** con la **franja dorada** a la izquierda (elemento identitario), sección en oro y etiquetas tipo píldora de vidrio.
- **Subtítulo** en píldora de vidrio marino con borde plata y franja dorada interna.
- **Marco**:
  - Arriba a la izquierda: píldora con un punto dorado y el kicker.
  - Arriba a la derecha: progreso por capítulos con barras doradas.
  - Abajo: el **logo de la empresa** en una ficha blanca.
- **Transiciones 3D**: en AMAC, `wipe_up` se convierte en `glide` (la escena llega desde el fondo) y `slide_left` en `flip` (gira como una tarjeta). Se pueden pedir directamente `glide`, `flip` o `zoom_blur`. Para conservar la transición plana se usa `"keep": true`.

## Logo por empresa (se adjunta en cada video)
Ana Milena facilita para diferentes empresas, así que el logo NO está fijo en la skill. Se pasa al crear cada video:
```bash
python3 scripts/build.py guion.json --logo ruta/logo_empresa.png --out video.mp4
```
o con `"meta": { "logo": "logo_empresa.png" }` (la ruta es relativa al storyboard). Admite PNG, JPG, WEBP o SVG; lo ideal es PNG con fondo transparente.

Dónde aparece el logo:
- En la escena **`intro`**, grande, en una tarjeta blanca con halo.
- En **`logo_end`** (cierre), si no se pasa `useLogo: false`.
- En la ficha blanca de la esquina inferior derecha, en el resto de escenas.

Si no hay logo, el cierre usa el nombre `brand` en texto y la esquina muestra `meta.brandUrl`.

Crédito de facilitación recomendado: `intro.data.by = "Facilitado por Ana Milena Alonso Cantor"`. En el cierre, el `url` puede ser `"IA Fácil · Ana Milena Alonso Cantor"`.

## Escena `intro` (nueva)
```json
{ "template": "intro", "noSection": true, "noCounter": true,
  "data": { "title": "IA en la práctica veterinaria", "subtitle": "Una línea de promesa", "by": "Facilitado por Ana Milena Alonso Cantor" },
  "beats": [{ "dur": 3.2 }] }
```
Va como primer capítulo, con `"num": 0` para que no cuente en el progreso, y numerando los siguientes desde 1.

# Estilo "datos con bolitas" (16:9)

Ingeniería inversa de un explicativo de periodismo de datos sobre la crisis de vivienda: 7 min 38 s, 16:9, una grabación de pantalla de tresmillonesdeviviendas.es. La pieza cuenta un problema con cifras y lo hace entendible con personajes. Úsalo para informes, diagnósticos, resultados de encuestas, casos de negocio y cualquier contenido con datos.

## Qué lo hace funcionar
1. **Personajes "bolita"**: cada persona u hogar es un círculo de color con cara, dos patitas y a veces brazos. Los accesorios dicen el rol: casco = quien construye o ejecuta, caja con planta = quien se muda o empieza, gafas grises = burocracia o control, gorra, corbata, audífonos, maleta. Las caras cuentan la emoción: dormido, enojado, preocupado o feliz.
2. **Dibujo a mano**: línea negra irregular que "hierve" (el trazo tiembla unas 8 veces por segundo), papel claro con cuadrícula tenue y zonas de color planas (azul cielo, arena).
3. **La cifra es la protagonista**: un número grande en letra monoespaciada y negrita sobre una franja de marcador amarillo, con una etiqueta negra que explica qué mide.
4. **Gráficos que se viven**: líneas que el personaje recorre caminando, barras en bloques 3D, gráficos de unidades (1 bolita = X hogares), pilas de monedas, filas de gente tras un cordón y líneas de tiempo con meta.
5. **Rótulos tipo etiqueta**: fondo negro con texto blanco monoespaciado. Rojo = alerta y azul = lugar o categoría. Los pasos o soluciones van numerados en círculos amarillos.
6. **Fuente siempre visible**: cada dato lleva su fuente en letra pequeña abajo a la izquierda.
7. **Cámara continua**: el mundo se desplaza de lado (paneo). Entre bloques temáticos hay un barrido rápido con desenfoque de movimiento.
8. **Ritmo**: una idea por escena y una cifra por idea. La escena se arma por capas al compás de la voz.

## Estructura narrativa recomendada
1. **Gancho con dato** (`linea` o `cifra`): el problema medido.
2. **Título** (`titulo`): "cómo resolver / el problema X".
3. **Síntoma humano** (`fila`, `escena`): cómo se vive el problema.
4. **La raíz** (`cifra`, `unidades`, `barras`): por qué pasa, con 2 o 3 datos.
5. **Consecuencias** (`unidades`, `monedas`, `comparacion`): a quién le pega y cuánto.
6. **Lo que no funciona** (`comparacion`, `escena` con letreros).
7. **Soluciones numeradas** (`puntos` y una escena por punto).
8. **Horizonte** (`linea_tiempo`): cuánto falta al ritmo actual y al ritmo propuesto.
9. **Frase de cierre** (`frase`) y **cierre** con logo (`cierre`).

Duración: de 90 a 180 s para redes y de 3 a 7 min para una pieza completa de clase o informe.

## Reglas
- Usa solo cifras que estén en el documento. Si son ilustrativas, dilo en pantalla (`fuente`).
- Todo gráfico de unidades lleva su leyenda: "1 bolita = …".
- Una cifra grande por escena como máximo. El resto va en etiquetas.
- Los rótulos van en minúsculas, salvo nombres propios y siglas.
- Varía los accesorios y las caras: la emoción del personaje refuerza el dato.
- Pasa a otro bloque temático con `whip` y continúa dentro del mismo bloque con `pan`.

## Cómo se activa
`"meta": { "style": "datos" }` en el storyboard, o `--style datos` al construir. El lienzo es de 1920×1080. Opciones de `meta`:
- `accent`: color del marcador (por defecto `#F2B630`); úsalo para adaptarlo a la marca del cliente;
- `captions: false`: quita los subtítulos (vienen activos por defecto);
- `logoCorner: false`: quita el logo de la esquina;
- `captionWords`: palabras por subtítulo.

## Plantillas
Todas las capas aparecen solas, escalonadas. Si quieres controlarlas con la voz, decláralas con `"show": ["capa"]` en el beat; desde ese momento la capa espera a ese beat. En cualquier escena puedes poner `"fuente": "…"` para la nota al pie y `headline` en un beat: `"*texto"` sale en marcador amarillo y `"texto"` en etiqueta negra; los `tags` se muestran debajo.

Los personajes se declaran así: `{x, color, face, acc:[...], arms, r, from}`.
- **Colores**: rojo, naranja, amarillo, verde, azul, celeste, morado, rosa, blanco, gris, cafe, o un código hex.
- **Caras** (`face`): feliz, neutral, triste, enojado, dormido, sorpresa, preocupado, guino.
- **Accesorios** (`acc`): casco, caja, gafas, gorra, corbata, audifonos, maleta, pelo, lazo.
- **Brazos** (`arms`): up, wave, point, side.
- **Entrada** (`from`): x desde donde entra caminando.

La utilería se declara así: `{type: casa|edificio|letrero|bandera|paraguas|monedas, x, ...}`.
- `casa`: s, roof, sign.
- `edificio`: w, h, sign, shop.
- `letrero`: text, dir.

| Plantilla | Para qué | `data` | Capas |
|---|---|---|---|
| `titulo` | Apertura | `title`, `sub`, `tag`, `char`, `props` | zone, title, sub, props, chars |
| `cifra` | Una cifra protagonista | `value` ("1,85", "+87%"; cuenta desde 0), `label`, `tag`, `side:{type:'unidades'\|'casas', n, cols, legend}`, `houses`, `char` | value, label, tag, side, chars |
| `unidades` | Proporciones (38 de cada 100) | `value`, `valueLabel`, `groups:[{label, n, cols, highlight:0.38, hcolor, kind:'bolita'\|'casa', note}]`, `legend` | units, highlight, value |
| `linea` | Evolución en el tiempo | `years`, `series:[{label, color, values, end}]`, `min`, `max`, `walker` | axes, s0, s1, s2… |
| `barras` | Crecimiento por periodos | `bars:[{label, value, tag}]`, `color`, `climber:{at, color, acc}`, `title` | bars |
| `fila` | Espera o atasco | `n`, `building:{sign, shop}`, `faces`, `accs`; `set:{advance:k}` mueve la fila | queue, building |
| `monedas` | Dinero o proporción del ingreso | `stacks:[{label, value, color, face}]`, `year`, `place`, `value`, `valueLabel` | value, stacks |
| `linea_tiempo` | Cuánto falta | `from`, `to`, `label`, `sub`, `title`, `char`, `walkDur` | walk, label, title |
| `puntos` | Soluciones o pasos | `title`, `items:[{title, text}]`, `char`, `props`; `set:{focus:i}` resalta un punto | title, i0…i4, props, chars |
| `comparacion` | Antes/después, aquí/allá | `title`, `left`/`right:{label, tag, chars, props, bg}` | title, left, right |
| `frase` | Idea fuerza | `text` (lo que va entre `*` lleva marcador), `sub`, `size`, `chars`, `props` | text |
| `escena` | Composición libre | `zones`, `props`, `chars`, `labels:[{x, y, text, kind:'tag'\|'mark'\|'texto'}]` | zones, props, chars, labels |
| `cierre` | Logo y llamado | `title`, `tagline`, `url`, `n` (personajes que saludan) | logo, chars |

Transiciones: `whip` (barrido con desenfoque, cambia de bloque), `pan` (paneo continuo), `pan_up`, `zoom_in`, `fade`, `cut`. Las del estilo AMAC se traducen solas: `slide_left` pasa a `pan`, `flip` a `whip`, y así con las demás.

Modelo completo: `examples/demo_datos_bolitas.json`, con las 13 plantillas.

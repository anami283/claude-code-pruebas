# Guía de estilo (obtenida por ingeniería inversa del video de referencia)

Referencia: caso de estudio animado de 81 s, formato 4:5 (1080×1350, 30 fps, H.264 + AAC 48 kHz). Tiene 8 capítulos, voz en off continua con música de fondo y subtítulos quemados en cada frase.

## ADN visual: "plano técnico / caso de estudio"
| Elemento | Especificación |
|---|---|
| Lienzo | 1080×1350 (4:5, pensado para feed de LinkedIn e Instagram) |
| Fondo claro | `#F5F6FA` con grilla técnica (líneas cada 108 px y subgrilla cada 27 px, 5 % de opacidad) |
| Fondo oscuro | `#0E1628`, azul marino con viñeta radial y la misma grilla |
| Tinta | `#141B30` sobre fondo claro, `#FFFFFF` sobre fondo oscuro |
| Acento único | rojo `#E5202B`, SOLO para: problema/alerta, elemento activo, conexiones de la solución y checks |
| Ilustración | line-art monocromo: trazo de 3 px, rellenos planos blancos o azul marino, sin degradados ni sombras |
| Personajes | figuras de línea simples (cabeza redonda, pelo sólido, ropa blanca o marina) que caminan o están de pie |
| Íconos / props | puertas, paneles de institución, servidores, formularios, bloques isométricos, teléfono, credencial roja |
| Suelo | línea horizontal fina en y = 1152; los objetos "se apoyan" en ella |

## Tipografía
- **Titular**: sans geométrica (Inter), 66 px, peso 600, tracking −3 %, alineado a la izquierda en x = 108, y ≈ 160. Si lleva segunda línea, esta va al 78 % del tamaño y en peso 400.
- **Rótulos técnicos**: monoespaciada (IBM Plex Mono) en MAYÚSCULAS, 13 a 17 px, tracking +28 a 32 %.
- **Subtítulo**: Inter 600 de 31 px, centrado en y ≈ 1215, dentro de una caja azul marino con texto blanco (en fondo claro) o una caja marina translúcida (en fondo oscuro).

## Marco persistente (se repite en todas las escenas)
- Esquinas en "L" de 32 px en los 4 vértices (margen de 36 px).
- Arriba a la izquierda: `CASO DE ESTUDIO · TEMA` (kicker). Arriba a la derecha: `02 / 08` (capítulo actual / total).
- Bajo el kicker: `02 — NOMBRE DEL CAPÍTULO` (mono), y debajo el titular.
- Abajo a la izquierda: `FIG. 02 — DESCRIPCIÓN`. Abajo a la derecha: la URL de la marca.

## Estructura narrativa de 8 capítulos
1. **Contexto / gancho** (oscuro): el hecho que lo detona todo.
2. **El problema** (claro): fragmentación, fricción, la persona sufriendo el sistema. Es el capítulo más largo.
3. **La necesidad** (oscuro): 2 o 3 checks que definen el ideal.
4. **Cómo se trabajó** (claro): personas y co-diseño ("primero procesos, después software").
5. **La solución** (oscuro → claro): pasos con tabs 01-04, hub que conecta todo, producto en uso.
6. **Resultados** (claro): 3 cifras grandes más paneles de evidencia.
7. **Por qué importa** (oscuro): el patrón generalizable.
8. **Cierre** (oscuro): llamada a la acción, logotipo y tagline tecleado.

Los temas **alternan claro y oscuro** entre capítulos. Ese contraste marca el ritmo.

## Ritmo y animación
- Cada frase de la voz (2 a 4 s) dispara UN cambio visual: aparece una capa, cambia el titular o se mueve un personaje.
- El titular entra con una máscara (sube desde abajo), y el anterior sale hacia arriba desvaneciéndose.
- Las etiquetas (chips mono con borde) aparecen escalonadas con un leve rebote. Las rojas (`!× 3`) marcan el problema.
- Las líneas se "dibujan" (stroke-dashoffset). Las credenciales rojas aparecen con escala y rebote.
- Transiciones entre capítulos:
  - **zoom** a través de una puerta u objeto, hasta que llena la pantalla.
  - **barrido vertical** (`wipe_up`).
  - **deslizamiento lateral** (`slide_left`).
  - **fundido** para el cierre.
- No hay cortes duros de cámara: todo es una sola "hoja" continua que se transforma.

## Audio
- Voz en off masculina, calmada, tono documental corporativo, ritmo de unos 2,5 palabras por segundo.
- Frases cortas (4 a 12 palabras) que muchas veces se encadenan con comas entre escenas ("Pero quienes llegaban… / pronto encontraron una segunda frontera.").
- Colchón musical tech/ambiental continuo (sin silencios), en volumen bajo y comprimido bajo la voz.
- Mezcla final a unos −14 LUFS, el estándar para redes sociales.

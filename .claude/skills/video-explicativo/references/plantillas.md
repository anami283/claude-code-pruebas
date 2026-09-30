# Formato del storyboard y catálogo de plantillas

## Estructura general
```json
{
  "meta": {
    "kicker": "Caso de estudio · Tema",       // arriba a la izquierda (se muestra en mayúsculas)
    "brandUrl": "marca.com",                  // abajo a la derecha
    "voice": { "elevenlabs_voice_id": "...", "piper_voice": "es_MX-claude-high", "speed": 1.0 },
    "music": { "mood": "tech|calido|serio", "bpm": 96 },
    "captionWords": 8,                        // máximo de palabras por subtítulo
    "lead": 0.5                               // silencio inicial (s)
  },
  "chapters": [
    {
      "section": "El problema",               // "02 — EL PROBLEMA"
      "fig": "Atención fragmentada",          // "FIG. 02 — ATENCIÓN FRAGMENTADA" (≤ 34 caracteres)
      "theme": "light",                       // light | dark
      "scenes": [
        {
          "template": "panels",
          "theme": "dark",                    // opcional: sobrescribe el tema del capítulo
          "transition": { "type": "zoom", "origin": [540, 800], "dur": 1.0 },
          "data": { ... },                    // datos propios de la plantilla (abajo)
          "show": ["panels"],                 // capas visibles desde el inicio de la escena
          "set": { "personAt": 0 },           // valores iniciales
          "hold": 0.15,                       // pausa al final de la escena (s)
          "noSection": false, "noCaption": false, "noCounter": false,
          "beats": [
            {
              "say": "Frase que dice la voz,",        // obligatorio para que haya voz
              "caption": "Texto del subtítulo",       // opcional (por defecto = say)
              "headline": "Titular.\nSegunda línea",  // cambia el titular (persiste)
              "tags": ["Etiqueta", "!Roja"],          // chips bajo el titular
              "show": ["capa"], "hide": ["capa"],     // revelar/ocultar capas
              "set": { "clave": 1 },                  // mover/animar valores
              "pause": 0.28, "min": 0.9,              // silencio tras la frase, duración mínima
              "dur": 1.6                              // duración si el beat no tiene voz
            }
          ]
        }
      ]
    }
  ]
}
```
Transiciones: `cut`, `fade`, `wipe_up`, `push_up`, `slide_left`, `wipe_left`, `zoom` (usa `origin` en px sobre la escena ANTERIOR).

## Plantillas narrativas (réplica del video de referencia)

### `hero_split`: dos lados separados por una frontera
`data`: `left` y `right` = `{colors:[hex...], dir:"h"|"v", label}` o `{icon, label}`; `walkers` (1-4).
Capas: `emblems`, `divider`, `people` (llegan caminando), `crowd`, `door` (puerta abierta), `wall` (sube un muro o edificio con puerta). `set.doorOpen` va de 0 a 1.

### `panels`: silos (instituciones, áreas, sistemas)
`data.panels[]`: `{title, subtitle, form, sys, label}` (entre 2 y 4 paneles).
Capas:
- `panels`, `process`, `forms`, `systems`.
- `broken`: conexiones con X.
- `alerts`: credenciales rojas.
- `redline`: línea roja punteada.
- `labels`: los cuadros se vuelven etiquetas grandes.
- `person`: madre e hijo.
- `outofreach`: elipse roja punteada más personas sentadas.

`set.personAt` indica el índice del panel hacia el que camina la persona.

### `blueprint`: la necesidad, con una sola puerta en modo plano
`data`: `checks[]` (2-4, se muestran en la zona del titular; NO uses `headline` en esta escena), `dimLabel`, `note`.
Capas: `ghosts` (3 puertas punteadas), `door`, `dims` (cotas), y `c0`, `c1`, `c2`, `c3` (cada check).

### `team_board`: co-diseño y trabajo en equipo
`data`: `board` (título del tablero), `labelA`, `labelB`, `laptop`, `screenText`.
Capas: `board`, `notes` (notas adhesivas), `groupA` (4 personas en la mesa), `groupB` (2 de pie), `screen` (el tablero se vuelve pantalla oscura).

### `iso_hub`: la solución que conecta todo
`data`: `tabs[]` (pasos 01-04), `tiles[]` (3 bloques isométricos), `accountLabel`.
Capas:
- `tabs`, `tiles`.
- `maze`: recorrido roto.
- `person`: persona + mesa.
- `badge`: credencial roja.
- `secure`: escudo.
- `links`: la credencial sube y se conecta a los bloques con líneas rojas.
- `door`: una puerta reemplaza la mesa.
- `checks`, `account`.

`set.tab` indica el índice del tab activo (en rojo).

### `phone_ui`: el producto en uso
`data.forms[]`: `{chip, title, subtitle, fields[], cta}` (una versión por idioma o variante). También `aiLabel` y `hair`.
Capas: `phone`, `character` (busto grande), `ai` (barra "capa de traducción IA" con conectores rojos).
`set.lang` indica la versión visible del formulario.

### `stats`: los resultados
`data`: `stats[]` = `{value:"30%", label}` (3 como máximo; el número cuenta hacia arriba), `panels[]` = `{title, chip, icon, text}`.
Capas: `s0`, `s1`, `s2` (cada cifra), `panels`, `bus` (conexión roja inferior).
Consejo: usa `tags` en los beats para la fuente o el sello ("Citado por la UE"). Como esta escena no lleva titular, las etiquetas bajan solas.

### `network`: el patrón generalizable
`data`: `actors[]` (2-3), `doorLabel`, `outcomes[]` (2-3), `rulerLabel`.
Capas: `actors`, `links`, `door`, `outcomes`, `ruler`.

### `statement`: frase centrada
`data`: `lines[]` (o `text`), `size` (58), `y` (600), `sub`.

### `logo_end`: cierre de marca
`data`: `brand`, `tagline` (se teclea letra por letra), `url`, `size` (150), `swoosh` (true agrega el trazo rojo).

## Plantillas genéricas (para cualquier contenido)

### `cards`: 2 a 4 ideas
`data.items[]`: `{icon, title, text, kicker}`. Con 4 elementos se arma una grilla de 2×2; con menos, una lista.
Capas: `items` (aparecen escalonados) o `i0` a `i3` (uno por beat). `set.focus` resalta en rojo el índice indicado.

### `process`: pasos numerados verticales
`data.steps[]`: `{title, text, icon}` (3 a 5 pasos).
Capas: `line`, `steps` o `s0` a `s4`. `set.active` indica el paso activo (en rojo); los anteriores quedan con check.

### `before_after`: antes vs. después
`data`: `beforeTitle`, `before[]`, `afterTitle`, `after[]` (3 a 4 elementos cada uno).
Capas: `before`, `after`.

### `bars`: magnitudes
`data.bars[]`: `{label, value, display, highlight}`.
Capa: `bars` (las barras crecen).

### `quote`: cita textual
`data`: `text`, `author`.

### `persona`: un personaje con sus dolores o ideas
`data`: `hair` (long|short|bun|curly), `pose`, `top`, `items[]` = `{icon, title, text, red}`.
Capas: `person`, `items` o `i0` a `i3`.

## Íconos disponibles (`icon`)
document, user, users, building, shield, check, clock, money, chart, trend, globe, chat, gear, idea, lock, phone, mail, cloud, database, heart, star, target, rocket, warning, search, calendar, truck, school, briefcase, health, leaf, ai, link, flow, home, factory, cart, scale, eye, handshake, megaphone

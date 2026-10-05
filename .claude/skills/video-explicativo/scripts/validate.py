#!/usr/bin/env python3
"""Valida un storyboard.json antes de renderizar. Uso: python3 validate.py storyboard.json"""
import json, sys

# capas que reconoce cada plantilla (las de "show"/"hide") y claves de "set"
TEMPLATES = {
    "hero_split": {"layers": {"emblems", "divider", "people", "crowd", "door", "wall"}, "set": {"doorOpen"}},
    "panels": {"layers": {"panels", "process", "forms", "systems", "broken", "alerts", "redline", "labels", "person", "outofreach"}, "set": {"personAt"}},
    "blueprint": {"layers": {"ghosts", "door", "dims", "c0", "c1", "c2", "c3"}, "set": set()},
    "team_board": {"layers": {"board", "notes", "groupA", "groupB", "screen"}, "set": set()},
    "iso_hub": {"layers": {"tabs", "tiles", "maze", "person", "door", "badge", "links", "secure", "account", "checks"}, "set": {"tab"}},
    "phone_ui": {"layers": {"phone", "character", "ai"}, "set": {"lang"}},
    "stats": {"layers": {"s0", "s1", "s2", "panels", "bus"}, "set": set()},
    "network": {"layers": {"actors", "links", "door", "outcomes", "ruler"}, "set": set()},
    "statement": {"layers": set(), "set": set()},
    "logo_end": {"layers": set(), "set": set()},
    "intro": {"layers": set(), "set": set()},
    "cards": {"layers": {"items", "i0", "i1", "i2", "i3"}, "set": {"focus"}},
    "process": {"layers": {"line", "steps", "s0", "s1", "s2", "s3", "s4"}, "set": {"active"}},
    "before_after": {"layers": {"before", "after"}, "set": set()},
    "bars": {"layers": {"bars"}, "set": set()},
    "quote": {"layers": set(), "set": set()},
    "persona": {"layers": {"person", "items", "i0", "i1", "i2", "i3"}, "set": set()},
}
# estilo "datos con bolitas" (16:9): capas automáticas salvo que se declaren con "show"
DATOS_TEMPLATES = {
    "titulo": {"layers": {"zone", "title", "sub", "props", "chars"}, "set": set()},
    "cifra": {"layers": {"value", "label", "tag", "side", "chars"}, "set": set()},
    "unidades": {"layers": {"units", "highlight", "value"}, "set": set()},
    "linea": {"layers": {"axes", "s0", "s1", "s2", "s3"}, "set": set()},
    "barras": {"layers": {"bars"}, "set": set()},
    "fila": {"layers": {"queue", "building"}, "set": {"advance"}},
    "monedas": {"layers": {"value", "stacks"}, "set": set()},
    "linea_tiempo": {"layers": {"walk", "label", "title", "extra"}, "set": set()},
    "puntos": {"layers": {"title", "i0", "i1", "i2", "i3", "i4", "props", "chars"}, "set": {"focus"}},
    "comparacion": {"layers": {"title", "left", "right"}, "set": set()},
    "frase": {"layers": {"text", "props", "chars"}, "set": set()},
    "escena": {"layers": {"zones", "props", "chars", "labels"}, "set": set()},
    "cierre": {"layers": {"logo", "chars"}, "set": set()},
}
DATOS_TRANSITIONS = {"cut", "none", "fade", "whip", "pan", "pan_up", "zoom_in"}
TRANSITIONS = {"cut", "none", "fade", "wipe_up", "wipe_left", "slide_left", "zoom", "push_up", "flip", "glide", "zoom_blur"}


def validate(sb):
    errs, warns = [], []
    datos = (sb.get("meta") or {}).get("style") == "datos"
    templates = DATOS_TEMPLATES if datos else TEMPLATES
    transitions = DATOS_TRANSITIONS | TRANSITIONS if datos else TRANSITIONS
    if "chapters" not in sb or not sb["chapters"]:
        return ["falta 'chapters'"], warns
    total_words = 0
    for ci, ch in enumerate(sb["chapters"], 1):
        if ch.get("theme", "light") not in ("light", "dark"):
            errs.append(f"cap {ci}: theme debe ser light|dark")
        if not ch.get("scenes"):
            errs.append(f"cap {ci}: sin escenas")
        for si, sc in enumerate(ch.get("scenes", []), 1):
            where = f"cap {ci} escena {si}"
            tp = sc.get("template")
            if tp not in templates:
                errs.append(f"{where}: plantilla desconocida '{tp}'. Opciones: {', '.join(templates)}")
                continue
            spec = templates[tp]
            tr = (sc.get("transition") or {}).get("type")
            if tr and tr not in transitions:
                errs.append(f"{where}: transición '{tr}' no existe ({', '.join(sorted(transitions))})")
            for l in sc.get("show", []):
                if spec["layers"] and l not in spec["layers"]:
                    warns.append(f"{where}: capa '{l}' no la usa {tp}")
            if not sc.get("beats"):
                errs.append(f"{where}: sin beats")
            for bi, b in enumerate(sc.get("beats", []), 1):
                w = f"{where} beat {bi}"
                for l in b.get("show", []) + b.get("hide", []):
                    if spec["layers"] and l not in spec["layers"]:
                        warns.append(f"{w}: capa '{l}' no la usa {tp} (capas: {', '.join(sorted(spec['layers']))})")
                for k in (b.get("set") or {}):
                    if k not in spec["set"]:
                        warns.append(f"{w}: set '{k}' no lo usa {tp}")
                say = (b.get("say") or "").strip()
                n = len(say.split())
                total_words += n
                if n > 18:
                    warns.append(f"{w}: frase de {n} palabras; el estilo pide frases cortas (≤ 14)")
                hl = b.get("headline")
                if hl and not datos and len(str(hl).split("\n")[0]) > 26:
                    warns.append(f"{w}: titular largo ({len(hl)} car.); ideal ≤ 22 por línea")
    secs = total_words / 2.5
    if secs > (420 if datos else 150):
        warns.append(f"narración estimada {secs:.0f}s: demasiado larga (objetivo 60-95s)")
    if secs < 30:
        warns.append(f"narración estimada {secs:.0f}s: muy corta")
    return errs, warns


if __name__ == "__main__":
    sb = json.load(open(sys.argv[1], encoding="utf-8"))
    e, w = validate(sb)
    for x in w:
        print("aviso:", x)
    for x in e:
        print("ERROR:", x)
    print("OK" if not e else f"{len(e)} errores")
    sys.exit(1 if e else 0)

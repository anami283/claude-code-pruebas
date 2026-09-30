// Núcleo: línea de tiempo, contexto de escena, titulares, subtítulos, marco y transiciones.
// Expone window.renderAt(t) y window.sceneEnds para el renderizador.

(function () {
  const DATA = window.__TIMELINE__;
  const root = document.getElementById('root');
  root.style.width = W + 'px'; root.style.height = H + 'px';
  const meta = DATA.meta || {};

  // ---------- preparar escenas ----------
  const scenes = DATA.scenes.map((sc, i) => {
    const s = { ...sc, index: i };
    s.T = THEMES[sc.chapter?.theme || 'light'];
    s.dur = sc.end - sc.start;
    // capas: momento en que aparece / desaparece cada una
    s.shown = {}; s.hidden = {}; s.sets = [];
    (sc.show || []).forEach(l => { s.shown[l] = 0; });
    if (sc.set) s.sets.push({ t: 0, v: sc.set });
    let headline = null;
    s.headlines = [];
    s.beats = (sc.beats || []).map(b => {
      const bt = { ...b, ls: b.start - sc.start, le: b.end - sc.start };
      (b.show || []).forEach(l => { if (!(l in s.shown)) s.shown[l] = bt.ls; });
      (b.hide || []).forEach(l => { s.hidden[l] = bt.ls; });
      if (b.set) s.sets.push({ t: bt.ls, v: b.set });
      if (b.headline !== undefined && b.headline !== headline) {
        headline = b.headline; s.headlines.push({ t: bt.ls, text: b.headline, tags: b.tags });
      } else if (b.tags) {
        s.headlines.push({ t: bt.ls, text: headline, tags: b.tags, keep: true });
      }
      return bt;
    });
    return s;
  });

  // ---------- contexto que reciben las plantillas ----------
  function makeCtx(sc, t) {
    const ctx = { t, T: sc.T, data: sc.data || {}, scene: sc, meta };
    ctx.since = l => (l in sc.shown && t >= sc.shown[l]) ? t - sc.shown[l] : -1;
    ctx.has = l => ctx.since(l) >= 0;
    // progreso 0..1 de una capa, con retardo y duración; resta si se ocultó
    ctx.p = (l, delay = 0, dur = 0.6, ease = E.out) => {
      if (!(l in sc.shown)) return 0;
      let v = ease((t - sc.shown[l] - delay) / dur);
      if (l in sc.hidden) v *= 1 - E.out((t - sc.hidden[l]) / 0.45);
      return clamp(v);
    };
    // valor animado de una variable fijada con "set"
    ctx.v = (key, def = 0, dur = 0.8, ease = E.inOut) => {
      let prev = def, cur = def, tt = -1;
      for (const s of sc.sets) {
        if (s.t > t) break;
        if (key in s.v) { prev = cur; cur = s.v[key]; tt = s.t; }
      }
      if (typeof cur !== 'number' || typeof prev !== 'number' || tt < 0) return cur;
      return lerp(prev, cur, ease((t - tt) / dur));
    };
    ctx.raw = (key, def) => { let cur = def; for (const s of sc.sets) { if (s.t > t) break; if (key in s.v) cur = s.v[key]; } return cur; };
    ctx.setAt = key => { let tt = -1; for (const s of sc.sets) { if (s.t > t) break; if (key in s.v) tt = s.t; } return tt; };
    return ctx;
  }

  // ---------- fondo con grilla ----------
  function background(T) {
    let g = `<rect width="${W}" height="${H}" fill="${T.bg}"/>`;
    if (T.name === 'dark') g += `<defs><radialGradient id="vg" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#16213A"/><stop offset="1" stop-color="#0A1120"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#vg)"/>`;
    let lines = '';
    for (let x = 0; x <= W; x += 108) lines += `M${x} 0V${H}`;
    for (let y = 0; y <= H; y += 108) lines += `M0 ${y}H${W}`;
    let fine = '';
    for (let x = 0; x <= W; x += 27) fine += `M${x} 0V${H}`;
    for (let y = 0; y <= H; y += 27) fine += `M0 ${y}H${W}`;
    g += `<path d="${fine}" stroke="${T.grid}" stroke-width="0.6" opacity=".55"/><path d="${lines}" stroke="${T.grid}" stroke-width="1.2"/>`;
    return g;
  }

  // ---------- titular (HTML) ----------
  function headlineHTML(sc, t) {
    const T = sc.T, ch = sc.chapter || {};
    let html = '';
    if (ch.section && !sc.noSection) {
      const secP = E.out((t - 0.1) / 0.5);
      html += `<div class="hl" style="top:124px;color:${T.name === 'dark' ? '#B8C0D2' : T.sub};opacity:${secP}"><div class="sec">${esc(String(ch.num).padStart(2, '0'))} — ${esc(ch.section)}</div></div>`;
    }
    const hs = sc.headlines;
    let curI = -1;
    for (let i = 0; i < hs.length; i++) if (hs[i].t <= t) curI = i;
    const size = sc.hlSize || 66;
    const block = (h, p, out) => {
      if (!h || (!h.text && !(h.tags && h.tags.length))) return '';
      const [l1, l2] = String(h.text || '').split('\n');
      const y = out ? -40 * E.inOut(p) : 0, op = out ? 1 - E.inOut(p) : 1;
      const rise = out ? 0 : (1 - E.out(p)) * 100;
      let s = `<div style="transform:translateY(${y}px);opacity:${op}${!h.text ? `;padding-top:${sc.tagsOffset ?? 150}px` : ''}">`;
      if (h.text) s += `<div class="mask"><div class="line1" style="font-size:${size}px;transform:translateY(${rise}%);color:${T.ink}">${esc(l1)}</div></div>`;
      if (l2) {
        const p2 = out ? 1 : E.out((t - h.t - 0.15) / 0.55);
        s += `<div class="mask"><div class="line2" style="font-size:${size * 0.78}px;transform:translateY(${(1 - p2) * 100}%);color:${T.ink}">${esc(l2)}</div></div>`;
      }
      if (h.tags && h.tags.length) {
        s += `<div class="tags">` + h.tags.map((tg, k) => {
          const red = String(tg).startsWith('!');
          const txt = red ? String(tg).slice(1) : tg;
          const tp = out ? 1 : E.back((t - h.t - 0.25 - k * 0.18) / 0.4);
          const c = red ? RED : T.ink;
          return `<span class="tag" style="color:${c};border-color:${c};opacity:${clamp(tp)};transform:scale(${lerp(0.7, 1, clamp(tp))})">${esc(txt)}</span>`;
        }).join('') + `</div>`;
      }
      return s + `</div>`;
    };
    if (curI >= 0) {
      const cur = hs[curI];
      const same = curI > 0 && hs[curI - 1].text === cur.text;
      const p = same ? 1 : (t - cur.t) / 0.55;
      let inner = '';
      if (curI > 0 && !same && t - cur.t < 0.35 && hs[curI - 1].text) inner += `<div style="position:absolute;inset:0">${block(hs[curI - 1], (t - cur.t) / 0.35, true)}</div>`;
      inner += `<div style="position:relative">${block(cur, t - cur.t < 0.3 && !same && curI > 0 && hs[curI - 1].text ? 0 : p, false)}</div>`;
      html += `<div class="hl" style="top:158px">${inner}</div>`;
    }
    return html;
  }

  // ---------- subtítulos ----------
  function splitCaption(text, maxWords) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return [words.join(' ')];
    const n = Math.ceil(words.length / maxWords), per = Math.ceil(words.length / n), out = [];
    let i = 0;
    while (i < words.length) {
      let j = Math.min(words.length, i + per);
      // preferir cortar tras puntuación cercana, y nunca dejar un resto de 1-2 palabras
      for (let k = Math.min(words.length - 1, j + 2); k > i + 2 && k >= j - 2; k--) if (/[,.;:]$/.test(words[k - 1])) { j = k; break; }
      if (words.length - j > 0 && words.length - j < 3) j = words.length;
      out.push(words.slice(i, j).join(' ')); i = j;
    }
    return out;
  }
  function captionAt(t) {
    for (const sc of scenes) {
      for (const b of sc.beats) {
        if (t >= b.start && t < b.end) {
          const text = b.caption ?? b.say;
          if (!text) return null;
          const speakEnd = b.start + (b.speech ?? (b.end - b.start));
          const chunks = splitCaption(text, meta.captionWords || 8);
          const total = chunks.reduce((a, c) => a + c.length, 0);
          let acc = b.start;
          for (let i = 0; i < chunks.length; i++) {
            const d = (speakEnd - b.start) * chunks[i].length / total;
            if (t < acc + d || i === chunks.length - 1) return { text: chunks[i], t0: acc, sc };
            acc += d;
          }
        }
      }
    }
    return null;
  }

  // ---------- marco (esquinas + rótulos mono) ----------
  function chrome(sc) {
    const T = sc.T, ch = sc.chapter || {}, c = T.name === 'dark' ? '#AEB6C8' : T.sub;
    const br = T.name === 'dark' ? '#C9D0DE' : T.ink;
    const corner = (x, y, dx, dy) => `<path d="M${x} ${y + dy * 32} L${x} ${y} L${x + dx * 32} ${y}" stroke="${br}" stroke-width="2" fill="none"/>`;
    let svg = `<svg width="${W}" height="${H}" style="position:absolute;inset:0">${corner(36, 36, 1, 1)}${corner(W - 36, 36, -1, 1)}${corner(36, H - 36, 1, -1)}${corner(W - 36, H - 36, -1, -1)}</svg>`;
    const total = String(meta.chapters || 8).padStart(2, '0');
    const num = ch.num ? String(ch.num).padStart(2, '0') : '';
    let h = `<div class="chrome" style="color:${c}">${svg}`;
    if (meta.kicker) h += `<div class="c" style="left:85px;top:40px">${esc(meta.kicker)}</div>`;
    if (num && !sc.noCounter) h += `<div class="c" style="right:85px;top:40px">${num} / ${total}</div>`;
    if (ch.fig || meta.footerLeft) h += `<div class="c" style="left:85px;top:1288px;max-width:${meta.brandUrl ? 640 : 900}px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(ch.fig ? `FIG. ${num} — ${ch.fig}` : meta.footerLeft)}</div>`;
    if (meta.brandUrl) h += `<div class="c" style="right:85px;top:1288px">${esc(meta.brandUrl)}</div>`;
    return h + `</div>`;
  }

  // ---------- render de una escena en un "stage" ----------
  function renderScene(sc, t) {
    const tpl = TEMPLATES[sc.template];
    const ctx = makeCtx(sc, t);
    let art = '';
    try { art = tpl ? tpl(ctx) : ''; } catch (e) { art = `<text x="80" y="700" fill="red" font-size="24">${esc(sc.template + ': ' + e.message)}</text>`; }
    const floor = sc.floor !== false && (tpl && tpl.floor !== undefined ? tpl.floor : true);
    const floorLine = floor ? `<path d="M0 1152 H${W}" stroke="${sc.T.name === 'dark' ? 'rgba(255,255,255,.35)' : sc.T.ink}" stroke-width="1.5"/>` : '';
    return `<svg class="art" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${background(sc.T)}${floorLine}${art}</svg>${headlineHTML(sc, t)}`;
  }

  function sceneIndexAt(t) {
    for (let i = scenes.length - 1; i >= 0; i--) if (t >= scenes[i].start) return i;
    return 0;
  }

  function transitionStyle(type, p, isIn, sc) {
    const e = E.inOut(p);
    switch (type) {
      case 'fade': return isIn ? `opacity:${e}` : '';
      case 'wipe_up': return isIn ? `transform:translateY(${(1 - e) * H}px)` : `transform:translateY(${-e * 180}px)`;
      case 'wipe_left': return isIn ? `transform:translateX(${(1 - e) * W}px)` : `transform:translateX(${-e * W * 0.3}px)`;
      case 'slide_left': return isIn ? `transform:translateX(${(1 - e) * W}px)` : `transform:translateX(${-e * W}px)`;
      case 'zoom': {
        const [ox, oy] = (sc.transition && sc.transition.origin) || [540, 675];
        if (isIn) return `opacity:${clamp((p - 0.55) / 0.45)}`;
        const z = 1 + Math.pow(E.inOut(p), 2) * 9;
        return `transform-origin:${ox}px ${oy}px;transform:scale(${z})`;
      }
      case 'push_up': return isIn ? `transform:translateY(${(1 - e) * H}px)` : `transform:translateY(${-e * H}px)`;
      default: return isIn ? '' : 'display:none';
    }
  }

  window.renderAt = function (t) {
    const i = sceneIndexAt(t), sc = scenes[i];
    const tr = sc.transition || { type: i === 0 ? 'none' : 'cut' };
    const td = tr.dur ?? (tr.type === 'zoom' ? 1.0 : 0.6);
    const lt = t - sc.start;
    let html = '';
    let chromeSc = sc;
    if (i > 0 && tr.type !== 'cut' && tr.type !== 'none' && lt < td) {
      const prev = scenes[i - 1];
      const p = lt / td;
      html += `<div class="stage" style="${transitionStyle(tr.type, p, false, sc)}">${renderScene(prev, t - prev.start)}</div>`;
      html += `<div class="stage" style="${transitionStyle(tr.type, p, true, sc)}">${renderScene(sc, lt)}</div>`;
      if (p < 0.5) chromeSc = prev;
    } else {
      html += `<div class="stage">${renderScene(sc, lt)}</div>`;
    }
    html += chrome(chromeSc);
    const cap = captionAt(t);
    if (cap && !cap.sc.noCaption) {
      const T = cap.sc.T, cp = E.out((t - cap.t0) / 0.18);
      html += `<div class="cap" style="opacity:${cp};transform:translateY(${(1 - cp) * 8}px)"><span style="background:${T.capBg};color:${T.capFg}">${esc(cap.text)}</span></div>`;
    }
    root.innerHTML = html;
  };

  window.__duration = DATA.duration;
  window.__sceneMarks = scenes.map(s => ({ start: s.start, end: s.end, template: s.template }));
  window.__ready = document.fonts.ready.then(() => true);
})();

// Núcleo del estilo "datos con bolitas": escenas, capas, rótulos, subtítulos, fuente del dato y transiciones.
// Expone window.renderAt(t) para el renderizador (mismo contrato que el motor principal).
(function () {
  const DATA = window.__TIMELINE__;
  const meta = DATA.meta || {};
  applyDatosMeta(meta);
  const root = document.getElementById('root');
  root.style.width = W + 'px'; root.style.height = H + 'px';

  const scenes = DATA.scenes.map((sc, i) => {
    const s = { ...sc, index: i, dur: sc.end - sc.start, shown: {}, hidden: {}, sets: [], headlines: [] };
    (sc.show || []).forEach(l => { s.shown[l] = 0; });
    if (sc.set) s.sets.push({ t: 0, v: sc.set });
    let headline = null;
    s.beats = (sc.beats || []).map(b => {
      const bt = { ...b, ls: b.start - sc.start, le: b.end - sc.start };
      (b.show || []).forEach(l => { if (!(l in s.shown)) s.shown[l] = bt.ls; });
      (b.hide || []).forEach(l => { s.hidden[l] = bt.ls; });
      if (b.set) s.sets.push({ t: bt.ls, v: b.set });
      if (b.headline !== undefined && b.headline !== headline) { headline = b.headline; s.headlines.push({ t: bt.ls, text: b.headline, tags: b.tags }); }
      else if (b.tags) s.headlines.push({ t: bt.ls, text: headline, tags: b.tags, keep: true });
      return bt;
    });
    return s;
  });

  function makeCtx(sc, t) {
    const ctx = { t, data: sc.data || {}, scene: sc, meta };
    ctx.since = l => (l in sc.shown && t >= sc.shown[l]) ? t - sc.shown[l] : -1;
    ctx.has = l => ctx.since(l) >= 0;
    const hide = (l, v) => (l in sc.hidden) ? v * (1 - E.out((t - sc.hidden[l]) / 0.45)) : v;
    ctx.p = (l, delay = 0, dur = 0.6, ease = E.out) => (l in sc.shown) ? clamp(hide(l, ease((t - sc.shown[l] - delay) / dur))) : 0;
    // capa controlada por beat si se declaró con "show"; si no, aparece sola tras `delay`
    ctx.ap = (l, delay = 0, dur = 0.6, ease = E.out) => (l in sc.shown) ? ctx.p(l, 0, dur, ease) : clamp(hide(l, ease((t - delay) / dur)));
    ctx.v = (key, def = 0, dur = 0.8, ease = E.inOut) => {
      let prev = def, cur = def, tt = -1;
      for (const s of sc.sets) { if (s.t > t) break; if (key in s.v) { prev = cur; cur = s.v[key]; tt = s.t; } }
      if (typeof cur !== 'number' || typeof prev !== 'number' || tt < 0) return cur;
      return lerp(prev, cur, ease((t - tt) / dur));
    };
    ctx.raw = (key, def) => { let cur = def; for (const s of sc.sets) { if (s.t > t) break; if (key in s.v) cur = s.v[key]; } return cur; };
    ctx.setAt = key => { let tt = -1; for (const s of sc.sets) { if (s.t > t) break; if (key in s.v) tt = s.t; } return tt; };
    return ctx;
  }

  // rótulo de la escena (headline): "*texto" = cifra sobre marcador; si no, etiqueta negra. tags debajo.
  function headlineSVG(sc, t) {
    const hs = sc.headlines;
    let cur = null;
    for (const h of hs) if (h.t <= t) cur = h;
    if (!cur) return '';
    const p = clamp((t - cur.t) / 0.45);
    let g = '';
    const x = sc.hlX ?? 110, y = sc.hlY ?? 130;
    if (cur.text) {
      const s = String(cur.text);
      if (s[0] === '*') g += mark(x, y + 40, s.slice(1), { size: 78, reveal: cur.keep ? 1 : E.out(p) });
      else g += appear(cur.keep ? 1 : p, String(s).split('\n').map((l, i) => tag(x, y + i * 52, l, { size: 32 })).join(''), { dy: 10 });
    }
    if (cur.tags) {
      const ty = y + (cur.text ? (String(cur.text)[0] === '*' ? 110 : 60 + (String(cur.text).split('\n').length - 1) * 52) : 0);
      let tx = x;
      cur.tags.forEach((tg, k) => { g += appear(clamp((t - cur.t - 0.2 - k * 0.15) / 0.35), tag(tx, ty, tg, { size: 24 })); tx += tagW(tg, 24) + 12; });
    }
    return g;
  }

  function renderScene(sc, t) {
    setBoil(sc.start + t);
    const tpl = TEMPLATES[sc.template], ctx = makeCtx(sc, t);
    let art = '';
    try { art = tpl ? tpl(ctx) : ''; } catch (e) { art = `<text x="80" y="540" fill="red" font-size="28">${esc(sc.template + ': ' + e.message)}</text>`; }
    // cámara: deriva lateral suave y acercamiento lento (como un mundo continuo)
    const cam = sc.camera || {};
    const dx = -(cam.pan ?? 18) * E.inOut(t / Math.max(2, sc.dur)), z = 1 + (cam.zoom ?? 0.025) * E.inOut(t / Math.max(2, sc.dur));
    const src = sc.fuente || (sc.data && sc.data.fuente);
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0">${paper(t)}` +
      `<g transform="translate(${f(W / 2 + dx)} ${f(H / 2)}) scale(${f(z * 1000) / 1000}) translate(${-W / 2} ${-H / 2})">${art}</g>` +
      headlineSVG(sc, t) + (src ? txt(110, H - 46, src, { size: 18, fill: P.sub }) : '') + `</svg>`;
  }

  const sceneIndexAt = t => { for (let i = scenes.length - 1; i >= 0; i--) if (t >= scenes[i].start) return i; return 0; };

  function transitionStyle(type, p, isIn) {
    const e = E.inOut(p);
    switch (type) {
      case 'fade': return isIn ? `opacity:${f(e)}` : '';
      // barrido rápido con desenfoque de movimiento (la firma del formato)
      case 'whip': {
        const blur = f(Math.sin(Math.PI * p) * 26);
        return isIn ? `transform:translateX(${f((1 - e) * W)}px);filter:blur(${blur}px)` : `transform:translateX(${f(-e * W)}px);filter:blur(${blur}px)`;
      }
      // paneo continuo: la cámara se desplaza por el mismo mundo
      case 'pan': return isIn ? `transform:translateX(${f((1 - e) * W)}px)` : `transform:translateX(${f(-e * W)}px)`;
      case 'pan_up': return isIn ? `transform:translateY(${f((1 - e) * H)}px)` : `transform:translateY(${f(-e * H)}px)`;
      case 'zoom_in': return isIn ? `opacity:${f(clamp((p - .45) / .55))}` : `transform-origin:50% 50%;transform:scale(${f(1 + e * e * 3)});opacity:${f(1 - clamp((p - .4) / .6))}`;
      default: return isIn ? '' : 'display:none';
    }
  }

  function captionHTML(t) {
    if (meta.captions === false) return '';
    for (const sc of scenes) for (const b of sc.beats) {
      if (t < b.start || t >= b.end || sc.noCaption) continue;
      const text = b.caption ?? b.say;
      if (!text) return '';
      const words = String(text).split(/\s+/), max = meta.captionWords || 9;
      const chunks = []; for (let i = 0; i < words.length; i += max) chunks.push(words.slice(i, i + max).join(' '));
      if (chunks.length > 1 && chunks[chunks.length - 1].split(' ').length < 3) { const last = chunks.pop(); chunks[chunks.length - 1] += ' ' + last; }
      const speakEnd = b.start + (b.speech || (b.end - b.start)), total = chunks.reduce((a, c) => a + c.length, 0);
      let acc = b.start, cur = chunks[chunks.length - 1], t0 = b.start;
      for (const c of chunks) { const d = (speakEnd - b.start) * c.length / total; if (t < acc + d) { cur = c; t0 = acc; break; } acc += d; }
      const op = E.out((t - t0) / 0.15);
      return `<div class="cap" style="opacity:${f(op)}"><span>${esc(cur)}</span></div>`;
    }
    return '';
  }

  window.renderAt = function (t) {
    const i = sceneIndexAt(t), sc = scenes[i];
    let tr = sc.transition || { type: i === 0 ? 'none' : 'cut' };
    const map = { wipe_up: 'pan_up', push_up: 'pan_up', slide_left: 'pan', wipe_left: 'pan', glide: 'pan', flip: 'whip', zoom: 'zoom_in', zoom_blur: 'whip' };
    const type = map[tr.type] || tr.type;
    const td = tr.dur ?? (type === 'whip' ? 0.55 : type === 'pan' || type === 'pan_up' ? 1.0 : 0.6);
    const lt = t - sc.start;
    let html = '';
    if (i > 0 && type !== 'cut' && type !== 'none' && lt < td) {
      const prev = scenes[i - 1], p = lt / td;
      html += `<div class="stage" style="${transitionStyle(type, p, false)}">${renderScene(prev, t - prev.start)}</div>`;
      html += `<div class="stage" style="${transitionStyle(type, p, true)}">${renderScene(sc, lt)}</div>`;
    } else html += `<div class="stage">${renderScene(sc, lt)}</div>`;
    if (meta.logoData && meta.logoCorner !== false && sc.template !== 'cierre') html += `<div class="logo"><img src="${meta.logoData}"></div>`;
    html += captionHTML(t);
    root.innerHTML = html;
  };
  window.__duration = DATA.duration;
  window.__ready = document.fonts.ready.then(() => true);
})();

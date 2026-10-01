// Núcleo: línea de tiempo, contexto de escena, titulares, subtítulos, marco y transiciones.
// Expone window.renderAt(t) y window.sceneEnds para el renderizador.

(function () {
  const DATA = window.__TIMELINE__;
  const root = document.getElementById('root');
  root.style.width = W + 'px'; root.style.height = H + 'px';
  const meta = DATA.meta || {};
  applyStyle(meta.style || 'amac');
  const AMAC = STYLE === 'amac';
  if (AMAC) document.body.classList.add('amac');
  const hash = k => { const x = Math.sin(k * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };

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

  // Fondo AMAC: degradado con profundidad, orbes de luz, red de partículas, piso en perspectiva y banner ondulado.
  function backgroundAmac(T, t, k) {
    const dark = T.name === 'dark', id = T.name;
    let g = `<defs>
      <radialGradient id="bgA${id}" cx="28%" cy="18%" r="100%"><stop offset="0" stop-color="${dark ? '#1E3F99' : '#FFFFFF'}"/><stop offset=".5" stop-color="${dark ? '#0D1B4B' : '#F4F6FB'}"/><stop offset="1" stop-color="${dark ? '#060D2B' : '#DDE5F5'}"/></radialGradient>
      <linearGradient id="wave${id}" x1="0" x2="1"><stop offset="0" stop-color="#2563EB"/><stop offset=".5" stop-color="#7B5BE6"/><stop offset="1" stop-color="#C0C8D8"/></linearGradient>
      <linearGradient id="floor${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${dark ? '#2563EB' : '#1A3A8F'}" stop-opacity="0"/><stop offset="1" stop-color="${dark ? '#2563EB' : '#1A3A8F'}" stop-opacity="${dark ? .5 : .28}"/></linearGradient>
    </defs><rect width="${W}" height="${H}" fill="url(#bgA${id})"/>`;
    // orbes de luz que derivan lentamente (degradados radiales: baratos de renderizar)
    const orbs = [[ACCENT2, dark ? .55 : .18, 0], ['#7B5BE6', dark ? .38 : .12, 2.1], [RED, dark ? .22 : .14, 4.2]];
    g += `<defs>` + orbs.map(([c, o], i) => `<radialGradient id="orb${id}${i}"><stop offset="0" stop-color="${c}" stop-opacity="${o}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`).join('') + `</defs>`;
    g += orbs.map(([c, o, ph], i) => {
      const x = 540 + Math.sin(t * 0.13 + ph + k) * 380, y = 420 + i * 260 + Math.cos(t * 0.11 + ph + k * 0.7) * 160;
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${430 + i * 40}" fill="url(#orb${id}${i})"/>`;
    }).join('');
    // piso en perspectiva (efecto tablero 3D)
    const vy = 760, vx = 540 + Math.sin(t * 0.2 + k) * 40;
    let fl = '';
    for (let i = -9; i <= 9; i++) fl += `M${f(vx)} ${vy} L${f(540 + i * 170)} ${H}`;
    const off = (t * 0.25) % 1;
    for (let j = 0; j < 9; j++) { const z = (j + off) / 9, y = vy + (H - vy) * z * z; fl += `M0 ${f(y)} H${W}`; }
    g += `<path d="${fl}" stroke="url(#floor${id})" stroke-width="1.2" fill="none"/>`;
    // red de partículas (nodos que se conectan)
    const N = 30, pts = [];
    for (let i = 0; i < N; i++) {
      const a = hash(i + k * 31), b = hash(i * 7.3 + k), c = hash(i * 3.1 + 9);
      pts.push([a * W + Math.sin(t * (0.18 + c * 0.25) + i) * 70, b * 1100 + Math.cos(t * (0.15 + a * 0.2) + i * 1.3) * 60]);
    }
    let ln = '';
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      const dx = pts[i][0] - pts[j][0], dy = pts[i][1] - pts[j][1], d = Math.sqrt(dx * dx + dy * dy);
      if (d < 190) ln += `<path d="M${f(pts[i][0])} ${f(pts[i][1])}L${f(pts[j][0])} ${f(pts[j][1])}" stroke="${dark ? '#8FB0FF' : '#1A3A8F'}" stroke-opacity="${f((1 - d / 190) * (dark ? .32 : .16))}" stroke-width="1"/>`;
    }
    g += ln + pts.map(([x, y], i) => `<circle cx="${f(x)}" cy="${f(y)}" r="${i % 5 === 0 ? 3.2 : 2}" fill="${i % 7 === 0 ? RED : (dark ? '#C0C8D8' : '#2563EB')}" opacity="${dark ? .8 : .45}"/>`).join('');
    // banner ondulado azul-violeta-plata (firma de marca)
    const wave = (amp, ph, y0) => { let d = `M0 ${H}`; for (let x = 0; x <= W; x += 30) d += ` L${x} ${f(y0 + Math.sin(x / 140 + t * 0.9 + ph) * amp)}`; return d + ` L${W} ${H} Z`; };
    g += `<path d="${wave(14, 0, 1318)}" fill="url(#wave${id})" opacity="${dark ? .55 : .38}"/><path d="${wave(10, 2, 1330)}" fill="url(#wave${id})" opacity="${dark ? .35 : .25}"/>`;
    return g;
  }

  // ---------- titular (HTML) ----------
  function headlineHTML(sc, t) {
    const T = sc.T, ch = sc.chapter || {};
    let html = '';
    if (ch.section && !sc.noSection) {
      const secP = E.out((t - 0.1) / 0.5);
      html += `<div class="hl" style="top:124px;color:${AMAC ? RED : (T.name === 'dark' ? '#B8C0D2' : T.sub)};opacity:${secP}"><div class="sec">${esc(String(ch.num).padStart(2, '0'))} — ${esc(ch.section)}</div></div>`;
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
      if (h.text && AMAC) s += `<div style="position:absolute;left:-28px;top:10px;width:6px;height:${f(l2 ? size * 1.95 : size * 0.95)}px;border-radius:3px;background:linear-gradient(${RED},#E9D18A);box-shadow:0 0 14px ${RED};transform:scaleY(${f(out ? 1 : E.out(p))});transform-origin:top"></div>`;
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
          const bgc = AMAC ? (red ? 'rgba(201,168,76,.14)' : (T.name === 'dark' ? 'rgba(255,255,255,.08)' : 'rgba(26,58,143,.06)')) : 'transparent';
          const bc = AMAC && !red ? (T.name === 'dark' ? 'rgba(192,200,216,.45)' : 'rgba(26,58,143,.35)') : c;
          return `<span class="tag" style="color:${c};border-color:${bc};background:${bgc};opacity:${clamp(tp)};transform:scale(${lerp(0.7, 1, clamp(tp))})">${esc(txt)}</span>`;
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

  function chromeAmac(sc) {
    const T = sc.T, ch = sc.chapter || {}, dark = T.name === 'dark';
    const c = dark ? '#C0C8D8' : '#4A5568';
    const total = Number(meta.chapters || 8), num = Number(ch.num || 0);
    const glass = dark ? 'background:rgba(255,255,255,.07);border:1px solid rgba(192,200,216,.28)' : 'background:rgba(255,255,255,.7);border:1px solid rgba(26,58,143,.18)';
    let h = `<div class="chrome" style="color:${c}">`;
    if (meta.kicker) h += `<div class="c" style="left:60px;top:44px;padding:9px 18px;border-radius:999px;${glass};display:flex;align-items:center;gap:10px"><span style="width:8px;height:8px;border-radius:50%;background:${RED};box-shadow:0 0 10px ${RED}"></span>${esc(meta.kicker)}</div>`;
    if (num && !sc.noCounter) {
      const bars = Array.from({ length: total }, (_, i) => `<span style="width:22px;height:4px;border-radius:2px;background:${i < num ? RED : (dark ? 'rgba(192,200,216,.25)' : 'rgba(26,58,143,.18)')};${i === num - 1 ? `box-shadow:0 0 8px ${RED}` : ''}"></span>`).join('');
      h += `<div class="c" style="right:60px;top:52px;display:flex;align-items:center;gap:12px"><span>${String(num).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span><span style="display:flex;gap:5px">${bars}</span></div>`;
    }
    if (ch.fig) h += `<div class="c" style="left:60px;top:1262px;max-width:640px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.85">${esc(ch.fig)}</div>`;
    const bigLogo = sc.template === 'intro' || sc.template === 'logo_end';
    if (meta.logoData && !bigLogo) h += `<div class="c" style="right:56px;top:1236px;height:58px;padding:8px 16px;border-radius:14px;background:rgba(255,255,255,.94);box-shadow:0 8px 24px rgba(5,12,40,.25);display:flex;align-items:center"><img src="${meta.logoData}" style="max-height:42px;max-width:200px;object-fit:contain"></div>`;
    else if (meta.brandUrl && !bigLogo) h += `<div class="c" style="right:60px;top:1262px">${esc(meta.brandUrl)}</div>`;
    return h + `</div>`;
  }

  // ---------- render de una escena en un "stage" ----------
  function renderScene(sc, t) {
    const tpl = TEMPLATES[sc.template];
    const ctx = makeCtx(sc, t);
    let art = '';
    try { art = tpl ? tpl(ctx) : ''; } catch (e) { art = `<text x="80" y="700" fill="red" font-size="24">${esc(sc.template + ': ' + e.message)}</text>`; }
    const floor = sc.floor !== false && (tpl && tpl.floor !== undefined ? tpl.floor : true);
    if (AMAC) {
      const dark = sc.T.name === 'dark', k = sc.index;
      const floorLine = floor ? `<path d="M40 1152 H${W - 40}" stroke="${dark ? 'rgba(192,200,216,.4)' : 'rgba(26,58,143,.3)'}" stroke-width="1.5"/>` : '';
      // cámara: entrada en profundidad + balanceo suave + acercamiento lento
      const intro = 1 - E.out(t / 1.1);
      const rx = 2.0 * Math.sin(t * 0.42 + k * 1.7) + intro * 9, ry = 2.8 * Math.sin(t * 0.31 + k * 0.9 + 1);
      const sc0 = (1 + 0.035 * E.inOut(t / Math.max(3, sc.dur))) * (1 - intro * 0.05);
      const glow = dark ? 'drop-shadow(0 0 14px rgba(37,99,235,.4))' : 'drop-shadow(0 14px 18px rgba(13,27,75,.16))';
      const bgShift = `translate(${f(-ry * 3)}px,${f(-rx * 2)}px) scale(1.04)`;
      return `<svg class="bg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0;transform:${bgShift}">${backgroundAmac(sc.T, t + k * 7, k)}</svg>` +
        `<svg class="art" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="transform:perspective(1600px) rotateX(${f(rx)}deg) rotateY(${f(ry)}deg) scale(${f(sc0)});filter:${glow}">${floorLine}${art}</svg>${headlineHTML(sc, t)}`;
    }
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
      case 'flip': {
        const q = isIn ? clamp((p - 0.5) / 0.5) : clamp(p / 0.5);
        if (isIn) return p < 0.5 ? 'opacity:0' : `transform:perspective(1800px) rotateY(${f((1 - E.out(q)) * -90)}deg)`;
        return p >= 0.5 ? 'opacity:0' : `transform:perspective(1800px) rotateY(${f(q * q * q * 90)}deg)`;
      }
      case 'glide': return isIn ? `opacity:${e};transform:perspective(1600px) translate3d(0,${f((1 - e) * 260)}px,${f(-(1 - e) * 500)}px) rotateX(${f((1 - e) * 20)}deg)` : `opacity:${f(1 - e)};transform:perspective(1600px) translate3d(0,${f(-e * 220)}px,${f(e * 260)}px)`;
      case 'zoom_blur': return isIn ? `opacity:${e};transform:scale(${f(1.18 - 0.18 * e)});filter:blur(${f((1 - e) * 10)}px)` : `opacity:${f(1 - e)};transform:scale(${f(1 - 0.08 * e)})`;
      case 'push_up': return isIn ? `transform:translateY(${(1 - e) * H}px)` : `transform:translateY(${-e * H}px)`;
      default: return isIn ? '' : 'display:none';
    }
  }

  window.renderAt = function (t) {
    const i = sceneIndexAt(t), sc = scenes[i];
    let tr = sc.transition || { type: i === 0 ? 'none' : 'cut' };
    // en AMAC las transiciones planas se vuelven 3D (salvo transition.keep)
    if (AMAC && !tr.keep) tr = { ...tr, type: ({ wipe_up: 'glide', push_up: 'glide', slide_left: 'flip', wipe_left: 'flip' })[tr.type] || tr.type };
    const td = tr.dur ?? (tr.type === 'zoom' ? 1.0 : tr.type === 'flip' ? 0.8 : 0.6);
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
    if (!meta.noChrome) html += AMAC ? chromeAmac(chromeSc) : chrome(chromeSc);
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

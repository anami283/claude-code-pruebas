// Plantillas del estilo "datos con bolitas". Cada una recibe ctx y devuelve SVG.
// ctx.ap('capa', retardo) -> progreso 0..1: si la capa se revela con "show" en un beat, manda el beat;
// si no, aparece sola a los `retardo` segundos de iniciada la escena.

const TEMPLATES = {};
const COLOR_NAMES = { rojo: P.red, naranja: P.orange, amarillo: P.yellow, verde: P.green, azul: P.blue, celeste: P.sky, morado: P.purple, rosa: P.pink, blanco: P.white, gris: P.gray, cafe: P.brown };
const col = (c, i = 0) => COLOR_NAMES[c] || c || BOLITA_COLORS[i % BOLITA_COLORS.length];

// personaje declarado en data: {x, color, face, acc, arms, look, r, from (entra caminando desde x), seed}
function drawChar(ctx, c, i = 0, o = {}) {
  if (!c) return '';
  const gy = o.gy ?? c.y ?? GROUND, delay = o.delay ?? c.delay ?? 0.3 + i * 0.15;
  const layer = o.layer || c.layer || 'chars';
  const p = ctx.ap(layer, delay, c.from !== undefined ? (c.walkDur || 1.6) : 0.5, c.from !== undefined ? E.inOut : E.out);
  if (p <= 0) return '';
  let x = c.x ?? 1450, walk = null;
  if (c.from !== undefined) { x = lerp(c.from, x, p); if (p < 1) walk = ctx.t; }
  const body = bolita(x, gy, { r: c.r || 54, color: col(c.color, i), face: c.face || 'neutral', acc: c.acc || [], arms: c.arms, look: c.look ?? (walk !== null ? Math.sign((c.x ?? 1450) - c.from) * 0.6 : 0), t: ctx.t, seed: c.seed ?? i * 1.3, walk });
  return c.from !== undefined ? body : pop(p, x, gy - 40, body);
}
const drawChars = (ctx, list, o = {}) => (list || []).map((c, i) => drawChar(ctx, c, i, o)).join('');

// rótulos libres: [{x, y, text, kind:'tag'|'mark'|'texto', size, layer, delay}]
function drawLabels(ctx, list) {
  return (list || []).map((l, i) => {
    const p = ctx.ap(l.layer || 'labels', l.delay ?? 0.5 + i * 0.25, 0.45);
    if (p <= 0) return '';
    let s;
    if (l.kind === 'mark') s = mark(l.x, l.y, l.text, { size: l.size || 90, reveal: E.out(p) });
    else if (l.kind === 'texto') s = lines(l.x, l.y, l.text, { size: l.size || 34, anchor: l.anchor });
    else s = tag(l.x, l.y, l.text, { size: l.size || 26, anchor: l.anchor });
    return l.kind === 'mark' ? s : appear(p, s, { dy: 12 });
  }).join('');
}

// ---------- 1) título de apertura ----------
TEMPLATES.titulo = ctx => {
  const { data: d } = ctx;
  let g = appear(ctx.ap('zone', 0, 0.5), zone(110, 250, 1000, 440));
  const pt = ctx.ap('title', 0.25, 0.6);
  if (pt > 0) g += mark(160, 400, d.title || '', { size: d.size || 96, reveal: E.out(pt) });
  g += appear(ctx.ap('sub', 0.7), lines(175, 500, d.sub || '', { size: 44 }));
  if (d.tag) g += appear(ctx.ap('sub', 1.0), tag(175, 500 + String(d.sub || '').split('\n').length * 58 + 40, d.tag, { size: 26 }));
  g += drawProps(d.props, GROUND, ctx.ap('props', 0.4, 0.8));
  g += drawChars(ctx, d.chars || (d.char ? [{ x: 1400, from: 2100, face: 'feliz', r: 72, ...d.char }] : []));
  return g;
};

// ---------- 2) cifra protagonista (con gráfico de unidades, casas o personaje al lado) ----------
TEMPLATES.cifra = ctx => {
  const { data: d, t } = ctx;
  let g = '';
  const pv = ctx.ap('value', 0.2, 0.5);
  if (pv > 0) g += mark(120, 330, countFig(d.value, ctx.ap('value', 0.2, 1.4)), { size: d.size || 150, reveal: E.out(pv) });
  g += appear(ctx.ap('label', 0.8), lines(150, 440, d.label || '', { size: 40 }));
  if (d.tag) g += appear(ctx.ap('tag', 1.4), tag(150, 700, d.tag, { size: 28 }));
  const s = d.side || {};
  const ps = ctx.ap('side', 0.6, 1.4, E.lin);
  if (s.type === 'unidades' || s.type === 'casas') {
    const n = s.n || 400, cols = s.cols || Math.ceil(Math.sqrt(n * 1.6)), rows = Math.ceil(n / cols);
    const x0 = 1000, x1 = 1820, y0 = 170, y1 = 820, step = Math.min((x1 - x0) / cols, (y1 - y0) / rows);
    const r = step * 0.38;
    for (let i = 0; i < n; i++) {
      const c = i % cols, rr = Math.floor(i / cols), q = clamp(ps * (n + 40) / 40 - i / 40);
      if (q <= 0) continue;
      const cx = x0 + c * step + step / 2, cy = y0 + rr * step + step / 2;
      const color = s.color ? col(s.color) : [P.red, P.orange, P.yellow, P.green, P.sky, P.purple, P.white, P.pink][Math.floor(hash(i * 1.7) * 8)];
      const u = s.type === 'casas' ? casita(cx, cy + r, r / 9, [P.red, P.green, P.blue, P.orange][i % 4]) : unitBolita(cx, cy, r, color, { face: r >= 7 });
      g += q < 1 ? `<g opacity="${f(q)}">${u}</g>` : u;
    }
    if (s.legend) g += appear(ctx.ap('side', 1.2), txt(x0, 880, s.legend, { size: 20, fill: P.sub }));
  }
  if (d.houses) g += appear(ctx.ap('side', 0.8), d.houses.map((h, i) => casa(220 + i * 190, 640, 0.95, { roof: col(h.roof || ['rojo', 'verde', 'azul'][i % 3]) })).join(''));
  g += drawChars(ctx, d.chars || (d.char ? [{ x: 760, ...d.char, y: 640 }] : []));
  return g;
};

// ---------- 3) gráfico de unidades (1 bolita = X), con parte resaltada y comparación ----------
TEMPLATES.unidades = ctx => {
  const { data: d } = ctx;
  let g = '';
  const groups = d.groups || [];
  const hasValue = !!d.value;
  if (hasValue) {
    const pv = ctx.ap('value', 1.6, 0.5);
    if (pv > 0) g += mark(110, 400, countFig(d.value, ctx.ap('value', 1.6, 1.2)), { size: 130, reveal: E.out(pv) });
    if (d.valueLabel) g += appear(ctx.ap('value', 2.0), String(d.valueLabel).split('\n').map((l, i) => tag(130, 500 + i * 42, (i ? '' : '!') + l, { size: 22, bg: P.red })).join(''));
  }
  const X0 = hasValue ? 640 : 160, X1 = 1820, gw = (X1 - X0 - (groups.length - 1) * 80) / Math.max(1, groups.length);
  const pu = ctx.ap('units', 0.3, 1.6, E.lin), ph = ctx.ap('highlight', 2.0, 1.2, E.lin);
  groups.forEach((gr, gi) => {
    const n = gr.n || 100, cols = gr.cols || Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols);
    const gx = X0 + gi * (gw + 80), y0 = 210, maxH = 600;
    const step = Math.min(gw / cols, maxH / rows), r = step * 0.38;
    const w = cols * step, ox = gx + (gw - w) / 2;
    if (gr.panel !== false) g += appear(pu * 3, zone(ox - 24, y0 - 24, w + 48, rows * step + 48, { fill: P.zone, op: .6 }));
    if (gr.label) g += appear(pu * 3, tag(ox - 24, y0 - 44, gr.label, { size: 22 }));
    const hn = Math.round(n * (gr.highlight ?? 0));
    for (let i = 0; i < n; i++) {
      const q = clamp(pu * (n + 30) / 30 - i / 30);
      if (q <= 0) continue;
      const c = i % cols, rr = Math.floor(i / cols);
      const cx = ox + c * step + step / 2, cy = y0 + rr * step + step / 2;
      let color = gr.highlight !== undefined ? P.white : (gr.color ? col(gr.color) : BOLITA_COLORS[Math.floor(hash(i * 2.3 + gi) * 8)]);
      if (i < hn && clamp(ph * (hn + 20) / 20 - i / 20) > 0.5) color = col(gr.hcolor || 'rojo');
      const u = gr.kind === 'casa' ? casita(cx, cy + r, r / 9, [P.red, P.green, P.blue, P.orange][i % 4]) : unitBolita(cx, cy, r, color, { face: gr.face !== false });
      g += q < 1 ? `<g opacity="${f(q)}">${u}</g>` : u;
    }
    if (gr.note) g += appear(ph, txt(ox + w / 2, y0 + rows * step + 70, gr.note, { size: 24, anchor: 'middle', fill: P.sub }));
  });
  if (d.legend) g += appear(pu * 2, txt(110, H - 46, d.legend, { size: 18, fill: P.sub }));
  return g;
};

// ---------- 4) gráfico de líneas con personaje que camina sobre la línea ----------
TEMPLATES.linea = ctx => {
  const { data: d, t } = ctx;
  const years = d.years || [];
  const series = d.series || [];
  const all = series.flatMap(s => s.values);
  const lo = d.min ?? Math.min(...all), hi = d.max ?? Math.max(...all);
  const X0 = 170, X1 = 1500, Y0 = 200, Y1 = 820;
  const X = i => X0 + (X1 - X0) * i / Math.max(1, years.length - 1), Y = v => Y1 - (Y1 - Y0) * (v - lo) / Math.max(1e-9, hi - lo);
  let g = '';
  const pa = ctx.ap('axes', 0, 0.6);
  if (pa > 0) {
    let ax = '';
    for (let k = 0; k <= 4; k++) { const v = lo + (hi - lo) * k / 4, y = Y(v); ax += rline(X0, y, X1, y, { w: 1.4, c: '#B9C6DA', j: .6 }) + txt(X0 - 20, y + 7, fmtNum(v, d.decimals || 0), { size: 18, fill: P.sub, anchor: 'end' }); }
    years.forEach((yr, i) => { if (years.length < 14 || i % 2 === 0) ax += txt(X(i), Y1 + 40, String(yr), { size: 20, fill: P.sub, anchor: 'middle' }); });
    g += appear(pa, ax, { dy: 0 });
  }
  let tip = null;
  series.forEach((s, si) => {
    const p = ctx.ap('s' + si, 0.6 + si * 2.4, s.dur || 2.2, E.inOut);
    if (p <= 0) return;
    const n = s.values.length, upto = p * (n - 1), k = Math.floor(upto), fr = upto - k;
    const pts = s.values.slice(0, k + 1).map((v, i) => [X(i), Y(v)]);
    if (k < n - 1) pts.push([lerp(X(k), X(k + 1), fr), lerp(Y(s.values[k]), Y(s.values[k + 1]), fr)]);
    g += rpoly(pts, { c: col(s.color, si), w: 7, j: .8 });
    const last = pts[pts.length - 1];
    const lx = last[0] + (d.walker ? 78 : 24); // deja sitio al personaje que va en la punta
    if (p >= 1 && s.end) g += tag(lx, last[1] - 50, s.label || '', { size: 20, bg: col(s.color, si) }) + txt(lx, last[1] + 8, s.end, { size: 54, weight: 700 });
    else if (s.label && p > 0.15 && !d.walker) g += tag(lx, last[1] - 26, s.label, { size: 18, bg: col(s.color, si), op: clamp(p * 3) });
    tip = { x: last[0], y: last[1], moving: p < 1 };
  });
  if (d.walker && tip) g += bolita(tip.x, tip.y - 4, { r: d.walker.r || 44, color: col(d.walker.color || 'amarillo'), face: d.walker.face || 'neutral', acc: d.walker.acc || [], t, walk: tip.moving ? t : null, look: tip.moving ? 0.7 : 0 });
  if (d.source) g += txt(110, H - 46, d.source, { size: 18, fill: P.sub });
  return g;
};

// ---------- 5) barras en bloques 3D, con un personaje que sube a la última ----------
TEMPLATES.barras = ctx => {
  const { data: d, t } = ctx;
  const bars = d.bars || [];
  const max = d.max ?? Math.max(...bars.map(b => b.value));
  const n = bars.length, X0 = 200, X1 = 1650, gap = 26, bw = (X1 - X0 - gap * (n - 1)) / n, maxH = 520;
  let g = ground(GROUND, { x0: 140, x1: 1780 });
  const pb = ctx.ap('bars', 0.3, 0.2 + n * 0.22, E.lin);
  bars.forEach((b, i) => {
    const q = E.out(clamp(pb * (n + 3) / 3 - i / 3 * 1.0));
    if (q <= 0) return;
    const h = maxH * b.value / max * q, x = X0 + i * (bw + gap);
    g += bloque(x, GROUND, bw, h, col(b.color || d.color || 'rojo'), { d: Math.min(26, bw * 0.3) });
    if (b.label && (n < 12 || i % 2 === 0 || i === n - 1)) g += txt(x + bw / 2, GROUND + 40, b.label, { size: 20, fill: P.sub, anchor: 'middle' });
    const above = d.climber && (d.climber.at ?? n - 1) === i ? (d.climber.r || 50) * 2.3 + 30 : 0;
    if (b.tag && q >= 1) g += appear(clamp(pb * 3 - 2), tag(x + bw / 2 + Math.min(26, bw * 0.3) / 2, GROUND - h - 50 - above, b.tag, { size: 26, anchor: 'middle' }));
  });
  const c = d.climber;
  if (c) {
    const at = c.at ?? n - 1, b = bars[at], q = E.out(clamp(pb * (n + 3) / 3 - at / 3));
    const x = X0 + at * (bw + gap) + bw / 2 + Math.min(26, bw * 0.3) / 2, top = GROUND - maxH * b.value / max * q - Math.min(26, bw * 0.3) * 0.3;
    g += bolita(x, top, { r: c.r || 50, color: col(c.color || 'rojo'), face: c.face || 'preocupado', acc: c.acc || [], t, arms: q < 1 ? 'up' : c.arms });
  }
  if (d.title) g += tag(140, 120, d.title, { size: 28 });
  return g;
};

// ---------- 6) la fila: bolitas esperando tras un cordón, frente a un edificio ----------
TEMPLATES.fila = ctx => {
  const { data: d, t } = ctx;
  const n = d.n || 9, sp = d.spacing || 128, x0 = d.x0 || 170, gy = GROUND;
  const adv = ctx.v('advance', 0, 1.6, E.inOut), moving = ctx.setAt('advance') >= 0 && t - ctx.setAt('advance') < 1.6;
  let g = ground(gy);
  if (d.building !== false) g += appear(ctx.ap('building', 0.1), edificio(1690, gy, 300, 470, { sign: (d.building || {}).sign || 'SE ALQUILA', shop: (d.building || {}).shop }));
  const pq = ctx.ap('queue', 0.2, 1.2, E.lin);
  const faces = d.faces || ['dormido', 'neutral', 'neutral', 'feliz', 'enojado', 'preocupado', 'neutral', 'triste', 'neutral', 'feliz'];
  const accs = d.accs || [[], ['gafas'], ['audifonos'], ['caja'], [], [], [], ['gorra'], [], []];
  // postes y cordón
  if (pq > 0 && d.rope !== false) {
    const xs = [];
    for (let i = 0; i <= Math.ceil(n / 2); i++) xs.push(x0 - 60 + i * sp * 2);
    let rope = '';
    for (let i = 0; i < xs.length - 1; i++) if (xs[i + 1] < 1500) rope += cordon(xs[i], xs[i + 1], gy - 62);
    g += appear(pq * 2, rope + xs.filter(x => x < 1520).map(x => poste(x, gy)).join(''), { dy: 0 });
  }
  for (let i = n - 1; i >= 0; i--) {
    const q = clamp(pq * (n + 2) / 2 - (n - 1 - i) / 2);
    if (q <= 0) continue;
    const x = x0 + i * sp + adv * sp;
    if (x > 1640) continue; // ya entró
    const op = x > 1560 ? clamp((1640 - x) / 80) : 1;
    const ci = (i + (d.seed || 0)) % BOLITA_COLORS.length;
    const b = bolita(x, gy, { r: d.r || 52, color: BOLITA_COLORS[ci], face: moving ? 'neutral' : faces[i % faces.length], acc: accs[i % accs.length], t, seed: i * 1.7, walk: moving ? t + i * 0.1 : null, look: moving ? 0.6 : (hash(i) - 0.5) });
    g += op < 1 ? `<g opacity="${f(op)}">${b}</g>` : appear(q, b, { dy: 16 });
  }
  return g;
};

// ---------- 7) pilas de monedas (proporción del ingreso, precios, etc.) ----------
TEMPLATES.monedas = ctx => {
  const { data: d, t } = ctx;
  const st = d.stacks || [];
  const max = d.max ?? Math.max(...st.map(s => s.value)), maxCoins = d.maxCoins || 52;
  let g = '';
  const hasPanel = !!(d.value || d.year);
  if (hasPanel) {
    g += appear(ctx.ap('value', 0.1), zone(80, 210, 560, 360));
    if (d.year) g += appear(ctx.ap('value', 0.2), tag(120, 280, d.year, { size: 24 }) + (d.place ? tag(140 + tagW(d.year), 280, '#' + d.place, { size: 24 }) : ''));
    const pv = ctx.ap('value', 0.5, 0.5);
    if (pv > 0) g += txt(120, 420, countFig(d.value || '', ctx.ap('value', 0.5, 1.2)), { size: 110, weight: 700 });
    if (d.valueLabel) g += appear(ctx.ap('value', 0.9), lines(126, 480, d.valueLabel, { size: 28 }));
  }
  const X0 = hasPanel ? 820 : 300, X1 = 1760, gap = (X1 - X0) / Math.max(1, st.length);
  const ps = ctx.ap('stacks', 0.4, 1.8, E.inOut);
  g += ground(GROUND, { x0: X0 - 120, x1: X1 + 60 });
  st.forEach((s, i) => {
    const x = X0 + gap * (i + 0.5), nC = Math.max(1, Math.round(maxCoins * s.value / max * ps));
    g += monedas(x, GROUND, nC, { w: 104 });
    g += bolita(x, GROUND - nC * 9 - 6, { r: s.r || 46, color: col(s.color, i + 3), face: s.face || 'neutral', acc: s.acc || [], t, seed: i });
    if (s.label) g += tag(x, GROUND + 50, s.label, { size: 20, anchor: 'middle' });
  });
  if (d.source) g += txt(110, H - 46, d.source, { size: 18, fill: P.sub });
  return g;
};

// ---------- 8) línea de tiempo: el personaje camina año a año hasta la meta ----------
TEMPLATES.linea_tiempo = ctx => {
  const { data: d, t } = ctx;
  const from = d.from || 2026, to = d.to || 2068, span = to - from, cells = Math.min(span, 60), per = span / cells;
  const X0 = 190, X1 = 1650, y = 700, cw = (X1 - X0) / cells;
  let g = '';
  const pw = ctx.ap('walk', 0.6, d.walkDur || 4.5, E.inOut);
  for (let i = 0; i < cells; i++) {
    const x = X0 + i * cw, filled = pw * cells > i;
    g += `<rect x="${f(x + 2)}" y="${y - 22}" width="${f(cw - 4)}" height="22" fill="${filled ? P.mark : '#F7EBD0'}" stroke="${P.ink}" stroke-width="1.6"/>`;
    const yr = Math.round(from + i * per);
    if (i && yr % 10 === 0 && Math.round(from + (i - 1) * per) % 10 !== 0) g += txt(x, y + 40, String(yr), { size: 18, fill: P.sub, anchor: 'middle' });
  }
  g += tag(X0 - 30, y + 60, String(from), { size: 20, anchor: 'middle' }) + bandera(X1 + 40, y) + tag(X1 + 40, y + 60, String(to), { size: 20, anchor: 'middle' });
  const c = d.char || { color: 'naranja', acc: ['casco'] };
  const x = lerp(X0, X1, pw);
  g += bolita(x, y - 24, { r: c.r || 46, color: col(c.color || 'naranja'), face: pw >= 1 ? (c.endFace || 'feliz') : (c.face || 'neutral'), acc: c.acc || [], t, walk: pw > 0 && pw < 1 ? t : null, look: pw < 1 ? 0.6 : 0 });
  if (pw > 0 && pw < 1) g += tag(x, y - 150, `${Math.round(from + span * pw)}`, { size: 20, anchor: 'middle' });
  if (d.label) { const pl = ctx.ap('label', 0.6 + (d.walkDur || 4.5) + 0.2, 0.5); if (pl > 0) g += mark(1180, 300, d.label, { size: 110, reveal: E.out(pl) }); if (d.sub) g += appear(pl, txt(1230, 370, d.sub, { size: 30 })); }
  if (d.title) g += appear(ctx.ap('title', 0.2), tag(160, 200, d.title, { size: 26 }));
  (d.extra || []).forEach((e, i) => { g += appear(ctx.ap('extra', 1 + i * 0.4), tag(e.x || 160, e.y || 250, e.text, { size: 22 })); });
  return g;
};

// ---------- 9) puntos numerados (soluciones, pasos, claves) ----------
TEMPLATES.puntos = ctx => {
  const { data: d } = ctx;
  const items = d.items || [];
  let g = '';
  if (d.title) g += appear(ctx.ap('title', 0.1), mark(130, 170, d.title, { size: 70 }), { dy: 0 });
  const y0 = d.title ? 330 : 240, gapY = Math.min(190, 620 / Math.max(1, items.length));
  items.forEach((it, i) => {
    const p = ctx.ap('i' + i, 0.5 + i * 0.9, 0.5);
    if (p <= 0) return;
    const y = y0 + i * gapY;
    const active = ctx.raw('focus', -1);
    const dim = active >= 0 && active !== i ? 0.4 : 1;
    let s = rcircle(180, y, 38, 38, { fill: P.mark, w: 3 }) + txt(180, y + 15, String(i + 1), { size: 40, weight: 700, anchor: 'middle' });
    s += tag(240, y + 9, it.title || '', { size: 30 });
    if (it.text) s += lines(244, y + 60, it.text, { size: 24, fill: P.sub });
    g += `<g opacity="${dim}">${pop(p, 180, y, s)}</g>`;
  });
  g += drawProps(d.props, GROUND, ctx.ap('props', 0.3, 0.8));
  g += drawChars(ctx, d.chars || (d.char ? [{ x: 1500, face: 'feliz', ...d.char }] : []));
  return g;
};

// ---------- 10) comparación en dos fotos (antes/después, aquí/allá) ----------
TEMPLATES.comparacion = ctx => {
  const { data: d } = ctx;
  let g = '';
  if (d.title) g += appear(ctx.ap('title', 0.1), mark(140, 160, d.title, { size: 72 }));
  ['left', 'right'].forEach((side, k) => {
    const s = d[side];
    if (!s) return;
    const p = ctx.ap(side, 0.3 + k * 0.7, 0.6);
    if (p <= 0) return;
    const x = k ? 1010 : 170, y = 240, w = 740, h = 520, rot = k ? 1.6 : -1.4;
    let inner = `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})">` + `<rect x="${x - 18}" y="${y - 18}" width="${w + 36}" height="${h + 86}" fill="#fff" stroke="${P.ink}" stroke-width="3"/>` + zone(x, y, w, h, { fill: s.bg || (k ? P.zone2 : P.zone) });
    inner += `<rect x="${x + w / 2 - 70}" y="${y - 40}" width="140" height="40" fill="${P.mark}" opacity=".8" transform="rotate(-3 ${x + w / 2} ${y - 20})"/>`;
    const gy = y + h - 40;
    inner += drawProps((s.props || []).map(o => ({ ...o, x: x + (o.x ?? w / 2) * 1, y: gy })), gy, 1);
    inner += (s.chars || []).map((c, i) => bolita(x + (c.x ?? 120 + i * 130), gy, { r: c.r || 50, color: col(c.color, i), face: c.face || 'neutral', acc: c.acc || [], arms: c.arms, t: ctx.t, seed: i + k })).join('');
    inner += `</g>`;
    if (s.label) inner += tag(x + w / 2, y + h + 100, s.label, { size: 24, anchor: 'middle' });
    if (s.tag) inner += tag(x + w / 2 + tagW(s.label || '') / 2 + 14, y + h + 100, '!' + s.tag, { size: 24 });
    g += appear(p, inner, { dy: 30 });
  });
  return g;
};

// ---------- 11) frase con palabras resaltadas: "la fila *se mueve*" ----------
TEMPLATES.frase = ctx => {
  const { data: d } = ctx;
  const size = d.size || 96, lines_ = String(d.text || '').split('\n');
  let g = '';
  const p = ctx.ap('text', 0.2, 0.6);
  lines_.forEach((ln, li) => {
    const segs = ln.split('*'), total = segs.join('').length * charW(size);
    let x = (d.x ?? W / 2) - (d.align === 'left' ? 0 : total / 2);
    const y = (d.y ?? 470) + li * size * 1.35;
    segs.forEach((s, i) => {
      const w = s.length * charW(size);
      if (i % 2 === 1 && s) {
        const k = x + y, rv = E.out(clamp(p * 1.6 - 0.5));
        g += `<path d="M${f(x - 14 + jit(k, 3))} ${f(y - size * 0.82)} L${f(x + (w + 14) * rv)} ${f(y - size * 0.86)} L${f(x + (w + 18) * rv)} ${f(y + size * 0.24)} L${f(x - 10)} ${f(y + size * 0.28)}Z" fill="${P.mark}"/>`;
      }
      g += txt(x, y, s, { size, weight: 700, op: f(E.out(p)) });
      x += w;
    });
  });
  if (d.sub) g += appear(ctx.ap('text', 0.8), txt(d.align === 'left' ? d.x : W / 2, (d.y ?? 470) + lines_.length * size * 1.35 + 10, d.sub, { size: 34, anchor: d.align === 'left' ? 'start' : 'middle', fill: P.sub }));
  g += drawProps(d.props, GROUND, ctx.ap('props', 0.4, 0.8));
  g += drawChars(ctx, d.chars);
  return g;
};

// ---------- 12) escena libre: personajes + utilería + rótulos ----------
TEMPLATES.escena = ctx => {
  const { data: d } = ctx;
  let g = '';
  (d.zones || []).forEach((z, i) => { g += appear(ctx.ap('zones', i * 0.1, 0.5), zone(z.x, z.y, z.w, z.h, { fill: z.fill ? col(z.fill) : P.zone })); });
  if (d.ground !== false) g += ground(d.groundY || GROUND);
  g += drawProps(d.props, d.groundY || GROUND, ctx.ap('props', 0.2, 0.8));
  g += drawChars(ctx, d.chars, { gy: d.groundY });
  g += drawLabels(ctx, d.labels);
  return g;
};

// ---------- 13) cierre con logo de la empresa ----------
TEMPLATES.cierre = ctx => {
  const { data: d, meta, t } = ctx;
  let g = '';
  const pl = ctx.ap('logo', 0.2, 0.7);
  const logo = d.logo || meta.logoData;
  if (logo && d.useLogo !== false) {
    g += pop(pl, W / 2, 330, `<rect x="${W / 2 - 300}" y="190" width="600" height="280" rx="26" fill="#fff" stroke="${P.ink}" stroke-width="3"/><image href="${logo}" x="${W / 2 - 250}" y="220" width="500" height="220" preserveAspectRatio="xMidYMid meet"/>`);
  } else if (d.title) {
    if (pl > 0) g += mark(W / 2, 360, d.title, { size: 100, anchor: 'middle', reveal: E.out(pl) });
  }
  if (d.tagline) g += appear(ctx.ap('logo', 0.8), txt(W / 2, 560, d.tagline, { size: 40, anchor: 'middle', weight: 600 }));
  if (d.url) g += appear(ctx.ap('logo', 1.2), tag(W / 2, 640, d.url, { size: 28, anchor: 'middle' }));
  g += ground(GROUND);
  const n = d.n || 7;
  for (let i = 0; i < n; i++) {
    const q = ctx.ap('chars', 0.4 + i * 0.12, 0.5);
    if (q <= 0) continue;
    const x = W / 2 + (i - (n - 1) / 2) * 150;
    g += pop(q, x, GROUND - 40, bolita(x, GROUND, { r: 50, color: BOLITA_COLORS[i % 8], face: 'feliz', arms: i % 2 ? 'wave' : 'none', acc: [[], ['casco'], [], ['caja'], ['gafas'], [], ['gorra']][i % 7], t: t + i * 0.3, seed: i }));
  }
  return g;
};

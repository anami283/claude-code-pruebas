// Estilo "datos con bolitas": periodismo de datos dibujado a mano (16:9).
// Piezas base: utilidades, trazo a mano con "hervor", textos y rótulos, personajes bolita y utilería.
// Todo devuelve strings SVG en coordenadas W×H (1920×1080 por defecto).

const SIZE = (window.__TIMELINE__ && window.__TIMELINE__.meta && window.__TIMELINE__.meta.size) || [1920, 1080];
const W = SIZE[0], H = SIZE[1];
const GROUND = 860; // línea de suelo por defecto

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const E = {
  out: x => 1 - Math.pow(1 - clamp(x), 3),
  in: x => Math.pow(clamp(x), 3),
  inOut: x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
  back: x => { x = clamp(x); const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); },
  lin: x => clamp(x),
};
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const f = n => (Math.round(n * 10) / 10);
const hash = k => { const x = Math.sin(k * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };

// ---------- paleta ----------
const P = {
  paper: '#F4F3EF', grid: '#E6E5E0', ink: '#1F1F22', sub: '#6B6B70', zone: '#D5E4F6', zone2: '#F3E2CF',
  mark: '#F2B630', tagBg: '#141416', tagFg: '#FFFFFF',
  red: '#E0393E', orange: '#F28C38', yellow: '#F2B82E', green: '#3DBE7A', blue: '#3B6FE0', sky: '#8DB8F0',
  purple: '#A98BEA', pink: '#F08BA8', white: '#FFFFFF', gray: '#BDBDC2', brown: '#C89B6D',
};
const BOLITA_COLORS = [P.green, P.sky, P.white, P.red, P.orange, P.purple, P.yellow, P.pink];
// permite adaptar el acento (marcador) a la marca: meta.accent
function applyDatosMeta(meta) { if (meta && meta.accent) P.mark = meta.accent; }

// ---------- trazo a mano con hervor (el ruido cambia 8 veces por segundo) ----------
let BOIL = 0;
function setBoil(t) { BOIL = Math.floor(t * 8) % 97; }
const jit = (k, a) => (hash(k + BOIL * 7.13) - 0.5) * 2 * a;
function rline(x1, y1, x2, y2, o = {}) {
  const a = o.j ?? 1.4, k = x1 * 0.37 + y1 * 0.71 + x2 * 0.13 + y2 * 0.29;
  const mx = (x1 + x2) / 2 + jit(k + 1, a * 1.3), my = (y1 + y2) / 2 + jit(k + 2, a * 1.3);
  return `<path d="M${f(x1 + jit(k + 3, a))} ${f(y1 + jit(k + 4, a))} Q${f(mx)} ${f(my)} ${f(x2 + jit(k + 5, a))} ${f(y2 + jit(k + 6, a))}" stroke="${o.c || P.ink}" stroke-width="${o.w || 3.2}" fill="none" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.op !== undefined ? ` opacity="${o.op}"` : ''}/>`;
}
function rpoly(pts, o = {}) { // polilínea abierta o cerrada con relleno
  const a = o.j ?? 1.3;
  const q = pts.map(([x, y], i) => [x + jit(x * .3 + y * .7 + i, a), y + jit(x * .7 + y * .3 + i + 9, a)]);
  let d = `M${f(q[0][0])} ${f(q[0][1])}` + q.slice(1).map(([x, y]) => ` L${f(x)} ${f(y)}`).join('') + (o.close ? ' Z' : '');
  return `<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.c || P.ink}" stroke-width="${o.w ?? 3.2}" stroke-linejoin="round" stroke-linecap="round"${o.op !== undefined ? ` opacity="${o.op}"` : ''}/>`;
}
function rrect(x, y, w, h, o = {}) {
  return rpoly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], { ...o, close: true });
}
function rcircle(cx, cy, rx, ry, o = {}) { // contorno orgánico (no perfecto)
  ry = ry ?? rx;
  const n = 22, a = o.j ?? 0.018, pts = [];
  for (let i = 0; i < n; i++) {
    const th = i / n * Math.PI * 2, k = cx * .11 + cy * .07 + i;
    const r = 1 + jit(k, a);
    pts.push([cx + Math.cos(th) * rx * r, cy + Math.sin(th) * ry * r]);
  }
  let d = '';
  for (let i = 0; i < n; i++) {
    const p0 = pts[i], p1 = pts[(i + 1) % n], m = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
    d += (i === 0 ? `M${f(m[0])} ${f(m[1])}` : '') + ` Q${f(p1[0])} ${f(p1[1])} ${f((p1[0] + pts[(i + 2) % n][0]) / 2)} ${f((p1[1] + pts[(i + 2) % n][1]) / 2)}`;
  }
  return `<path d="${d} Z" fill="${o.fill || 'none'}" stroke="${o.c || P.ink}" stroke-width="${o.w ?? 3.2}"${o.op !== undefined ? ` opacity="${o.op}"` : ''}/>`;
}

// ---------- texto ----------
const MONO = "'Roboto Mono', monospace";
const charW = size => size * 0.6;
function txt(x, y, s, o = {}) {
  return `<text x="${f(x)}" y="${f(y)}" font-family="${MONO}" font-size="${o.size || 28}" font-weight="${o.weight || 500}" fill="${o.fill || P.ink}" text-anchor="${o.anchor || 'start'}"${o.op !== undefined ? ` opacity="${o.op}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${esc(s)}</text>`;
}
function lines(x, y, s, o = {}) { // texto multilínea con \n
  const size = o.size || 28, lh = o.lh || size * 1.32;
  return String(s).split('\n').map((l, i) => txt(x, y + i * lh, l, o)).join('');
}
// rótulo negro tipo etiqueta (o de color: '!' rojo, '#' azul, '+' verde)
function tag(x, y, s, o = {}) {
  let bg = o.bg || P.tagBg, fg = o.fg || P.tagFg, t = String(s);
  // el prefijo de color solo cuenta si no va seguido de un número ("+140%" se muestra tal cual)
  const pre = /^[!#+](?!\d)/.test(t) ? t[0] : '';
  if (pre === '!') bg = P.red; else if (pre === '#') bg = P.blue; else if (pre === '+') bg = P.green;
  if (pre) t = t.slice(1);
  const size = o.size || 24, padX = size * 0.5, w = charW(size) * t.length + padX * 2, h = size * 1.55;
  const x0 = o.anchor === 'middle' ? x - w / 2 : o.anchor === 'end' ? x - w : x;
  return `<g${o.op !== undefined ? ` opacity="${f(o.op)}"` : ''}${o.tf ? ` transform="${o.tf}"` : ''}><rect x="${f(x0)}" y="${f(y - h * 0.72)}" width="${f(w)}" height="${f(h)}" fill="${bg}"/>${txt(x0 + padX, y + size * 0.08, t, { size, fill: fg, weight: 500 })}</g>`;
}
const tagW = (s, size = 24) => charW(size) * String(s).replace(/^[!#+](?!\d)/, '').length + size;
// cifra grande sobre franja de marcador amarillo
function mark(x, y, s, o = {}) {
  const size = o.size || 110, t = String(s), w = charW(size) * t.length + size * 0.55, h = size * 1.08;
  const x0 = o.anchor === 'middle' ? x - w / 2 : x;
  const k = x * .3 + y, sk = o.reveal ?? 1;
  const pts = [[x0 - 6 + jit(k, 3), y - h * 0.82], [x0 + w * sk + jit(k + 1, 4), y - h * 0.86], [x0 + w * sk + 4 + jit(k + 2, 4), y + h * 0.22], [x0 - 2, y + h * 0.26]];
  return `<g${o.op !== undefined ? ` opacity="${f(o.op)}"` : ''}><path d="M${pts.map(p => p.map(f).join(' ')).join(' L')} Z" fill="${o.bg || P.mark}"/>${txt(x0 + size * 0.27, y, t, { size, weight: 700, fill: P.ink, op: clamp(sk * 1.6 - 0.4) })}</g>`;
}
// formato de números en español: 1.222.836 · 1,85
function fmtNum(v, dec = 0) {
  const s = Number(v).toFixed(dec), [i, d] = s.split('.');
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d ? ',' + d : '');
}
// interpreta "1,85" / "+87%" / "1.222.836" / "42 años" y devuelve {pre, num, dec, post}
function parseFig(s) {
  const m = String(s).match(/^([^\d]*)([\d.]+(?:,\d+)?)(.*)$/);
  if (!m) return null;
  const raw = m[2], dec = raw.includes(',') ? raw.split(',')[1].length : 0;
  return { pre: m[1], num: parseFloat(raw.replace(/\./g, '').replace(',', '.')), dec, post: m[3] };
}
function countFig(s, p) { // cifra animada que cuenta desde 0
  const q = parseFig(s);
  if (!q || p >= 1) return String(s);
  return q.pre + fmtNum(q.num * E.out(p), q.dec) + q.post;
}

// ---------- fondo de papel ----------
function paper(t) {
  let g = `<rect width="${W}" height="${H}" fill="${P.paper}"/>`;
  let d = '';
  for (let x = 0; x <= W; x += 48) d += `M${x} 0V${H}`;
  for (let y = 0; y <= H; y += 48) d += `M0 ${y}H${W}`;
  g += `<path d="${d}" stroke="${P.grid}" stroke-width="1" opacity=".7"/>`;
  // motas de papel
  for (let i = 0; i < 70; i++) g += `<circle cx="${f(hash(i * 3.1) * W)}" cy="${f(hash(i * 7.7) * H)}" r="${f(0.8 + hash(i) * 1.2)}" fill="#CFCBC2" opacity=".5"/>`;
  return g;
}
// zona de color de fondo (cielo azul claro con borde irregular)
function zone(x, y, w, h, o = {}) {
  const k = x + y, pts = [];
  const n = Math.max(6, Math.round(w / 90));
  for (let i = 0; i <= n; i++) pts.push([x + w * i / n, y + jit(k + i, 5)]);
  for (let i = n; i >= 0; i--) pts.push([x + w * i / n, y + h + jit(k + i + 50, 5)]);
  return `<path d="M${pts.map(p => p.map(f).join(' ')).join(' L')} Z" fill="${o.fill || P.zone}" opacity="${o.op ?? 1}"/>`;
}
function ground(y = GROUND, o = {}) {
  return rline(o.x0 ?? 40, y, o.x1 ?? W - 40, y, { w: 2.4, c: o.c || '#9A9AA0' });
}

// ---------- personaje bolita ----------
// opts: r, color, face (feliz|neutral|triste|enojado|dormido|sorpresa|preocupado|guino), acc:[casco,caja,gafas,gorra,corbata,audifonos,maleta,pelo,lazo],
//       walk (fase en segundos o null), look (-1..1), arms (none|up|wave|point), t (para parpadeo), seed
function bolita(cx, gy, o = {}) {
  const r = o.r || 46, col = o.color || P.orange, t = o.t || 0, seed = o.seed || 0;
  const legL = r * 0.5, walking = o.walk !== undefined && o.walk !== null;
  const ph = walking ? o.walk * 9 : 0;
  const bob = walking ? Math.abs(Math.sin(ph)) * r * 0.08 : Math.sin(t * 2 + seed) * r * 0.012;
  const cy = gy - legL - r * 0.92 - bob, lw = Math.max(2.2, r * 0.06);
  let g = `<ellipse cx="${f(cx)}" cy="${f(gy + 2)}" rx="${f(r * 0.85)}" ry="${f(r * 0.12)}" fill="#000" opacity=".08"/>`;
  // piernas
  const sw = walking ? Math.sin(ph) * r * 0.28 : 0;
  g += rline(cx - r * 0.28, cy + r * 0.8, cx - r * 0.3 + sw, gy, { w: lw, j: 0.8 }) + rline(cx + r * 0.28, cy + r * 0.8, cx + r * 0.3 - sw, gy, { w: lw, j: 0.8 });
  g += rline(cx - r * 0.3 + sw, gy, cx - r * 0.12 + sw, gy, { w: lw, j: 0.5 }) + rline(cx + r * 0.3 - sw, gy, cx + r * 0.48 - sw, gy, { w: lw, j: 0.5 });
  // brazos (detrás del cuerpo si son laterales)
  const arms = o.arms || 'none';
  if (arms === 'up') g += rline(cx - r * 0.85, cy - r * 0.1, cx - r * 1.15, cy - r * 0.9, { w: lw }) + rline(cx + r * 0.85, cy - r * 0.1, cx + r * 1.15, cy - r * 0.9, { w: lw });
  if (arms === 'wave') { const a = Math.sin(t * 9) * r * 0.18; g += rline(cx + r * 0.85, cy - r * 0.05, cx + r * 1.2 + a, cy - r * 0.85, { w: lw }); }
  if (arms === 'point') g += rline(cx + r * 0.9, cy + r * 0.05, cx + r * 1.45, cy - r * 0.15, { w: lw });
  if (arms === 'side') g += rline(cx - r * 0.95, cy + r * 0.1, cx - r * 1.2, cy + r * 0.55, { w: lw }) + rline(cx + r * 0.95, cy + r * 0.1, cx + r * 1.2, cy + r * 0.55, { w: lw });
  // cuerpo con sombreado suave
  g += rcircle(cx, cy, r, r * 0.95, { fill: col, w: lw });
  g += `<path d="M${f(cx + r * 0.62)} ${f(cy - r * 0.55)} A${f(r * 0.9)} ${f(r * 0.86)} 0 0 1 ${f(cx - r * 0.3)} ${f(cy + r * 0.86)} A${f(r * 0.95)} ${f(r * 0.9)} 0 0 0 ${f(cx + r * 0.62)} ${f(cy - r * 0.55)}Z" fill="#000" opacity=".07"/>`;
  // cara
  const acc = o.acc || [];
  const lx = (o.look || 0) * r * 0.16, ex = r * 0.2, ey = cy - r * 0.08, er = Math.max(1.8, r * 0.065);
  const blink = ((t + seed * 1.7) % 3.4) < 0.1;
  const face = o.face || 'neutral';
  const eye = (x) => {
    if (face === 'dormido' || blink) return rline(x - er * 1.4, ey, x + er * 1.4, ey, { w: lw * 0.8, j: 0.3 });
    if (face === 'feliz' || face === 'guino') return `<path d="M${f(x - er * 1.5)} ${f(ey + er * 0.6)} Q${f(x)} ${f(ey - er * 1.6)} ${f(x + er * 1.5)} ${f(ey + er * 0.6)}" stroke="${P.ink}" stroke-width="${f(lw * 0.8)}" fill="none" stroke-linecap="round"/>`;
    return `<circle cx="${f(x)}" cy="${f(ey)}" r="${f(face === 'sorpresa' ? er * 1.3 : er)}" fill="${P.ink}"/>`;
  };
  g += eye(cx + lx - ex) + eye(cx + lx + ex);
  const mY = cy + r * 0.2;
  if (face === 'feliz' || face === 'guino') g += `<path d="M${f(cx + lx - r * 0.13)} ${f(mY)} Q${f(cx + lx)} ${f(mY + r * 0.14)} ${f(cx + lx + r * 0.13)} ${f(mY)}" stroke="${P.ink}" stroke-width="${f(lw * 0.8)}" fill="none" stroke-linecap="round"/>`;
  else if (face === 'triste' || face === 'preocupado') g += `<path d="M${f(cx + lx - r * 0.11)} ${f(mY + r * 0.07)} Q${f(cx + lx)} ${f(mY - r * 0.05)} ${f(cx + lx + r * 0.11)} ${f(mY + r * 0.07)}" stroke="${P.ink}" stroke-width="${f(lw * 0.8)}" fill="none" stroke-linecap="round"/>`;
  else if (face === 'sorpresa') g += `<ellipse cx="${f(cx + lx)}" cy="${f(mY + r * 0.04)}" rx="${f(r * 0.06)}" ry="${f(r * 0.08)}" fill="${P.ink}"/>`;
  else if (face !== 'dormido') g += rline(cx + lx - r * 0.08, mY + r * 0.03, cx + lx + r * 0.08, mY + r * 0.03, { w: lw * 0.8, j: 0.3 });
  if (face === 'enojado') g += rline(cx + lx - ex - er * 2, ey - er * 3, cx + lx - ex + er * 1.5, ey - er * 1.6, { w: lw * 0.8, j: .3 }) + rline(cx + lx + ex + er * 2, ey - er * 3, cx + lx + ex - er * 1.5, ey - er * 1.6, { w: lw * 0.8, j: .3 });
  if (face === 'preocupado' || face === 'triste') g += rline(cx + lx - ex - er * 1.8, ey - er * 2.2, cx + lx - ex + er * 1.2, ey - er * 3.2, { w: lw * 0.7, j: .3 }) + rline(cx + lx + ex + er * 1.8, ey - er * 2.2, cx + lx + ex - er * 1.2, ey - er * 3.2, { w: lw * 0.7, j: .3 });
  if (face === 'dormido') g += txt(cx + r * 0.7, cy - r * 1.05 - Math.sin(t * 2) * 4, 'z', { size: r * 0.4, fill: P.sub, weight: 700 }) + txt(cx + r * 0.95, cy - r * 1.4 - Math.sin(t * 2 + 1) * 4, 'z', { size: r * 0.3, fill: P.sub, weight: 700 });
  // mejillas
  g += `<circle cx="${f(cx + lx - ex * 1.9)}" cy="${f(mY - r * 0.02)}" r="${f(r * 0.09)}" fill="#E8697A" opacity=".22"/><circle cx="${f(cx + lx + ex * 1.9)}" cy="${f(mY - r * 0.02)}" r="${f(r * 0.09)}" fill="#E8697A" opacity=".22"/>`;
  // accesorios
  const top = cy - r * 0.95;
  for (const a of acc) {
    if (a === 'gafas') g += rcircle(cx + lx - ex, ey, er * 2.6, er * 2.6, { w: lw * 0.7, j: .02 }) + rcircle(cx + lx + ex, ey, er * 2.6, er * 2.6, { w: lw * 0.7, j: .02 }) + rline(cx + lx - ex + er * 2.6, ey, cx + lx + ex - er * 2.6, ey, { w: lw * 0.7, j: .2 });
    if (a === 'casco') g += `<path d="M${f(cx - r * 0.72)} ${f(top + r * 0.32)} Q${f(cx - r * 0.7)} ${f(top - r * 0.42)} ${f(cx)} ${f(top - r * 0.45)} Q${f(cx + r * 0.7)} ${f(top - r * 0.42)} ${f(cx + r * 0.72)} ${f(top + r * 0.32)} Z" fill="${P.yellow}" stroke="${P.ink}" stroke-width="${f(lw)}"/>` + rrect(cx - r * 0.9, top + r * 0.22, r * 1.8, r * 0.16, { fill: P.yellow, w: lw, j: .6 }) + rline(cx, top - r * 0.44, cx, top + r * 0.22, { w: lw * 0.7, j: .3 });
    if (a === 'gorra') g += `<path d="M${f(cx - r * 0.7)} ${f(top + r * 0.3)} Q${f(cx - r * 0.6)} ${f(top - r * 0.35)} ${f(cx + r * 0.1)} ${f(top - r * 0.32)} Q${f(cx + r * 0.7)} ${f(top - r * 0.2)} ${f(cx + r * 0.7)} ${f(top + r * 0.3)} Z" fill="${P.blue}" stroke="${P.ink}" stroke-width="${f(lw)}"/>` + rpoly([[cx + r * 0.5, top + r * 0.25], [cx + r * 1.15, top + r * 0.32], [cx + r * 0.6, top + r * 0.4]], { fill: P.blue, w: lw, close: true, j: .5 });
    if (a === 'caja') {
      const bw = r * 1.45, bh = r * 0.9, bx = cx - bw / 2, by = top - bh + r * 0.12;
      g += rrect(bx, by, bw, bh, { fill: P.brown, w: lw, j: .8 }) + rpoly([[bx, by], [bx + bw * 0.15, by - bh * 0.25], [bx + bw * 1.15, by - bh * 0.25], [bx + bw, by]], { fill: '#D8AE82', w: lw, j: .6 });
      g += rpoly([[bx + bw, by], [bx + bw * 1.15, by - bh * 0.25], [bx + bw * 1.15, by + bh * 0.78], [bx + bw, by + bh]], { fill: '#B4875A', w: lw, close: true, j: .6 });
      g += txt(bx + bw * 0.62, by + bh * 0.72, '↑↑', { size: bh * 0.34, weight: 700, anchor: 'middle' });
      // planta en maceta
      const px = cx + r * 0.05, py = by - bh * 0.18;
      g += rpoly([[px - r * 0.2, py], [px + r * 0.2, py], [px + r * 0.15, py - r * 0.3], [px - r * 0.15, py - r * 0.3]], { fill: P.orange, w: lw * 0.8, close: true, j: .4 });
      for (let i = -3; i <= 3; i++) g += `<path d="M${f(px)} ${f(py - r * 0.3)} Q${f(px + i * r * 0.08)} ${f(py - r * 0.6)} ${f(px + i * r * 0.16)} ${f(py - r * (0.75 - Math.abs(i) * 0.08))}" stroke="#2E9E5B" stroke-width="${f(lw * 1.2)}" fill="none" stroke-linecap="round"/>`;
    }
    if (a === 'audifonos') g += `<path d="M${f(cx - r * 0.92)} ${f(cy - r * 0.05)} Q${f(cx - r * 0.95)} ${f(top - r * 0.2)} ${f(cx)} ${f(top - r * 0.15)} Q${f(cx + r * 0.95)} ${f(top - r * 0.2)} ${f(cx + r * 0.92)} ${f(cy - r * 0.05)}" stroke="${P.ink}" stroke-width="${f(lw * 1.6)}" fill="none"/>` + rrect(cx - r * 1.05, cy - r * 0.2, r * 0.2, r * 0.4, { fill: P.yellow, w: lw * .8, j: .4 }) + rrect(cx + r * 0.85, cy - r * 0.2, r * 0.2, r * 0.4, { fill: P.yellow, w: lw * .8, j: .4 });
    if (a === 'corbata') g += rpoly([[cx - r * 0.07, cy + r * 0.42], [cx + r * 0.07, cy + r * 0.42], [cx + r * 0.1, cy + r * 0.8], [cx, cy + r * 0.92], [cx - r * 0.1, cy + r * 0.8]], { fill: P.red, w: lw * 0.7, close: true, j: .3 });
    if (a === 'lazo') g += rpoly([[cx + r * 0.35, top + r * 0.1], [cx + r * 0.7, top - r * 0.12], [cx + r * 0.68, top + r * 0.32]], { fill: P.pink, w: lw * .8, close: true, j: .4 }) + rpoly([[cx + r * 0.35, top + r * 0.1], [cx + r * 0.05, top - r * 0.12], [cx + r * 0.08, top + r * 0.3]], { fill: P.pink, w: lw * .8, close: true, j: .4 });
    if (a === 'pelo') for (let i = -2; i <= 2; i++) g += rline(cx + i * r * 0.12, top + r * 0.05, cx + i * r * 0.2, top - r * 0.22, { w: lw, j: .5 });
    if (a === 'maleta') g += rrect(cx - r * 1.75, gy - r * 0.95, r * 0.75, r * 0.95, { fill: P.green, w: lw, j: .6 }) + `<path d="M${f(cx - r * 1.5)} ${f(gy - r * 0.95)} V${f(gy - r * 1.15)} H${f(cx - r * 1.25)} V${f(gy - r * 0.95)}" stroke="${P.ink}" stroke-width="${f(lw)}" fill="none"/>`;
  }
  return g;
}
// bolita pequeña para gráficos de unidades (simple y barata)
function unitBolita(cx, cy, r, col, o = {}) {
  let g = `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${col}" stroke="${P.ink}" stroke-width="${f(Math.max(1.2, r * 0.14))}"/>`;
  if (o.face !== false && r >= 7) g += `<circle cx="${f(cx - r * 0.3)}" cy="${f(cy - r * 0.08)}" r="${f(r * 0.11)}" fill="${P.ink}"/><circle cx="${f(cx + r * 0.3)}" cy="${f(cy - r * 0.08)}" r="${f(r * 0.11)}" fill="${P.ink}"/>`;
  if (o.legs && r >= 7) g += `<path d="M${f(cx - r * 0.3)} ${f(cy + r)} v${f(r * 0.4)} M${f(cx + r * 0.3)} ${f(cy + r)} v${f(r * 0.4)}" stroke="${P.ink}" stroke-width="${f(r * 0.12)}"/>`;
  return g;
}

// ---------- utilería ----------
function casa(x, gy, s = 1, o = {}) { // casa con techo de color, centrada en x
  const w = 150 * s, h = 105 * s, x0 = x - w / 2, roof = o.roof || P.red;
  let g = rrect(x0, gy - h, w, h, { fill: P.white, w: 3 * Math.max(.6, s) });
  g += rpoly([[x0 - 14 * s, gy - h], [x, gy - h - 75 * s], [x0 + w + 14 * s, gy - h]], { fill: roof, close: true, w: 3 * Math.max(.6, s) });
  g += rrect(x0 + w * 0.18, gy - h * 0.62, w * 0.22, h * 0.62, { fill: P.yellow, w: 2.6 * Math.max(.6, s) });
  g += rrect(x0 + w * 0.55, gy - h * 0.7, w * 0.3, h * 0.32, { fill: P.sky, w: 2.6 * Math.max(.6, s) });
  if (o.sign) g += tag(x, gy + 34 * s, o.sign, { size: 18 * Math.max(.8, s), anchor: 'middle', bg: P.mark, fg: P.ink });
  return g;
}
function casita(x, y, s, roof) { // icono mínimo de casa para gráficos de unidades
  return `<path d="M${f(x - 8 * s)} ${f(y)} h${f(16 * s)} v${f(-11 * s)} l${f(-8 * s)} ${f(-7 * s)} l${f(-8 * s)} ${f(7 * s)}Z" fill="#fff" stroke="${P.ink}" stroke-width="${f(1.4 * s)}"/><path d="M${f(x - 10 * s)} ${f(y - 10 * s)} l${f(10 * s)} ${f(-9 * s)} l${f(10 * s)} ${f(9 * s)}" fill="${roof || P.red}" stroke="${P.ink}" stroke-width="${f(1.4 * s)}"/>`;
}
function edificio(x, gy, w = 260, h = 420, o = {}) { // edificio con balcones, toldos y letrero
  const x0 = x - w / 2, fl = o.floors || 4;
  let g = rrect(x0, gy - h, w, h, { fill: P.white });
  g += rrect(x0 + w * 0.15, gy - h - 34, w * 0.3, 34, { fill: P.white, w: 2.6 });
  g += rline(x0 + w * 0.8, gy - h, x0 + w * 0.8, gy - h - 60, { w: 2.4 }) + rline(x0 + w * 0.72, gy - h - 44, x0 + w * 0.88, gy - h - 44, { w: 2 });
  const cols = 3, fh = (h - 120) / fl;
  const aw = [P.red, P.yellow, P.green, P.red];
  for (let r = 0; r < fl; r++) for (let c = 0; c < cols; c++) {
    const wx = x0 + 24 + c * (w - 48) / cols, wy = gy - h + 30 + r * fh, ww = (w - 48) / cols - 18;
    g += rrect(wx, wy + 16, ww, fh * 0.55, { fill: P.zone, w: 2.2 });
    if ((r + c) % 2 === 0) g += rpoly([[wx - 4, wy + 18], [wx + ww + 4, wy + 18], [wx + ww, wy + 2], [wx, wy + 2]], { fill: aw[(r + c) % 4], close: true, w: 2 });
    g += rline(wx - 6, wy + 16 + fh * 0.55, wx + ww + 6, wy + 16 + fh * 0.55, { w: 2.2 });
  }
  g += rrect(x0 + w * 0.38, gy - 82, w * 0.24, 82, { fill: P.sky, w: 2.6 });
  if (o.sign) g += tag(x0 + w * 0.5, gy - 98, o.sign, { size: 18, anchor: 'middle', bg: P.mark, fg: P.ink });
  if (o.shop) g += rrect(x0 + 6, gy - 120, w - 12, 26, { fill: P.green, w: 2.4 }) + txt(x, gy - 100, o.shop, { size: 16, anchor: 'middle', fill: '#fff', weight: 700 });
  return g;
}
function letrero(x, gy, text, o = {}) { // poste con tabla en forma de flecha
  const s = o.size || 26, w = charW(s) * text.length + 60, y = gy - (o.h || 230);
  let g = rrect(x - 5, y - 20, 10, gy - y + 20, { fill: '#B38A5E', w: 2.6 });
  const dir = o.dir === 'left' ? -1 : 1, x0 = dir > 0 ? x - 20 : x + 20 - w;
  const pts = dir > 0 ? [[x0, y - 34], [x0 + w - 24, y - 34], [x0 + w, y], [x0 + w - 24, y + 34], [x0, y + 34]] : [[x0 + 24, y - 34], [x0 + w, y - 34], [x0 + w, y + 34], [x0 + 24, y + 34], [x0, y]];
  g += rpoly(pts, { fill: o.fill || '#F3E6CF', close: true });
  g += txt(x0 + w / 2 + dir * -6, y + s * 0.35, text, { size: s, anchor: 'middle', weight: 600 });
  return g;
}
function poste(x, gy, h = 70) { // poste dorado de fila
  return rrect(x - 4, gy - h, 8, h, { fill: '#D9A93A', w: 2 }) + rcircle(x, gy - h - 6, 9, 9, { fill: '#D9A93A', w: 2 }) + `<ellipse cx="${f(x)}" cy="${f(gy)}" rx="16" ry="5" fill="#D9A93A" stroke="${P.ink}" stroke-width="2"/>`;
}
function cordon(x1, x2, y) {
  return `<path d="M${f(x1)} ${f(y)} Q${f((x1 + x2) / 2)} ${f(y + 18)} ${f(x2)} ${f(y)}" stroke="#C2303A" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M${f(x1)} ${f(y)} Q${f((x1 + x2) / 2)} ${f(y + 18)} ${f(x2)} ${f(y)}" stroke="${P.ink}" stroke-width="1.6" fill="none" opacity=".5"/>`;
}
function monedas(x, gy, n, o = {}) { // pila de monedas
  const w = o.w || 92, hh = 9;
  let g = '';
  for (let i = 0; i < n; i++) {
    const y = gy - i * hh, dx = jit(x + i * 3.3, 1.6);
    g += `<rect x="${f(x - w / 2 + dx)}" y="${f(y - hh)}" width="${w}" height="${hh}" fill="#E2AE3A" stroke="${P.ink}" stroke-width="1.8"/>`;
  }
  g += `<ellipse cx="${f(x)}" cy="${f(gy - n * hh)}" rx="${f(w / 2)}" ry="9" fill="#F2C55A" stroke="${P.ink}" stroke-width="1.8"/>`;
  return g;
}
function bloque(x, gy, w, h, col, o = {}) { // bloque 3D (barra)
  const d = o.d ?? w * 0.32;
  let g = rrect(x, gy - h, w, h, { fill: col, w: 2.6, j: .6 });
  g += rpoly([[x, gy - h], [x + d, gy - h - d * 0.6], [x + w + d, gy - h - d * 0.6], [x + w, gy - h]], { fill: shade(col, 1.18), close: true, w: 2.6, j: .6 });
  g += rpoly([[x + w, gy - h], [x + w + d, gy - h - d * 0.6], [x + w + d, gy - d * 0.6], [x + w, gy]], { fill: shade(col, 0.8), close: true, w: 2.6, j: .6 });
  return g;
}
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(k > 1 ? v + (255 - v) * (k - 1) : v * k))));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}
function bandera(x, gy, h = 90) {
  let g = rline(x, gy, x, gy - h, { w: 3 });
  for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) g += `<rect x="${x + j * 12}" y="${gy - h + i * 12}" width="12" height="12" fill="${(i + j) % 2 ? '#fff' : P.ink}"/>`;
  return g + rrect(x, gy - h, 48, 36, { w: 2.4, j: .5 });
}
function paraguas(x, y, w = 420) {
  let g = `<path d="M${f(x - w / 2)} ${f(y)} Q${f(x)} ${f(y - w * 0.42)} ${f(x + w / 2)} ${f(y)} Z" fill="${P.mark}" stroke="${P.ink}" stroke-width="3"/>`;
  for (let i = 1; i < 4; i++) g += `<path d="M${f(x - w / 2 + i * w / 4)} ${f(y)} Q${f(x - w / 2 + i * w / 4)} ${f(y - w * 0.2)} ${f(x)} ${f(y - w * 0.21)}" stroke="${P.ink}" stroke-width="2" fill="none" opacity=".5"/>`;
  return g + rline(x, y - w * 0.21, x, y + w * 0.5, { w: 3.4 });
}
const PROPS = { casa, edificio, letrero, bandera, paraguas };
// dibuja una lista de utilería declarada en data: [{type:'casa', x, s, roof, sign}, ...]
function drawProps(list, gy, p = 1) {
  return (list || []).map((o, i) => {
    let s = '';
    if (o.type === 'casa') s = casa(o.x, o.y ?? gy, o.s || 1, o);
    else if (o.type === 'edificio') s = edificio(o.x, o.y ?? gy, o.w || 260, o.h || 420, o);
    else if (o.type === 'letrero') s = letrero(o.x, o.y ?? gy, o.text || '', o);
    else if (o.type === 'bandera') s = bandera(o.x, o.y ?? gy, o.h);
    else if (o.type === 'paraguas') s = paraguas(o.x, o.y ?? gy - 330, o.w);
    else if (o.type === 'monedas') s = monedas(o.x, o.y ?? gy, o.n || 10, o);
    return appear(clamp(p * 1.2 - i * 0.1), s, { dy: 24 });
  }).join('');
}
// aparición genérica: opacidad + desplazamiento
function appear(p, inner, o = {}) {
  if (p <= 0) return '';
  if (p >= 1) return inner;
  const dy = (o.dy ?? 20) * (1 - E.out(p)), dx = (o.dx ?? 0) * (1 - E.out(p));
  return `<g opacity="${f(E.out(p))}" transform="translate(${f(dx)} ${f(dy)})">${inner}</g>`;
}
function pop(p, cx, cy, inner) {
  if (p <= 0) return '';
  if (p >= 1) return inner;
  const s = E.back(p);
  return `<g opacity="${f(clamp(p * 2))}" transform="translate(${f(cx)} ${f(cy)}) scale(${f(s)}) translate(${f(-cx)} ${f(-cy)})">${inner}</g>`;
}

// Primitivas visuales: paleta, easing, personajes en línea, props e íconos.
// Todo devuelve strings SVG en el sistema de coordenadas 1080x1350.

const W = 1080, H = 1350;
const RED = '#E5202B';

const THEMES = {
  light: {
    name: 'light', bg: '#F5F6FA', ink: '#141B30', sub: '#5A6075', grid: 'rgba(20,27,48,0.055)',
    paper: '#FFFFFF', line: '#141B30', muted: '#C9CDD8', soft: '#E6E8EF',
    capBg: '#141B30', capFg: '#FFFFFF', tile: '#FFFFFF', tileSide: '#E6E8EF',
    figFill: '#FFFFFF', figDark: '#141B30', figLine: '#141B30', figDarkLine: '#141B30',
  },
  dark: {
    name: 'dark', bg: '#0E1628', ink: '#FFFFFF', sub: '#8C95AB', grid: 'rgba(255,255,255,0.045)',
    paper: '#0E1628', line: '#FFFFFF', muted: '#3A4560', soft: '#1C2740',
    capBg: 'rgba(22,32,56,0.92)', capFg: '#FFFFFF', tile: '#233257', tileSide: '#1A2645',
    figFill: '#FFFFFF', figDark: '#141B30', figLine: '#0E1628', figDarkLine: '#FFFFFF',
  },
};

// ---------- utilidades ----------
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const E = {
  out: t => 1 - Math.pow(1 - clamp(t), 3),
  inOut: t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
  back: t => { t = clamp(t); const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  lin: t => clamp(t),
};
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const f = n => (Math.round(n * 100) / 100);

// Aparición estándar: opacidad + desplazamiento vertical.
function A(p, inner, o = {}) {
  if (p <= 0.001) return '';
  const dy = (o.dy ?? 26) * (1 - p), dx = (o.dx ?? 0) * (1 - p);
  let tr = `translate(${f(dx)},${f(dy)})`;
  if (o.scale) {
    const s = lerp(o.scale, 1, p), [cx, cy] = o.origin || [540, 675];
    tr += ` translate(${cx},${cy}) scale(${f(s)}) translate(${-cx},${-cy})`;
  }
  return `<g transform="${tr}" opacity="${f(clamp(p))}">${inner}</g>`;
}

// Línea que se "dibuja" (pathLength normalizado).
function drawPath(d, p, attrs = '') {
  if (p <= 0.001) return '';
  return `<path d="${d}" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${f(1 - clamp(p))}" fill="none" ${attrs}/>`;
}

function mono(x, y, txt, o = {}) {
  const size = o.size ?? 16, ls = o.ls ?? 0.28, anchor = o.anchor ?? 'start', w = o.weight ?? 500;
  return `<text x="${f(x)}" y="${f(y)}" font-family="Plex Mono" font-size="${size}" font-weight="${w}" letter-spacing="${size * ls}" fill="${o.fill}" text-anchor="${anchor}" ${o.extra || ''}>${esc(String(txt).toUpperCase())}</text>`;
}
function sans(x, y, txt, o = {}) {
  const size = o.size ?? 28, anchor = o.anchor ?? 'start', w = o.weight ?? 600;
  return `<text x="${f(x)}" y="${f(y)}" font-family="Inter" font-size="${size}" font-weight="${w}" letter-spacing="${o.ls ?? -0.01 * size}" fill="${o.fill}" text-anchor="${anchor}" ${o.extra || ''}>${esc(txt)}</text>`;
}
// Ajuste de línea aproximado para texto SVG.
function wrap(text, maxW, size, factor = 0.53) {
  const words = String(text || '').split(/\s+/).filter(Boolean), lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (t.length * size * factor > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}
function sansBlock(x, y, text, o = {}) {
  const size = o.size ?? 24, lh = o.lh ?? 1.3;
  return wrap(text, o.maxW ?? 400, size, o.factor).map((l, i) => sans(x, y + i * size * lh, l, o)).join('');
}

// ---------- personajes ----------
// Personaje de línea, origen en los pies (x,y). pose: stand | walk | sit | wave | point
// hair: long | short | bun | curly | none ; top/bottom: 'light'|'dark'
function person(x, y, o = {}, T = THEMES.light) {
  const s = o.scale ?? 1, flip = o.flip ? -1 : 1, t = o.t ?? 0;
  const L = T.figLine, FL = T.figFill, DK = T.figDark, DKL = T.figDarkLine;
  const topC = o.top === 'dark' ? DK : FL, topL = o.top === 'dark' ? DKL : L;
  const botC = o.bottom === 'light' ? FL : DK, botL = o.bottom === 'light' ? L : DKL;
  const pose = o.pose || 'stand', sw = 3 / s;
  const phase = t * (o.speed ?? 7);
  const swing = pose === 'walk' ? Math.sin(phase) * 24 : 0;
  const bob = pose === 'walk' ? Math.abs(Math.cos(phase)) * -4 : 0;
  const hipY = -118, shY = -198;
  let g = '';
  const leg = (ang, isBack) => {
    const c = isBack ? (o.bottom === 'light' ? '#DDE0E8' : botC) : botC;
    if (pose === 'sit') {
      return `<g><path d="M-16 ${hipY} L42 ${hipY - 2} L44 ${hipY + 18} L-14 ${hipY + 22} Z" fill="${c}" stroke="${botL}" stroke-width="${sw}" stroke-linejoin="round"/>
        <path d="M30 ${hipY + 4} L46 ${hipY + 4} L44 -8 L30 -8 Z" fill="${c}" stroke="${botL}" stroke-width="${sw}" stroke-linejoin="round"/>
        <path d="M28 -10 L50 -10 Q58 -9 58 -2 L28 -2 Z" fill="${FL}" stroke="${L}" stroke-width="${sw}"/></g>`;
    }
    return `<g transform="rotate(${f(ang)} 0 ${hipY})">
      <path d="M-11 ${hipY} L11 ${hipY} L8 -12 L-6 -12 Z" fill="${c}" stroke="${botL}" stroke-width="${sw}" stroke-linejoin="round"/>
      <path d="M-8 -14 L10 -14 Q22 -12 22 -2 L-8 -2 Z" fill="${FL}" stroke="${L}" stroke-width="${sw}" stroke-linejoin="round"/></g>`;
  };
  const arm = (ang, side) => {
    const sx = side * 25;
    let a = ang;
    if (pose === 'wave' && side === 1) a = -150 + Math.sin(t * 6) * 12;
    if (pose === 'point' && side === 1) a = -80;
    return `<g transform="rotate(${f(a)} ${sx} ${shY + 8})">
      <path d="M${sx - 8} ${shY + 4} L${sx + 8} ${shY + 4} L${sx + 6} ${shY + 76} L${sx - 6} ${shY + 76} Z" fill="${topC}" stroke="${topL}" stroke-width="${sw}" stroke-linejoin="round"/>
      <circle cx="${sx}" cy="${shY + 84}" r="7" fill="${FL}" stroke="${L}" stroke-width="${sw}"/></g>`;
  };
  // pierna trasera, brazo trasero, torso, pierna delantera, brazo delantero, cabeza
  g += arm(pose === 'sit' ? -35 : -swing * 0.8, -1);
  g += leg(pose === 'walk' ? -swing : 0, true);
  g += leg(pose === 'walk' ? swing : 0, false);
  g += `<path d="M-27 ${shY} Q0 ${shY - 8} 27 ${shY} L23 ${hipY + 4} L-23 ${hipY + 4} Z" fill="${topC}" stroke="${topL}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  if (o.top === 'dark') g += `<path d="M0 ${shY - 2} L0 ${hipY + 2}" stroke="${DKL}" stroke-width="${sw * 0.7}" opacity=".5"/>`;
  g += arm(pose === 'sit' ? -30 : swing * 0.8, 1);
  // cuello y cabeza
  const hy = -232;
  g += `<rect x="-6" y="${shY - 14}" width="12" height="14" fill="${FL}" stroke="${L}" stroke-width="${sw}"/>`;
  const hair = o.hair || 'short';
  if (hair === 'long') g += `<path d="M-24 ${hy - 4} Q-26 ${hy - 30} 0 ${hy - 30} Q26 ${hy - 30} 24 ${hy - 4} L28 ${hy + 34} Q16 ${hy + 40} 12 ${hy + 26} L-12 ${hy + 26} Q-16 ${hy + 40} -28 ${hy + 34} Z" fill="${DK}" stroke="${DKL}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  g += `<circle cx="0" cy="${hy}" r="20" fill="${FL}" stroke="${L}" stroke-width="${sw}"/>`;
  if (hair === 'short') g += `<path d="M-20 ${hy - 2} Q-22 ${hy - 26} 0 ${hy - 25} Q22 ${hy - 26} 20 ${hy - 4} Q8 ${hy - 14} -20 ${hy - 2} Z" fill="${DK}" stroke="${DKL}" stroke-width="${sw}"/>`;
  if (hair === 'long') g += `<path d="M-20 ${hy - 2} Q-18 ${hy - 24} 0 ${hy - 24} Q20 ${hy - 24} 21 ${hy} Q6 ${hy - 10} -4 ${hy - 18} Q-10 ${hy - 6} -20 ${hy - 2} Z" fill="${DK}" stroke="${DKL}" stroke-width="${sw}"/>`;
  if (hair === 'bun') g += `<circle cx="0" cy="${hy - 26}" r="9" fill="${DK}" stroke="${DKL}" stroke-width="${sw}"/><path d="M-20 ${hy} Q-20 ${hy - 24} 0 ${hy - 22} Q20 ${hy - 24} 20 ${hy} Q10 ${hy - 12} -20 ${hy} Z" fill="${DK}" stroke="${DKL}" stroke-width="${sw}"/>`;
  if (hair === 'curly') g += [-16, -6, 5, 15].map((cx, i) => `<circle cx="${cx}" cy="${hy - 16 + (i % 2) * 3}" r="9" fill="${DK}" stroke="${DKL}" stroke-width="${sw}"/>`).join('');
  if (o.glasses) g += `<g stroke="${L}" stroke-width="${sw}" fill="none"><circle cx="3" cy="${hy + 1}" r="5"/><circle cx="15" cy="${hy + 1}" r="5"/><path d="M8 ${hy + 1} L10 ${hy + 1}"/></g>`;
  g += `<circle cx="4" cy="${hy + 1}" r="2" fill="${L}"/><circle cx="14" cy="${hy + 1}" r="2" fill="${L}"/>`;
  g += `<path d="M5 ${hy + 9} Q10 ${hy + 13} 15 ${hy + 9}" stroke="${L}" stroke-width="${sw * 0.8}" fill="none" stroke-linecap="round"/>`;
  if (o.beard) g += `<path d="M-12 ${hy + 6} Q0 ${hy + 26} 16 ${hy + 8} Q10 ${hy + 16} 0 ${hy + 14} Z" fill="${DK}" stroke="${DKL}" stroke-width="${sw}"/>`;
  return `<g transform="translate(${f(x)},${f(y + bob * s)}) scale(${f(s * flip)},${f(s)})">${g}</g>`;
}

// Busto grande (para escenas de "persona usando el producto").
function bust(x, y, o = {}, T = THEMES.light) {
  return person(x, y, { ...o, pose: 'stand' }, T);
}

// ---------- props ----------
function door(x, y, w, h, o = {}, T = THEMES.light) {
  const open = clamp(o.open ?? 0), fill = o.fill ?? T.paper, line = o.line ?? T.line;
  const pw = w * (1 - 0.72 * open);
  let g = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${o.dark ? T.soft : fill}" stroke="${line}" stroke-width="3"/>`;
  if (open > 0) g += `<rect x="${x + 3}" y="${y + 3}" width="${w - 6}" height="${h - 3}" fill="${T.name === 'dark' ? '#1A2645' : '#DADDE6'}"/>`;
  g += `<path d="M${x} ${y} L${x + pw} ${y + 10 * open} L${x + pw} ${y + h - 10 * open} L${x} ${y + h} Z" fill="${fill}" stroke="${line}" stroke-width="3" stroke-linejoin="round"/>`;
  if (open < 0.6) {
    g += `<rect x="${x + 12}" y="${y + 12}" width="${Math.max(0, pw - 24)}" height="${h - 24}" fill="none" stroke="${line}" stroke-width="1.5" opacity=".45"/>`;
    g += `<circle cx="${x + pw - 22}" cy="${y + h * 0.53}" r="6" fill="${line}"/>`;
  }
  return g;
}
function desk(x, y, w, T = THEMES.light, o = {}) {
  const c = o.color ?? (T.name === 'dark' ? '#FFFFFF' : T.ink);
  return `<rect x="${x}" y="${y}" width="${w}" height="12" fill="${c}"/><rect x="${x + 18}" y="${y + 12}" width="9" height="${o.h ?? 88}" fill="${c}"/><rect x="${x + w - 27}" y="${y + 12}" width="9" height="${o.h ?? 88}" fill="${c}"/>`;
}
function laptop(x, y, T, label) {
  return `<path d="M${x} ${y} L${x + 80} ${y} L${x + 72} ${y - 52} L${x + 8} ${y - 52} Z" fill="${T.paper}" stroke="${T.line}" stroke-width="3" stroke-linejoin="round"/><rect x="${x - 10}" y="${y}" width="100" height="6" fill="${T.line}"/>${label ? mono(x + 40, y - 22, label, { size: 8, anchor: 'middle', fill: T.sub }) : ''}`;
}
function isoTile(cx, cy, s, T, o = {}) {
  const top = o.fill ?? T.tile, side = o.side ?? T.tileSide, line = o.line ?? T.line, d = s * 0.28;
  const pts = `${cx},${cy - s * 0.58} ${cx + s},${cy} ${cx},${cy + s * 0.58} ${cx - s},${cy}`;
  const id = 'h' + Math.round(cx) + Math.round(cy);
  return `<defs><pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)"><path d="M0 0 L0 8" stroke="${line}" stroke-width="1" opacity=".35"/></pattern></defs>
  <path d="M${cx - s} ${cy} L${cx} ${cy + s * 0.58} L${cx} ${cy + s * 0.58 + d} L${cx - s} ${cy + d} Z" fill="${side}" stroke="${line}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M${cx} ${cy + s * 0.58} L${cx + s} ${cy} L${cx + s} ${cy + d} L${cx} ${cy + s * 0.58 + d} Z" fill="url(#${id})" stroke="${line}" stroke-width="2.5" stroke-linejoin="round"/>
  <polygon points="${pts}" fill="${top}" stroke="${line}" stroke-width="2.5" stroke-linejoin="round"/>`;
}
function idBadge(cx, cy, s = 1) {
  return `<g transform="translate(${cx},${cy}) scale(${s})"><rect x="-26" y="-33" width="52" height="66" rx="5" fill="${RED}"/><circle cx="0" cy="-12" r="9" fill="#fff"/><rect x="-15" y="4" width="30" height="5" rx="2" fill="#fff"/><rect x="-15" y="15" width="22" height="5" rx="2" fill="#fff"/></g>`;
}
function server(x, y, T) {
  const c = T.name === 'dark' ? '#FFFFFF' : T.ink, l = T.name === 'dark' ? T.ink === '#FFFFFF' ? '#0E1628' : '#fff' : '#fff';
  return `<rect x="${x}" y="${y}" width="58" height="90" rx="4" fill="${c}"/>${[20, 42, 64].map(yy => `<rect x="${x + 12}" y="${y + yy - 2}" width="34" height="5" fill="${l}"/>`).join('')}`;
}
function formDoc(x, y, T, title, w = 80, h = 100) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${T.paper}" stroke="${T.line}" stroke-width="2.5"/>${mono(x + 9, y + 22, title || '', { size: 11, fill: T.ink, ls: 0.16 })}${[40, 55, 70, 85].map((yy, i) => `<rect x="${x + 9}" y="${y + yy}" width="${(w - 18) * (i % 2 ? 0.6 : 0.9)}" height="6" fill="${T.soft}"/>`).join('')}`;
}
function xMark(cx, cy, s, c) { return `<path d="M${cx - s} ${cy - s} L${cx + s} ${cy + s} M${cx + s} ${cy - s} L${cx - s} ${cy + s}" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>`; }
function checkBox(x, y, s, p = 1) {
  return `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="3" fill="none" stroke="${RED}" stroke-width="2.5"/>${drawPath(`M${x + s * 0.22} ${y + s * 0.52} L${x + s * 0.42} ${y + s * 0.72} L${x + s * 0.8} ${y + s * 0.28}`, p, `stroke="${RED}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"`)}`;
}
function checkCircle(cx, cy, r = 11) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${RED}"/><path d="M${cx - r * 0.45} ${cy} L${cx - r * 0.1} ${cy + r * 0.38} L${cx + r * 0.5} ${cy - r * 0.35}" stroke="#fff" stroke-width="${r * 0.28}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function shield(cx, cy, s, T) {
  return `<path d="M${cx} ${cy - s} L${cx + s * 0.85} ${cy - s * 0.6} L${cx + s * 0.8} ${cy + s * 0.2} Q${cx + s * 0.5} ${cy + s * 0.85} ${cx} ${cy + s} Q${cx - s * 0.5} ${cy + s * 0.85} ${cx - s * 0.8} ${cy + s * 0.2} L${cx - s * 0.85} ${cy - s * 0.6} Z" fill="${T.paper}" stroke="${T.line}" stroke-width="2.5"/><path d="M${cx - s * 0.35} ${cy} L${cx - s * 0.05} ${cy + s * 0.3} L${cx + s * 0.4} ${cy - s * 0.3}" stroke="${T.line}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
}

// ---------- íconos de línea (grilla 24x24) ----------
const ICONS = {
  document: 'M6 2h8l4 4v16H6z M14 2v4h4 M9 11h6 M9 15h6 M9 19h4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21c0-4 4-6 8-6s8 2 8 6',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5 M16 4.5a3.5 3.5 0 0 1 0 6.5 M18 14.8c2.4.6 4 2.3 4 5.2',
  building: 'M4 21V5l8-3 8 3v16 M2 21h20 M8 8h2 M14 8h2 M8 12h2 M14 12h2 M8 16h2 M14 16h2 M10 21v-3h4v3',
  shield: 'M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z M8.5 12l2.5 2.5 4.5-5',
  check: 'M4 12l5 5L20 6',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2',
  money: 'M2 6h20v12H2z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 6v12 M18 6v12',
  chart: 'M3 3v18h18 M7 16v-4 M11 16V8 M15 16v-6 M19 16V5',
  trend: 'M3 17l6-6 4 4 8-8 M15 7h6v6',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M2 12h20 M12 2c3 3 4 6.5 4 10s-1 7-4 10c-3-3-4-6.5-4-10s1-7 4-10z',
  chat: 'M4 4h16v12H9l-5 4z M8 9h8 M8 12h5',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  idea: 'M9 18h6 M10 21h4 M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  lock: 'M5 11h14v10H5z M8 11V7a4 4 0 1 1 8 0v4 M12 15v2',
  phone: 'M7 2h10v20H7z M11 18h2',
  mail: 'M3 5h18v14H3z M3 6l9 7 9-7',
  cloud: 'M7 18a5 5 0 0 1-.6-10A7 7 0 0 1 20 10a4 4 0 0 1-1 8z',
  database: 'M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3z M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5 M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  heart: 'M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z',
  star: 'M12 2l3 6.5 7 .9-5.1 4.9 1.3 7L12 18l-6.2 3.3 1.3-7L2 9.4l7-.9z',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  rocket: 'M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2 M9 18l-3-3 M14.5 4.5C17 2 22 2 22 2s0 5-2.5 7.5L12 17l-5-5z M15 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  warning: 'M12 3l10 18H2z M12 10v5 M12 18v.5',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M21 21l-5-5',
  calendar: 'M3 5h18v16H3z M3 10h18 M8 3v4 M16 3v4',
  truck: 'M2 6h12v10H2z M14 10h4l4 4v2h-8 M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  school: 'M2 9l10-5 10 5-10 5z M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5 M22 9v6',
  briefcase: 'M3 7h18v13H3z M8 7V4h8v3 M3 12h18',
  health: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
  leaf: 'M4 20c0-9 6-15 16-16-1 10-7 16-16 16z M4 20l8-8',
  ai: 'M6 6h12v12H6z M9 9h6v6H9z M9 2v4 M15 2v4 M9 18v4 M15 18v4 M2 9h4 M2 15h4 M18 9h4 M18 15h4',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  flow: 'M3 4h6v6H3z M15 14h6v6h-6z M6 10v4a3 3 0 0 0 3 3h6 M15 7h-3',
  home: 'M3 11l9-8 9 8 M5 9v12h14V9 M10 21v-6h4v6',
  factory: 'M2 21V10l6 4V10l6 4V6h8v15z M6 17h2 M12 17h2 M18 17h2',
  cart: 'M3 3h3l2.5 12h11L22 7H7 M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  scale: 'M12 3v18 M5 21h14 M4 7h16 M4 7l-3 7a3 3 0 0 0 6 0z M20 7l-3 7a3 3 0 0 0 6 0z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  handshake: 'M2 12l4-4 4 2 3-2 3 1 4 3 2 2-6 6-6-4-3 1z M9 13l2 2 M12 12l3 3',
  megaphone: 'M3 10v4h4l8 5V5L7 10z M18 9a4 4 0 0 1 0 6 M7 14l1 6h3l-1-5',
};
function icon(name, x, y, size, color, sw = 1.8) {
  const d = ICONS[name] || ICONS.document;
  return `<g transform="translate(${x},${y}) scale(${size / 24})"><path d="${d}" fill="none" stroke="${color}" stroke-width="${f(sw * 24 / size)}" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}

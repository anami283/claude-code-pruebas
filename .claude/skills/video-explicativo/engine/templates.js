// Plantillas de escena. Cada una recibe ctx y devuelve SVG.
// ctx.p('capa') -> progreso 0..1 de una capa revelada con "show" en un beat.
// ctx.v('clave') -> valor animado fijado con "set". ctx.t -> segundos dentro de la escena.

const TEMPLATES = {};
const FLOOR = 1152;

// Distribuye n columnas en el ancho útil.
function cols(n, x0 = 68, x1 = 1012, gap = 12) {
  const w = (x1 - x0 - gap * (n - 1)) / n;
  return Array.from({ length: n }, (_, i) => ({ x: x0 + i * (w + gap), w, cx: x0 + i * (w + gap) + w / 2 }));
}
function emblem(cx, cy, e, T) {
  // e: {colors:[...], dir:'h'|'v', icon, label}
  const w = 190, h = 128, x = cx - w / 2, y = cy - h / 2;
  let g = '';
  if (e.colors && e.colors.length) {
    const n = e.colors.length;
    g += e.colors.map((c, i) => e.dir === 'v'
      ? `<rect x="${x + i * w / n}" y="${y}" width="${w / n + 0.5}" height="${h}" fill="${c}"/>`
      : `<rect x="${x}" y="${y + i * h / n}" width="${w}" height="${h / n + 0.5}" fill="${c}"/>`).join('');
  } else {
    g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${T.paper}" stroke="${T.line}" stroke-width="3"/>`;
    g += icon(e.icon || 'building', cx - 34, cy - 34, 68, T.ink, 1.6);
  }
  if (e.label) g += mono(cx, y + h + 34, e.label, { size: 13, anchor: 'middle', fill: T.name === 'dark' ? '#C9D0DE' : T.sub });
  return g;
}

// 1) HERO: dos lados separados por una línea; gente llega; aparece una puerta.
TEMPLATES.hero_split = ctx => {
  const { T, data: d, t } = ctx;
  let g = '';
  const pf = ctx.p('emblems', 0, 0.8);
  g += A(pf, emblem(380, 330, d.left || {}, T) + emblem(700, 330, d.right || {}, T), { dy: 20 });
  const pl = ctx.p('divider', 0.2, 1.0, E.inOut);
  if (pl > 0) g += `<path d="M540 250 V${lerp(250, FLOOR, pl)}" stroke="${T.line}" stroke-width="2"/>`;
  if (ctx.has('people')) {
    const st = ctx.since('people');
    const walkers = d.walkers || 2;
    for (let i = 0; i < walkers; i++) {
      const x = lerp(-80 - i * 70, 300 - i * 70, E.out((st - i * 0.15) / 3.2));
      const moving = st < 3.2;
      g += person(x, FLOOR - 4, { pose: moving ? 'walk' : 'stand', t: st + i, hair: ['long', 'short', 'bun', 'curly'][i % 4], scale: i === 1 ? 0.62 : 0.92, bottom: 'dark' }, T);
    }
  }
  if (ctx.has('crowd')) {
    const st = ctx.since('crowd');
    for (let i = 0; i < 4; i++) {
      const x = lerp(-100 - i * 90, 150 + i * 90, E.out((st - i * 0.2) / 3));
      g += person(x, FLOOR - 4, { pose: st < 3 ? 'walk' : 'stand', t: st * 1.1 + i, hair: ['short', 'long', 'curly', 'bun'][i], scale: 0.86, bottom: i % 2 ? 'light' : 'dark' }, T);
    }
  }
  const pd = ctx.p('door', 0, 0.7);
  if (pd > 0) g += A(pd, door(620, FLOOR - 300, 150, 300, { open: ctx.v('doorOpen', 0.6), fill: T.name === 'dark' ? '#FFFFFF' : T.paper, line: T.name === 'dark' ? '#8C95AB' : T.line }, T), { dy: 40 });
  if (ctx.has('wall')) {
    const pw = E.out(ctx.since('wall') / 0.9);
    g += `<g transform="translate(0,${(1 - pw) * 700})">
      <rect x="455" y="520" width="440" height="${FLOOR - 520 + 200}" fill="#FFFFFF" stroke="#8C95AB" stroke-width="3"/>
      ${[0, 1, 2].map(i => `<rect x="${495 + i * 60}" y="560" width="46" height="46" fill="none" stroke="#141B30" stroke-width="2"/>`).join('')}
      ${door(560, FLOOR - 300, 150, 300, { fill: '#FFFFFF', line: '#141B30' }, THEMES.light)}</g>`;
  }
  return g;
};

// 2) PANELES: instituciones/áreas separadas, cada una con su proceso, formulario y sistema.
TEMPLATES.panels = ctx => {
  const { T, data: d, t } = ctx;
  const P = d.panels || [];
  const C = cols(P.length || 3);
  const top = d.top ?? 468;
  let g = '';
  const pp = ctx.p('panels', 0, 0.8);
  if (pp > 0) {
    C.forEach((c, i) => {
      const pi = P[i] || {};
      const pr = E.out((t - (ctx.scene.shown.panels || 0) - i * 0.12) / 0.8);
      let pg = `<rect x="${c.x}" y="${top}" width="${c.w}" height="${FLOOR - top}" fill="${T.paper}" stroke="${T.line}" stroke-width="3"/>`;
      pg += `<rect x="${c.x}" y="${top}" width="${c.w}" height="52" fill="${T.name === 'dark' ? '#FFFFFF' : T.ink}"/>`;
      pg += mono(c.x + 16, top + 34, pi.title || '', { size: 17, fill: T.name === 'dark' ? T.bg : '#FFFFFF', weight: 600, ls: 0.14 });
      if (pi.subtitle) pg += mono(c.x + 16, top + 76, pi.subtitle, { size: 13, fill: T.sub, ls: 0.16 });
      // cajas superiores o etiqueta grande
      const lb = ctx.p('labels', i * 0.12, 0.5);
      const sq = Math.min(72, (c.w - 60) / 3);
      if (lb < 1) pg += `<g opacity="${1 - lb}">` + [0, 1, 2].map(k => `<rect x="${c.x + 25 + k * (sq + 20) * (c.w - 50) / (3 * sq + 40)}" y="${top + 92}" width="${sq}" height="${sq}" fill="none" stroke="${T.line}" stroke-width="2"/>`).join('') + `</g>`;
      if (lb > 0 && pi.label) pg += A(lb, `<rect x="${c.x + 25}" y="${top + 100}" width="${c.w - 50}" height="56" fill="${T.paper}" stroke="${T.line}" stroke-width="2.5"/>${mono(c.cx, top + 135, pi.label, { size: 15, anchor: 'middle', fill: T.ink, weight: 600, ls: 0.12 })}`, { dy: 10 });
      // mini diagrama de proceso
      const pr2 = ctx.p('process', i * 0.15, 0.6);
      if (pr2 > 0) {
        const y = top + 200, x0 = c.x + 50, x1 = c.x + c.w - 50;
        const ys = [[0, 0, 0], [0, 20, 0], [0, 0, 0]][i % 3];
        const pts = [0, 0.5, 1].map((k, j) => [lerp(x0 + 22, x1 - 22, k), y + ys[j]]);
        pg += `<g opacity="${pr2}">${drawPath(`M${x0} ${y} L${pts[0][0]} ${pts[0][1]} L${pts[1][0]} ${pts[1][1]} L${pts[2][0]} ${pts[2][1]} L${x1} ${y}`, pr2, `stroke="${T.line}" stroke-width="2"`)}${pts.map(p => `<rect x="${p[0] - 11}" y="${p[1] - 11}" width="22" height="22" fill="${T.paper}" stroke="${T.line}" stroke-width="2"/>`).join('')}</g>`;
      }
      // formulario y sistema
      const pfm = ctx.p('forms', i * 0.12, 0.5);
      if (pfm > 0) pg += A(pfm, formDoc(c.x + 8, top + 287, T, pi.form || 'FORM', Math.min(80, c.w * 0.27), 100), { dy: 12 });
      const psy = ctx.p('systems', i * 0.12, 0.5);
      if (psy > 0) pg += A(psy, server(c.x + c.w - 70, top + 289, T) + mono(c.x + c.w - 41, top + 402, pi.sys || `SYS·${i + 1}`, { size: 12, anchor: 'middle', fill: T.ink }), { dy: 12 });
      // puerta
      const dw = Math.min(135, c.w * 0.44);
      pg += door(c.cx - dw / 2 - 5, top + 335, dw, FLOOR - top - 335, {}, T);
      pg += `<rect x="${c.x}" y="${FLOOR - 12}" width="${c.w}" height="12" fill="${T.soft}" stroke="${T.line}" stroke-width="1.5"/>`;
      g += A(pr, pg, { dy: 60 });
    });
  }
  // conexiones rotas entre sistemas
  const pb = ctx.p('broken', 0, 0.9);
  if (pb > 0) C.slice(0, -1).forEach((c, i) => {
    const x0 = c.x + c.w - 45, y0 = top + 280, x1 = C[i + 1].cx - 55, y1 = top + 245;
    g += drawPath(`M${x0} ${y0} Q${x0 + 20} ${y1} ${x1} ${y1}`, pb, `stroke="${T.line}" stroke-width="2"`);
    if (pb > 0.9) g += xMark(x1 + 18, y1, 11, T.line);
  });
  // alertas rojas (la persona repite su historia)
  C.forEach((c, i) => {
    const pa = ctx.p('alerts', i * 0.35, 0.4, E.back);
    if (pa > 0) g += A(pa, idBadge(c.x + c.w - 85, top + 297, 0.9), { scale: 0.4, origin: [c.x + c.w - 85, top + 297], dy: 0 });
  });
  if (ctx.has('redline')) g += drawPath(`M${C[0].x + 40} ${top + 312} H${C[C.length - 1].x + C[C.length - 1].w - 40}`, ctx.p('redline', 0, 1.2), `stroke="${RED}" stroke-width="2" stroke-dasharray="6 5"`);
  // persona(s) que recorren los paneles
  if (ctx.has('person')) {
    const at = ctx.v('personAt', 0, 1.6);
    const moving = ctx.setAt('personAt') >= 0 && ctx.t - ctx.setAt('personAt') < 1.6;
    const cx = lerp(C[0].cx, C[C.length - 1].cx, (at) / Math.max(1, C.length - 1));
    const pp2 = ctx.p('person', 0, 0.6);
    g += A(pp2, person(cx - 10, FLOOR - 10, { pose: moving ? 'walk' : 'stand', t: ctx.t, hair: 'long', scale: 0.95, top: 'light', bottom: 'dark' }, T) + person(cx - 55, FLOOR - 10, { pose: moving ? 'walk' : 'stand', t: ctx.t + 0.4, hair: 'short', scale: 0.55, top: 'dark', bottom: 'light' }, T), { dx: -30, dy: 0 });
  }
  if (ctx.has('outofreach')) {
    const po = ctx.p('outofreach', 0, 1.2, E.inOut);
    g += drawPath(`M540 ${top - 30} C${980 + 60} ${top - 20} ${1060} ${top + 280} 540 ${top + 330} C20 ${top + 280} 40 ${top - 20} 540 ${top - 30}`, po, `stroke="${RED}" stroke-width="2.5" stroke-dasharray="8 7"`);
    const ps = ctx.p('outofreach', 0.4, 0.7);
    g += A(ps, desk(620, FLOOR - 70, 300, T, { h: 58 }) + person(700, FLOOR - 8, { pose: 'sit', hair: 'long', scale: 0.95, t: ctx.t }, T) + person(810, FLOOR - 8, { pose: 'sit', hair: 'short', scale: 0.55 }, T));
  }
  return g;
};

// 3) PLANO: una sola puerta dibujada como plano + checklist en la zona de titular.
TEMPLATES.blueprint = ctx => {
  const { T, data: d } = ctx;
  let g = '';
  const checks = d.checks || [];
  checks.forEach((c, i) => {
    const p = ctx.p('c' + i, 0, 0.5);
    if (p > 0) g += A(p, checkBox(108, 150 + i * 70, 34, ctx.p('c' + i, 0.2, 0.4)) + sans(162, 180 + i * 70, c, { size: 48, weight: i === checks.length - 1 && d.emphasizeLast !== false ? 600 : 400, fill: T.ink }), { dx: -20, dy: 0 });
  });
  const pg = ctx.p('ghosts', 0, 0.7);
  const ghostOut = ctx.p('door', 0, 0.6);
  if (pg > 0) g += `<g opacity="${pg * (1 - ghostOut * 0.8)}">` + [-220, 0, 220].map(dx => `<rect x="${540 + dx - 95}" y="600" width="190" height="400" fill="none" stroke="${T.line}" stroke-width="2" stroke-dasharray="8 8"/>`).join('') + `</g>`;
  if (ghostOut > 0) {
    g += A(ghostOut, `<rect x="445" y="600" width="190" height="400" fill="none" stroke="${T.line}" stroke-width="3.5"/><rect x="458" y="613" width="164" height="384" fill="none" stroke="${T.line}" stroke-width="1.5"/><circle cx="600" cy="815" r="7" fill="none" stroke="${T.line}" stroke-width="2"/>`, { scale: 0.9, origin: [540, 800], dy: 0 });
    const pd = ctx.p('dims', 0.1, 0.8);
    g += `<g opacity="${pd}"><path d="M445 560 H635 M445 552 V568 M635 552 V568" stroke="${T.line}" stroke-width="1.5"/>${mono(540, 546, d.dimLabel || '1 puerta', { size: 13, anchor: 'middle', fill: T.sub })}
      <path d="M670 600 V1000 M662 600 H678 M662 1000 H678" stroke="${T.line}" stroke-width="1.5"/>${mono(700, 780, d.note || 'fig. — diseñado, aún no construido', { size: 11, fill: T.sub, extra: '' })}</g>`;
  }
  return g;
};
TEMPLATES.blueprint.floor = false;

// 4) EQUIPO: tablero con notas + dos grupos de personas trabajando juntos.
TEMPLATES.team_board = ctx => {
  const { T, data: d, t } = ctx;
  let g = '';
  const pb = ctx.p('board', 0, 0.7);
  const dark = ctx.p('screen', 0, 0.6);
  if (pb > 0) {
    let b = `<rect x="100" y="560" width="660" height="370" fill="${dark > 0 ? `rgba(20,27,48,${dark})` : T.paper}" stroke="${T.line}" stroke-width="3"/>`;
    b += `<rect x="100" y="560" width="660" height="370" fill="${T.paper}" opacity="${1 - dark}" stroke="${T.line}" stroke-width="3"/>`;
    if (dark > 0) b += `<rect x="100" y="560" width="660" height="370" fill="#141B30" opacity="${dark}"/>`;
    b += mono(122, 594, d.board || 'mapa del servicio · hoy → mañana', { size: 12, fill: dark > 0.5 ? '#fff' : T.sub });
    const pn = ctx.p('notes', 0, 1.6, E.lin);
    for (let i = 0; i < 10; i++) {
      const k = clamp(pn * 10 - i);
      if (k <= 0 || dark > 0.6) continue;
      const x = 150 + (i % 5) * 122, y = 650 + Math.floor(i / 5) * 120, r = ((i * 37) % 9) - 4;
      b += A(E.back(k), `<g transform="rotate(${r} ${x + 30} ${y + 30})"><rect x="${x}" y="${y}" width="62" height="54" fill="${T.paper}" stroke="${T.line}" stroke-width="2"/><path d="M${x + 10} ${y + 18} H${x + 50} M${x + 10} ${y + 30} H${x + 42}" stroke="${T.muted}" stroke-width="3"/></g>`, { dy: 8 });
    }
    if (dark > 0 && d.screenText) b += `<g opacity="${dark}">${sans(430, 760, d.screenText, { size: 30, anchor: 'middle', fill: '#fff', weight: 500 })}</g>`;
    g += A(pb, b, { dy: 30 });
  }
  const pa = ctx.p('groupA', 0, 0.7);
  if (pa > 0) {
    let a = desk(110, FLOOR - 110, 520, T, { h: 98 });
    const hairs = ['short', 'long', 'bun', 'short'];
    [170, 285, 400, 515].forEach((x, i) => { a += person(x, FLOOR - 18, { pose: 'stand', hair: hairs[i], scale: 0.78, glasses: i === 0, beard: i === 3, top: i === 3 ? 'dark' : 'light' }, T); });
    a = `<g>${a}</g>` + `<rect x="100" y="${FLOOR - 112}" width="540" height="14" fill="${T.name === 'dark' ? '#fff' : T.ink}"/>` + laptop(470, FLOOR - 112, T, d.laptop || '');
    a += `<path d="M110 ${FLOOR + 22} H630" stroke="${T.line}" stroke-width="1.2"/>` + mono(370, FLOOR + 50, d.labelA || 'equipo A', { size: 12, anchor: 'middle', fill: T.sub });
    g += A(pa, a, { dy: 30 });
  }
  const pbb = ctx.p('groupB', 0, 0.7);
  if (pbb > 0) {
    let b = person(760, FLOOR - 8, { pose: 'stand', hair: 'short', beard: true, scale: 0.92, top: 'light' }, T) + person(880, FLOOR - 8, { pose: 'point', hair: 'long', scale: 0.9, top: 'dark', flip: true, t }, T);
    b += `<path d="M720 ${FLOOR + 22} H930" stroke="${T.line}" stroke-width="1.2"/>` + mono(825, FLOOR + 50, d.labelB || 'equipo B', { size: 12, anchor: 'middle', fill: T.sub });
    g += A(pbb, b, { dx: 40, dy: 0 });
  }
  return g;
};

// 5) HUB ISOMÉTRICO: pasos (tabs), bloques, recorrido roto, credencial que conecta todo.
TEMPLATES.iso_hub = ctx => {
  const { T, data: d, t } = ctx;
  let g = '';
  const tabs = d.tabs || [];
  if (tabs.length) {
    const active = ctx.raw('tab', 0), n = tabs.length, w = (864 - (n - 1) * 10) / n;
    const pt = ctx.p('tabs', 0, 0.6);
    tabs.forEach((tb, i) => {
      const x = 108 + i * (w + 10), c = i === active ? RED : i < active ? T.ink : T.muted;
      g += `<g opacity="${pt}"><rect x="${x}" y="260" width="${w}" height="4" fill="${c}"/>${mono(x, 290, String(i + 1).padStart(2, '0'), { size: 13, fill: i === active ? T.ink : T.sub })}${mono(x, 310, tb, { size: 13, fill: i === active ? T.ink : T.sub, weight: i === active ? 600 : 400 })}</g>`;
    });
  }
  const tiles = d.tiles || ['A', 'B', 'C'];
  const pos = [[255, 510], [540, 440], [825, 510]];
  tiles.slice(0, 3).forEach((lb, i) => {
    const p = ctx.p('tiles', i * 0.12, 0.7);
    const [cx, cy] = pos[i];
    const chk = ctx.p('checks', i * 0.2, 0.4, E.back);
    g += A(p, isoTile(cx, cy, 100, T, { fill: T.name === 'dark' ? '#233257' : '#FFFFFF' }) + mono(cx - (chk > 0 ? 14 : 0), cy - 92, lb, { size: 16, anchor: 'middle', fill: T.ink, weight: 600, ls: 0.18 }) + (chk > 0 ? A(chk, checkCircle(cx + lb.length * 6.2 + 4, cy - 98, 10), { dy: 0, scale: 0.3, origin: [cx + lb.length * 6.2 + 4, cy - 98] }) : ''), { dy: 30 });
  });
  const pm = ctx.p('maze', 0, 1.6, E.inOut);
  const mazeOut = ctx.p('person', 0, 0.4);
  if (pm > 0 && mazeOut < 1) g += `<g opacity="${1 - mazeOut}">${drawPath('M170 1040 C260 940 330 1000 380 960 S520 880 540 920 S640 1040 720 960 S860 820 880 900 S760 1000 700 1010', pm, `stroke="${T.line}" stroke-width="2" stroke-dasharray="7 7"`)}${pm > 0.4 ? `<rect x="505" y="880" width="22" height="22" fill="none" stroke="${T.line}" stroke-width="2"/>${xMark(516, 891, 6, T.line)}` : ''}${pm > 0.8 ? `<rect x="700" y="990" width="22" height="22" fill="none" stroke="${T.line}" stroke-width="2"/>${xMark(711, 1001, 6, T.line)}<rect x="740" y="990" width="22" height="22" fill="none" stroke="${T.line}" stroke-width="2"/>${xMark(751, 1001, 6, T.line)}` : ''}</g>`;
  const pp = ctx.p('person', 0, 0.6);
  const doorP = ctx.p('door', 0, 0.8);
  if (pp > 0) {
    let s = person(330, FLOOR - 78, { pose: 'stand', hair: 'long', scale: 0.8, t }, T);
    s += `<path d="M218 ${FLOOR - 184} H530" stroke="${T.line}" stroke-width="3" stroke-dasharray="14 10" opacity="${1 - doorP * 0.3}"/>`;
    if (doorP < 1) s += `<g opacity="${1 - doorP}">${desk(408, FLOOR - 168, 265, T, { h: 90 })}</g>`;
    g += A(pp, s, { dy: 20 });
  }
  if (doorP > 0) g += `<g transform="translate(0,${(1 - E.out(doorP)) * 360})">${door(475, FLOOR - 78 - 330, 130, 330, { fill: '#FFFFFF', line: T.name === 'dark' ? '#8C95AB' : T.line, open: 0 }, T)}</g>`;
  const pbd = ctx.p('badge', 0, 0.45, E.back);
  if (pbd > 0) {
    const up = ctx.p('links', 0, 0.9, E.inOut);
    const bx = 540, by = lerp(FLOOR - 230, 700, up);
    const lk = ctx.p('links', 0.5, 1.0, E.inOut);
    if (lk > 0) {
      g += drawPath(`M${bx} ${by - 36} V${pos[1][1] + 88}`, lk, `stroke="${RED}" stroke-width="3"`);
      g += drawPath(`M${bx - 30} ${by - 10} H${pos[0][0]} V${pos[0][1] + 88}`, lk, `stroke="${RED}" stroke-width="3"`);
      g += drawPath(`M${bx + 30} ${by - 10} H${pos[2][0]} V${pos[2][1] + 88}`, lk, `stroke="${RED}" stroke-width="3"`);
    }
    g += A(pbd, idBadge(bx, by, 1), { dy: 0, scale: 0.3, origin: [bx, by] });
    const sh = ctx.p('secure', 0, 0.4, E.back);
    if (sh > 0) g += A(sh, shield(bx + 58, by, 22, T), { dy: 0 });
    const al = ctx.p('account', 0, 0.5);
    if (al > 0 && d.accountLabel) g += A(al, mono(bx + 95, by + 6, d.accountLabel, { size: 13, fill: T.ink, weight: 600 }), { dx: -10, dy: 0 });
  }
  return g;
};

// 6) TELÉFONO: persona usando una interfaz en varios idiomas/versiones.
TEMPLATES.phone_ui = ctx => {
  const { T, data: d, t } = ctx;
  let g = '';
  const forms = d.forms || [{ chip: 'ES', title: 'Registro', fields: ['Nombre completo', 'Fecha de nacimiento', 'Hogar'], cta: 'Continuar' }];
  const li = Math.min(forms.length - 1, ctx.raw('lang', 0));
  const lt = ctx.setAt('lang');
  const swap = lt >= 0 ? E.out((t - lt) / 0.5) : 1;
  const x = 590, y = 440, w = 330, h = 510;
  const pph = ctx.p('phone', 0, 0.7);
  if (pph > 0) {
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="30" fill="${T.paper}" stroke="${T.line}" stroke-width="3.5"/><rect x="${x + w / 2 - 40}" y="${y + 14}" width="80" height="8" rx="4" fill="${T.line}"/>`;
    s += forms.map((fm, k) => { const cx = x + 40 + k * 64; const on = k === li; return `<rect x="${cx}" y="${y + 44}" width="54" height="30" rx="15" fill="${on ? T.ink : T.paper}" stroke="${T.line}" stroke-width="2"/>${mono(cx + 27, y + 64, fm.chip || '', { size: 12, anchor: 'middle', fill: on ? T.paper : T.ink, weight: 600, ls: 0.1 })}`; }).join('');
    const fm = forms[li];
    let body = sans(x + 34, y + 120, fm.title || '', { size: 30, fill: T.ink, weight: 600 }) + mono(x + 34, y + 146, fm.subtitle || '', { size: 10, fill: T.sub, ls: 0.12 });
    (fm.fields || []).forEach((fl, k) => { body += `<rect x="${x + 34}" y="${y + 172 + k * 66}" width="${w - 68}" height="44" rx="6" fill="${T.paper}" stroke="${T.line}" stroke-width="2"/>` + sans(x + 50, y + 200 + k * 66, fl, { size: 17, fill: T.sub, weight: 400 }); });
    body += `<rect x="${x + 34}" y="${y + h - 84}" width="${w - 68}" height="48" rx="24" fill="${T.ink}"/>` + sans(x + w / 2, y + h - 53, fm.cta || 'Continuar', { size: 19, anchor: 'middle', fill: T.paper, weight: 600 });
    s += `<g opacity="${swap}" transform="translate(${(1 - swap) * 16},0)">${body}</g>`;
    g += A(pph, s, { dy: 40 });
  }
  const pai = ctx.p('ai', 0, 0.8, E.inOut);
  if (pai > 0) {
    g += `<g opacity="${clamp(pai * 2)}"><rect x="200" y="360" width="${lerp(0, 740, pai)}" height="36" fill="${T.ink}"/>${pai > 0.5 ? mono(222, 384, d.aiLabel || 'capa de traducción con IA', { size: 13, fill: T.paper, weight: 600 }) + mono(918, 384, forms.map(f => f.chip).join(' ⇄ '), { size: 12, anchor: 'end', fill: T.paper }) : ''}<rect x="${lerp(200, 700, 1)}" y="360" width="${lerp(0, 120, pai)}" height="36" fill="${RED}" opacity=".95"/>
      ${[-12, 0, 12].map(dx => drawPath(`M${x + w / 2 + dx} 396 V${y}`, pai, `stroke="${RED}" stroke-width="2"`)).join('')}</g>`;
  }
  const pc = ctx.p('character', 0, 0.8);
  if (pc > 0) g += A(pc, `<g clip-path="url(#clipc)"><defs><clipPath id="clipc"><rect x="0" y="0" width="${W}" height="${FLOOR + 40}"/></clipPath></defs>${person(310, FLOOR + 330, { pose: 'stand', hair: d.hair || 'long', scale: 2.3, top: 'light', t: 0 }, T)}</g>`, { dx: -40, dy: 0 });
  return g;
};
TEMPLATES.phone_ui.floor = false;

// 7) CIFRAS: números grandes en la zona del titular + paneles de resultado conectados.
TEMPLATES.stats = ctx => {
  const { T, data: d, t } = ctx;
  let g = '';
  const stats = d.stats || [];
  stats.forEach((s, i) => {
    const p = ctx.p('s' + i, 0, 0.7);
    if (p <= 0) return;
    const x = 108 + i * 290;
    const num = parseFloat(String(s.value).replace(/[^0-9.\-]/g, ''));
    let shown = s.value;
    if (!isNaN(num) && d.countUp !== false) {
      const k = E.out(ctx.since('s' + i) / 1.0);
      const pre = String(s.value).match(/^[^0-9\-]*/)[0], suf = String(s.value).match(/[^0-9.]*$/)[0];
      const dec = (String(num).split('.')[1] || '').length;
      shown = pre + (num * k).toFixed(dec) + suf;
    }
    g += A(p, sans(x, 250, shown, { size: 92, weight: 400, fill: T.ink, ls: -3 }) + mono(x + 2, 292, s.label || '', { size: 13, fill: T.sub }), { dy: 30 });
  });
  const P = d.panels || [];
  if (P.length) {
    const C = cols(P.length, 100, 980, 12), top = 560;
    C.forEach((c, i) => {
      const p = ctx.p('panels', i * 0.15, 0.7);
      if (p <= 0) return;
      const pi = P[i];
      let s = `<rect x="${c.x}" y="${top}" width="${c.w}" height="${FLOOR - 140 - top}" fill="${T.paper}" stroke="${T.line}" stroke-width="3"/><rect x="${c.x}" y="${top}" width="${c.w}" height="38" fill="${T.name === 'dark' ? '#fff' : T.ink}"/>`;
      s += mono(c.x + 12, top + 25, pi.title || '', { size: 12, fill: T.name === 'dark' ? T.bg : '#fff', weight: 600, ls: 0.12 });
      if (pi.chip) s += `<rect x="${c.x + c.w - 50}" y="${top + 52}" width="38" height="24" rx="12" fill="none" stroke="${T.line}" stroke-width="1.5"/>` + mono(c.x + c.w - 31, top + 69, pi.chip, { size: 10, anchor: 'middle', fill: T.ink, ls: 0.05 });
      s += icon(pi.icon || 'check', c.cx - 50, top + 110, 100, T.ink, 1.3);
      if (pi.text) s += sansBlock(c.x + 20, top + 270, pi.text, { size: 21, weight: 500, fill: T.ink, maxW: c.w - 40 });
      g += A(p, s, { dy: 40 });
    });
    const pb = ctx.p('bus', 0, 1.0, E.inOut);
    if (pb > 0) {
      const y = FLOOR - 95;
      g += drawPath(`M${C[0].cx} ${FLOOR - 140} V${y} H${C[C.length - 1].cx} V${FLOOR - 140}`, pb, `stroke="${RED}" stroke-width="3"`);
      if (C.length % 2 === 1) g += drawPath(`M540 ${FLOOR - 140} V${y}`, pb, `stroke="${RED}" stroke-width="3"`);
      g += A(pb, idBadge(540, y, 0.5), { dy: 0 });
    }
  }
  return g;
};

// 8) RED / PATRÓN: actores arriba → una puerta → resultados abajo.
TEMPLATES.network = ctx => {
  const { T, data: d, t } = ctx;
  let g = '';
  const actors = d.actors || [];
  const ax = actors.length === 2 ? [360, 720] : [300, 540, 780].slice(0, actors.length);
  const pa = ctx.p('actors', 0, 0.7);
  actors.forEach((a, i) => {
    const hair = ['short', 'long', 'bun', 'curly'][i % 4];
    const pi = ctx.p('actors', i * 0.12, 0.6);
    g += A(pi, `<g clip-path="url(#ca${i})"><defs><clipPath id="ca${i}"><rect x="${ax[i] - 70}" y="300" width="140" height="170"/></clipPath></defs>${person(ax[i], 600, { hair, scale: 0.9, glasses: i === 2, top: i === 1 ? 'dark' : 'light' }, T)}</g>` + mono(ax[i], 495, a, { size: 13, anchor: 'middle', fill: T.ink, weight: 600 }), { dy: 20 });
  });
  const l1 = ctx.p('links', 0, 0.9, E.inOut);
  if (l1 > 0) {
    g += ax.map(x => drawPath(`M${x} 510 V545 H540 V600`, l1, `stroke="${RED}" stroke-width="3"`)).join('');
  }
  const pd = ctx.p('door', 0, 0.6);
  if (pd > 0) g += A(pd, door(482, 600, 116, 190, { fill: '#FFFFFF', line: T.name === 'dark' ? '#8C95AB' : T.line }, T) + mono(540, 830, d.doorLabel || '', { size: 13, anchor: 'middle', fill: T.ink, weight: 600 }), { scale: 0.85, origin: [540, 700], dy: 0 });
  const outs = d.outcomes || [];
  const ox = outs.length === 2 ? [380, 700] : [290, 540, 790].slice(0, outs.length);
  const l2 = ctx.p('outcomes', 0, 0.9, E.inOut);
  if (l2 > 0) {
    g += ox.map(x => drawPath(`M540 850 V880 H${x} V935`, l2, `stroke="${RED}" stroke-width="3"`)).join('');
    outs.forEach((o, i) => { g += A(ctx.p('outcomes', 0.4 + i * 0.12, 0.6), isoTile(ox[i], 990, 72, T) + mono(ox[i], 1100, o, { size: 12, anchor: 'middle', fill: T.ink, weight: 600 }), { dy: 20 }); });
  }
  const pr = ctx.p('ruler', 0, 1.0, E.inOut);
  if (pr > 0) g += `<g opacity="${pr}"><path d="M985 ${lerp(1110, 470, pr)} V1110 M975 470 H995 M975 1110 H995" stroke="${T.line}" stroke-width="1.5"/>${d.rulerLabel ? mono(1010, 790, d.rulerLabel, { size: 11, fill: T.sub, anchor: 'middle', extra: 'transform="rotate(90 1010 790)"' }) : ''}</g>`;
  return g;
};
TEMPLATES.network.floor = false;

// 9) DECLARACIÓN centrada (cita, idea fuerza, llamado a la acción).
TEMPLATES.statement = ctx => {
  const { T, data: d, t } = ctx;
  const lines = (d.lines || [d.text || '']).flatMap(l => wrap(l, 820, d.size || 58, 0.5));
  const size = d.size || 58;
  const y0 = (d.y || 600) - (lines.length - 1) * size * 0.6;
  return lines.map((l, i) => A(E.out((t - 0.15 - i * 0.18) / 0.6), sans(540, y0 + i * size * 1.2, l, { size, anchor: 'middle', weight: 600, fill: T.ink }), { dy: 24 })).join('') +
    (d.sub ? A(E.out((t - 0.7) / 0.6), sans(540, y0 + lines.length * size * 1.2 + 20, d.sub, { size: 28, anchor: 'middle', weight: 400, fill: T.sub })) : '');
};
TEMPLATES.statement.floor = false;

// 10) CIERRE DE MARCA: wordmark + acento rojo + tagline tecleada + URL.
TEMPLATES.logo_end = ctx => {
  const { T, data: d, t } = ctx;
  const brand = d.brand || 'marca';
  let g = '';
  const pl = E.out((t - 0.1) / 0.8);
  const size = d.size || 150;
  g += A(pl, `<text x="540" y="600" font-family="Inter" font-weight="700" font-size="${size}" letter-spacing="${-size * 0.04}" fill="${T.ink}" text-anchor="middle">${esc(brand)}</text>`, { scale: 0.92, origin: [540, 560], dy: 0 });
  const sw = E.inOut((t - 0.5) / 0.7);
  if (sw > 0 && d.swoosh) g += drawPath('M600 610 C640 560 670 500 705 440', sw, `stroke="${RED}" stroke-width="16" stroke-linecap="round"`) + (sw > 0.95 ? `<path d="M690 432 L722 418 L716 452 Z" fill="${RED}"/>` : '');
  const tag = d.tagline || '';
  const n = Math.floor(clamp((t - 1.0) / 1.2) * tag.length);
  if (n > 0) g += sans(540, 690, tag.slice(0, n), { size: 34, anchor: 'middle', weight: 400, fill: T.ink });
  const pu = E.out((t - 2.3) / 0.6);
  if (pu > 0) g += `<g opacity="${pu}"><rect x="${540 - 20 * pu}" y="722" width="${40 * pu}" height="3" fill="${RED}"/>${mono(540, 762, d.url || '', { size: 14, anchor: 'middle', fill: T.sub })}</g>`;
  return g;
};
TEMPLATES.logo_end.floor = false;

// ---------- plantillas genéricas para cualquier contenido ----------

// 11) TARJETAS: 2-4 ideas con ícono, título y texto corto.
TEMPLATES.cards = ctx => {
  const { T, data: d } = ctx;
  const items = d.items || [];
  const n = items.length, two = n === 4;
  let g = '';
  items.forEach((it, i) => {
    const p = ctx.p(`i${i}`, 0, 0.6) || ctx.p('items', i * 0.2, 0.6);
    if (p <= 0) return;
    let x, y, w, h;
    if (two) { w = 426; h = 360; x = 108 + (i % 2) * (w + 12); y = 400 + Math.floor(i / 2) * (h + 12); }
    else { w = 864; h = Math.min(220, (720 - (n - 1) * 14) / n); x = 108; y = 400 + i * (h + 14); }
    const hl = ctx.raw('focus', -1) === i;
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${T.paper}" stroke="${hl ? RED : T.line}" stroke-width="${hl ? 4 : 2.5}"/>`;
    s += mono(x + 22, y + 34, String(i + 1).padStart(2, '0') + (it.kicker ? ' — ' + it.kicker : ''), { size: 12, fill: hl ? RED : T.sub });
    if (two) {
      s += icon(it.icon || 'idea', x + 24, y + 62, 72, T.ink, 1.4);
      s += sansBlock(x + 24, y + 196, it.title || '', { size: 32, weight: 600, fill: T.ink, maxW: w - 48, lh: 1.15 });
      s += sansBlock(x + 24, y + 196 + 44 * Math.max(1, wrap(it.title, w - 48, 32).length), it.text || '', { size: 20, weight: 400, fill: T.sub, maxW: w - 48 });
    } else {
      s += icon(it.icon || 'idea', x + 24, y + h / 2 - 26, 60, T.ink, 1.4);
      s += sansBlock(x + 116, y + h / 2 - (it.text ? 8 : -12), it.title || '', { size: 32, weight: 600, fill: T.ink, maxW: w - 150 });
      if (it.text) s += sansBlock(x + 116, y + h / 2 + 30, it.text, { size: 21, weight: 400, fill: T.sub, maxW: w - 150 });
    }
    g += A(p, s, { dy: 30 });
  });
  return g;
};
TEMPLATES.cards.floor = false;

// 12) PROCESO: pasos verticales numerados; "set.active" resalta el paso actual en rojo.
TEMPLATES.process = ctx => {
  const { T, data: d } = ctx;
  const steps = d.steps || [];
  const n = steps.length, top = 400, gap = Math.min(170, 700 / Math.max(1, n));
  const active = ctx.raw('active', -1);
  let g = '';
  const pl = ctx.p('line', 0, 1.2, E.inOut) || ctx.p('s0', 0, 1.2, E.inOut);
  if (pl > 0 && n > 1) g += `<path d="M150 ${top + 30} V${lerp(top + 30, top + 30 + gap * (n - 1), pl)}" stroke="${T.line}" stroke-width="2" stroke-dasharray="6 6"/>`;
  steps.forEach((s, i) => {
    const p = ctx.p('s' + i, 0, 0.6) || ctx.p('steps', i * 0.25, 0.6);
    if (p <= 0) return;
    const y = top + i * gap, on = i === active, done = active > i;
    let e = `<circle cx="150" cy="${y + 30}" r="30" fill="${on ? RED : done ? T.ink : T.paper}" stroke="${on ? RED : T.line}" stroke-width="2.5"/>`;
    e += done ? `<path d="M137 ${y + 30} L146 ${y + 40} L164 ${y + 20}" stroke="${T.paper}" stroke-width="4" fill="none" stroke-linecap="round"/>` : mono(150, y + 36, String(i + 1), { size: 18, anchor: 'middle', fill: on ? '#fff' : T.ink, weight: 600, ls: 0 });
    e += sans(210, y + 30, s.title || s, { size: 36, weight: 600, fill: T.ink });
    if (s.text) e += sansBlock(210, y + 68, s.text, { size: 21, weight: 400, fill: T.sub, maxW: 740 });
    if (s.icon) e += icon(s.icon, 912, y + 4, 52, on ? RED : T.ink, 1.5);
    g += A(p, e, { dx: -24, dy: 0 });
  });
  return g;
};
TEMPLATES.process.floor = false;

// 13) ANTES / DESPUÉS
TEMPLATES.before_after = ctx => {
  const { T, data: d } = ctx;
  let g = '';
  const col = (x, title, items, layer, red) => {
    const p = ctx.p(layer, 0, 0.6);
    if (p <= 0) return '';
    let s = `<rect x="${x}" y="400" width="420" height="700" fill="${T.paper}" stroke="${red ? RED : T.line}" stroke-width="${red ? 3.5 : 2.5}"/><rect x="${x}" y="400" width="420" height="56" fill="${red ? RED : (T.name === 'dark' ? '#fff' : T.ink)}"/>`;
    s += mono(x + 22, 437, title, { size: 17, fill: red ? '#fff' : (T.name === 'dark' ? T.bg : '#fff'), weight: 600 });
    items.forEach((it, i) => {
      const ip = ctx.p(layer, 0.3 + i * 0.2, 0.5);
      const y = 510 + i * 118;
      s += A(ip, (red ? checkCircle(x + 42, y + 12, 14) : xMark(x + 42, y + 12, 10, T.sub)) + sansBlock(x + 76, y + 20, it, { size: 23, weight: 500, fill: T.ink, maxW: 320 }), { dy: 10 });
    });
    return A(p, s, { dy: 30 });
  };
  g += col(108, d.beforeTitle || 'Antes', d.before || [], 'before', false);
  g += col(552, d.afterTitle || 'Después', d.after || [], 'after', true);
  return g;
};
TEMPLATES.before_after.floor = false;

// 14) BARRAS: comparación simple de magnitudes; "highlight" en rojo.
TEMPLATES.bars = ctx => {
  const { T, data: d } = ctx;
  const bars = d.bars || [];
  const max = Math.max(...bars.map(b => b.value), 1);
  const n = bars.length, gap = n > 4 ? 30 : 70, bw = Math.min(190, (840 - (n - 1) * gap) / n), x0 = 540 - (n * bw + (n - 1) * gap) / 2, base = 1040, hmax = 540;
  let g = `<path d="M110 ${base} H970" stroke="${T.line}" stroke-width="2"/>`;
  bars.forEach((b, i) => {
    const p = ctx.p('bars', i * 0.15, 1.0, E.inOut);
    const x = x0 + i * (bw + gap), h = hmax * b.value / max * p;
    const red = b.highlight || d.highlight === i;
    g += `<rect x="${x}" y="${base - h}" width="${bw}" height="${h}" fill="${red ? RED : T.paper}" stroke="${red ? RED : T.line}" stroke-width="2.5"/>`;
    if (p > 0.6) g += sans(x + bw / 2, base - h - 18, b.display ?? b.value, { size: 34, anchor: 'middle', weight: 600, fill: red ? RED : T.ink });
    wrap(String(b.label || '').toUpperCase(), bw + gap - 10, 13, 0.75).forEach((ln, k) => { g += mono(x + bw / 2, base + 36 + k * 20, ln, { size: 13, anchor: 'middle', fill: T.sub, ls: 0.16 }); });
  });
  return g;
};
TEMPLATES.bars.floor = false;

// 15) CITA
TEMPLATES.quote = ctx => {
  const { T, data: d, t } = ctx;
  const lines = wrap(d.text || '', 800, 48, 0.5);
  let g = A(E.out(t / 0.5), `<text x="108" y="520" font-family="Inter" font-weight="700" font-size="200" fill="${RED}">“</text>`, { dy: 20 });
  g += lines.map((l, i) => A(E.out((t - 0.2 - i * 0.12) / 0.6), sans(108, 600 + i * 62, l, { size: 48, weight: 500, fill: T.ink }))).join('');
  if (d.author) g += A(E.out((t - 0.8) / 0.6), mono(108, 640 + lines.length * 62, '— ' + d.author, { size: 16, fill: T.sub }));
  return g;
};
TEMPLATES.quote.floor = false;

// 16) PERSONA + IDEAS: un personaje y globos/íconos que aparecen a su alrededor.
TEMPLATES.persona = ctx => {
  const { T, data: d, t } = ctx;
  let g = '';
  const pp = ctx.p('person', 0, 0.7);
  g += A(pp, person(300, FLOOR - 4, { pose: d.pose || 'stand', hair: d.hair || 'long', scale: 1.5, top: d.top || 'light', t }, T), { dx: -30, dy: 0 });
  (d.items || []).forEach((it, i) => {
    const p = ctx.p('i' + i, 0, 0.5, E.back) || ctx.p('items', i * 0.3, 0.5, E.back);
    if (p <= 0) return;
    const y = 470 + i * 150, x = 500;
    const red = it.red;
    g += A(p, `<rect x="${x}" y="${y}" width="470" height="118" rx="8" fill="${T.paper}" stroke="${red ? RED : T.line}" stroke-width="2.5"/>${icon(it.icon || 'chat', x + 24, y + 31, 56, red ? RED : T.ink, 1.5)}${sansBlock(x + 104, y + (it.text ? 50 : 68), it.title || '', { size: 26, weight: 600, fill: T.ink, maxW: 340 })}${it.text ? sansBlock(x + 104, y + 84, it.text, { size: 19, weight: 400, fill: T.sub, maxW: 340 }) : ''}`, { scale: 0.85, origin: [x, y + 59], dy: 0 });
  });
  return g;
};

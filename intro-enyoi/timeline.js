// Línea de tiempo única (40 s). Se controla cuadro a cuadro con window.seek(t).
// La narración (voz/escena1-5.mp3) entra en: 0,15 · 6,35 · 14,75 · 20,30 · 33,00 s (ver mezcla.sh).
const tl = gsap.timeline({ paused: true });
const counters = []; // [{el, obj, fmt}] — se actualizan tras cada seek (determinista)

// ---------- Protagonista: Laura ----------
const laura = mountLaura(document.getElementById('laura'));
function setPose(t, pose, first = false) {
  const { on, off } = laura.poseTargets(pose);
  if (first) { tl.set(off, { opacity: 0 }, t); tl.set(on, { opacity: 1 }, t); return; }
  tl.to(off, { opacity: 0, duration: 0.16, ease: 'power1.out' }, t);
  tl.to(on, { opacity: 1, duration: 0.16, ease: 'power1.out' }, t);
  tl.to('#la-body', { y: -7, duration: 0.14, yoyo: true, repeat: 1, ease: 'power1.out' }, t);
}
const POSE = {
  typing:  { arm: ['arm-type-l', 'arm-type-r'], eyes: 'eyes-open', brows: 'brows-neutral', mouth: 'mouth-neutral' },
  overwhelmed: { arm: ['arm-head-l', 'arm-head-r'], eyes: 'eyes-open', brows: 'brows-worried', mouth: 'mouth-o' },
  tired:   { arm: ['arm-type-l', 'arm-chin-r'], eyes: 'eyes-tired', brows: 'brows-worried', mouth: 'mouth-flat' },
  thinking:{ arm: ['arm-type-l', 'arm-chin-r'], eyes: 'eyes-up', brows: 'brows-up', mouth: 'mouth-hmm' },
  happy:   { arm: ['arm-type-l', 'arm-point-r'], eyes: 'eyes-open', brows: 'brows-neutral', mouth: 'mouth-smile' },
  proud:   { arm: ['arm-type-l', 'arm-point-r'], eyes: 'eyes-happy', brows: 'brows-up', mouth: 'mouth-smile' },
  waving:  { arm: ['arm-type-l', 'arm-wave-r'], eyes: 'eyes-happy', brows: 'brows-up', mouth: 'mouth-smile' },
};
tl.fromTo('#laura', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0);
setPose(0, POSE.typing, true);
tl.to('#la-body', { scaleY: 1.012, transformOrigin: '50% 100%', duration: 1.6, yoyo: true, repeat: 23, ease: 'sine.inOut' }, 0);
for (const t of [1.6, 21.6, 24.6, 27.8]) // parpadeos (solo con ojos abiertos)
  tl.to('#la-eyes', { scaleY: 0.1, transformOrigin: '50% 50%', duration: 0.07, yoyo: true, repeat: 1 }, t);

// ---------- Línea del flujo (escena 4) oculta hasta que se dibuja ----------
const SX = [800, 1100, 1400, 1700];
const flowLen = SX[3] - SX[0];
gsap.set('#s4-path', { strokeDasharray: flowLen, strokeDashoffset: flowLen });

// ---------- Sobres (escenas 1, 2 y 4) ----------
const ENV_SVG = '<svg viewBox="0 0 140 98"><rect x="4" y="4" width="132" height="90" rx="10"/><path d="M8 10 L70 56 L132 10"/><path d="M8 88 L54 46 M132 88 L86 46"/></svg>';
// [x, y, rotación, área, color del remitente]  (x, y = esquina superior izquierda del sobre)
const CHAOS = [
  [700, 110, -12, 'Finanzas', '#FF0A6C'], [960, 70, 8, 'Comercial', '#8B2FC9'], [1230, 130, -5, 'Operaciones', '#C58BFF'],
  [1500, 80, 14, 'Compras', '#FF6FA8'], [1730, 190, -9, 'TI', '#6B4FD8'], [1690, 700, 10, 'Talento Humano', '#B15CE0'],
  [1080, 790, -14, 'Calidad', '#FF3D8B'], [90, 840, 6, 'Finanzas', '#FF0A6C'], [430, 870, -10, 'Comercial', '#8B2FC9'],
];
const envBox = document.getElementById('envs');
const envs = CHAOS.map(([x, y, r, a, c]) => {
  const d = document.createElement('div');
  d.className = 'env';
  d.innerHTML = ENV_SVG + `<div class="lbl"><span class="av" style="background:${c}"></span>${a}</div>`;
  envBox.appendChild(d);
  gsap.set(d, { x, y, rotation: r, transformOrigin: '70px 49px' });
  return d;
});
const labels = envs.map(e => e.querySelector('.lbl'));

// ---------- ESCENA 1 · El caos (0–6 s) ----------
envs.forEach((e, i) => {
  tl.fromTo(e, { opacity: 0, y: `-=70`, scale: 0.85 },
    { opacity: 1, y: `+=70`, scale: 1, duration: 0.55, ease: 'power3.out' }, 0.2 + i * 0.27);
});
envs.forEach((e, i) => { // leve deriva continua (desorden "vivo")
  tl.to(e, { rotation: `+=${i % 2 ? 4 : -4}`, x: `+=${(i % 3 - 1) * 10}`, duration: 5.2, ease: 'sine.inOut' }, 0.8);
});
setPose(2.6, POSE.overwhelmed);
tl.fromTo('#s1-time', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 2.0);
tl.fromTo('#s1-sub', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 3.5);

// ---------- ESCENA 2 · El costo (6–14 s) ----------
tl.to(['#s1-time', '#s1-sub'], { opacity: 0, y: -16, duration: 0.5, ease: 'power2.in' }, 6.0);
tl.to(envs, { opacity: 0.11, duration: 0.7, ease: 'power2.out' }, 6.0);
setPose(6.2, POSE.tired);
tl.fromTo('#la-clock', { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' }, 6.6);
tl.fromTo('#la-clock-m', { rotation: 0, svgOrigin: '0 0' }, { rotation: 1440, svgOrigin: '0 0', duration: 6.8, ease: 'none' }, 6.6);
tl.to('#la-clock', { opacity: 0, duration: 0.4, ease: 'power2.in' }, 13.5);

const COST = [['Revisar correos', 90], ['Resumir', 60], ['Organizar compromisos', 45], ['Redactar reporte', 60]];
const blkBox = document.getElementById('s2-blocks');
const BX = [680, 991, 1302, 1613]; // left de cada bloque (255 px de ancho, 56 px de separación)
COST.forEach(([title, min], i) => {
  const b = document.createElement('div');
  b.className = 'blk';
  b.style.left = BX[i] + 'px';
  b.innerHTML = `<div class="t">${title}</div><div class="n">0 min</div>`;
  blkBox.appendChild(b);
  const at = 6.6 + i * 0.8;
  tl.fromTo(b, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, at);
  const obj = { v: 0 };
  counters.push({ el: b.querySelector('.n'), obj, fmt: v => `${Math.round(v)} min` });
  tl.to(obj, { v: min, duration: 0.8, ease: 'power2.out' }, at + 0.15);
  if (i > 0) {
    const p = document.createElement('div');
    p.className = 'plus';
    p.textContent = '+';
    p.style.left = (BX[i] - 53) + 'px';
    blkBox.appendChild(p);
    tl.fromTo(p, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' }, at);
  }
});
const total = { v: 0 };
counters.push({ el: document.getElementById('s2-total'), obj: total,
  fmt: v => { const m = Math.round(v); return `${Math.floor(m / 60)} h ${m % 60} min`; } });
tl.fromTo('#s2-total', { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }, 10.0);
tl.to(total, { v: 255, duration: 2.0, ease: 'power2.out' }, 10.0);
tl.fromTo('#s2-week', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 12.4);
tl.to(['#s2-blocks', '#s2-total', '#s2-week'], { opacity: 0, duration: 0.45, ease: 'power2.in' }, 13.55);
tl.to(envs, { opacity: 0, duration: 0.45, ease: 'power2.in' }, 13.55);

// ---------- ESCENA 3 · La pregunta (14–20 s) ----------
function words(sel, text) {
  const el = document.querySelector(sel);
  el.innerHTML = text.split(' ').map(w => `<span class="w">${w}</span>`).join(' ');
  return el.querySelectorAll('.w');
}
const q1 = words('#s3-l1', '¿Y si la IA hiciera el borrador…');
const q2 = words('#s3-l2', '…y tú pusieras el criterio?');
setPose(14.2, POSE.thinking);
tl.fromTo(q1, { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.2 }, 14.6);
tl.fromTo(q2, { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.2 }, 17.0);
tl.fromTo('#la-spark', { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' }, 17.0);
tl.to('#la-spark', { rotation: 90, transformOrigin: '50% 50%', duration: 2.4, ease: 'sine.inOut' }, 17.4);
tl.to(['#s3-l1', '#s3-l2', '#la-spark'], { opacity: 0, duration: 0.45, ease: 'power2.in' }, 19.55);

// ---------- ESCENA 4 · El orden (20–32 s) ----------
setPose(20.2, POSE.happy);
envs.forEach((e, i) => { // regresan desordenados (más girados que en la escena 1)
  tl.fromTo(e, { opacity: 0, scale: 0.9, rotation: CHAOS[i][2] * 1.8 },
    { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }, 20.0 + i * 0.05);
});
tl.to(labels, { opacity: 0, duration: 0.4, ease: 'power2.out' }, 20.7);
envs.forEach((e, i) => { // del caos al orden: cuadrícula 3×3 centrada en (1250, 300)
  const c = i % 3, r = Math.floor(i / 3);
  tl.to(e, { x: 1250 + (c - 1) * 160 - 70, y: 300 + (r - 1) * 115 - 49, rotation: 0, scale: 0.8,
    duration: 1.5, ease: 'power3.inOut' }, 21.0 + i * 0.07);
});
// flujo de 4 pasos: la línea se dibuja de izquierda a derecha y cada paso aparece
// cuando la voz lo nombra (capturas 22,7 · resumes 24,9 · organizas 27,1 · Agent Mode 29,3)
const STEPS = [['Capturar', 'Outlook y Teams'], ['Resumir', 'Copilot Chat'], ['Organizar', 'Tabla y Planner'], ['Reportar', 'Agent Mode en Word']];
const flow = document.getElementById('s4-flow');
const svg = document.getElementById('s4-line');
const LINE_T0 = 22.7, LINE_DUR = 6.6;
tl.to('#s4-path', { strokeDashoffset: 0, duration: LINE_DUR, ease: 'none' }, LINE_T0);
STEPS.forEach(([t, sub], i) => {
  const st = document.createElement('div');
  st.className = 'step';
  st.style.left = SX[i] + 'px';
  st.innerHTML = `<div class="dot">${i + 1}</div><div class="st">${t}</div><div class="ss">${sub}</div>`;
  flow.appendChild(st);
  const at = LINE_T0 + LINE_DUR * (SX[i] - SX[0]) / flowLen;
  tl.fromTo(st, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' }, Math.max(LINE_T0, at - 0.25));
  if (i > 0) { // punta de flecha justo antes de cada paso
    const ax = SX[i] - 66;
    const tri = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    tri.setAttribute('d', `M${ax - 12} 40 L${ax + 4} 52 L${ax - 12} 64`);
    tri.setAttribute('style', 'fill:none;stroke:#FF0A6C;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:none');
    tri.style.opacity = 0;
    svg.appendChild(tri);
    tl.to(tri, { opacity: 1, duration: 0.2, ease: 'power2.out' }, at - 0.3);
  }
});
// 29 s: la cuadrícula se convierte en el documento
tl.to(envs, { x: 1250 - 70, y: 300 - 49, scale: 0.35, opacity: 0, duration: 0.6, ease: 'power2.in', stagger: 0.03 }, 29.0);
tl.fromTo('#s4-doc', { opacity: 0, scale: 0.88 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' }, 29.3);
tl.fromTo('#s4-doc .doc-lines i', { scaleX: 0, transformOrigin: 'left center' },
  { scaleX: 1, duration: 0.5, ease: 'power2.out', stagger: 0.1 }, 29.7);
tl.fromTo('#s4-doc .doc-checks span', { scale: 0 }, { scale: 1, duration: 0.35, ease: 'power2.out', stagger: 0.1 }, 30.2);
setPose(29.5, POSE.proud);
tl.to(['#s4-doc', '#s4-flow'], { opacity: 0, duration: 0.45, ease: 'power2.in' }, 31.55);

// ---------- ESCENA 5 · Título y cierre (32–40 s) ----------
setPose(32.2, POSE.waving);
tl.fromTo('#la-wave-hand', { rotation: -14, svgOrigin: '402 220' }, { rotation: 14, svgOrigin: '402 220', duration: 0.32, ease: 'sine.inOut', yoyo: true, repeat: 7 }, 32.4);
tl.fromTo('#s5-logo', { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.9, ease: 'power2.out' }, 32.2);
tl.fromTo('#s5-title', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 32.9);
tl.fromTo('#s5-sub', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 33.5);
tl.fromTo('#s5-rule', { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: 0.6, ease: 'power2.out' }, 34.1);
tl.fromTo('#s5-fac', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 34.4);
tl.fromTo('#s5-tag', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 34.9);
// 38,0–39,5 s: todo quieto (la respiración de Laura se detiene en 38,4 s) · 39,5–40,0 s: fundido final
tl.to('#stage', { opacity: 0, duration: 0.5, ease: 'power1.in' }, 39.5);

// ---------- Fin de la línea de tiempo: 40 s exactos ----------
tl.set({}, {}, 40);

function renderCounters() {
  for (const c of counters) c.el.textContent = c.fmt(c.obj.v);
}
window.TL_DURATION = 40;
window.seek = t => { tl.seek(t, true); renderCounters(); };
window.__ready = document.fonts.ready.then(() => { window.seek(0); return true; });

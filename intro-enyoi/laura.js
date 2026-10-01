// Personaje "Laura" (SVG plano, colores Enyoi). Las poses, ojos, cejas y bocas son capas
// con data-k; la línea de tiempo las alterna con setPose(...) en momentos fijos.
const SKIN = '#C98B6B', SKIN_D = '#B37656', HAIR = '#2A1A14', BLAZER = '#8B2FC9', INNER = '#D3A6FF',
  INK = '#1B1420', DESK = '#262230', DESK_T = '#363042', LAPTOP = '#DAD5E3';

const arm = (d, k) => `<g data-k="${k}" class="var"><path d="${d}" fill="none" stroke="${BLAZER}" stroke-width="36" stroke-linecap="round" stroke-linejoin="round"/></g>`;
const hand = (x, y, k, r = 21) => `<circle data-k="${k}" class="var" cx="${x}" cy="${y}" r="${r}" fill="${SKIN}"/>`;

const LAURA_SVG = `
<svg viewBox="0 0 460 600" width="600" height="782" overflow="visible">
  <g id="la-body">
    <!-- cabello (atrás) -->
    <path d="M150 190 Q140 95 230 88 Q322 95 312 190 Q330 300 318 372 Q290 392 230 384 Q170 392 142 372 Q130 300 150 190Z" fill="${HAIR}"/>
    <!-- cuello y torso -->
    <rect x="208" y="248" width="44" height="62" rx="16" fill="${SKIN_D}"/>
    <path d="M108 600 L108 392 Q108 316 180 304 L280 304 Q352 316 352 392 L352 600Z" fill="${BLAZER}"/>
    <path d="M196 304 L264 304 L230 392Z" fill="${INNER}"/>
    <path d="M180 304 L230 400 L206 420 L168 318Z M280 304 L230 400 L254 420 L292 318Z" fill="#7424AD"/>
    <!-- cabeza -->
    <g id="la-head">
      <ellipse cx="160" cy="200" rx="12" ry="18" fill="${SKIN_D}"/><ellipse cx="300" cy="200" rx="12" ry="18" fill="${SKIN_D}"/>
      <ellipse cx="230" cy="190" rx="70" ry="82" fill="${SKIN}"/>
      <path d="M158 178 Q160 104 230 102 Q302 104 304 180 Q292 146 252 132 Q238 158 186 160 Q168 166 158 178Z" fill="${HAIR}"/>
      <path d="M158 170 Q146 250 160 330 Q150 260 166 200Z M302 170 Q316 250 300 330 Q312 260 294 200Z" fill="${HAIR}"/>
      <circle cx="190" cy="222" r="11" fill="#E0727F" opacity=".35"/><circle cx="270" cy="222" r="11" fill="#E0727F" opacity=".35"/>
      <!-- ojos -->
      <g data-k="eyes-open" class="var" id="la-eyes">
        <ellipse cx="205" cy="196" rx="7.5" ry="9.5" fill="${INK}"/><ellipse cx="255" cy="196" rx="7.5" ry="9.5" fill="${INK}"/>
        <circle cx="207.5" cy="193" r="2.4" fill="#fff"/><circle cx="257.5" cy="193" r="2.4" fill="#fff"/>
      </g>
      <g data-k="eyes-up" class="var">
        <ellipse cx="208" cy="191" rx="7.5" ry="9.5" fill="${INK}"/><ellipse cx="258" cy="191" rx="7.5" ry="9.5" fill="${INK}"/>
        <circle cx="210.5" cy="188" r="2.4" fill="#fff"/><circle cx="260.5" cy="188" r="2.4" fill="#fff"/>
      </g>
      <g data-k="eyes-tired" class="var" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round">
        <path d="M195 199 Q205 204 215 199"/><path d="M245 199 Q255 204 265 199"/>
      </g>
      <g data-k="eyes-happy" class="var" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round">
        <path d="M195 200 Q205 188 215 200"/><path d="M245 200 Q255 188 265 200"/>
      </g>
      <!-- cejas -->
      <g data-k="brows-neutral" class="var" fill="none" stroke="${HAIR}" stroke-width="5" stroke-linecap="round">
        <path d="M193 175 Q205 169 218 174"/><path d="M242 174 Q255 169 267 175"/></g>
      <g data-k="brows-worried" class="var" fill="none" stroke="${HAIR}" stroke-width="5" stroke-linecap="round">
        <path d="M193 178 Q206 176 218 166"/><path d="M242 166 Q254 176 267 178"/></g>
      <g data-k="brows-up" class="var" fill="none" stroke="${HAIR}" stroke-width="5" stroke-linecap="round">
        <path d="M193 170 Q205 162 218 167"/><path d="M242 164 Q255 156 267 163"/></g>
      <!-- bocas -->
      <path data-k="mouth-neutral" class="var" d="M218 236 Q230 242 242 236" fill="none" stroke="#8A3A44" stroke-width="5" stroke-linecap="round"/>
      <ellipse data-k="mouth-o" class="var" cx="230" cy="240" rx="9" ry="11" fill="#7A1E3A"/>
      <path data-k="mouth-flat" class="var" d="M218 240 Q230 236 242 240" fill="none" stroke="#8A3A44" stroke-width="5" stroke-linecap="round"/>
      <path data-k="mouth-smile" class="var" d="M210 230 Q230 258 250 230 Z" fill="#7A1E3A" stroke="#7A1E3A" stroke-width="3" stroke-linejoin="round"/>
      <path data-k="mouth-hmm" class="var" d="M220 238 Q232 234 243 231" fill="none" stroke="#8A3A44" stroke-width="5" stroke-linecap="round"/>
    </g>
    <!-- brazos (detrás del portátil) -->
    ${arm('M134 350 Q112 440 168 470', 'arm-type-l')}${arm('M326 350 Q348 440 292 470', 'arm-type-r')}
    ${arm('M132 350 Q80 270 150 166', 'arm-head-l')}${arm('M328 350 Q380 270 310 166', 'arm-head-r')}
    ${hand(152, 160, 'arm-head-l', 24)}${hand(308, 160, 'arm-head-r', 24)}
    ${arm('M328 352 Q352 450 286 280', 'arm-chin-r')}${hand(258, 268, 'arm-chin-r', 22)}
    ${arm('M326 350 Q400 360 452 318', 'arm-point-r')}
    <g data-k="arm-point-r" class="var"><circle cx="462" cy="312" r="21" fill="${SKIN}"/><rect x="470" y="302" width="38" height="13" rx="6.5" fill="${SKIN}" transform="rotate(-18 470 308)"/></g>
    <g data-k="arm-wave-r" class="var" id="la-wave">
      <path d="M326 350 Q390 330 400 230" fill="none" stroke="${BLAZER}" stroke-width="36" stroke-linecap="round"/>
      <g id="la-wave-hand"><circle cx="402" cy="196" r="23" fill="${SKIN}"/>
        <rect x="385" y="160" width="10" height="26" rx="5" fill="${SKIN}"/><rect x="398" y="155" width="10" height="28" rx="5" fill="${SKIN}"/><rect x="411" y="160" width="10" height="26" rx="5" fill="${SKIN}"/></g>
    </g>
  </g>
  <!-- escritorio y portátil -->
  <rect x="-30" y="470" width="520" height="160" rx="24" fill="${DESK}"/>
  <rect x="-14" y="470" width="488" height="10" rx="5" fill="${DESK_T}"/>
  <path d="M150 380 Q150 372 158 372 L302 372 Q310 372 310 380 L316 470 L144 470Z" fill="${LAPTOP}"/>
  <circle cx="230" cy="420" r="11" fill="#FF0A6C" opacity=".85"/>
  <rect x="120" y="466" width="220" height="10" rx="5" fill="#B9B3C4"/>
  <!-- chispa de idea (escena 3) -->
  <g id="la-spark" opacity="0" transform="translate(330 70)">
    <circle cx="0" cy="0" r="34" fill="#D3A6FF" opacity=".18"/>
    <path d="M0 -26 L6 -6 L26 0 L6 6 L0 26 L-6 6 L-26 0 L-6 -6Z" fill="#D3A6FF"/>
  </g>
  <!-- reloj (escena 2) -->
  <g id="la-clock" opacity="0" transform="translate(360 70)">
    <circle r="34" fill="#141218" stroke="#DAD5E3" stroke-width="5"/>
    <line id="la-clock-m" x1="0" y1="0" x2="0" y2="-24" stroke="#FF0A6C" stroke-width="5" stroke-linecap="round"/>
    <line x1="0" y1="0" x2="15" y2="0" stroke="#DAD5E3" stroke-width="5" stroke-linecap="round"/>
  </g>
</svg>`;

function mountLaura(el) {
  el.innerHTML = LAURA_SVG;
  const vars = [...el.querySelectorAll('.var')];
  const groups = {};
  for (const v of vars) {
    const k = v.dataset.k, g = k.split('-')[0] === 'arm' ? 'arm' : k.split('-')[0];
    (groups[g] = groups[g] || new Set()).add(k);
  }
  // pose = { arm: ['arm-type-l','arm-type-r'], eyes: 'eyes-open', brows: ..., mouth: ... }
  function poseTargets(pose) {
    const on = new Set([...(pose.arm || []), pose.eyes, pose.brows, pose.mouth].filter(Boolean));
    return { on: vars.filter(v => on.has(v.dataset.k)), off: vars.filter(v => !on.has(v.dataset.k)) };
  }
  return { poseTargets };
}

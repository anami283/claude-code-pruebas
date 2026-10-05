// Renderiza index.html a MP4 1920×1080 a 30 fps, o fotogramas fijos.
// Uso:
//   node render.mjs --out ../out/video_mudo.mp4 [--workers 4]
//   node render.mjs --stills 5:../out/stills/escena-1.png,13:../out/stills/escena-2.png
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = k => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : undefined; };
const W = 1920, H = 1080, FPS = 30, DUR = 40;

function chromiumPath() {
  for (const c of [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium']) {
    if (!c || !fs.existsSync(c)) continue;
    if (fs.statSync(c).isFile()) return c;
    for (const s of ['chrome-linux/chrome', 'chrome-linux64/chrome']) if (fs.existsSync(path.join(c, s))) return path.join(c, s);
  }
  const dirs = fs.existsSync('/opt/pw-browsers') ? fs.readdirSync('/opt/pw-browsers').filter(d => d.startsWith('chromium')) : [];
  for (const d of dirs) for (const s of ['chrome-linux/chrome', 'chrome-linux64/chrome']) {
    const p = path.join('/opt/pw-browsers', d, s); if (fs.existsSync(p)) return p;
  }
}

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', e => { console.error('Error en la página:', e.message); process.exit(1); });
  await page.goto('file://' + path.join(here, 'index.html'));
  await page.evaluate(() => window.__ready);
  await page.evaluate(() => Promise.all([...document.images].map(i => i.decode())));
  return page;
}
const shot = async (page, t, type = 'jpeg') => {
  await page.evaluate(tt => window.seek(tt), t);
  return page.screenshot({ type, quality: type === 'jpeg' ? 94 : undefined });
};

const browser = await chromium.launch({ executablePath: chromiumPath(), args: ['--disable-gpu', '--font-render-hinting=none'] });

if (arg('stills')) {
  const page = await openPage(browser);
  for (const item of arg('stills').split(',')) {
    const [t, out] = item.split(':');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, await shot(page, Number(t), 'png'));
    console.log(`still ${t}s → ${out}`);
  }
  await browser.close();
} else {
  const out = arg('out');
  const total = DUR * FPS, workers = Number(arg('workers') || 4), per = Math.ceil(total / workers);
  const tmp = path.join(path.dirname(out), '.seg'); fs.mkdirSync(tmp, { recursive: true });
  const t0 = Date.now(); let done = 0;
  const segs = await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const a = w * per, b = Math.min(total, a + per), seg = path.join(tmp, `seg${w}.mp4`);
    const page = await openPage(browser);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), seg], { stdio: ['pipe', 'inherit', 'inherit'] });
    const closed = new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg ' + c))));
    for (let i = a; i < b; i++) {
      const buf = await shot(page, i / FPS);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (++done % 150 === 0) process.stdout.write(`\r  ${done}/${total} cuadros (${((Date.now() - t0) / 1000) | 0}s)`);
    }
    ff.stdin.end(); await closed; await page.close();
    return seg;
  }));
  await browser.close();
  const list = path.join(tmp, 'list.txt');
  fs.writeFileSync(list, segs.map(s => `file '${path.resolve(s)}'`).join('\n'));
  await new Promise((res, rej) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', out], { stdio: 'inherit' })
    .on('close', c => c === 0 ? res() : rej(new Error('concat ' + c))));
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\nvideo: ${out} (${total} cuadros, ${((Date.now() - t0) / 1000) | 0}s)`);
}

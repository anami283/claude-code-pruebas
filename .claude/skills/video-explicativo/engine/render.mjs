// Renderiza timeline.json a MP4 (sin audio) o a imágenes fijas de control.
// Uso:
//   node render.mjs --timeline work/timeline.json --out work/video.mp4 [--workers 4] [--fps 30]
//   node render.mjs --timeline work/timeline.json --stills work/stills   (1 cuadro por beat)
//   node render.mjs --timeline work/timeline.json --at 12.5 --png frame.png
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));

const timeline = JSON.parse(fs.readFileSync(args.timeline, 'utf8'));
const fps = Number(args.fps || timeline.meta?.fps || 30);
const W = 1080, H = 1350;

function findChromium() {
  const cands = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'];
  for (const c of cands) {
    if (!c) continue;
    try {
      const st = fs.statSync(c);
      if (st.isFile()) return c;
      if (st.isDirectory()) {
        // /opt/pw-browsers/chromium puede ser un directorio con chrome-linux/chrome
        for (const sub of ['chrome-linux/chrome', 'chrome-linux64/chrome', 'chrome']) {
          const p = path.join(c, sub); if (fs.existsSync(p)) return p;
        }
      }
    } catch { }
  }
  return undefined; // playwright buscará su navegador instalado
}

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.addInitScript(tl => { window.__TIMELINE__ = tl; }, timeline);
  await page.goto('file://' + path.join(here, 'index.html'));
  await page.evaluate(() => window.__ready);
  await page.waitForTimeout(150);
  return page;
}

async function frameAt(page, t, type = 'jpeg') {
  await page.evaluate(tt => window.renderAt(tt), t);
  return page.screenshot({ type, quality: type === 'jpeg' ? 92 : undefined, clip: { x: 0, y: 0, width: W, height: H } });
}

function ffmpegWriter(out) {
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(fps), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg ' + c))));
  return { ff, done };
}

async function main() {
  const exe = findChromium();
  const browser = await chromium.launch({ executablePath: exe, args: ['--disable-gpu', '--font-render-hinting=none', '--disable-background-networking', '--disable-component-update', '--no-first-run'] });
  const dur = timeline.duration;

  if (args.png) {
    const page = await openPage(browser);
    fs.writeFileSync(args.png, await frameAt(page, Number(args.at || 0), 'png'));
    await browser.close(); return;
  }

  if (args.stills) {
    fs.mkdirSync(args.stills, { recursive: true });
    const page = await openPage(browser);
    let k = 0;
    for (const sc of timeline.scenes) {
      for (const b of sc.beats) {
        const t = Math.min(b.end - 0.05, b.start + Math.max(1.2, (b.end - b.start) * 0.85));
        fs.writeFileSync(path.join(args.stills, `${String(++k).padStart(3, '0')}.jpg`), await frameAt(page, t));
      }
    }
    await browser.close();
    console.log(`stills: ${k}`);
    return;
  }

  const total = Math.ceil(dur * fps);
  const workers = Math.max(1, Math.min(Number(args.workers || 4), 8));
  const per = Math.ceil(total / workers);
  const tmp = path.join(path.dirname(args.out), '.segments');
  fs.mkdirSync(tmp, { recursive: true });
  let doneFrames = 0; const t0 = Date.now();
  const jobs = Array.from({ length: workers }, async (_, w) => {
    const a = w * per, b = Math.min(total, a + per);
    if (a >= b) return null;
    const seg = path.join(tmp, `seg_${w}.mp4`);
    const page = await openPage(browser);
    const { ff, done } = ffmpegWriter(seg);
    for (let i = a; i < b; i++) {
      const buf = await frameAt(page, i / fps);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      doneFrames++;
      if (doneFrames % 150 === 0) process.stdout.write(`\r  ${doneFrames}/${total} cuadros (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
    ff.stdin.end(); await done; await page.close();
    return seg;
  });
  const segs = (await Promise.all(jobs)).filter(Boolean);
  await browser.close();
  const list = path.join(tmp, 'list.txt');
  fs.writeFileSync(list, segs.map(s => `file '${path.resolve(s)}'`).join('\n'));
  await new Promise((res, rej) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', args.out], { stdio: 'inherit' }).on('close', c => c === 0 ? res() : rej(new Error('concat ' + c))));
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\nvideo: ${args.out} (${total} cuadros, ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}

main().catch(e => { console.error(e); process.exit(1); });

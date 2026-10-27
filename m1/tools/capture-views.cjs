/* CRVRO M1 r2 — capture front / three-quarter / side views from a real
 * Chromium WebGL context, plus a side-by-side against the Blender poster.
 * Usage: node tools/capture-views.cjs   (server on 127.0.0.1:8727)
 */
const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(
  process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));

const URL = 'http://127.0.0.1:8727/index.html';
const OUT = path.join(__dirname, 'evidence', 'r2');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'],
    defaultViewport: { width: 1600, height: 1000, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
  await sleep(1200);
  const gl = await page.evaluate(() => {
    const r = window.__M1__.renderer.getContext();
    const ext = r.getExtension('WEBGL_debug_renderer_info');
    return ext ? r.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown';
  });

  const shots = {};
  for (const [file, view] of [['01-three-quarter.png', 'threeQuarter'], ['02-front.png', 'front'], ['03-side.png', 'side']]) {
    await page.evaluate((v) => window.__M1__.setView(v), view);
    await sleep(500);
    await page.screenshot({ path: path.join(OUT, file) });
    shots[view] = file;
  }

  // accessibility sanity: CTA is reachable by keyboard and is a real link
  await page.evaluate(() => window.__M1__.setView('threeQuarter'));
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const focus = await page.evaluate(() => {
    const a = document.activeElement;
    return { id: a.id, tag: a.tagName, href: a.getAttribute('href') };
  });
  // CTA hit-test: the element at the CTA's on-screen centre is the CTA itself
  const hit = await page.evaluate(() => {
    const r = document.getElementById('cta').getBoundingClientRect();
    const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return !!el && !!el.closest('#cta');
  });
  await page.screenshot({ path: path.join(OUT, '04-cta-focused.png') });

  // side-by-side against the Blender poster (same 1600×1000 frame)
  const poster = 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, '..', 'assets', 'crvro-m1-poster.png')).toString('base64');
  const imgs = ['02-front.png', '01-three-quarter.png'].map((f) => 'data:image/png;base64,' + fs.readFileSync(path.join(OUT, f)).toString('base64'));
  const cmp = await browser.newPage();
  await cmp.setViewport({ width: 2400, height: 560 });
  await cmp.setContent(`<body style="margin:0;display:flex;background:#111;font:14px monospace;color:#ddd">
    ${[[poster, 'Blender poster (Eevee, existing)'], [imgs[0], 'Browser WebGL r2 — front'], [imgs[1], 'Browser WebGL r2 — three-quarter (rest)']]
      .map(([s, l]) => `<figure style="margin:0;width:800px"><img src="${s}" style="width:800px;display:block"><figcaption style="padding:8px">${l}</figcaption></figure>`).join('')}
  </body>`);
  await cmp.screenshot({ path: path.join(OUT, '05-browser-vs-blender.png') });

  const report = { gl, errors, focus, ctaHitTest: hit, shots };
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

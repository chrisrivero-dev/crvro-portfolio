/* Iteration 02 captures: D1 + D2 from identical cameras, plus a drive/organizer close-up. */
const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));
const OUT = path.join(__dirname, '..', 'captures', 'iter-02');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const only = process.argv[2];
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--ignore-gpu-blocklist'],
    defaultViewport: { width: 1600, height: 1000, deviceScaleFactor: 1 } });
  const report = {};
  for (const v of ['d1', 'd2']) {
    const page = await browser.newPage();
    report[v] = { errors: [] };
    page.on('pageerror', (e) => report[v].errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && !/ERR_NAME_NOT_RESOLVED|Failed to load resource/.test(m.text()) && report[v].errors.push(m.text()));
    const t0 = Date.now();
    await page.goto(`http://127.0.0.1:8728/${v}.html`, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => window.__M1__ && window.__M1__.frames > 0, { timeout: 15000 });
    report[v].readyMs = Date.now() - t0;
    await sleep(1200);
    const views = only ? [only] : ['threeQuarter', 'front', 'wide', 'closeup', 'top'];
    for (const view of views) {
      await page.evaluate((x) => window.__M1__.setView(x), view);
      await sleep(500);
      await page.screenshot({ path: path.join(OUT, `${v}-${view}.png`) });
    }
    if (!only) {
      await page.evaluate(() => { window.__M1__.setView('threeQuarter'); document.getElementById('pins-toggle').click(); });
      await sleep(400);
      await page.screenshot({ path: path.join(OUT, `${v}-destinations.png`) });
      // mobile check
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      await page.reload({ waitUntil: 'networkidle0' });
      await page.waitForFunction(() => window.__M1__ && window.__M1__.frames > 0, { timeout: 15000 });
      await sleep(1000);
      await page.screenshot({ path: path.join(OUT, `${v}-mobile.png`) });
      report[v].mobileCtaVisible = await page.evaluate(() => { const r = document.getElementById('cta').getBoundingClientRect(); return r.right > 0 && r.left < innerWidth && r.top > 0 && r.bottom < innerHeight; });
    }
    await page.close();
  }
  if (!only) {
    const img = (f) => 'data:image/png;base64,' + fs.readFileSync(path.join(OUT, f)).toString('base64');
    const i1 = (f) => 'data:image/png;base64,' + fs.readFileSync(path.join(OUT, '..', 'iter-01', f)).toString('base64');
    const cmp = await browser.newPage();
    await cmp.setViewport({ width: 2400, height: 1000 });
    const cap = 'padding:6px 10px 14px';
    await cmp.setContent(`<body style="margin:0;background:#111;color:#ddd;font:15px monospace;display:grid;grid-template-columns:repeat(3,800px)">
      ${['a', 'b', 'c'].map((v) => `<figure style="margin:0"><img src="${i1(v + '-threeQuarter.png')}" style="width:800px;display:block"><figcaption style="${cap}">iter-01 · ${v.toUpperCase()}</figcaption></figure>`).join('')}
      <figure style="margin:0"><img src="${img('d1-threeQuarter.png')}" style="width:800px;display:block"><figcaption style="${cap}">D1 · warm drafting studio — rest</figcaption></figure>
      <figure style="margin:0"><img src="${img('d2-threeQuarter.png')}" style="width:800px;display:block"><figcaption style="${cap}">D2 · cinematic archive — rest</figcaption></figure>
      <figure style="margin:0"><img src="${img('d1-wide.png')}" style="width:800px;display:block"><figcaption style="${cap}">D1 — room</figcaption></figure>
      <figure style="margin:0"><img src="${img('d1-closeup.png')}" style="width:800px;display:block"><figcaption style="${cap}">D1 — drive + organizer</figcaption></figure>
      <figure style="margin:0"><img src="${img('d2-closeup.png')}" style="width:800px;display:block"><figcaption style="${cap}">D2 — drive + organizer</figcaption></figure>
      <figure style="margin:0"><img src="${img('d2-wide.png')}" style="width:800px;display:block"><figcaption style="${cap}">D2 — room</figcaption></figure>
    </body>`);
    await cmp.screenshot({ path: path.join(OUT, 'compare.png'), fullPage: true });
  }
  console.log(JSON.stringify(report));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

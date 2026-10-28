/* Career notebook captures. Each state at 1920x1080, 1280x800 and 390x844 (phone emulation in Chromium, not a real device).
 * LOFI=1 skips the 3D wait (plain pages). Run: BASE=http://localhost:5192 TAG=before STATES="/" node scripts/capture-career.cjs  -> captures/career/<TAG>/ */
const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));
const BASE = process.env.BASE || 'http://localhost:5192';
const TAG = process.env.TAG || 'after';
const OUT = path.join(__dirname, '..', 'captures', 'career', TAG);
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const VPS = [['1920', { width: 1920, height: 1080 }], ['1280', { width: 1280, height: 800 }], ['390', { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]];
// STATES: @@-separated "url" or "url|js" (js is evaluated in the page after it settles; e.g. a top-down debug view)
const STATES = (process.env.STATES || '/').split('@@');
const ONLY = process.env.VP ? process.env.VP.split(',') : null;
const errors = [];
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
  for (const [vn, vp] of VPS) {
    if (ONLY && !ONLY.includes(vn)) continue;
    for (const spec of STATES) {
      const [st, js] = spec.split('|');
      const page = await browser.newPage();
      await page.setViewport(vp);
      page.on('pageerror', (e) => errors.push(`${vn} ${st}: ${e}`));
      await page.goto(BASE + st, { waitUntil: 'networkidle0' });
      if (!process.env.LOFI) await page.waitForFunction(() => window.__WS__ && !window.__WS__.ctl.state.busy, { timeout: 25000 });
      await sleep(2000);
      if (js) { await page.evaluate(js); await sleep(1500); }
      const name = `${vn}-${st.replace(/[/#?=]+/g, '_').replace(/^_|_$/g, '') || 'desk'}${js ? '-' + (process.env.SUFFIX || 'x') : ''}`;
      await page.screenshot({ path: path.join(OUT, name + '.png') });
      await page.close();
    }
  }
  console.log(JSON.stringify({ errors }));
  await browser.close();
})();

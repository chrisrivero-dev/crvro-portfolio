/* The main desk view at the three sizes, for the lamp silhouette fix. Run: BASE=http://localhost:5194 OUT=before node scripts/capture-lamp.cjs */
const path = require('path'); const fs = require('fs');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));
const BASE = process.env.BASE || 'http://localhost:5194';
const OUT = path.join(__dirname, '..', 'captures', 'lamp', process.env.OUT || 'after'); fs.mkdirSync(OUT, { recursive: true });
const M = { deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const VPS = { 1920: { width: 1920, height: 1080 }, 1280: { width: 1280, height: 800 }, 390: { width: 390, height: 844, ...M } };
(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
  for (const [n, vp] of Object.entries(VPS)) {
    const p = await b.newPage(); await p.setViewport(vp);
    await p.goto(BASE + '/', { waitUntil: 'networkidle0' });
    await p.waitForFunction(() => window.__WS__ && !window.__WS__.ctl.state.busy, { timeout: 30000 }); await new Promise((r) => setTimeout(r, 2000));
    await p.screenshot({ path: path.join(OUT, `${n}-desk.png`) }); await p.close();
  }
  await b.close();
})();

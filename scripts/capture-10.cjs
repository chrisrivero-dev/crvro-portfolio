/* 10 plant polish evidence: reading corner, chair/ottoman/plant, the cabinet plant, the cabinet from above, the workstation clearance,
 * and the desk view after returning, at 1920x1080, 1280x800 and 390x844 (Chromium emulation for the phone).
 * Run: BASE=http://localhost:4173 OUT=before|after node scripts/capture-10.cjs */
const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));
const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = path.join(__dirname, '..', 'captures', 'plants', process.env.OUT || 'after');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const VPS = {
  1920: { width: 1920, height: 1080 },
  1280: { width: 1280, height: 800 },
  390: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const STEPS = [
  ['01-reading-corner', '#corner', 'corner'],
  ['02-chair-ottoman-plant', 'CAM:1.45:0.2:5200:-1300:-1150:4400', 'corner'],
  ['03-cabinet-plant', 'CAM:1.57:0.22:2000:-1700:-850:1550', 'corner'],
  ['04-cabinet-top-down', 'CAM:1.57:1.35:2900:-1840:-910:1820', 'corner'],
  ['05-workstation-clearance', 'CAM:0.55:0.12:4300:-50:-1000:600', 'corner'],
  ['06-desk-restored', '', 'rest'],
];
(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
  for (const vn of (process.env.VPS || '1920,1280,390').split(',')) {
    const p = await b.newPage();
    await p.setViewport(VPS[vn]);
    await p.goto(BASE + '/', { waitUntil: 'networkidle0' });
    await p.waitForFunction(() => window.__WS__ && !window.__WS__.ctl.state.busy, { timeout: 25000 });
    await sleep(1500);
    for (const [name, act, view] of STEPS) {
      if (act.startsWith('CAM:')) await p.evaluate((c) => { const [yaw, pitch, dist, x, y, z] = c.slice(4).split(':').map(Number); const e = window.__WS__.engine; return e.flyTo({ yaw, pitch, dist, target: new e.THREE.Vector3(x, y, z) }, 0); }, act);
      else if (act === '') await p.evaluate(() => { if (window.__WS__.ctl.state.view !== 'rest') window.__WS__.ctl.back(); });
      else await p.evaluate((h) => { location.hash = h; }, act);
      await p.waitForFunction((v) => { const s = window.__WS__.ctl.state; return s.view === v && !s.busy; }, { timeout: 15000, polling: 60 }, view).catch(() => console.log('timeout', vn, name));
      await sleep(1400);
      await p.screenshot({ path: path.join(OUT, `${vn}-${name}.png`) });
    }
    await p.close();
  }
  await b.close();
})();

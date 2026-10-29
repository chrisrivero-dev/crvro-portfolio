/* 12 instant camera evidence: on the shelf, front close-up, angled close-up (turned), detail crop and the phone inspection view,
 * at 1920x1080, 1280x800 and 390x844 (Chromium emulation for the phone). Prints desk draw calls.
 * Run: BASE=http://localhost:5194 OUT=after node scripts/capture-12.cjs */
const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));
const BASE = process.env.BASE || 'http://localhost:5194';
const OUT = path.join(__dirname, '..', 'captures', 'camera', process.env.OUT || 'after');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const VPS = { 1920: { width: 1920, height: 1080 }, 1280: { width: 1280, height: 800 }, 390: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } };
(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
  for (const vn of (process.env.VPS || '1920,1280,390').split(',')) {
    const p = await b.newPage();
    const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
    await p.setViewport(VPS[vn]);
    await p.goto(BASE + '/', { waitUntil: 'networkidle0' });
    await p.waitForFunction(() => window.__WS__ && !window.__WS__.ctl.state.busy, { timeout: 25000 });
    await sleep(1200);
    console.log(vn, 'desk draw calls', await p.evaluate(() => { const e = window.__WS__.engine; e.markDirty(); return new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => res(e.renderer.info.render.calls)))); }));
    const cam = () => p.evaluate(() => { const e = window.__WS__.engine, c = new e.THREE.Box3().setFromObject(e.room.camera).getCenter(new e.THREE.Vector3()); return [c.x, c.y, c.z]; });
    const shot = async (n) => { await sleep(1300); await p.screenshot({ path: path.join(OUT, `${vn}-${n}.png`) }); };
    const c = await cam();
    await p.evaluate((c) => { const e = window.__WS__.engine; e.flyTo({ yaw: -Math.PI / 2 + 0.25, pitch: 0.15, dist: 2600, target: new e.THREE.Vector3(c[0], c[1] - 150, c[2]) }, 0); }, c);
    await shot('01-on-shelf');
    await p.evaluate(() => { location.hash = '#corner/camera'; });
    await p.waitForFunction(() => { const s = window.__WS__.ctl.state; return s.view === 'camera' && !s.busy; }, { timeout: 15000 });
    await shot('02-front-closeup');
    const turned = await p.evaluate(() => { const ctl = window.__WS__.ctl; if (!ctl.turnCamera) return false; ctl.turnCamera(1.0); return true; });
    if (!turned) await p.evaluate((c) => { const e = window.__WS__.engine; e.flyTo({ yaw: -Math.PI / 2 + 0.75, pitch: 0.3, dist: 1100, target: new e.THREE.Vector3(...c) }, 0); }, c);
    await shot('03-angled');
    if (turned) await p.evaluate(() => window.__WS__.ctl.turnCamera(-1.0));
    await p.evaluate((c) => { const e = window.__WS__.engine; e.flyTo({ yaw: -Math.PI / 2 + 0.15, pitch: 0.12, dist: 520, target: new e.THREE.Vector3(c[0], c[1] + 40, c[2] + 50) }, 0); }, c);
    await shot('04-detail');
    console.log(vn, 'page errors', errs.length ? errs : 'none');
    await p.close();
  }
  await b.close();
})();

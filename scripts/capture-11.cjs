/* 11 studio refinement evidence: the desk, the door wall with the world map, the bookcase with the Daventry One drawing, the window's
 * blue-hour exterior, the lab inspection view (one model selected) and the reading corner, at 1920x1080, 1280x800, 768x1024, 390x844
 * and 375x812 (Chromium emulation for tablet and phones). Prints draw calls at the desk. Run: BASE=http://localhost:5194 OUT=after node scripts/capture-11.cjs */
const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));
const BASE = process.env.BASE || 'http://localhost:5194';
const OUT = path.join(__dirname, '..', 'captures', 'studio', process.env.OUT || 'after');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const M = { deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const VPS = { 1920: { width: 1920, height: 1080 }, 1280: { width: 1280, height: 800 }, 768: { width: 768, height: 1024, ...M }, 390: { width: 390, height: 844, ...M }, 375: { width: 375, height: 812, ...M } };
const STEPS = [
  ['01-desk', '', 'rest'],
  ['02-door-world-map', 'CAM:3.14159:0.05:5200:1400:500:7400', 'rest'],
  ['03-bookcase-lab-drawing', 'CAM:-1.5708:0.12:6200:5600:300:3300', 'rest'],
  ['03b-tree-bookshelf', 'CAM:3.55:0.1:5200:5400:-400:7000', 'rest'],
  ['04-window-exterior', 'LOOK:' + (process.env.WIN || '1.25') + ':0.05', 'rest'],
  ['04b-window-close', 'CAM:1.5708:0.0:3000:-2300:650:150', 'rest'],
  ['05-lab-inspect', '#corner/lab', 'lab'],
  ['06-lab-node', 'NODE:captain', 'lab'],
  ['07-reading-corner', '#corner', 'corner'],
  ['08-camera-inspect', '#corner/camera', 'camera'],
];
(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
  for (const vn of (process.env.VPS || '1920,1280,768,390,375').split(',')) {
    const p = await b.newPage();
    const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
    await p.setViewport(VPS[vn]);
    await p.goto(BASE + '/', { waitUntil: 'networkidle0' });
    await p.waitForFunction(() => window.__WS__ && !window.__WS__.ctl.state.busy, { timeout: 25000 });
    await sleep(1500);
    for (const [name, act, view] of STEPS) {
      if (act.startsWith('LOOK:')) { await p.evaluate(() => { if (window.__WS__.ctl.state.view !== 'rest') window.__WS__.ctl.back(); }); await p.waitForFunction(() => window.__WS__.ctl.state.view === 'rest' && !window.__WS__.ctl.state.busy, { timeout: 15000 }); await p.evaluate((a) => { const [y, pt] = a.slice(5).split(':').map(Number); window.__WS__.engine.setLook(y, pt); }, act); }
      else if (act.startsWith('CAM:')) await p.evaluate((c) => { const [yaw, pitch, dist, x, y, z] = c.slice(4).split(':').map(Number); const e = window.__WS__.engine; e.setLook(0, 0); return e.flyTo({ yaw, pitch, dist, target: new e.THREE.Vector3(x, y, z) }, 0); }, act);
      else if (act.startsWith('NODE:')) await p.evaluate((id) => window.__WS__.ctl.selectLabNode(id), act.slice(5));
      else if (act === '') await p.evaluate(() => { if (window.__WS__.ctl.state.view !== 'rest') window.__WS__.ctl.back(); });
      else await p.evaluate((h) => { location.hash = h; }, act);
      await p.waitForFunction((v) => { const s = window.__WS__.ctl.state; return s.view === v && !s.busy; }, { timeout: 15000, polling: 60 }, view).catch(() => console.log('timeout', vn, name));
      await sleep(1400);
      if (name === '01-desk') console.log(vn, 'desk draw calls', await p.evaluate(() => { const r = window.__WS__.engine.renderer; window.__WS__.engine.markDirty(); return new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => res({ calls: r.info.render.calls, tex: r.info.memory.textures, geo: r.info.memory.geometries })))); }));
      await p.screenshot({ path: path.join(OUT, `${vn}-${name}.png`) });
    }
    console.log(vn, 'page errors', errs.length ? errs : 'none');
    await p.close();
  }
  await b.close();
})();

/* Rendering and memory cost of the room: draw calls, triangles, GPU object counts, JS heap and time to ready.
 * Run against two builds to compare: BASE=http://localhost:4173 (previous production) vs BASE=http://localhost:5193 (this branch). */
const path = require('path');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));
const BASE = process.env.BASE;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-precise-memory-info'] });
  const out = {};
  for (const [name, vp] of [['desktop', { width: 1280, height: 800 }], ['phone', { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]]) {
    const runs = [];
    for (let i = 0; i < 3; i++) {
      const p = await b.newPage(); await p.setViewport(vp);
      const t0 = Date.now();
      await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
      await p.waitForFunction(() => window.__WS__ && !window.__WS__.ctl.state.busy, { timeout: 30000 });
      const ready = Date.now() - t0;
      await sleep(2500);
      const m = await p.evaluate(() => { const i = window.__WS__.engine.renderer.info; return { calls: i.render.calls, tris: i.render.triangles, textures: i.memory.textures, geometries: i.memory.geometries, heapMB: +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) }; });
      const f0 = await p.evaluate(() => window.__WS__.engine.frames); await sleep(1000); const f1 = await p.evaluate(() => window.__WS__.engine.frames);
      runs.push({ ...m, readyMs: ready, idleFrames: f1 - f0 });
      await p.close();
    }
    const med = (k) => runs.map((r) => r[k]).sort((a, c) => a - c)[1];
    out[name] = { calls: med('calls'), tris: med('tris'), textures: med('textures'), geometries: med('geometries'), heapMB: med('heapMB'), readyMs: med('readyMs'), idleFrames: Math.max(...runs.map((r) => r.idleFrames)) };
  }
  console.log(JSON.stringify(out));
  await b.close();
})();

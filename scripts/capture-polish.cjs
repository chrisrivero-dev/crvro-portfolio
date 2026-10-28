/* Release polish captures: each key state at 1280x800, 1920x1080 and 390x844 (phone emulation, Chromium; not a real device).
 * Run: BASE=http://127.0.0.1:5191 TAG=after node scripts/capture-polish.cjs  -> captures/polish/<TAG>/ */
const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));
const BASE = process.env.BASE || 'http://127.0.0.1:5191';
const OUT = path.join(__dirname, '..', 'captures', 'polish', process.env.TAG || 'after');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const VPS = [['1280', { width: 1280, height: 800 }], ['1920', { width: 1920, height: 1080 }], ['390', { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]];
const STATES = ['/', '/#computer', '/#plans', '/#plans/parcel-engine', '/#plans/groundrules', '/#disks'];
const errors = [];
const measures = {};
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
  for (const [vn, vp] of VPS) {
    for (const st of STATES) {
      const page = await browser.newPage();
      await page.setViewport(vp);
      page.on('pageerror', (e) => errors.push(`${vn} ${st}: ${e}`));
      await page.goto(BASE + st, { waitUntil: 'networkidle0' });
      await page.waitForFunction(() => window.__WS__ && !window.__WS__.ctl.state.busy, { timeout: 25000 });
      await sleep(2200);
      const name = `${vn}-${st.replace(/[/#]+/g, '_').replace(/^_|_$/g, '') || 'desk'}`;
      await page.screenshot({ path: path.join(OUT, name + '.png') });
      measures[name] = await page.evaluate(() => {
        const r = (sel) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return b.width ? { top: Math.round(b.top), h: Math.round(b.height), w: Math.round(b.width) } : null; };
        const notes = window.__WS__.engine.notes.map((m) => {
          const { camera, THREE } = window.__WS__.engine;
          const pts = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([u, v]) => { const p = m.localToWorld(new THREE.Vector3((u - 0.5) * 280, (v - 0.5) * 390, 0)).project(camera); return [(p.x * 0.5 + 0.5) * innerWidth, (-p.y * 0.5 + 0.5) * innerHeight]; });
          const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
          return { slug: m.userData.note.slug, x0: Math.round(Math.min(...xs)), x1: Math.round(Math.max(...xs)), y0: Math.round(Math.min(...ys)), y1: Math.round(Math.max(...ys)) };
        });
        return { vw: innerWidth, vh: innerHeight, dock: r('.ws3d__dock'), notes };
      });
      if (vn === '390' && st === '/') {
        await page.tap('.ws3d__stbtn'); await sleep(500);
        await page.screenshot({ path: path.join(OUT, `${vn}-stations-open.png`) });
        measures.stationsOpen = await page.evaluate(() => { const d = document.querySelector('.ws3d__dock').getBoundingClientRect(); return { dockTop: Math.round(d.top), dockH: Math.round(d.height), rows: [...document.querySelectorAll('.ws3d__stlist button')].map((b) => Math.round(b.getBoundingClientRect().height)) }; });
      }
      await page.close();
    }
  }
  fs.writeFileSync(path.join(OUT, 'measures.json'), JSON.stringify({ measures, errors }, null, 1));
  console.log(JSON.stringify({ stationsOpen: measures.stationsOpen, errors }, null, 1));
  await browser.close();
})();

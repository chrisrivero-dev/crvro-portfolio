/* 09 visual evidence: a full turn from the desk (0°, 90°, 180°, 270°, 360°) at 1920x1080, 1280x800, 390x844 and 844x390, plus the wide
 * office, the door wall, the workstation with its task chair, the reading corner from the room, the lounge chair, the seated lounge
 * view and the return to the desk. Phone sizes are Chromium emulation. Output: captures/room/after/<vp>-<state>.png
 * Headings use engine.setLook (the same offset a drag sets; verify-room.cjs drives the full turn by mouse and touch).
 * Run: BASE=http://localhost:5193 node scripts/capture-09.cjs   (VPS=1920,390 to limit) */
const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));
const BASE = process.env.BASE || 'http://localhost:5193';
const OUT = path.join(__dirname, '..', 'captures', 'room', 'after');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const VPS = {
  1920: { width: 1920, height: 1080 },
  1280: { width: 1280, height: 800 },
  390: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  844: { width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const H = Math.PI / 2;
// [file, action, view]; LOOK:<yaw> is the look-around offset a drag sets (positive = turning left, toward the reading corner)
const STEPS = [
  ['01-heading-000', 'LOOK:0', 'rest'],
  ['02-heading-090', `LOOK:${H}`, 'rest'],
  ['03-heading-180-door', `LOOK:${2 * H}`, 'rest'],
  ['04-heading-270-corner', `LOOK:${3 * H}`, 'rest'],
  ['05-heading-360', `LOOK:${4 * H}`, 'rest'],
  ['06-door-wall-up', `LOOK:${2 * H}:-0.3`, 'rest'],
  ['07-wide-office', 'CAM:0.84:0.28:7400:-300:-900:1700', 'rest'],
  ['08-workstation-chair', 'CAM:0.55:0.12:4300:-50:-1000:600', 'rest'],
  ['09-corner-from-room', 'LOOK:1.75', 'rest'],
  ['09b-facing-desk', 'LOOK:0', 'rest'],
  ['10-lounge-chair', '#corner', 'corner'],
  ['11-lounge-seated', '#corner/seat', 'seat'],
  ['12-desk-restored', '', 'rest'],
];
(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
  for (const vn of (process.env.VPS || '1920,1280,390,844').split(',')) {
    const p = await b.newPage();
    await p.setViewport(VPS[vn]);
    await p.goto(BASE + '/', { waitUntil: 'networkidle0' });
    await p.waitForFunction(() => window.__WS__ && !window.__WS__.ctl.state.busy, { timeout: 25000 });
    await sleep(1500);
    for (const [name, act, view] of STEPS) {
      if (act.startsWith('LOOK:')) { const [y, pt = 0] = act.slice(5).split(':').map(Number); await p.evaluate((y, pt) => window.__WS__.engine.setLook(y, pt), y, pt); }
      else if (act.startsWith('CAM:')) await p.evaluate((c) => { const [yaw, pitch, dist, x, y, z] = c.slice(4).split(':').map(Number); const e = window.__WS__.engine; e.setLook(0, 0); e.setHaze(2); return e.flyTo({ yaw, pitch, dist, target: new e.THREE.Vector3(x, y, z) }, 0); }, act);
      else if (act === '') await p.evaluate(() => { if (window.__WS__.ctl.state.view !== 'rest') window.__WS__.ctl.back(); });
      else await p.evaluate((h) => { location.hash = h; }, act);
      await p.waitForFunction((v) => { const s = window.__WS__.ctl.state; return s.view === v && !s.busy; }, { timeout: 15000, polling: 60 }, view).catch(() => console.log('timeout', vn, name));
      await sleep(act.startsWith('LOOK') ? 500 : 1400);
      await p.screenshot({ path: path.join(OUT, `${vn}-${name}.png`) });
      if (act.startsWith('CAM:')) await p.evaluate(() => { const e = window.__WS__.engine; e.setHaze(0); return e.flyTo('threeQuarter', 0); });
      console.log(vn, name);
    }
    await p.close();
  }
  await b.close();
})();

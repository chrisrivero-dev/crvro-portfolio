/* 07 visual evidence: every required state at 1920x1080, 1280x800, 390x844 (iPhone portrait) and 844x390 (iPhone landscape).
 * Phone sizes are Chromium emulation, not a device. Output: captures/career/after/<vp>-<state>.png
 * Run: BASE=http://localhost:5193 node scripts/capture-07.cjs   (VPS=1920,390 to limit) */
const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));
const BASE = process.env.BASE || 'http://localhost:5193';
const OUT = path.join(__dirname, '..', 'captures', 'career', 'after');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const VPS = {
  1920: { width: 1920, height: 1080 },
  1280: { width: 1280, height: 800 },
  390: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  844: { width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
// [file name, hash or action, view to wait for]
const STEPS = [
  ['01-room', '', 'rest'],
  ['02-career-work', '#career', 'book'],
  ['03-career-work-scrolled', 'SCROLL', 'book'],
  ['04-career-highlights', '#career/highlights', 'book'],
  ['05-career-resume', '#career/resume', 'book'],
  ['06-desk-after-notebook', '', 'rest'],
  ['07-corner', '#corner', 'corner'],
  ['08-seat', '#corner/seat', 'seat'],
  ['09-desk-after-seat', '', 'rest'],
  ['10-record-stopped', '#corner/record', 'record'],
  ['11-record-playing', 'PLAY', 'record'],
  ['12-desk-after-record', '', 'rest'],
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
      if (act === 'PLAY') await p.evaluate(() => window.__WS__.ctl.togglePlay());
      else if (act === 'SCROLL') await p.evaluate(() => { const b = document.querySelector('.nb-paper .nb-body'); b.scrollTop = b.scrollHeight * 0.42; });
      else if (act === '') await p.evaluate(() => { if (window.__WS__.ctl.state.view !== 'rest') window.__WS__.ctl.back(); });   // the dock's Back to the desk
      else await p.evaluate((h) => { location.hash = h; }, act);
      await p.waitForFunction((v) => { const s = window.__WS__.ctl.state; return s.view === v && !s.busy && (v !== 'book' || s.fit > 0); }, { timeout: 15000, polling: 60 }, view).catch(() => console.log('timeout', vn, name));
      await sleep(act === 'PLAY' ? 1800 : 1400);
      await p.screenshot({ path: path.join(OUT, `${vn}-${name}.png`) });
      console.log(vn, name, await p.evaluate(() => location.hash || '/'));
    }
    await p.close();
  }
  await b.close();
})();

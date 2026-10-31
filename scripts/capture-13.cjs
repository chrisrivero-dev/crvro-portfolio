/* 13 HeyHab evidence: the disk in the tray, lifted, loaded with its CRT directory, the case study opened and returned from, the mobile disk
 * list, and the full page at 1920, 1280, 390 and 375 (Chromium emulation for phones) with a horizontal overflow check.
 * Run: BASE=http://localhost:5194 node scripts/capture-13.cjs */
const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));
const BASE = process.env.BASE || 'http://localhost:5194';
const OUT = path.join(__dirname, '..', 'captures', 'heyhab', process.env.OUT || 'after');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const M = { deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const VPS = { 1920: { width: 1920, height: 1080 }, 1280: { width: 1280, height: 800 }, 390: { width: 390, height: 844, ...M }, 375: { width: 375, height: 812, ...M } };
(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
  for (const vn of Object.keys(VPS)) {
    const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
    await p.setViewport(VPS[vn]);
    await p.goto(BASE + '/', { waitUntil: 'networkidle0' });
    await p.waitForFunction(() => window.__WS__ && !window.__WS__.ctl.state.busy, { timeout: 30000 }); await sleep(1200);
    const idle = (t) => p.waitForFunction((t) => { const s = window.__WS__.ctl.state; return !s.busy && !s.pending && t === 'x' || (t === s.view && !s.busy && !s.pending); }, { timeout: 20000 }, t);
    const shot = async (n) => { await sleep(1000); await p.screenshot({ path: path.join(OUT, `${vn}-${n}.png`) }); };
    await p.screenshot({ path: path.join(OUT, `${vn}-01-desk.png`) });
    await p.evaluate(() => { location.hash = '#disks'; }); await idle('drive'); await shot('02-tray');
    await p.evaluate(() => { location.hash = '#disk/heyhab'; }); await idle('hold'); await shot('03-lifted');
    await p.evaluate(() => window.__WS__.ctl.load('heyhab'));
    await p.waitForFunction(() => window.__WS__.ctl.state.session === 'heyhab' && !window.__WS__.ctl.state.busy, { timeout: 20000 }); await shot('04-crt-directory');
    console.log(vn, 'crt:', (await p.evaluate(() => document.getElementById('screen')?.innerText || '')).replace(/\s+/g, ' ').slice(0, 160));
    await p.evaluate(() => window.__WS__.ctl.eject()); await sleep(2500);
    await p.goto(BASE + '/projects/heyhab', { waitUntil: 'networkidle0' }); await sleep(900);
    const m = await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } scrollTo(0, 0); await new Promise((r) => setTimeout(r, 300)); return { over: document.documentElement.scrollWidth - innerWidth, h: document.body.scrollHeight, broken: [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src), title: document.title }; });
    console.log(vn, JSON.stringify(m), 'errors', errs.length);
    await p.screenshot({ path: path.join(OUT, `${vn}-05-case-study-top.png`) });
    if (vn === '1280' || vn === '390') await p.screenshot({ path: path.join(OUT, `${vn}-06-case-study-full.png`), fullPage: true });
    await p.close();
  }
  await b.close();
})();

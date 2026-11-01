/* 12 the desk lamp: clicking it switches it off and on; the light, glow and bulb follow; the keyboard button works; nothing else moves.
 * Run: BASE=http://localhost:5194 node scripts/verify-lamp.cjs */
const path = require('path'); const fs = require('fs');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));
const BASE = process.env.BASE || 'http://localhost:5194';
const OUT = path.join(__dirname, '..', 'captures', 'lamp', 'after'); fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0; const check = (n, ok, d) => { ok ? pass++ : fail++; console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : (d ?? '')); };
const lit = (p) => p.evaluate(() => { const e = window.__WS__.engine; let spot = null, glow = null; e.scene.traverse((o) => { if (o.isSpotLight && o.castShadow) spot = o.intensity; }); return { on: e.lamp.on, spot }; });
(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
  for (const [n, vp] of [['1920', { width: 1920, height: 1080 }], ['390', { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]]) {
    const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
    await p.setViewport(vp); await p.goto(BASE + '/', { waitUntil: 'networkidle0' });
    await p.waitForFunction(() => window.__WS__ && !window.__WS__.ctl.state.busy, { timeout: 30000 }); await sleep(1800);
    if (n === '390') { await p.evaluate(() => window.__WS__.engine.setLook(-0.75, 0)); await sleep(800); }   // on a phone the lamp is off to the right of the resting view: drag to look first
    const xy = await p.evaluate(() => { const e = window.__WS__.engine, c = new e.THREE.Box3().setFromObject(e.lamp.group).getCenter(new e.THREE.Vector3()); c.y += 120; const v = c.project(e.camera); return [(v.x + 1) * innerWidth / 2, (1 - v.y) * innerHeight / 2]; });
    const a = await lit(p); check(`${n}: the lamp starts on`, a.on && a.spot > 0, JSON.stringify(a));
    await (n === '390' ? p.touchscreen.tap(xy[0], xy[1]) : p.mouse.click(xy[0], xy[1])); await sleep(500);
    const off = await lit(p); check(`${n}: clicking the lamp turns it off (spot light is dark)`, !off.on && off.spot === 0, JSON.stringify(off));
    check(`${n}: the camera did not move`, (await p.evaluate(() => window.__WS__.ctl.state.view)) === 'rest');
    await p.screenshot({ path: `${OUT}/${n}-lamp-off.png` });
    await (n === '390' ? p.touchscreen.tap(xy[0], xy[1]) : p.mouse.click(xy[0], xy[1])); await sleep(500);
    const on = await lit(p); check(`${n}: clicking again turns it back on`, on.on && on.spot === a.spot, JSON.stringify(on));
    if (n === '1920') {
      await p.evaluate(() => document.querySelector('.ws3d__mugbtn[aria-pressed]').focus());
      await p.keyboard.press('Enter'); await sleep(300);
      check('keyboard: the focusable lamp button turns it off', (await lit(p)).on === false);
      check('keyboard: its label and state follow', await p.evaluate(() => /off/.test(document.querySelector('.ws3d__mugbtn[aria-pressed]').textContent) && document.querySelector('.ws3d__mugbtn[aria-pressed]').getAttribute('aria-pressed') === 'false'));
      await p.keyboard.press('Enter'); await sleep(300); check('keyboard: and back on', (await lit(p)).on === true);
      await p.screenshot({ path: `${OUT}/${n}-lamp-on.png` });
    }
    check(`${n}: no page errors`, errs.length === 0, errs.join()); await p.close();
  }
  console.log(`${pass}/${pass + fail} passed`); await b.close(); process.exit(fail ? 1 : 0);
})();

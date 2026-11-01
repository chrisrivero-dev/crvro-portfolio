/* 14 the Sierra shelf: the labels, each character outcome, closing, keyboard, and the phone path through the bar button, with screenshots.
 * Phone runs are Chromium emulation. Run: BASE=http://localhost:5194 node scripts/verify-sierra.cjs */
const path = require('path'); const fs = require('fs');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));
const BASE = process.env.BASE || 'http://localhost:5194';
const OUT = path.join(__dirname, '..', 'captures', 'sierra'); fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0; const check = (n, ok, d) => { ok ? pass++ : fail++; console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : (d ?? '')); };
const S = (p) => p.evaluate(() => window.__WS__.ctl.state);
const settled = (p, v) => p.waitForFunction((v) => { const s = window.__WS__.ctl.state; return s.view === v && !s.busy; }, { timeout: 15000 }, v);
async function open(b, vp) { const p = await b.newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(String(e))); await p.setViewport(vp); await p.goto(BASE + '/', { waitUntil: 'networkidle0' }); await p.waitForFunction(() => window.__WS__ && !window.__WS__.ctl.state.busy, { timeout: 30000 }); await sleep(1200); return p; }
const dash = (p) => p.evaluate(() => document.querySelector('.sq')?.innerText.includes('\u2014'));
(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
  let p = await open(b, { width: 1920, height: 1080 });
  await p.screenshot({ path: `${OUT}/1920-desk.png` });
  await p.evaluate(() => { location.hash = '#shelf'; }); await settled(p, 'shelf'); await sleep(1200);
  await p.screenshot({ path: `${OUT}/1920-shelf.png` });
  check('shelf: four folders pickable', (await p.evaluate(() => new Set(window.__WS__.engine.sierra.map((m) => m.userData.sierra)).size)) === 4);
  // a real click on the Hero's Quest label
  const xy = await p.evaluate(() => { const e = window.__WS__.engine, m = e.sierra.find((o) => o.userData.sierra === 'hero' && o.geometry.type === 'PlaneGeometry'), v = m.getWorldPosition(new e.THREE.Vector3()).project(e.camera); return [(v.x + 1) * innerWidth / 2, (1 - v.y) * innerHeight / 2]; });
  await p.mouse.click(xy[0], xy[1]); await sleep(400);
  check('mouse: clicking the folder opens the panel', (await S(p)).folder === 'hero');
  for (const c of ['fighter', 'magic', 'thief']) {
    if (!(await p.$('.sq'))) await p.evaluate(() => window.__WS__.ctl.openFolder('hero'));
    await p.waitForSelector(`[data-class="${c}"]`); await sleep(150);
    await p.screenshot({ path: `${OUT}/1920-choose.png` });
    await p.click(`[data-class="${c}"]`); await sleep(200);
    const t = await p.$eval('.sq', (e) => e.innerText);
    check(`${c}: a story about the locked gate`, /gate is locked/.test(t), t);
    await p.screenshot({ path: `${OUT}/1920-outcome-${c}.png` });
    await p.evaluate(() => [...document.querySelectorAll('.sq button')].find((x) => /character sheet/.test(x.textContent)).click()); await sleep(200);
    const s = await p.$eval('.sq', (e) => e.innerText);
    check(`${c}: character sheet with the message`, /Christopher Rivero/.test(s) && /Explorer \/ Problem Solver/.test(s) && /Before I was building interactive worlds/.test(s) && (await p.$$('.sq__stats li')).length === 4);
    await p.screenshot({ path: `${OUT}/1920-sheet.png` });
    await p.evaluate(() => [...document.querySelectorAll('.sq button')].find((x) => /Play again/.test(x.textContent)).click()); await sleep(150);
  }
  // keyboard: arrows, Enter, shortcuts blocked, Escape twice
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await sleep(200);
  check('keyboard: arrow and Enter choose a character', /gate is locked/.test(await p.$eval('.sq', (e) => e.innerText)));
  await p.keyboard.press('c'); await sleep(300);
  check('keyboard: room shortcuts wait while the panel is open', (await S(p)).view === 'shelf');
  await p.keyboard.press('Escape'); await sleep(300);
  let st = await S(p); check('Escape closes the panel, stays at the shelf', !st.folder && st.view === 'shelf' && !(await p.$('.sq')));
  check('focus returns to the folder button', await p.evaluate(() => document.activeElement?.dataset?.folder === 'hero'));
  for (const f of ['space', 'kings', 'sierra']) {
    await p.click(`[data-folder="${f}"]`); await sleep(200);
    const t = await p.$eval('.sq', (e) => e.innerText);
    check(`${f}: opens its short note`, f === 'sierra' ? /HEROQUEST/.test(t) : /slip of paper/.test(t));
    check(`${f}: no em dash`, !(await dash(p)));
    await p.screenshot({ path: `${OUT}/1920-${f}.png` });
    await p.click('.sq__x'); await sleep(200);
  }
  await p.keyboard.press('Escape'); await settled(p, 'rest'); await sleep(300);
  check('Escape from the shelf returns to the desk', (await S(p)).view === 'rest');
  await p.keyboard.press('g'); await settled(p, 'shelf'); check('G opens the shelf', true);
  await p.keyboard.press('Escape'); await settled(p, 'rest');
  await p.keyboard.press('d'); await settled(p, 'drive');
  check('D still goes to the disks', true);
  check('desktop: no page errors', p.errs.length === 0, p.errs.join());
  await p.close();
  for (const [w, h] of [[390, 844], [375, 812]]) {
    p = await open(b, { width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await p.tap('.ws3d__stbtn'); await sleep(300);
    const btn = await p.evaluateHandle(() => [...document.querySelectorAll('button')].find((x) => /Old game folders/.test(x.textContent) && x.offsetParent));
    check(`${w}: the Stations menu lists the folders`, !!(await btn.asElement()));
    await p.screenshot({ path: `${OUT}/${w}-stations.png` });
    await btn.asElement()?.tap(); await settled(p, 'shelf'); await sleep(1200);
    await p.screenshot({ path: `${OUT}/${w}-shelf.png` });
    await p.tap('[data-folder="hero"]'); await sleep(300);
    await p.tap('[data-class="thief"]'); await sleep(200);
    await p.screenshot({ path: `${OUT}/${w}-outcome.png` });
    await p.evaluate(() => [...document.querySelectorAll('.sq button')].find((x) => /character sheet/.test(x.textContent)).click()); await sleep(200);
    await p.screenshot({ path: `${OUT}/${w}-sheet.png` });
    const m = await p.evaluate(() => { const r = document.querySelector('.sq__panel').getBoundingClientRect(); return r.left >= 0 && r.right <= document.documentElement.clientWidth; });
    check(`${w}: the panel fits the screen`, m);
    await p.tap('.sq__x'); await sleep(300);
    check(`${w}: Close works by touch`, !(await p.$('.sq')));
    check(`${w}: no page errors`, p.errs.length === 0, p.errs.join());
    await p.close();
  }
  console.log(`${pass}/${pass + fail} passed`); await b.close(); process.exit(fail ? 1 : 0);
})();

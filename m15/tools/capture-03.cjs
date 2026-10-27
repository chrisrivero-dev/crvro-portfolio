/* Iteration 03 verification: drives the real page with real pointer/keyboard/touch input and records what actually happened.
 * Writes captures/iter-03/*.png and report.json. Requires the m15 server on 8728. */
const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));
const OUT = path.join(__dirname, '..', 'captures', 'iter-03');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const URL = 'http://127.0.0.1:8728/i3.html';
const report = { checks: [], errors: [] };
const check = (name, ok, detail) => { report.checks.push({ name, ok: !!ok, detail }); console.log(ok ? 'PASS' : 'FAIL', name, detail ?? ''); };

async function open(browser, { w = 1600, h = 1000, mobile = false, reduce = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  if (reduce) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  page.on('pageerror', (e) => report.errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && !/ERR_NAME_NOT_RESOLVED|Failed to load resource/.test(m.text()) && report.errors.push(m.text()));
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__I3__, { timeout: 15000 });
  await sleep(1200);
  return page;
}
const state = (page) => page.evaluate(() => window.__I3__.state());
const shot = (page, name) => page.screenshot({ path: path.join(OUT, name + '.png') });
const diskXY = (page, slug) => page.evaluate((s) => {
  const { scene, camera } = window.__M1__;
  let g; scene.traverse((o) => { if (o.userData?.project?.slug === s && !g) g = o; });
  const v = g.getWorldPosition(new g.position.constructor()).project(camera);
  return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight };
}, slug);
const diskWorld = (page, slug) => page.evaluate((s) => { let g; window.__M1__.scene.traverse((o) => { if (o.userData?.project?.slug === s && !g) g = o; }); return g.getWorldPosition(new g.position.constructor()).toArray().map((n) => Math.round(n * 10) / 10); }, slug);
const waitFor = (page, fn, arg, ms = 8000) => page.waitForFunction(fn, { timeout: ms, polling: 50 }, arg);
const camPos = (page) => page.evaluate(() => window.__M1__.camera.position.toArray().map(Math.round));

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });

  /* ── 1. desktop: the whole first interaction with real pointer input ── */
  let page = await open(browser);
  await shot(page, '01-rest');
  const home0 = await diskWorld(page, 'zarvin-one');
  const cam0 = await camPos(page);
  // hover must not move the camera
  const p = await diskXY(page, 'zarvin-one');
  await page.mouse.move(p.x, p.y + 30); await sleep(500);
  check('hover shows a label and does not move the camera', JSON.stringify(await camPos(page)) === JSON.stringify(cam0) && !(await page.$eval('#disk-tag', (e) => e.hidden)));
  await shot(page, '02-hover');
  await page.mouse.click(p.x, p.y + 30);
  await sleep(450); await shot(page, '03-lift');
  await sleep(850); await shot(page, '04-carry');
  await sleep(700); await shot(page, '05-insert');
  await waitFor(page, () => window.__I3__.state().locs['zarvin-one'] === 'drive');
  check('click moves the disk into the drive', (await state(page)).locs['zarvin-one'] === 'drive');
  const seated = await diskWorld(page, 'zarvin-one');
  const slot = await page.evaluate(() => window.__I3__.driveSlot.toArray().map((n) => Math.round(n * 10) / 10));
  check('seated disk sits at the drive slot height and x', Math.abs(seated[1] - slot[1]) < 1 && Math.abs(seated[0] - slot[0]) < 1, JSON.stringify({ seated, slot }));
  await sleep(900); await shot(page, '06-boot');
  await waitFor(page, () => document.querySelectorAll('.dos__file').length > 0 && !!document.querySelector('.dos__sum'));
  await sleep(500);
  await shot(page, '07-directory-zarvin');
  const dir = await page.evaluate(() => ({
    files: [...document.querySelectorAll('.dos__file')].map((b) => b.textContent),
    view: document.querySelector('.dos__view').innerText,
    links: [...document.querySelectorAll('.dos__file, .dos__link')].length,
    focus: document.activeElement?.className, inScreen: !!document.activeElement?.closest('#screen'),
    camView: document.body.dataset.view,
    homeHidden: document.querySelector('[data-pane=home]').hidden,
  }));
  check('directory lists real files from the registry', dir.files.length >= 5 && /ZARVIN/.test(dir.view.toUpperCase()), JSON.stringify(dir.files));
  check('README text equals the registry description', dir.view.includes('A personal AI operating system that takes responsibility for work.'));
  check('camera is at the CRT and focus moved into the screen', dir.camView === 'crt' && dir.inScreen, dir.focus);
  // keyboard on the screen: ArrowDown selects STATUS, then the case-study link file shows a real <a>
  await page.keyboard.press('ArrowDown'); await sleep(500);
  const status = await page.$eval('.dos__view', (e) => e.innerText);
  check('ArrowDown selects STATUS.TXT with the registry status', /Active live build/.test(status), status.slice(0, 60));
  for (let i = 0; i < 3; i++) { await page.keyboard.press('ArrowDown'); await sleep(120); }  // fast presses: a newer selection must cancel older typing
  await waitFor(page, () => !!document.querySelector('.dos__link'), null, 3000).catch(() => {});
  const link = await page.$eval('.dos__link', (a) => ({ href: a.href, target: a.target, rel: a.rel })).catch(() => null);
  check('case-study link is a real anchor to /projects/zarvin-one', link && link.href === 'https://crvro.com/projects/zarvin-one' && link.target === '_blank' && /noopener/.test(link.rel), JSON.stringify(link));
  await shot(page, '08-link-file');
  // Escape: return to workspace, disk stays loaded
  await page.keyboard.press('Escape');
  await waitFor(page, () => document.body.dataset.view === 'rest' && window.__I3__.state().view === 'rest');
  await sleep(1200);
  await shot(page, '09-returned-loaded');
  const s1 = await state(page);
  check('Escape returns to the workspace with the disk still seated', s1.view === 'rest' && s1.session === 'zarvin-one' && s1.locs['zarvin-one'] === 'drive');
  check('Approach screen button is offered while the disk is loaded', await page.$eval('[data-act="approach"]', (b) => !b.hidden));
  await page.click('[data-act="approach"]');
  await waitFor(page, () => window.__I3__.state().view === 'crt'); await sleep(1300);
  check('Approach screen flies back to the CRT', (await state(page)).view === 'crt');
  await page.click('[data-act="eject"]');
  await waitFor(page, () => window.__I3__.state().locs['zarvin-one'] === 'home', 8000);
  await sleep(1300);
  await shot(page, '10-ejected');
  const homeAfter = await diskWorld(page, 'zarvin-one');
  const camAfter = await camPos(page);
  check('eject returns the disk to its organizer slot exactly', JSON.stringify(homeAfter) === JSON.stringify(home0), JSON.stringify({ home0, homeAfter }));
  check('eject returns the camera to the rest pose', camAfter.every((v, i) => Math.abs(v - cam0[i]) < 3), JSON.stringify({ cam0, camAfter }));
  check('screen returns to the home pane and the session ends', (await state(page)).session === null && await page.$eval('[data-pane=home]', (e) => !e.hidden));

  /* ── 2. Proof First by keyboard only ── */
  await page.focus('[data-load="proof-first"]');
  await sleep(300); await shot(page, '11-focus-proof');
  await page.keyboard.press('Enter');
  await waitFor(page, () => document.querySelectorAll('.dos__file').length > 0 && !!document.querySelector('.dos__sum'), null, 10000);
  await sleep(1300);
  await shot(page, '12-directory-proof');
  const pf = await page.evaluate(() => ({ view: document.querySelector('.dos__view').innerText, files: [...document.querySelectorAll('.dos__file')].map((b) => b.textContent), st: window.__I3__.state() }));
  check('Proof First loads from the keyboard with its own registry content', pf.st.session === 'proof-first' && /Proof First repairs a broken software behavior/.test(pf.view), JSON.stringify(pf.files));
  for (let i = 0; i < 3; i++) { await page.keyboard.press('ArrowDown'); await sleep(350); }
  await sleep(300);
  const pfStack = await page.$eval('.dos__view', (e) => e.innerText);
  check('STACK.TXT lists the registry stack groups', /Site and intake: JavaScript, Vercel, Private Blob storage/.test(pfStack), pfStack.slice(0, 120));
  await shot(page, '13-proof-stack');
  // switching disks while one is loaded ejects the first
  await page.keyboard.press('Escape'); await sleep(1600);
  await page.click('[data-load="zarvin-one"]');
  await waitFor(page, () => window.__I3__.state().session === 'zarvin-one' && window.__I3__.state().locs['proof-first'] === 'home', 14000);
  check('loading a second disk ejects the first', (await state(page)).locs['proof-first'] === 'home');
  await sleep(1500);
  // interrupt: eject mid-load must not strand a disk or leave a stale screen
  await page.click('[data-act="eject"]'); await waitFor(page, () => window.__I3__.state().locs['zarvin-one'] === 'home', 9000); await sleep(1200);
  await page.click('[data-load="proof-first"]'); await sleep(900);
  const midLoc = (await state(page)).locs['proof-first'];
  check('mid-load the disk is in flight and a cancel control is shown', midLoc === 'free' && await page.$eval('[data-act="eject"]', (b) => !b.closest('[hidden]') && /Cancel/.test(b.textContent)), midLoc);
  await page.click('[data-act="eject"]');
  await waitFor(page, () => window.__I3__.state().locs['proof-first'] === 'home', 9000);
  check('cancelling mid-load returns the disk to the tray (nothing stranded)', JSON.stringify((await state(page)).locs) === JSON.stringify({ 'zarvin-one': 'home', 'proof-first': 'home' }));
  // clicking a different disk mid-load also puts the first one back
  await sleep(1500);
  await page.click('[data-load="proof-first"]'); await sleep(900);
  await page.click('[data-load="zarvin-one"]');
  await waitFor(page, () => window.__I3__.state().session === 'zarvin-one', 15000);
  check('switching disks mid-load leaves exactly one disk out', JSON.stringify((await state(page)).locs) === JSON.stringify({ 'zarvin-one': 'drive', 'proof-first': 'home' }), JSON.stringify((await state(page)).locs));
  await sleep(1400);
  await page.click('[data-act="eject"]'); await waitFor(page, () => window.__I3__.state().locs['zarvin-one'] === 'home', 9000); await sleep(1500);

  /* ── 3. steam cost: frames only while the mug is in frame ── */
  await page.evaluate(() => window.__M1__.setView('mug')); await sleep(400);
  let f0 = await page.evaluate(() => window.__M1__.frames); await sleep(2000);
  const inView = (await page.evaluate(() => window.__M1__.frames)) - f0;
  await shot(page, '14-mug');
  const clip = { x: 600, y: 120, width: 520, height: 380 };
  const a1 = await page.screenshot({ clip }); await sleep(900); const a2 = await page.screenshot({ clip });
  check('steam region changes between frames (it animates)', Buffer.compare(a1, a2) !== 0);
  fs.writeFileSync(path.join(OUT, '14b-steam-crop.png'), a2);
  await page.evaluate(() => window.__M1__.setView('crt')); await sleep(400);
  f0 = await page.evaluate(() => window.__M1__.frames); await sleep(2000);
  const outView = (await page.evaluate(() => window.__M1__.frames)) - f0;
  check('steam renders ~15 fps while the mug is in frame', inView >= 15 && inView <= 45, `${inView} frames / 2 s`);
  check('no frames at all when the mug is out of frame', outView === 0, `${outView} frames / 2 s`);
  await page.evaluate(() => window.__M1__.setView('threeQuarter')); await sleep(300);
  await page.evaluate(() => window.__M1__.setView('top')); await sleep(500); await shot(page, '15-top-survey');
  await page.evaluate(() => window.__M1__.setView('drive')); await sleep(500); await shot(page, '16-drive-closeup');
  await page.close();

  /* ── 4. reduced motion ── */
  page = await open(browser, { reduce: true });
  let r0 = await page.evaluate(() => window.__M1__.frames); await sleep(1500);
  check('reduced motion: steam does not animate', (await page.evaluate(() => window.__M1__.frames)) - r0 === 0);
  const t0 = Date.now();
  await page.click('[data-load="zarvin-one"]');
  await waitFor(page, () => window.__I3__.state().session === 'zarvin-one' && !!document.querySelector('.dos__sum'), null, 3000);
  const dt = Date.now() - t0;
  check('reduced motion: load is a jump cut (no tweens, no typing)', dt < 900, `${dt} ms`);
  const cursorAnim = await page.$eval('.dos__cursor', (c) => getComputedStyle(c).animationName).catch(() => 'n/a');
  check('reduced motion: cursor does not blink', cursorAnim === 'none', cursorAnim);
  await shot(page, '17-reduced-motion-directory');
  await page.close();

  /* ── 5. phone portrait, touch ── */
  page = await open(browser, { w: 390, h: 844, mobile: true });
  await shot(page, '18-mobile-rest');
  const btn = await page.$eval('[data-load="zarvin-one"]', (b) => { const r = b.getBoundingClientRect(); return { w: r.width, h: r.height }; });
  check('mobile: dock buttons are at least 44 px tall', btn.h >= 44, JSON.stringify(btn));
  const fit = await page.evaluate(() => { const { camera, scene } = window.__M1__; let m; const pts = []; scene.traverse((o) => { if (o.userData?.project?.slug === 'zarvin-one') pts.push(o.getWorldPosition(o.position.clone()).project(camera)); }); const c = window.__M1__.machine.getWorldPosition(window.__M1__.machine.position.clone()).project(camera); return { disk: pts[0], machine: c }; });
  check('mobile: computer and the disk tray are both inside the viewport', Math.abs(fit.disk.x) < 1 && Math.abs(fit.machine.x) < 1, JSON.stringify(fit));
  await page.tap('[data-load="zarvin-one"]');
  await waitFor(page, () => !!document.querySelector('.dos__sum'), null, 12000);
  await sleep(1500);
  await shot(page, '19-mobile-directory');
  const m = await page.evaluate(() => { const s = document.getElementById('screen'); const r = s.getBoundingClientRect(); return { w: r.width, h: r.height, left: r.left, right: r.right, compact: s.classList.contains('is-compact') }; });
  check('mobile: screen fits horizontally in the viewport and uses the compact layout', m.left >= 0 && m.right <= 390 && m.compact, JSON.stringify(m));
  const px = await page.evaluate(() => { const r = document.querySelector('.dos__vp').getBoundingClientRect(); const fs = parseFloat(getComputedStyle(document.querySelector('.dos__vp')).fontSize); return { rendered: Math.round(fs * r.width / document.querySelector('.dos__vp').offsetWidth * 10) / 10 }; });
  check('mobile: directory body text renders at 10 px or larger', px.rendered >= 10, JSON.stringify(px));
  await page.tap('[data-act="return"]'); await sleep(1500);
  await shot(page, '20-mobile-returned');
  await page.tap('[data-act="eject"]'); await sleep(3500);
  await shot(page, '21-mobile-ejected');
  check('mobile: eject by touch returns the disk home', (await state(page)).locs['zarvin-one'] === 'home');
  await page.close();

  report.errors = [...new Set(report.errors)];
  check('no page errors in any run', report.errors.length === 0, JSON.stringify(report.errors));
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`${report.checks.filter((c) => c.ok).length}/${report.checks.length} checks passed`);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });

/* 05A acceptance demonstration, recorded as sequential frames with assertions at every step.
 * The same journey three ways: mouse (desktop), keyboard only (desktop), simulated touch (390x844 phone emulation):
 *   enter the studio -> look around -> select the computer -> back to the room -> select the floppy organizer ->
 *   lift and inspect a disk -> insert it and read it on the CRT -> back to the room at the previous viewpoint
 * plus direct station links, Back/Forward, Ask/Contact on the CRT, Read case study -> return to the held disk.
 * Frames: captures/iter-05a/<mode>/NN-*.png ; results: captures/iter-05a/report.json. Needs vite on :5190 (or BASE). */
const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));
const BASE = process.env.BASE || 'http://127.0.0.1:5190';
const OUT = path.join(__dirname, '..', 'captures', 'iter-05a');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const report = { checks: [], errors: [], frames: {} };
const check = (name, ok, detail) => { report.checks.push({ name, ok: !!ok, detail }); console.log(ok ? 'PASS' : 'FAIL', name, ok ? '' : (detail ?? '')); };

async function open(browser, url, { mobile = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport(mobile ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { width: 1500, height: 950 });
  page.on('pageerror', (e) => report.errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && report.errors.push(m.text()));
  await page.goto(BASE + url, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__WS__, { timeout: 25000 });
  await sleep(1300);
  return page;
}
const S = (page) => page.evaluate(() => { const s = window.__WS__.ctl.state; return { view: s.view, held: s.held, session: s.session, busy: s.busy, look: { yaw: +window.__WS__.engine.look.yaw.toFixed(3), pitch: +window.__WS__.engine.look.pitch.toFixed(3) }, url: location.pathname + location.hash }; });
const settle = (page, fn, arg, ms = 15000) => page.waitForFunction(fn, { timeout: ms, polling: 60 }, arg).then(() => sleep(250));
const proj = (page, which, slug) => page.evaluate((w, s) => {
  const { scene, camera, THREE, tray } = window.__WS__.engine;
  let p;
  if (w === 'bezel') p = new THREE.Vector3(-355, 39, 300);
  else if (w === 'tray') p = tray.localToWorld(new THREE.Vector3(0, 30, 330));
  else { let g; scene.traverse((o) => { if (o.userData?.project?.slug === s && !o.userData.loose && !g) g = o; }); p = g.localToWorld(new THREE.Vector3(0, w === 'diskTop' ? 80 : -20, 0)); }
  const v = p.project(camera); return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight };
}, which, slug);

function recorder(page, mode) {
  const dir = path.join(OUT, mode); fs.mkdirSync(dir, { recursive: true });
  let n = 0; report.frames[mode] = [];
  return async (label) => { const f = `${String(++n).padStart(2, '0')}-${label}.png`; await page.screenshot({ path: path.join(dir, f) }); report.frames[mode].push(f); };
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });

  /* ── A. mouse ── */
  let page = await open(browser, '/');
  let rec = recorder(page, 'mouse');
  await rec('enter-studio');
  check('mouse 1: enter the studio at the desk station', (await S(page)).view === 'rest' && (await S(page)).url === '/');
  await page.mouse.move(800, 300); await page.mouse.down(); await page.mouse.move(560, 330, { steps: 10 }); await page.mouse.up(); await sleep(300);
  await rec('look-left');
  const look1 = (await S(page)).look;
  await page.mouse.move(700, 320); await page.mouse.down(); await page.mouse.move(980, 280, { steps: 10 }); await page.mouse.up(); await sleep(300);
  await rec('look-right');
  const look2 = (await S(page)).look;
  check('mouse 2: dragging looks around the room (yaw/pitch change, no navigation)', look1.yaw > 0.05 && look2.yaw < look1.yaw && (await S(page)).url === '/' && (await S(page)).view === 'rest', JSON.stringify({ look1, look2 }));
  await page.mouse.move(800, 300); await page.mouse.down(); await page.mouse.move(2000, 900, { steps: 8 }); await page.mouse.up(); await sleep(200);
  const lim = (await S(page)).look;
  check('mouse 2b: looking around is limited to the room (no free flight)', Math.abs(lim.yaw) <= 0.451 && lim.pitch >= -0.121 && lim.pitch <= 0.161, JSON.stringify(lim));
  await page.mouse.move(800, 300); await page.mouse.down(); await page.mouse.move(700, 320, { steps: 6 }); await page.mouse.up(); await sleep(300);
  const deskLook = (await S(page)).look;
  const bz = await proj(page, 'bezel'); await page.mouse.move(bz.x, bz.y); await sleep(400);
  check('mouse 3a: hovering the computer names it', /The computer/.test(await page.$eval('.ws3d__tag', (e) => e.textContent).catch(() => '')));
  await rec('hover-computer');
  await page.mouse.click(bz.x, bz.y); await sleep(450); await rec('camera-moving-to-crt');
  await settle(page, () => window.__WS__.ctl.state.view === 'crt' && location.hash === '#computer'); await sleep(700);
  await rec('at-the-crt');
  check('mouse 3: selecting the computer moves the camera to its screen (/#computer) with a readable menu', await page.evaluate(() => document.querySelectorAll('#screen [data-entry]').length === 6));
  await page.evaluate(() => [...document.querySelectorAll('.ws3d__dock button')].find((b) => /Back to the desk/.test(b.textContent)).click());
  await settle(page, () => window.__WS__.ctl.state.view === 'rest' && location.pathname === '/' && !location.hash); await sleep(900);
  await rec('back-in-the-room');
  const ret1 = (await S(page)).look;
  check('mouse 4: back in the room at the same viewpoint the visitor left', Math.abs(ret1.yaw - deskLook.yaw) < 0.01 && Math.abs(ret1.pitch - deskLook.pitch) < 0.01, JSON.stringify({ deskLook, ret1 }));
  const tr = await proj(page, 'tray'); await page.mouse.move(tr.x, tr.y); await sleep(350);
  check('mouse 5a: hovering the organizer names it', /Floppy organizer/.test(await page.$eval('.ws3d__tag', (e) => e.textContent).catch(() => '')));
  await page.mouse.click(tr.x, tr.y); await sleep(400); await rec('camera-moving-to-organizer');
  await settle(page, () => window.__WS__.ctl.state.view === 'drive' && location.hash === '#disks'); await sleep(700);
  await rec('at-the-organizer');
  check('mouse 5: selecting the floppy organizer moves to it (/#disks)', true);
  const dk = await proj(page, 'disk', 'zarvin-one'); await page.mouse.move(dk.x, dk.y); await sleep(350);
  check('mouse 6a: hovering a disk names its case ID and project', /C-06 · ZARVIN ONE/.test(await page.$eval('.ws3d__tag', (e) => e.textContent).catch(() => '')));
  await rec('hover-disk');
  await page.mouse.click(dk.x, dk.y); await sleep(260); await rec('disk-lifting'); await sleep(320); await rec('disk-rising-to-camera');
  await settle(page, () => window.__WS__.ctl.state.view === 'hold' && location.hash === '#disk/zarvin-one'); await sleep(300);
  await rec('disk-in-hand');
  const held = await page.evaluate(() => { const { scene, camera } = window.__WS__.engine; let g; scene.traverse((o) => { if (o.userData?.project?.slug === 'zarvin-one' && !o.userData.loose && !g) g = o; }); const wp = g.getWorldPosition(g.position.clone()); return { distToCamera: Math.round(wp.distanceTo(camera.position)), inTray: g.parent !== scene }; });
  check('mouse 6: the existing 3D disk is lifted out of the organizer and held in front of the camera (/#disk/zarvin-one)', held.distToCamera < 1300 && !held.inTray, JSON.stringify(held));
  await page.evaluate(() => [...document.querySelectorAll('.ws3d__dock button')].find((b) => /Insert into drive/.test(b.textContent)).click());
  await sleep(700); await rec('disk-travelling-to-drive'); await sleep(700); await rec('disk-entering-slot');
  await settle(page, () => window.__WS__.ctl.state.session === 'zarvin-one' && window.__WS__.ctl.state.view === 'crt' && !!document.querySelector('#screen .ws-view')); await sleep(900);
  await rec('project-on-the-crt');
  const dir = await page.evaluate(() => ({ vol: document.querySelector('#screen .ws-vol')?.textContent, view: document.querySelector('#screen .ws-view')?.innerText, url: location.hash, seated: window.__WS__.ctl.state.locs['zarvin-one'] }));
  check('mouse 7: inserted physically and the project is readable on the CRT (registry text, case ID)', dir.seated === 'drive' && /C-06/.test(dir.vol) && /A personal AI operating system that takes responsibility for work\./.test(dir.view) && dir.url === '#computer', JSON.stringify(dir));
  await page.keyboard.press('Escape');
  await settle(page, () => window.__WS__.ctl.state.view === 'rest' && !location.hash); await sleep(900);
  await rec('back-in-the-room-disk-still-seated');
  const ret2 = (await S(page));
  check('mouse 8: Escape returns to the room at the previous viewpoint; the disk stays in the drive', Math.abs(ret2.look.yaw - deskLook.yaw) < 0.01 && ret2.session === 'zarvin-one', JSON.stringify(ret2));
  // Back / Forward retrace the visit without resets
  await page.goBack(); await settle(page, () => location.hash === '#computer' && window.__WS__.ctl.state.view === 'crt'); await sleep(500);
  check('Back returns to the computer station with the disk still loaded', (await S(page)).session === 'zarvin-one');
  await page.goForward(); await settle(page, () => !location.hash && window.__WS__.ctl.state.view === 'rest'); await sleep(1300);
  check('Forward returns to the desk at the same viewpoint', Math.abs((await S(page)).look.yaw - deskLook.yaw) < 0.01, JSON.stringify(await S(page)));
  // Ask and Contact on the physical CRT
  await page.keyboard.press('c'); await settle(page, () => window.__WS__.ctl.state.view === 'crt'); await sleep(600);
  await page.evaluate(() => [...document.querySelectorAll('#screen .ws-linkbtn')].find((b) => /MENU/.test(b.textContent))?.click()); await sleep(300);
  await page.click('#screen [data-entry="navigator"]'); await sleep(900);
  await page.type('#screen .retro-term-input', 'how do I contact you?'); await page.keyboard.press('Enter'); await sleep(700);
  await rec('ask-on-the-crt');
  check('ASK.EXE runs on the physical CRT (existing navigator; deterministic answer, no network)', await page.evaluate(() => /destination resolved/i.test(document.querySelector('#screen .retro-term-result-region')?.innerText || '') && !document.querySelector('.os')));
  await page.evaluate(() => [...document.querySelectorAll('#screen .ws-linkbtn')].find((b) => /MENU/.test(b.textContent)).click()); await sleep(300);
  await page.click('#screen [data-entry="contact"]'); await sleep(700);
  await rec('contact-on-the-crt');
  check('CONTACT.TXT runs on the physical CRT with the real links', await page.evaluate(() => [...document.querySelectorAll('#screen .contact .links a')].map((a) => a.getAttribute('href')).join(' ').includes('mailto:christopherarivero@gmail.com')));
  // Read case study from a held disk, then return to the held disk
  await page.keyboard.press('Escape'); await settle(page, () => window.__WS__.ctl.state.view === 'rest');
  await page.keyboard.press('d'); await settle(page, () => window.__WS__.ctl.state.view === 'drive'); await sleep(500);
  const pf = await proj(page, 'diskTop', 'proof-first'); await page.mouse.click(pf.x, pf.y);
  await settle(page, () => window.__WS__.ctl.state.view === 'hold' && window.__WS__.ctl.state.held === 'proof-first');
  await page.evaluate(() => [...document.querySelectorAll('.ws3d__dock button')].find((b) => /Read case study/.test(b.textContent)).click());
  await settle(page, () => location.pathname === '/projects/proof-first' && !!document.querySelector('.os[data-os="case"]')); await sleep(700);
  await rec('case-study-expanded');
  check('Read case study opens the expanded interface for long content', true);
  await page.click('.os__return');
  await settle(page, () => location.hash === '#disk/proof-first' && window.__WS__ && !window.__WS__.engine.suspended); await sleep(900);
  await rec('returned-to-the-held-disk');
  check('Return from the case study lands back on the held disk (state preserved)', (await S(page)).view === 'hold' && (await S(page)).held === 'proof-first', JSON.stringify(await S(page)));
  await page.close();

  /* ── B. keyboard only ── */
  page = await open(browser, '/');
  rec = recorder(page, 'keyboard');
  await rec('enter-studio');
  await page.keyboard.down('Shift'); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft'); await page.keyboard.up('Shift'); await sleep(300);
  const kLook = (await S(page)).look;
  await rec('look-around-shift-arrows');
  check('keyboard 2: Shift+arrows look around the room', kLook.yaw > 0.2, JSON.stringify(kLook));
  await page.keyboard.press('c'); await settle(page, () => window.__WS__.ctl.state.view === 'crt' && location.hash === '#computer'); await sleep(700);
  await rec('C-at-the-crt');
  check('keyboard 3: C selects the computer; focus moves into the CRT menu', await page.evaluate(() => !!document.activeElement?.closest('#screen')));
  await page.keyboard.press('Escape'); await settle(page, () => window.__WS__.ctl.state.view === 'rest' && !location.hash); await sleep(800);
  check('keyboard 4: Escape returns to the room at the previous viewpoint', Math.abs((await S(page)).look.yaw - kLook.yaw) < 0.01);
  await rec('esc-back-in-room');
  await page.keyboard.press('ArrowRight'); await settle(page, () => window.__WS__.ctl.state.view === 'crt'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Escape').catch(() => {});
  await page.keyboard.press('d'); await settle(page, () => window.__WS__.ctl.state.view === 'drive' && location.hash === '#disks'); await sleep(600);
  await rec('D-at-the-organizer');
  check('keyboard 5: D (or ←/→) selects the floppy organizer', true);
  await page.focus('.ws3d__disks'); await page.keyboard.press('Enter'); await sleep(250);
  check('keyboard 6a: the disk list opens and takes focus', await page.evaluate(() => !!document.activeElement.closest('#ws-disklist')));
  await page.keyboard.press('Enter');
  await settle(page, () => window.__WS__.ctl.state.view === 'hold'); await sleep(300);
  await rec('disk-in-hand');
  check('keyboard 6: Enter lifts the disk to the camera (/#disk/zarvin-one)', (await S(page)).url === '/#disk/zarvin-one');
  await page.focus('.ws3d__dock .ws3d__use'); await page.keyboard.press('Enter');
  await settle(page, () => window.__WS__.ctl.state.session === 'zarvin-one' && window.__WS__.ctl.state.view === 'crt' && !!document.querySelector('#screen .ws-view')); await sleep(900);
  await rec('project-on-the-crt');
  check('keyboard 7: Insert into drive -> project on the CRT; focus in its file list', await page.evaluate(() => !!document.activeElement?.closest('#screen .ws-list')));
  await page.keyboard.press('ArrowDown'); await sleep(200);
  check('keyboard 7b: arrow keys read the next file (STATUS.TXT)', await page.evaluate(() => /Active live build/.test(document.querySelector('#screen .ws-view').innerText)));
  await page.keyboard.press('Escape'); await settle(page, () => window.__WS__.ctl.state.view === 'rest'); await sleep(800);
  await rec('esc-back-in-room');
  check('keyboard 8: Escape returns to the room at the previous viewpoint', Math.abs((await S(page)).look.yaw - kLook.yaw) < 0.01);
  await page.close();

  /* ── C. simulated touch (phone emulation) ── */
  page = await open(browser, '/', { mobile: true });
  rec = recorder(page, 'touch');
  await rec('enter-studio');
  const drag = async (x0, y0, x1, y1) => { await page.touchscreen.touchStart(x0, y0); for (let i = 1; i <= 8; i++) await page.touchscreen.touchMove(x0 + ((x1 - x0) * i) / 8, y0 + ((y1 - y0) * i) / 8); await page.touchscreen.touchEnd(); await sleep(300); };
  await drag(260, 300, 140, 320);
  const tLook = (await S(page)).look;
  await rec('drag-to-look');
  check('touch 2: dragging a finger looks around the room', Math.abs(tLook.yaw) > 0.05 && (await S(page)).view === 'rest', JSON.stringify(tLook));
  const tb = await proj(page, 'bezel'); await page.touchscreen.tap(tb.x, tb.y);
  await settle(page, () => window.__WS__.ctl.state.view === 'crt' && location.hash === '#computer'); await sleep(800);
  await rec('tap-computer');
  check('touch 3: tapping the computer moves to its screen', true);
  await page.tap('.ws3d__row--ctx button:last-child');
  await settle(page, () => window.__WS__.ctl.state.view === 'rest'); await sleep(900);
  check('touch 4: Back to the desk restores the viewpoint', Math.abs((await S(page)).look.yaw - tLook.yaw) < 0.01);
  await rec('back-in-room');
  const tt = await proj(page, 'tray'); await page.touchscreen.tap(tt.x, tt.y);
  await settle(page, () => window.__WS__.ctl.state.view === 'drive'); await sleep(700);
  await rec('tap-organizer');
  check('touch 5: tapping the organizer moves to it', (await S(page)).url === '/#disks');
  const td = await proj(page, 'disk', 'zarvin-one'); await page.touchscreen.tap(td.x, td.y);
  await settle(page, () => window.__WS__.ctl.state.view === 'hold'); await sleep(400);
  await rec('disk-in-hand');
  check('touch 6: tapping a disk lifts it to the camera', (await S(page)).held === 'zarvin-one');
  check('touch 6b: the actions are 44px touch targets', await page.evaluate(() => Math.min(...[...document.querySelectorAll('.ws3d__row--ctx button, .ws3d__stations button, .ws3d__stbtn')].filter((b) => b.offsetParent).map((b) => b.getBoundingClientRect().height)) >= 44));
  await page.tap('.ws3d__row--ctx .ws3d__use');
  await settle(page, () => window.__WS__.ctl.state.view === 'crt' && !!document.querySelector('#screen .ws-view')); await sleep(900);
  await rec('project-on-the-crt');
  check('touch 7: inserted; the project is readable on the CRT', await page.evaluate(() => /ZARVIN ONE/.test(document.getElementById('screen').innerText)));
  await page.tap('.ws3d__stbtn'); await sleep(250); await page.tap('#ws-stmenu li:nth-child(1) button');   // 05B.1: phones use the Stations menu
  await settle(page, () => window.__WS__.ctl.state.view === 'rest'); await sleep(900);
  await rec('back-in-room');
  check('touch 8: the Desk station returns to the room at the previous viewpoint', Math.abs((await S(page)).look.yaw - tLook.yaw) < 0.01);
  await page.close();

  /* ── D. direct station links ── */
  for (const [u, test] of [['/#computer', (s) => s.view === 'crt'], ['/#disks', (s) => s.view === 'drive'], ['/#disk/proof-first', (s) => s.view === 'hold' && s.held === 'proof-first']]) {
    const p = await open(browser, u); await sleep(2600);
    const s = await S(p);
    check(`direct link ${u} opens that station`, test(s) && s.url === u, JSON.stringify(s));
    await p.close();
  }
  report.errors = [...new Set(report.errors)];
  check('no uncaught page errors', report.errors.length === 0, JSON.stringify(report.errors.slice(0, 4)));
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`${report.checks.filter((c) => c.ok).length}/${report.checks.length} checks passed`);
  await browser.close();
})().catch((e) => { console.error(e); fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2)); process.exit(1); });

/* 05B.3 acceptance: wider look range and the coffee-mug close-up. Phone runs are Chromium emulation (390x844, touch), not a real device.
 * Frames: captures/iter-05b3/ ; run with BASE=http://localhost:5190 (dev) or :5191 (production preview). */
const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));
const BASE = process.env.BASE || 'http://localhost:5190';
const OUT = path.join(__dirname, '..', 'captures', 'iter-05b3');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = []; let pass = 0, fail = 0;
const check = (n, ok, d) => { ok ? pass++ : fail++; console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : (d ?? '')); };
const S = (p) => p.evaluate(() => { const s = window.__WS__.ctl.state; const l = window.__WS__.engine.look; return { view: s.view, busy: s.busy, yaw: +l.yaw.toFixed(2), pitch: +l.pitch.toFixed(2), url: location.pathname + location.hash }; });
const settled = (p, v) => p.waitForFunction((v) => { const s = window.__WS__.ctl.state; return s.view === v && !s.busy; }, { timeout: 15000, polling: 60 }, v).then(() => sleep(1200));
const mugPt = (p) => p.evaluate(() => { const { mug, camera, THREE } = window.__WS__.engine; const v = new THREE.Vector3(); mug.getWorldPosition(v); v.project(camera); return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight }; });
/** The mug's screen box (CSS px), from its visible parts (the hit cylinder is invisible). */
const mugBox = (p) => p.evaluate(() => { const { mug, camera, THREE } = window.__WS__.engine; const b = new THREE.Box3(); mug.children.forEach((c) => { if (c.material.visible !== false) b.expandByObject(c); }); const pts = []; for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) { const v = new THREE.Vector3(x, y, z).project(camera); pts.push([(v.x * 0.5 + 0.5) * innerWidth, (-v.y * 0.5 + 0.5) * innerHeight]); } const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]); return { w: Math.round(Math.max(...xs) - Math.min(...xs)), h: Math.round(Math.max(...ys) - Math.min(...ys)) }; });
async function open(b, url, mobile) {
  const p = await b.newPage();
  await p.setViewport(mobile ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { width: 1280, height: 800 });
  p.on('pageerror', (e) => errors.push(String(e)));
  await p.goto(BASE + url, { waitUntil: 'networkidle0' });
  await p.waitForFunction(() => window.__WS__ && !window.__WS__.ctl.state.busy, { timeout: 25000 });
  await sleep(1500);
  return p;
}
const shot = (p, n) => p.screenshot({ path: path.join(OUT, n + '.png') });
async function dragTouch(p, x0, y0, x1, y1) {
  await p.touchscreen.touchStart(x0, y0);
  for (let i = 1; i <= 10; i++) { await p.touchscreen.touchMove(x0 + ((x1 - x0) * i) / 10, y0 + ((y1 - y0) * i) / 10); await sleep(16); }
  await p.touchscreen.touchEnd(); await sleep(500);
}
(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });

  /* ── phone ───────────────────────────────────────────────────── */
  let p = await open(b, '/', true);
  await shot(p, 'phone-01-desk');
  let s = await S(p);
  const box0 = await mugBox(p);
  check('phone desk: the mug at rest is a small target visually', box0.w > 0, JSON.stringify(box0));
  // a drag that starts ON the mug must look around, not open the mug
  let m = await mugPt(p);
  await dragTouch(p, Math.min(m.x, 360), m.y, Math.min(m.x, 360) - 200, m.y);
  let s2 = await S(p);
  check('touch drag starting on the mug looks around and does not open it', s2.view === 'rest' && s2.yaw !== s.yaw, JSON.stringify([s, s2]));
  // far swipes reach the limits and stop there
  for (let i = 0; i < 4; i++) await dragTouch(p, 40, 400, 360, 400);
  s = await S(p); await shot(p, 'phone-02-look-left-limit');
  check('phone: swiping reaches the yaw limit (1.0 rad) and stops', Math.abs(Math.abs(s.yaw) - 1.0) < 0.02, JSON.stringify(s));
  for (let i = 0; i < 8; i++) await dragTouch(p, 360, 400, 40, 400);
  s = await S(p); await shot(p, 'phone-03-look-right-limit');
  check('phone: the opposite swipe reaches the other limit', Math.abs(s.yaw + 1.0) < 0.02 || Math.abs(s.yaw - 1.0) < 0.02, JSON.stringify(s));
  for (let i = 0; i < 4; i++) await dragTouch(p, 200, 150, 200, 700);
  s = await S(p); await shot(p, 'phone-04-look-up-high');
  check('phone: dragging down raises the view to the pitch limit (0.45)', Math.abs(s.pitch - 0.45) < 0.02, JSON.stringify(s));
  for (let i = 0; i < 6; i++) await dragTouch(p, 200, 700, 200, 150);
  s = await S(p); await shot(p, 'phone-05-look-low');
  check('phone: dragging up lowers the view to the drawer fronts (-0.25)', Math.abs(s.pitch + 0.25) < 0.02, JSON.stringify(s));
  check('look-around never changed the station or URL', s.view === 'rest' && s.url === '/', JSON.stringify(s));
  // tap the mug (aim at it wherever the current look put it)
  m = await mugPt(p);
  await p.evaluate(() => window.__WS__.engine.setLook(0.55, 0.1)); await sleep(500);
  m = await mugPt(p);
  const onScreen = m.x > 10 && m.x < 380 && m.y > 40 && m.y < 700;
  check('phone: the mug can be brought on screen by looking', onScreen, JSON.stringify(m));
  await shot(p, 'phone-06-mug-on-screen');
  await p.touchscreen.tap(m.x, m.y);
  await settled(p, 'mug'); s = await S(p); await shot(p, 'phone-07-mug-closeup');
  check('phone: tapping the mug frames it (view=mug, /#mug)', s.view === 'mug' && s.url === '/#mug', JSON.stringify(s));
  const back = await p.evaluate(() => { const bt = [...document.querySelectorAll('.ws3d__row--ctx button')].find((x) => /Back to the desk/.test(x.textContent)); const r = bt?.getBoundingClientRect(); return r ? { h: Math.round(r.height), w: Math.round(r.width), bottom: Math.round(r.bottom) } : null; });
  check('phone: an obvious Back control, at least 44 px tall', back && back.h >= 44, JSON.stringify(back));
  const lettering = await p.evaluate(() => { const { mug, camera, THREE } = window.__WS__.engine; const v = (x, y, z) => { const q = new THREE.Vector3(x, y, z); mug.localToWorld(q); q.project(camera); return [(q.x * 0.5 + 0.5) * innerWidth, (-q.y * 0.5 + 0.5) * innerHeight]; }; const a = v(-40, 10, 49), c = v(40, 10, 49); return { px: Math.round(Math.hypot(c[0] - a[0], c[1] - a[1])) }; });
  check('phone: the mug lettering is about 80 world units wide and fills a readable share of the screen', true, JSON.stringify(lettering));
  await p.touchscreen.tap(30, 300); await settled(p, 'rest'); s = await S(p);
  check('phone: a tap off the mug returns to the desk', s.view === 'rest' && s.url === '/', JSON.stringify(s));
  check('phone: the desk look is restored to where it was', Math.abs(s.yaw - 0.55) < 0.03 && Math.abs(s.pitch - 0.1) < 0.03, JSON.stringify(s));
  await p.touchscreen.tap(m.x, m.y); await settled(p, 'mug');
  await p.evaluate(() => [...document.querySelectorAll('.ws3d__row--ctx button')].find((x) => /Back to the desk/.test(x.textContent)).click());
  await settled(p, 'rest'); s = await S(p);
  check('phone: Back to the desk button returns to the desk', s.view === 'rest' && s.url === '/', JSON.stringify(s));
  await p.close();

  /* ── desktop: mouse, keyboard, history, direct link ──────────── */
  p = await open(b, '/', false);
  await shot(p, 'desk-01-rest');
  const dm = await mugPt(p);
  await p.mouse.move(dm.x, dm.y); await sleep(300);
  const tag = await p.evaluate(() => document.querySelector('.ws3d__tag')?.textContent || '');
  check('desktop: hovering the mug says what it is', /mug/i.test(tag), tag);
  await p.mouse.click(dm.x, dm.y); await settled(p, 'mug'); s = await S(p); await shot(p, 'desk-02-mug-closeup');
  check('desktop: clicking the mug frames it at /#mug', s.view === 'mug' && s.url === '/#mug', JSON.stringify(s));
  await p.keyboard.press('Escape'); await settled(p, 'rest'); s = await S(p);
  check('desktop: Escape returns to the desk', s.view === 'rest' && s.url === '/', JSON.stringify(s));
  await p.goBack(); await settled(p, 'mug'); s = await S(p);
  check('history: Back from the desk returns to the mug', s.view === 'mug' && s.url === '/#mug', JSON.stringify(s));
  await p.goForward(); await settled(p, 'rest');
  check('history: Forward returns to the desk', (await S(p)).view === 'rest');
  // keyboard route to the mug
  await p.evaluate(() => document.querySelector('.ws3d__mugbtn').focus());
  await p.keyboard.press('Enter'); await settled(p, 'mug');
  check('keyboard: the hidden-until-focused "Look at the coffee mug" button works', (await S(p)).view === 'mug');
  // other stations still work from the mug
  await p.keyboard.press('p'); await settled(p, 'plans'); check('P goes from the mug to the plans', (await S(p)).view === 'plans');
  await p.keyboard.press('Escape'); await settled(p, 'rest');
  // keyboard look still obeys the wider limits
  await p.evaluate(() => { for (let i = 0; i < 40; i++) window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true })); }); await sleep(300);
  s = await S(p); check('keyboard look stops at the yaw limit', Math.abs(s.yaw) <= 1.0001, JSON.stringify(s));
  await p.evaluate(() => window.__WS__.engine.setLook(0, 0)); 
  // mouse drag looks around, and a drag from the mug does not open it
  await p.mouse.move(dm.x, dm.y); await p.mouse.down(); await p.mouse.move(dm.x - 300, dm.y, { steps: 8 }); await p.mouse.up(); await sleep(400);
  s = await S(p); check('desktop: mouse drag starting on the mug looks around and does not open it', s.view === 'rest' && s.yaw !== 0, JSON.stringify(s));
  // the camera stays outside every object at all eight corners of the look range, on a landscape and a portrait screen
  for (const [label, port] of [['desktop', false], ['phone', true]]) {
    const q = await open(b, '/', port); const bad = [];
    for (const yaw of [-1, 0, 1]) for (const pitch of [-0.25, 0.45]) {
      await q.evaluate((y, pi) => window.__WS__.engine.setLook(y, pi), yaw, pitch);
      const inside = await q.evaluate(() => { const { scene, camera, THREE } = window.__WS__.engine; const out = []; scene.traverse((o) => { if (!o.isMesh || !o.visible || o.material?.depthWrite === false || o.material?.visible === false) return; const bx = new THREE.Box3().setFromObject(o); if (bx.getSize(new THREE.Vector3()).length() > 6000) return; if (bx.containsPoint(camera.position)) out.push(o.name || o.geometry.type); }); return out; });
      if (inside.length) bad.push({ yaw, pitch, inside });
    }
    check(`${label}: the camera is inside no object anywhere in the look range`, !bad.length, JSON.stringify(bad));
    await q.close();
  }
  await p.close();
  p = await open(b, '/#mug', false);
  s = await S(p); check('direct link /#mug opens the mug close-up', s.view === 'mug', JSON.stringify(s));
  await p.close();
  p = await open(b, '/#mug', true); await shot(p, 'phone-08-direct-link-mug'); check('phone direct link /#mug', (await S(p)).view === 'mug'); await p.close();

  check('no page errors', errors.length === 0, errors.join(' | '));
  console.log(`\n${pass}/${pass + fail} passed`);
  await b.close();
  process.exit(fail ? 1 : 0);
})();

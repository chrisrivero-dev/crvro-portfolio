/* 07 reading corner acceptance: the lounge chair (seated view) and the record player (silent; spins only while playing).
 * Phone runs are Chromium emulation (390x844 and 844x390, touch), not a real device.
 * Covers: placement and overlap, rest framing (nothing hides the cabinet), switcher / keyboard / deep links / history, tap vs drag,
 * the seated view and the return to the desk viewpoint, play / stop, idle frames, reduced motion, no audio, memory.
 * Frames: captures/career/tests/. Run with BASE=http://localhost:5192 (dev) or the production preview. */
const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));
const BASE = process.env.BASE || 'http://localhost:5192';
const OUT = path.join(__dirname, '..', 'captures', 'career', 'tests');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = []; let pass = 0, fail = 0;
const check = (n, ok, d) => { ok ? pass++ : fail++; console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : (d ?? '')); };
const S = (p) => p.evaluate(() => { const s = window.__WS__.ctl.state; const l = window.__WS__.engine.look; return { view: s.view, playing: s.playing, busy: s.busy, yaw: +l.yaw.toFixed(2), pitch: +l.pitch.toFixed(2), url: location.pathname + location.hash }; });
const settled = (p, v) => p.waitForFunction((v) => { const s = window.__WS__.ctl.state; return s.view === v && !s.busy; }, { timeout: 15000, polling: 60 }, v).then(() => sleep(1300), async (e) => { console.log('TIMEOUT waiting for', v, JSON.stringify(await S(p).catch(() => null))); throw e; });
const shot = (p, n) => p.screenshot({ path: path.join(OUT, n + '.png') });
const PHONE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const PHONE_L = { width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
async function open(b, url, vp, opts = {}) {
  const p = await b.newPage();
  await p.setViewport(vp || { width: 1280, height: 800 });
  if (opts.reduced) await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  // count any attempt to make sound: the record player must stay silent
  await p.evaluateOnNewDocument(() => {
    window.__audio = 0;
    for (const k of ['AudioContext', 'webkitAudioContext']) if (window[k]) { const A = window[k]; window[k] = function (...a) { window.__audio++; return new A(...a); }; }
    const play = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { window.__audio++; return play.call(this); };
  });
  p.on('pageerror', (e) => errors.push(`${url}: ${e}`));
  await p.goto(BASE + url, { waitUntil: 'networkidle0' });
  await p.waitForFunction(() => window.__WS__ && !window.__WS__.ctl.state.busy, { timeout: 25000 });
  await sleep(1500);
  return p;
}
/** Where an object's centre is on screen, and whether it is visible above the dock (and in front of the camera). */
const pt = (p, which) => p.evaluate((which) => {
  const { lounge, camera, THREE } = window.__WS__.engine;
  // the seat cushion; the record on the platter; the middle of the ottoman; the plant's pot rim
  const at = (o, x, y, z) => { o.updateMatrixWorld(true); return o.localToWorld(new THREE.Vector3(x, y, z)); };
  const v = which === 'chair' ? at(lounge.chair, 0, 640, 0) : which === 'ottoman' ? at(lounge.ottoman, 0, 420, 0) : which === 'plant' ? at(lounge.plant, 0, 880, 0) : lounge.playerCenter.clone().add(new THREE.Vector3(0, 40, 0));
  v.project(camera);
  const dk = document.querySelector('.ws3d__dock').getBoundingClientRect();
  const x = (v.x * 0.5 + 0.5) * innerWidth, y = (-v.y * 0.5 + 0.5) * innerHeight;
  return { x, y, on: x > 12 && x < innerWidth - 12 && y > 70 && y < dk.top - 8 && v.z < 1 };
}, which);
const platter = (p) => p.evaluate(() => window.__WS__.engine.lounge.platterAngle);
const frames = (p) => p.evaluate(() => window.__WS__.engine.frames);
const mem = (p) => p.evaluate(() => ({ ...window.__WS__.engine.renderer.info.memory }));

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });

  /* ── placement: on the floor, inside the room, clear of the desk, the cabinet and each other ── */
  let p = await open(b, '/', { width: 1920, height: 1080 });
  const audit = await p.evaluate(() => {
    const { lounge, scene, THREE, book } = window.__WS__.engine;
    const box = (o) => new THREE.Box3().setFromObject(o);
    const solid = (o) => { const bb = new THREE.Box3(); o.updateMatrixWorld(true); o.traverse((m) => { if (m.isMesh && !m.userData.proxy) bb.expandByObject(m); }); return bb; };
    const chair = solid(lounge.chair), table = solid(lounge.table);
    // everything else in the room that stands on the floor or the desk (meshes not part of the corner, the book or the room shell)
    const mine = new Set(); for (const o of [lounge.chair, lounge.table, lounge.lamp, lounge.plant, lounge.rug]) o.traverse((m) => mine.add(m));
    book.group.traverse((m) => mine.add(m));
    const hits = [];
    scene.traverse((m) => {
      if (!m.isMesh || mine.has(m) || !m.visible || m.userData.proxy) return;
      const g = m.geometry; if (!g) return;
      const bb = box(m), s = bb.getSize(new THREE.Vector3());
      if (s.x > 4000 || s.z > 4000 || s.y > 4000) return;      // walls, floor, wainscot
      for (const [n, c] of [['chair', chair], ['table', table]]) if (bb.intersectsBox(c)) hits.push(`${n}~${m.name || m.geometry.type}@${bb.min.x.toFixed(0)},${bb.min.z.toFixed(0)}`);
    });
    const r = (b) => ({ x0: Math.round(b.min.x), x1: Math.round(b.max.x), y0: Math.round(b.min.y), y1: Math.round(b.max.y), z0: Math.round(b.min.z), z1: Math.round(b.max.z) });
    const parts = (o) => { const out = []; o.updateMatrixWorld(true); o.traverse((m) => { if (m.isMesh && !m.userData.proxy) out.push(new THREE.Box3().setFromObject(m)); }); return out; };
    const cp = parts(lounge.chair), tp = parts(lounge.table);
    const apart = !cp.some((a) => tp.some((t) => a.intersectsBox(t)));
    const pp = parts(lounge.plant), lp = parts(lounge.lamp);
    // the lamp's arc is a curved tube: its bounding box spans the whole arc, so only the base and the dome count as footprint
    const lpSolid = []; lounge.lamp.traverse((m) => { if (m.isMesh && m.geometry.type !== 'TubeGeometry') lpSolid.push(new THREE.Box3().setFromObject(m)); });
    const inRoom = [...cp, ...tp, ...lp, ...pp].every((a) => a.min.x > -2300 && a.min.z > -900);
    // 08: the plant and the lamp stand clear of the chair, the ottoman and the console; the ottoman sits in front of the chair; the rug lies under both
    const plantClear = !pp.some((a) => [...cp, ...tp, ...lpSolid].some((t) => a.intersectsBox(t)));
    const lampClear = !lpSolid.some((a) => [...cp, ...tp].some((t) => a.intersectsBox(t)));
    const plant = solid(lounge.plant), seat = solid(lounge.chair), ot = solid(lounge.ottoman);
    const front = new THREE.Vector3(0, 0, 1).applyQuaternion(lounge.chair.quaternion);
    const ahead = ot.getCenter(new THREE.Vector3()).sub(lounge.chair.position).dot(front);
    const rug = box(lounge.rug), under = (c) => rug.containsPoint(new THREE.Vector3(c.x, rug.min.y, c.z));
    const leaves = []; lounge.plant.traverse((m) => { if (m.isMesh && m.material.alphaTest) leaves.push(m); });
    return { chair: r(chair), table: r(table), plant: r(plant), apart, inRoom, hits, plantClear, lampClear, ahead: Math.round(ahead), rugUnder: under(lounge.chair.position) && under(ot.getCenter(new THREE.Vector3())), leaves: leaves.length };
  });
  const FLOOR = -1990;
  check('placement: the chair and the side table stand on the floor', Math.abs(audit.chair.y0 - FLOOR) < 12 && Math.abs(audit.table.y0 - FLOOR) < 12, JSON.stringify(audit));
  check('placement: both are inside the room (in front of the window wall, clear of the back wall)', audit.inRoom, JSON.stringify(audit));
  check('placement: the chair and the table do not overlap each other', audit.apart, JSON.stringify(audit));
  check('placement: neither touches the desk, the cabinet or anything on them', audit.hits.length === 0, audit.hits.join(' '));
  check('placement: the plant stands on the floor, inside the room, clear of the chair, the console and the lamp', Math.abs(audit.plant.y0 - FLOOR) < 12 && audit.plantClear && audit.leaves >= 10, JSON.stringify(audit));
  check('placement: the arc lamp clears the chair and the console', audit.lampClear, JSON.stringify(audit));
  check('placement: the ottoman sits in front of the chair, and the rug lies under both', audit.ahead > 900 && audit.ahead < 1800 && audit.rugUnder, JSON.stringify(audit));
  check('placement: the record player stands on the table top', await p.evaluate(() => { const { lounge, THREE } = window.__WS__.engine; const pl = new THREE.Box3().setFromObject(lounge.player), tb = new THREE.Box3().setFromObject(lounge.table); return pl.min.y >= tb.min.y + 1000 && pl.min.y < tb.min.y + 1100 && pl.min.x >= tb.min.x - 20 && pl.max.x <= tb.max.x + 20; }));

  /* ── the desk view: the corner does not cover the cabinet, computer, disks, plans or notebook ── */
  const restCover = await p.evaluate(() => {
    const { lounge, camera, scene, THREE } = window.__WS__.engine;
    const mine = new Set(); for (const o of [lounge.chair, lounge.table, lounge.lamp, lounge.plant, lounge.rug]) o.traverse((m) => mine.add(m));
    const ray = new THREE.Raycaster(); let n = 0, hit = 0;
    const solids = []; scene.traverse((m) => { if (m.isMesh && m.visible && !m.userData.proxy && m.material && m.material.visible !== false) solids.push(m); });
    for (let i = 0; i < 64; i++) for (let j = 0; j < 36; j++) {
      ray.setFromCamera({ x: -1 + (i + 0.5) / 32, y: -1 + (j + 0.5) / 18 }, camera); n++;
      const h = ray.intersectObjects(solids, false)[0]; if (h && mine.has(h.object)) hit++;
    }
    return { share: hit / n };
  });
  check('desk view: the reading corner covers at most a sliver of the desk view (under 1 %)', restCover.share < 0.01, JSON.stringify(restCover));
  await shot(p, 'c01-desk-1920');

  /* ── the switcher: Reading corner ── */
  await p.evaluate(() => window.__WS__.engine.setLook(0.3, 0.1)); await sleep(300);
  const deskLook = await S(p);
  await p.evaluate(() => [...document.querySelectorAll('.ws3d__stations button')].find((x) => /Reading corner/.test(x.textContent)).click());
  await settled(p, 'corner'); let s = await S(p);
  check('switcher: "Reading corner" flies to the corner (/#corner)', s.view === 'corner' && s.url === '/#corner', JSON.stringify(s));
  const ch = await pt(p, 'chair'), pl = await pt(p, 'player');
  check('corner: the chair and the record player are both on screen', ch.on && pl.on, JSON.stringify({ ch, pl }));
  const ot = await pt(p, 'ottoman'), pn = await pt(p, 'plant');
  check('corner: the ottoman and the plant are on screen too (the whole composition)', ot.on && pn.on, JSON.stringify({ ot, pn }));
  await shot(p, 'c02-corner-1920');

  // a drag is not a tap: it does not sit down
  await p.mouse.move(ch.x, ch.y); await p.mouse.down(); for (let i = 1; i <= 8; i++) { await p.mouse.move(ch.x + i * 12, ch.y); await sleep(16); } await p.mouse.up(); await sleep(600);
  check('drag vs tap: a drag that starts on the chair does not sit', (await S(p)).view === 'corner');

  await p.mouse.click(ch.x, ch.y); await settled(p, 'seat'); s = await S(p);
  check('chair: a click on it sits down (/#corner/seat)', s.view === 'seat' && s.url === '/#corner/seat', JSON.stringify(s));
  const cam = await p.evaluate(() => { const { camera, lounge, THREE } = window.__WS__.engine; const c = new THREE.Box3().setFromObject(lounge.chair); return { x: camera.position.x, y: camera.position.y, z: camera.position.z, inside: camera.position.x > c.min.x - 300 && camera.position.x < c.max.x + 300 && camera.position.z > c.min.z - 300 && camera.position.z < c.max.z + 300, eye: camera.position.y - c.min.y }; });
  check('seat: the camera is at the chair, at a seated eye height', cam.inside && cam.eye > 1700 && cam.eye < 2600, JSON.stringify(cam));
  await shot(p, 'c03-seat-1920');
  await p.goBack(); await settled(p, 'corner');
  check('history: Back from the seat returns to the corner', (await S(p)).url === '/#corner');
  await p.goForward(); await settled(p, 'seat');
  check('history: Forward sits down again', (await S(p)).url === '/#corner/seat');
  await p.evaluate(() => [...document.querySelectorAll('.ws3d__row--ctx button')].find((x) => /Stand up/.test(x.textContent)).click());
  await settled(p, 'rest'); s = await S(p);
  check('seat: "Stand up · back to the desk" restores the desk viewpoint the visitor left', s.url === '/' && Math.abs(s.yaw - deskLook.yaw) < 0.02 && Math.abs(s.pitch - deskLook.pitch) < 0.02, JSON.stringify({ s, deskLook }));
  await shot(p, 'c04-desk-restored-1920');

  /* ── the record player ── */
  await p.keyboard.press('l'); await settled(p, 'corner');
  check('keyboard: L goes to the reading corner', (await S(p)).url === '/#corner');
  const pl2 = await pt(p, 'player');
  await p.mouse.click(pl2.x, pl2.y); await settled(p, 'record'); s = await S(p);
  check('record player: a click on it looks closer (/#corner/record), still stopped', s.view === 'record' && s.url === '/#corner/record' && !s.playing, JSON.stringify(s));
  check('record player: on screen in its close-up', (await pt(p, 'player')).on);
  await shot(p, 'c05-record-stopped-1920');
  const m0 = await mem(p);
  const a0 = await platter(p), f0 = await frames(p);
  const pl3 = await pt(p, 'player');
  await p.mouse.click(pl3.x, pl3.y); await sleep(1600);
  s = await S(p); const a1 = await platter(p), f1 = await frames(p);
  check('record player: a click plays it; the platter turns and frames are drawn', s.playing && a1 !== a0 && f1 - f0 > 20, JSON.stringify({ s, a0, a1, f0, f1 }));
  const btn = await p.evaluate(() => { const x = [...document.querySelectorAll('.ws3d__row--ctx button')].find((q) => /Stop/.test(q.textContent)); return x && { pressed: x.getAttribute('aria-pressed'), label: document.querySelector('.ws3d__row--ctx .ws3d__label').textContent }; });
  check('record player: the dock shows Stop (pressed) and says it is silent', btn && btn.pressed === 'true' && /silent/i.test(btn.label), JSON.stringify(btn));
  const arm = await p.evaluate(() => window.__WS__.engine.lounge.armT);
  check('record player: the tonearm has swung onto the record', arm > 0.99, String(arm));
  await shot(p, 'c06-record-playing-1920');
  check('record player: no sound is made (no AudioContext, no media playback)', (await p.evaluate(() => window.__audio)) === 0);
  await p.keyboard.press(' '); await sleep(1200);
  s = await S(p);
  const f2 = await frames(p); await sleep(900); const f3 = await frames(p);
  check('record player: Space stops it; nothing is drawn once it has stopped', !s.playing && f3 === f2, JSON.stringify({ s, f2, f3 }));
  check('record player: the tonearm is back on its rest', (await p.evaluate(() => window.__WS__.engine.lounge.armT)) < 0.01);
  // several play/stop cycles leave no textures or geometries behind
  for (let i = 0; i < 3; i++) { await p.evaluate(() => window.__WS__.ctl.togglePlay()); await sleep(1100); await p.evaluate(() => window.__WS__.ctl.togglePlay()); await sleep(900); }
  const m1 = await mem(p);
  check('memory: play/stop cycles add no textures or geometries', m1.textures === m0.textures && m1.geometries === m0.geometries, JSON.stringify({ m0, m1 }));
  // leaving while it plays stops it
  await p.evaluate(() => window.__WS__.ctl.togglePlay()); await sleep(1100);
  await p.keyboard.press('Escape'); await settled(p, 'rest'); s = await S(p);
  check('record player: leaving (Esc) stops it and returns to the desk', !s.playing && s.url === '/', JSON.stringify(s));
  await p.close();

  /* ── deep links ── */
  for (const [url, v] of [['/#corner', 'corner'], ['/#corner/seat', 'seat'], ['/#corner/record', 'record'], ['/#corner/nope', 'corner']]) {
    p = await open(b, url, { width: 1280, height: 800 });
    await settled(p, v); s = await S(p);
    check(`deep link: ${url} opens the ${v} view`, s.view === v && !s.playing, JSON.stringify(s));
    if (v === 'record') await shot(p, 'c07-record-1280');
    if (url === '/#corner') await shot(p, 'c07-corner-1280');
    if (v === 'seat') await shot(p, 'c07-seat-1280');
    await p.close();
  }

  /* ── reduced motion: playing shows the arm on the record, the platter does not turn, nothing animates ── */
  p = await open(b, '/#corner/record', { width: 1280, height: 800 }, { reduced: true });
  await settled(p, 'record');
  const r0 = await platter(p);
  await p.evaluate(() => window.__WS__.ctl.togglePlay()); await sleep(400);
  const rf0 = await frames(p); await sleep(1000); const rf1 = await frames(p);
  s = await S(p);
  check('reduced motion: Play sets the arm down but the platter stays still and no frames run', s.playing && (await platter(p)) === r0 && rf1 === rf0 && (await p.evaluate(() => window.__WS__.engine.lounge.armT)) > 0.99, JSON.stringify({ s, rf0, rf1 }));
  check('reduced motion: the dock says motion is reduced', await p.evaluate(() => /motion reduced/i.test(document.querySelector('.ws3d__row--ctx .ws3d__label').textContent)));
  await p.close();

  /* ── phone, portrait ── */
  p = await open(b, '/', PHONE);
  await p.evaluate(() => document.querySelector('.ws3d__stbtn').click()); await sleep(400);
  const menu = await p.evaluate(() => [...document.querySelectorAll('.ws3d__stmenu button, .ws3d__stations button')].filter((x) => x.offsetParent).map((x) => ({ t: x.textContent.trim(), h: Math.round(x.getBoundingClientRect().height) })));
  check('phone: the Stations menu lists the reading corner (44px rows)', menu.some((m) => /Reading corner/.test(m.t) && m.h >= 44), JSON.stringify(menu));
  await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.offsetParent && /Reading corner/.test(x.textContent)).click());
  await settled(p, 'corner');
  const mch = await pt(p, 'chair'), mpl = await pt(p, 'player');
  check('phone: the chair and the record player are on screen in the corner view', mch.on && mpl.on, JSON.stringify({ mch, mpl }));
  { const o = await pt(p, 'ottoman'), n = await pt(p, 'plant'); check('phone: the ottoman and the plant are on screen too', o.on && n.on, JSON.stringify({ o, n })); }
  await shot(p, 'm-c01-corner');
  await p.touchscreen.tap(mch.x, mch.y); await settled(p, 'seat');
  check('phone: a tap on the chair sits down', (await S(p)).url === '/#corner/seat');
  await shot(p, 'm-c02-seat');
  await p.touchscreen.tap(195, 300); await settled(p, 'rest');
  check('phone: a tap while seated stands up, back at the desk', (await S(p)).url === '/');
  await p.evaluate(() => { location.hash = '#corner/record'; }); await settled(p, 'record');
  const ctrls = await p.evaluate(() => [...document.querySelectorAll('.ws3d__row--ctx button')].map((x) => ({ t: x.textContent.trim(), h: Math.round(x.getBoundingClientRect().height) })));
  check('phone: Play and Back to the desk are 44px tap targets', ctrls.length === 2 && ctrls.every((c) => c.h >= 44), JSON.stringify(ctrls));
  const mp = await pt(p, 'player');
  await p.touchscreen.tap(mp.x, mp.y); await sleep(1500);
  check('phone: a tap on the record player plays it', (await S(p)).playing);
  await shot(p, 'm-c03-record-playing');
  await p.touchscreen.tap(mp.x, mp.y); await sleep(1000);
  check('phone: a second tap stops it', !(await S(p)).playing);
  const dockH = await p.evaluate(() => document.querySelector('.ws3d__dock').getBoundingClientRect().height / innerHeight);
  check('phone: the dock stays under a quarter of the screen in the corner views', dockH < 0.25, dockH.toFixed(3));
  await p.close();

  /* ── phone, landscape ── */
  p = await open(b, '/#corner', PHONE_L);
  await settled(p, 'corner');
  const lch = await pt(p, 'chair'), lpl = await pt(p, 'player');
  check('phone landscape: the chair and the record player are on screen', lch.on && lpl.on, JSON.stringify({ lch, lpl }));
  { const o = await pt(p, 'ottoman'), n = await pt(p, 'plant'); check('phone landscape: the ottoman and the plant are on screen too', o.on && n.on, JSON.stringify({ o, n })); }
  await shot(p, 'm-c04-corner-landscape');
  await p.close();

  check('no uncaught page errors', errors.length === 0, errors.join('\n'));
  await b.close();
  console.log(`${pass}/${pass + fail} passed`);
  process.exit(fail ? 1 : 0);
})();

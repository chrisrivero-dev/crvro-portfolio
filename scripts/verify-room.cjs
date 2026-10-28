/* 09 complete room acceptance: a full turn by mouse and by touch, every heading lands on finished geometry, the camera never leaves the
 * room or enters furniture, the door and the task chair are where they should be, and the default desk view is unchanged.
 * Phone runs are Chromium emulation (touch), not a device. Frames: captures/room/tests/. Run with BASE=http://localhost:5193. */
const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));
const BASE = process.env.BASE || 'http://localhost:5192';
const OUT = path.join(__dirname, '..', 'captures', 'room', 'tests');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = []; let pass = 0, fail = 0;
const check = (n, ok, d) => { ok ? pass++ : fail++; console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : (d ?? '')); };
const PHONE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const PHONE_L = { width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
async function open(b, vp) {
  const p = await b.newPage();
  await p.setViewport(vp);
  p.on('pageerror', (e) => errors.push(String(e)));
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' });
  await p.waitForFunction(() => window.__WS__ && !window.__WS__.ctl.state.busy, { timeout: 25000 });
  await sleep(1200);
  return p;
}
const yaw = (p) => p.evaluate(() => window.__WS__.engine.look.yaw);
/** Is the view finished? Rays through a grid all hit visible geometry (no void), and the camera is inside the room and in no furniture. */
const audit = (p) => p.evaluate(() => {
  const { camera, scene, THREE } = window.__WS__.engine;
  const solids = []; scene.traverse((m) => { if (m.isMesh && m.visible && !m.userData.proxy && m.material && m.material.visible !== false && m.material.blending !== THREE.AdditiveBlending) solids.push(m); });
  const ray = new THREE.Raycaster(); let miss = 0, n = 0;
  for (let i = 0; i < 24; i++) for (let j = 0; j < 14; j++) { ray.setFromCamera({ x: -1 + (i + 0.5) / 12, y: -1 + (j + 0.5) / 7 }, camera); n++; if (!ray.intersectObjects(solids, false).length) miss++; }
  const c = camera.position;
  const inRoom = c.x > -2300 && c.x < 6200 && c.z > -900 && c.z < 7400 && c.y > -1990 && c.y < 3210;
  const inside = []; scene.traverse((m) => { if (!m.isMesh || m.userData.proxy || !m.geometry) return; const bb = new THREE.Box3().setFromObject(m); const s = bb.getSize(new THREE.Vector3()); if (s.x > 3000 || s.z > 3000 || s.y > 3000) return; if (bb.containsPoint(c)) inside.push(m.name || m.geometry.type); });
  return { miss, n, inRoom, inside, fov: +camera.fov.toFixed(1), cam: [c.x, c.y, c.z].map(Math.round) };
});

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });

  /* ── desktop: the default view, then a full turn by mouse ── */
  let p = await open(b, { width: 1920, height: 1080 });
  let a = await audit(p);
  check('default desk view: the stations\' 34° lens, no look offset, camera in the room', a.fov === 34 && (await yaw(p)) === 0 && a.inRoom && a.miss === 0, JSON.stringify(a));
  const fixtures = await p.evaluate(() => {
    const { room, knee, THREE, camera, scene, tray, machine } = window.__WS__.engine;
    const tc = new THREE.Box3().setFromObject(room.taskChair);
    // the chair's seat: under the desk's front edge, inside the knee space, below the pencil drawer
    let seat = null; room.taskChair.traverse((m) => { if (m.name === 'task-seat') seat = new THREE.Box3().setFromObject(m); });
    const floor = -1990;
    // the desk view: nothing of the chair between the camera and the tray or the computer
    const ray = new THREE.Raycaster(); const blocked = [];
    const solids = []; scene.traverse((m) => { if (m.isMesh && m.visible && !m.userData.proxy) solids.push(m); });
    for (const [n, o] of [['tray', tray], ['computer', machine]]) { const c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()); ray.set(camera.position, c.clone().sub(camera.position).normalize()); const h = ray.intersectObjects(solids, false)[0]; let o2 = h && h.object; while (o2 && o2 !== room.taskChair) o2 = o2.parent; if (o2) blocked.push(n); }
    return { door: room.door, knee, seatTop: seat && Math.round(seat.max.y - floor), seatFront: seat && Math.round(Math.min(seat.min.z, seat.max.z)), seatX: seat && [Math.round(seat.min.x), Math.round(seat.max.x)], chairOnFloor: Math.round(tc.min.y - floor), blocked };
  });
  check('door: an opening in the front wall (opposite the workstation), ≈ 94 × 208 cm', fixtures.door.z === 7400 && fixtures.door.x1 - fixtures.door.x0 > 1800 && fixtures.door.h > 4200, JSON.stringify(fixtures.door));
  check('desk: a knee space under the computer, ≥ 50 cm wide and ≥ 60 cm clear', fixtures.knee.x1 - fixtures.knee.x0 >= 1060 && fixtures.knee.clear >= 1270, JSON.stringify(fixtures.knee));
  check('task chair: on the floor; seat (≈ 46 cm) below the knee space, its front under the desk edge, inside the knee space', Math.abs(fixtures.chairOnFloor) < 12 && fixtures.seatTop > 900 && fixtures.seatTop < fixtures.knee.clear && fixtures.seatFront < fixtures.knee.front && fixtures.seatX[0] > fixtures.knee.x0 - 120 && fixtures.seatX[1] < fixtures.knee.x1 + 120, JSON.stringify(fixtures));
  check('task chair: hides neither the disk tray nor the computer in the desk view', fixtures.blocked.length === 0, JSON.stringify(fixtures.blocked));

  // drag right in steps, 1.5 screen widths at a time, until a full turn has been made; audit every quarter
  const r = { x: 960, y: 520 };
  let total = 0, last = 0; const seen = new Set(); const fails = [];
  for (let k = 0; k < 6; k++) {
    await p.mouse.move(200, r.y); await p.mouse.down();
    for (let i = 1; i <= 20; i++) { await p.mouse.move(200 + i * 72, r.y); await sleep(12); }
    await p.mouse.up(); await sleep(250);
    const y = await yaw(p); total += Math.abs(((last - y + Math.PI * 3) % (Math.PI * 2)) - Math.PI); last = y;
    seen.add(Math.round(((-y % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / (Math.PI / 2)) % 4);
    a = await audit(p); if (a.miss || !a.inRoom || a.inside.length) fails.push({ y, a });
    await p.screenshot({ path: path.join(OUT, `r-mouse-${k}.png`) });
  }
  check('mouse: dragging turns the view a full 360° and on (all four quadrants)', total > 2 * Math.PI && seen.size === 4, JSON.stringify({ total, seen: [...seen] }));
  check('mouse: every heading on the way is finished geometry, camera inside the room and clear of furniture', fails.length === 0, JSON.stringify(fails));
  // eight fixed headings, level and looking up: no voids
  const voids = [];
  for (let i = 0; i < 8; i++) for (const lp of [0, -0.45, 0.45]) { await p.evaluate((y, lp) => window.__WS__.engine.setLook(y, lp), i * Math.PI / 4, lp); a = await audit(p); if (a.miss) voids.push([i * 45, lp, a.miss]); }
  check('eight headings × level / up / down: no ray leaves the room', voids.length === 0, JSON.stringify(voids));
  // the look-around pitch never inverts
  await p.evaluate(() => window.__WS__.engine.setLook(0, 0)); await sleep(100);
  await p.mouse.move(960, 200); await p.mouse.down(); for (let i = 1; i <= 20; i++) await p.mouse.move(960, 200 + i * 60); await p.mouse.up(); await sleep(200);
  const up = await p.evaluate(() => { const d = new window.__WS__.engine.THREE.Vector3(); window.__WS__.engine.camera.getWorldDirection(d); return d.y; });
  check('pitch: a long vertical drag is clamped (the view never turns over)', up > -0.95 && up < 0.6, String(up));
  // returning: the station switcher and Esc both come back to the desk with no seam
  await p.evaluate(() => window.__WS__.engine.setLook(3.0, 0)); await sleep(100);
  await p.keyboard.press('c'); await p.waitForFunction(() => !window.__WS__.ctl.state.busy && window.__WS__.ctl.state.view !== 'rest', { timeout: 15000 }); await sleep(600);
  await p.keyboard.press('Escape'); await p.waitForFunction(() => window.__WS__.ctl.state.view === 'rest' && !window.__WS__.ctl.state.busy, { timeout: 15000 }); await sleep(600);
  a = await audit(p);
  check('station round trip from behind: the camera comes back to the desk (inside the room, no void)', a.inRoom && a.miss === 0, JSON.stringify(a));
  await p.evaluate(() => window.__WS__.engine.setLook(0, 0)); await sleep(200);
  check('turning back to 0°: the 34° desk lens again', (await audit(p)).fov === 34);
  await p.close();

  /* ── phones: a full turn by touch ── */
  for (const [name, vp] of [['phone', PHONE], ['phone landscape', PHONE_L]]) {
    p = await open(b, vp);
    const c = await p.createCDPSession();
    const W = vp.width, H = vp.height * 0.4;
    let tot = 0, prev = 0; const q = new Set(); const bad = [];
    for (let k = 0; k < 8; k++) {
      const pts = Array.from({ length: 14 }, (_, i) => ({ x: 30 + i * (W - 60) / 13, y: H }));
      await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pts[0]] });
      for (const t of pts.slice(1)) { await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [t] }); await sleep(16); }
      await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(250);
      const y = await yaw(p); tot += Math.abs(((prev - y + Math.PI * 3) % (Math.PI * 2)) - Math.PI); prev = y;
      q.add(Math.round(((-y % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / (Math.PI / 2)) % 4);
      const au = await audit(p); if (au.miss || !au.inRoom || au.inside.length) bad.push({ y, au });
    }
    await p.screenshot({ path: path.join(OUT, `r-${name.replace(' ', '-')}.png`) });
    check(`${name}: swiping turns the view a full 360° (all four quadrants)`, tot > 2 * Math.PI && q.size === 4, JSON.stringify({ tot, q: [...q] }));
    check(`${name}: every heading is finished geometry, camera in the room`, bad.length === 0, JSON.stringify(bad));
    await p.close();
  }
  check('no uncaught page errors', errors.length === 0, errors.join('\n'));
  console.log(`${pass}/${pass + fail} passed`);
  await b.close();
  process.exit(fail ? 1 : 0);
})();

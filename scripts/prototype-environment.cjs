/* PROPOSAL ONLY (not shipped): rough stand-ins for an Eames-style lounge chair and a small record player, injected into the live scene
 * so their candidate positions can be judged against the real camera framing. Nothing here is part of the site bundle.
 * Run: BASE=http://localhost:5192 node scripts/prototype-environment.cjs  -> captures/career/proposals/ */
const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));
const BASE = process.env.BASE || 'http://localhost:5192';
const OUT = path.join(__dirname, '..', 'captures', 'career', 'proposals');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const VPS = [['1920', { width: 1920, height: 1080 }], ['1280', { width: 1280, height: 800 }], ['390', { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]];

const BUILD = `
(() => {
  const { THREE, scene, markDirty } = window.__WS__.engine;
  const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });
  const walnut = M('#5a3a22', { roughness: 0.45 }), leather = M('#1d1a17', { roughness: 0.5 }), steel = M('#16151a', { metalness: 0.6, roughness: 0.4 });
  const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };
  const FLOOR = -1990;
  /* chair: about 62 cm wide, seat 38 cm high; 1 unit = 0.47 mm */
  const chair = new THREE.Group(); chair.name = 'proposal-chair';
  const col = new THREE.Mesh(new THREE.CylinderGeometry(45, 55, 420, 16), steel); col.position.y = FLOOR + 330; chair.add(col);
  for (let i = 0; i < 5; i++) { const leg = box(520, 40, 70, steel, 0, FLOOR + 40, 0); leg.geometry.translate(260, 0, 0); leg.rotation.y = (i * Math.PI * 2) / 5; chair.add(leg); }
  chair.add(box(1150, 70, 1000, walnut, 0, FLOOR + 560, 0));                      // seat shell
  chair.add(box(1050, 150, 900, leather, 0, FLOOR + 665, 20));                      // seat cushion
  const back = new THREE.Group(); back.position.set(0, FLOOR + 640, -480); back.rotation.x = -0.5;
  back.add(box(1150, 1000, 70, walnut, 0, 480, 0)); back.add(box(1050, 880, 130, leather, 0, 480, 80));
  chair.add(back);
  for (const sx of [-1, 1]) chair.add(box(90, 60, 880, walnut, sx * 640, FLOOR + 900, -20));
  chair.userData.where = {};
  /* record player: 36 cm wide plinth, black platter, tonearm */
  const tt = new THREE.Group(); tt.name = 'proposal-turntable';
  tt.add(box(640, 70, 520, M('#d9cfb8', { roughness: 0.5 }), 0, 35, 0));
  const plat = new THREE.Mesh(new THREE.CylinderGeometry(190, 190, 18, 40), M('#0d0d0d', { roughness: 0.35 })); plat.position.set(-60, 80, 0); tt.add(plat);
  const label = new THREE.Mesh(new THREE.CylinderGeometry(60, 60, 20, 24), M('#b8863b')); label.position.set(-60, 82, 0); tt.add(label);
  const arm = box(250, 8, 10, steel, 170, 100, -110); arm.rotation.y = 0.5; tt.add(arm);
  tt.traverse((o) => { o.castShadow = true; });
  window.__proposal = { scene, chair, tt, markDirty, THREE };
  scene.add(chair, tt);
})()`;

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
  const POS = {
    chairA: { x: -1900, z: 1050, r: 0.9 },     // left foreground, turned toward the desk
    chairB: { x: -1950, z: 150, r: 1.3 },      // against the window wall, beside the cabinet
  };
  for (const [vn, vp] of VPS) {
    for (const [name, pos] of Object.entries(POS)) {
      const page = await browser.newPage();
      await page.setViewport(vp);
      await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
      await page.waitForFunction(() => window.__WS__ && !window.__WS__.ctl.state.busy, { timeout: 25000 });
      await sleep(1500);
      await page.evaluate(BUILD);
      await page.evaluate((p) => { const { chair, tt, markDirty } = window.__proposal; chair.position.set(p.x, 0, p.z); chair.rotation.y = p.r; tt.visible = false; markDirty(); }, pos);
      await sleep(600);
      await page.screenshot({ path: path.join(OUT, `${vn}-${name}.png`) });
      await page.close();
    }
    // record player on the free right half of the wall shelf (the notebook rests on the desk on landscape screens)
    const page = await browser.newPage();
    await page.setViewport(vp);
    await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => window.__WS__ && !window.__WS__.ctl.state.busy, { timeout: 25000 });
    await sleep(1500);
    await page.evaluate(BUILD);
    await page.evaluate(() => { const { chair, tt, markDirty } = window.__proposal; chair.visible = false; tt.position.set(-800, -390 + 830 + 18, -900 + 160); tt.rotation.y = 0.25; markDirty(); });
    await sleep(600);
    await page.screenshot({ path: path.join(OUT, `${vn}-recordplayer-shelf.png`) });
    await page.close();
  }
  await browser.close();
})();

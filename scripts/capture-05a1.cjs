/* 05A.1 focused captures + audit. MODE=before|after -> captures/iter-05a1/<mode>/ and audit-<mode>.json.
 * Audit (per viewport): control sizes, font sizes, contrast of control text, control-area height, rendered CRT text size,
 * disk-held clearance against CRT / keyboard / organizer, put-back exactness. */
const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));
const BASE = process.env.BASE || 'http://127.0.0.1:5190';
const MODE = process.env.MODE || 'after';
const OUT = path.join(__dirname, '..', 'captures', 'iter-05a1', MODE);
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const audit = {};

async function run(browser, name, mobile) {
  const page = await browser.newPage();
  await page.setViewport(mobile ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { width: 1500, height: 950 });
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__WS__, { timeout: 25000 }); await sleep(1400);
  const shot = (n) => page.screenshot({ path: path.join(OUT, `${name}-${n}.png`) });
  const wait = (fn, arg, ms = 15000) => page.waitForFunction(fn, { timeout: ms, polling: 60 }, arg).then(() => sleep(500));
  const A = (audit[name] = {});
  const controls = () => page.evaluate(() => {
    const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
    const blend = (fg, bg) => { const f = fg.match(/[\d.]+/g).map(Number), b = bg.match(/[\d.]+/g).map(Number); const a = f[3] ?? 1; return `rgb(${f[0] * a + b[0] * (1 - a)},${f[1] * a + b[1] * (1 - a)},${f[2] * a + b[2] * (1 - a)})`; };
    const out = [];
    for (const e of document.querySelectorAll('.ws3d__dock button, .ws3d__dock .ws3d__label, .ws3d__flat, .ws3d__hint, .ws3d__disklist button')) {
      const r = e.getBoundingClientRect(); if (!r.width || getComputedStyle(e).display === 'none') continue;
      const cs = getComputedStyle(e);
      // effective backdrop: composite every ancestor's background (outermost first) over a bright wall, the worst case behind translucent panels
      const chain = []; for (let n = e; n; n = n.parentElement) chain.unshift(getComputedStyle(n).backgroundColor);
      let eff = 'rgb(201,184,152)'; for (const c of chain) { if (!/rgba\(0, 0, 0, 0\)|transparent/.test(c)) eff = blend(c, eff); }
      const L1 = lum(cs.color), L2 = lum(eff); const cr = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      out.push({ t: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28), w: Math.round(r.width), h: Math.round(r.height), font: parseFloat(cs.fontSize), contrastWorst: +cr.toFixed(1), tag: e.tagName });
    }
    const dock = document.querySelector('.ws3d__dock')?.getBoundingClientRect();
    return { controls: out, dockH: dock ? Math.round(dock.height) : 0, dockPct: dock ? +(dock.height / innerHeight * 100).toFixed(1) : 0 };
  });
  const crtText = () => page.evaluate(() => {
    const s = document.getElementById('screen').getBoundingClientRect(); const scale = s.width / 600;
    const sizes = (sel) => [...document.querySelectorAll(sel)].slice(0, 6).map((e) => +(parseFloat(getComputedStyle(e).fontSize) * scale).toFixed(1));
    return { scale: +scale.toFixed(2), menuItem: sizes('#screen .ws-fn')[0], body: sizes('#screen .ws-vp, #screen .retro-term-line, #screen .contact .body p')[0], fileBtn: sizes('#screen .ws-file')[0], link: sizes('#screen .ws-link, #screen .contact .links a')[0] };
  });
  await shot('desk'); A.desk = await controls();
  await page.keyboard.press('c'); await wait(() => window.__WS__.ctl.state.view === 'crt'); await shot('computer-menu'); A.computerMenu = await controls(); A.menuText = await crtText();
  await page.click('#screen [data-entry="navigator"]'); await sleep(900); await shot('computer-ask'); A.askText = await crtText(); A.askControls = await controls();
  await page.evaluate(() => [...document.querySelectorAll('#screen .ws-linkbtn')].find((b) => /MENU/.test(b.textContent)).click()); await sleep(300);
  await page.click('#screen [data-entry="contact"]'); await sleep(900); await shot('computer-contact'); A.contactText = await crtText();
  await page.keyboard.press('Escape'); await wait(() => window.__WS__.ctl.state.view === 'rest');
  await page.keyboard.press('d'); await wait(() => window.__WS__.ctl.state.view === 'drive'); await shot('tray'); A.tray = await controls();
  const dz = await page.evaluate(() => { const { scene, camera, THREE } = window.__WS__.engine; let g; scene.traverse((o) => { if (o.userData?.project?.slug === 'zarvin-one' && !o.userData.loose && !g) g = o; }); const v = g.localToWorld(new THREE.Vector3(0, -20, 0)).project(camera); return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight }; });
  const before = await page.evaluate(() => { const { scene } = window.__WS__.engine; let g; scene.traverse((o) => { if (o.userData?.project?.slug === 'zarvin-one' && !o.userData.loose && !g) g = o; }); return { p: g.getWorldPosition(g.position.clone()).toArray().map((n) => +n.toFixed(3)), q: g.getWorldQuaternion(g.quaternion.clone()).toArray().map((n) => +n.toFixed(4)) }; });
  if (mobile) await page.touchscreen.tap(dz.x, dz.y); else await page.mouse.click(dz.x, dz.y);
  await wait(() => window.__WS__.ctl.state.view === 'hold'); await sleep(400); await shot('disk-held'); A.held = await controls();
  A.clearance = await page.evaluate(() => {
    const { scene, camera, machine, tray, THREE } = window.__WS__.engine; let g, kb = null; scene.traverse((o) => { if (o.userData?.project?.slug === 'zarvin-one' && !o.userData.loose && !g) g = o; if (o.userData?.keyboard) kb = o; });
    const box = (o) => new THREE.Box3().setFromObject(o);
    const d = box(g);
    const hits = { crt: d.intersectsBox(box(machine)), organizer: d.intersectsBox(box(tray)), keyboard: kb ? d.intersectsBox(box(kb)) : 'keyboard not tagged' };
    return { hits, distToCamera: Math.round(g.getWorldPosition(new THREE.Vector3()).distanceTo(camera.position)) };
  });
  await page.evaluate(() => [...document.querySelectorAll('.ws3d__dock button')].find((b) => /Put back/.test(b.textContent)).click());
  await wait(() => window.__WS__.ctl.state.view === 'drive' && !window.__WS__.ctl.state.busy && window.__WS__.ctl.state.locs['zarvin-one'] === 'home');
  const after = await page.evaluate(() => { const { scene } = window.__WS__.engine; let g; scene.traverse((o) => { if (o.userData?.project?.slug === 'zarvin-one' && !o.userData.loose && !g) g = o; }); return { p: g.getWorldPosition(g.position.clone()).toArray().map((n) => +n.toFixed(3)), q: g.getWorldQuaternion(g.quaternion.clone()).toArray().map((n) => +n.toFixed(4)) }; });
  A.putBackExact = JSON.stringify(before) === JSON.stringify(after);
  // load the disk to read its directory on the CRT
  const dz2 = dz; if (mobile) await page.touchscreen.tap(dz2.x, dz2.y); else await page.mouse.click(dz2.x, dz2.y);
  await wait(() => window.__WS__.ctl.state.view === 'hold');
  await page.evaluate(() => [...document.querySelectorAll('.ws3d__dock button')].find((b) => /Insert into drive/.test(b.textContent)).click());
  await wait(() => window.__WS__.ctl.state.session === 'zarvin-one' && window.__WS__.ctl.state.view === 'crt' && !!document.querySelector('#screen .ws-view'), null, 20000); await sleep(600);
  await shot('computer-directory'); A.dirText = await crtText(); A.dirControls = await controls();
  await page.close();
}
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
  await run(browser, 'desktop', false);
  await run(browser, 'mobile', true);
  fs.writeFileSync(path.join(__dirname, '..', 'captures', 'iter-05a1', `audit-${MODE}.json`), JSON.stringify(audit, null, 1));
  const m = audit.mobile;
  console.log(MODE, 'mobile dock % of viewport (desk):', m.desk.dockPct, '| smallest control h:', Math.min(...m.desk.controls.map((c) => c.h)), '| smallest font:', Math.min(...m.desk.controls.map((c) => c.font)), '| worst contrast:', Math.min(...m.desk.controls.map((c) => c.contrastWorst)));
  console.log('mobile CRT text px (menu/ask/contact/dir):', m.menuText.menuItem, m.askText.body, m.contactText.body, m.dirText.body);
  console.log('held clearance:', JSON.stringify(audit.desktop.clearance), JSON.stringify(m.clearance), 'putBackExact', audit.desktop.putBackExact, m.putBackExact);
  await browser.close();
})();

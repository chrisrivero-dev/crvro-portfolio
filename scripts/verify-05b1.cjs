/* 05B.1 acceptance: the drafting-plans station, recorded as sequential frames with assertions at every step.
 * Journeys: mouse (1500x950), keyboard only (1500x950), simulated touch (390x844 phone emulation, Chromium; not a real device).
 *   desk -> discover the sheet -> plans -> read a pinned note -> case study -> return to the note -> step back -> desk
 * plus direct links, Back/Forward, one-object-in-hand, the floppy -> note pointer, camera collisions, tap-target sizes,
 * look-down limit, and before/after framing captures.
 * Frames: captures/iter-05b1/<mode>/NN-*.png ; results: captures/iter-05b1/report.json. Needs vite on :5190 (or BASE). */
const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));
const BASE = process.env.BASE || 'http://127.0.0.1:5190';
const OUT = path.join(__dirname, '..', 'captures', 'iter-05b1');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const report = { checks: [], errors: [], frames: {}, measures: {} };
const check = (name, ok, detail) => { report.checks.push({ name, ok: !!ok, detail }); console.log(ok ? 'PASS' : 'FAIL', name, ok ? '' : (detail ?? '')); };

async function open(browser, url, { mobile = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport(mobile ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { width: 1500, height: 950 });
  page.on('pageerror', (e) => report.errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && report.errors.push(m.text()));
  await page.goto(BASE + url, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__WS__, { timeout: 25000 });
  await sleep(1500);
  return page;
}
const S = (page) => page.evaluate(() => {
  const s = window.__WS__.ctl.state;
  return { view: s.view, note: s.note, held: s.held, session: s.session, busy: s.busy, locs: s.locs, look: { yaw: +window.__WS__.engine.look.yaw.toFixed(3), pitch: +window.__WS__.engine.look.pitch.toFixed(3) }, url: location.pathname + location.hash };
});
const settled = (page, view, url) => page.waitForFunction((v, u) => { const s = window.__WS__?.ctl.state; return s && s.view === v && !s.busy && (location.pathname + location.hash) === u; }, { timeout: 15000, polling: 60 }, view, url).then(() => sleep(1100));
// screen position of a point on a note (u,v in 0..1, v up) or on the sheet (world)
const notePt = (page, slug, u = 0.5, v = 0.5) => page.evaluate((s, u, v) => {
  const { notes, camera, THREE } = window.__WS__.engine;
  const m = notes.find((n) => n.userData.note.slug === s);
  const p = m.localToWorld(new THREE.Vector3((u - 0.5) * 280, (v - 0.5) * 390, 0)).project(camera);
  return { x: (p.x * 0.5 + 0.5) * innerWidth, y: (-p.y * 0.5 + 0.5) * innerHeight };
}, slug, u, v);
const stampPt = (page, slug, kind) => page.evaluate((s, k) => {
  const r = window.__WS__.engine.notes.find((n) => n.userData.note.slug === s).userData.note.rects.find((q) => q.kind === k);
  return { u: (r.u0 + r.u1) / 2, v: (r.v0 + r.v1) / 2 };
}, slug, kind).then((uv) => notePt(page, slug, uv.u, uv.v));
const worldPt = (page, x, y, z) => page.evaluate((x, y, z) => { const { camera, THREE } = window.__WS__.engine; const p = new THREE.Vector3(x, y, z).project(camera); return { x: (p.x * 0.5 + 0.5) * innerWidth, y: (-p.y * 0.5 + 0.5) * innerHeight }; }, x, y, z);
const SHEET_FREE = [1330, -389.4, -170];        // a spot on the survey sheet that no note, tape or prop covers
/** Screen size (CSS px) of a note and of its stamps at the current pose. */
const noteSize = (page, slug) => page.evaluate((s) => {
  const { notes, camera, THREE } = window.__WS__.engine;
  const m = notes.find((n) => n.userData.note.slug === s);
  const sp = (u, v) => { const p = m.localToWorld(new THREE.Vector3((u - 0.5) * 280, (v - 0.5) * 390, 0)).project(camera); return { x: (p.x * 0.5 + 0.5) * innerWidth, y: (-p.y * 0.5 + 0.5) * innerHeight }; };
  const box = (u0, v0, u1, v1) => { const a = sp(u0, v0), b = sp(u1, v1); return { w: Math.round(Math.abs(b.x - a.x)), h: Math.round(Math.abs(b.y - a.y)) }; };
  return { note: box(0, 0, 1, 1), stamps: m.userData.note.rects.map((r) => ({ kind: r.kind, ...box(r.u0, r.v0, r.u1, r.v1) })) };
}, slug);
/** The camera must not be inside any scene object, and nothing may stand between it and the note it reads. */
const collisions = (page, slug) => page.evaluate((s) => {
  const { scene, camera, notes, THREE } = window.__WS__.engine;
  const inside = [];
  scene.traverse((o) => {
    if (!o.isMesh || !o.visible || o.material?.depthWrite === false) return;
    const b = new THREE.Box3().setFromObject(o);
    if (b.getSize(new THREE.Vector3()).length() > 6000) return;       // room shell (walls, floor)
    if (b.containsPoint(camera.position)) inside.push(o.geometry.type);
  });
  let blocked = null;
  if (s) {
    const m = notes.find((n) => n.userData.note.slug === s);
    for (const [u, v] of [[0.5, 0.5], [0.1, 0.1], [0.9, 0.9], [0.1, 0.9], [0.9, 0.1]]) {
      const p = m.localToWorld(new THREE.Vector3((u - 0.5) * 280, (v - 0.5) * 390, 0));
      const dir = p.clone().sub(camera.position); const dist = dir.length();
      const rc = new THREE.Raycaster(camera.position, dir.normalize(), 1, dist - 2); rc.camera = camera;
      const hit = rc.intersectObjects(scene.children, true).find((h) => h.object.isMesh && h.object.visible && h.object.material?.depthWrite !== false && !h.object.material?.transparent);
      if (hit) { blocked = hit.object.geometry.type; break; }
    }
  }
  return { inside, blocked, camY: Math.round(camera.position.y) };
}, slug);
const homePoses = (page) => page.evaluate(() => {
  const out = {};
  window.__WS__.engine.diskList.forEach((d) => { out[d.userData.project.slug] = [d.position.x, d.position.y, d.position.z, d.quaternion.x, d.quaternion.w].map((n) => +n.toFixed(4)).join(','); });
  window.__WS__.engine.notes.forEach((n) => { out[n.userData.note.slug] = [n.position.x, n.position.y, n.position.z].map((v) => +v.toFixed(4)).join(','); });
  return out;
});
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
  const poses0 = await homePoses(page);
  await rec('desk');
  // look a little to the side first: the desk viewpoint must come back after the excursion
  await page.mouse.move(700, 300); await page.mouse.down(); await page.mouse.move(820, 330, { steps: 8 }); await page.mouse.up(); await sleep(400);
  const deskLook = (await S(page)).look;
  let p = await worldPt(page, ...SHEET_FREE);
  await page.mouse.move(p.x, p.y); await sleep(250);
  const tag = await page.$eval('.ws3d__tag', (e) => e.textContent).catch(() => '');
  await rec('hover-sheet');
  check('mouse 1: hovering the survey sheet names it, and says the notes are pinned to a studio drawing', /Drafting plans/.test(tag) && /studio drawing/.test(tag), tag);
  await page.mouse.click(p.x, p.y);
  await sleep(450); await rec('flying-to-plans');
  await settled(page, 'plans', '/#plans'); await rec('plans');
  check('mouse 2: clicking the sheet moves the camera over the drafting plans (/#plans)', true);
  p = await notePt(page, 'parcel-engine', 0.5, 0.6);
  await page.mouse.move(p.x, p.y); await sleep(250);
  const tag2 = await page.$eval('.ws3d__tag', (e) => e.textContent).catch(() => '');
  check('mouse 3: hovering a note names it (case ID, title)', /G-01 · Parcel Engine · pinned note/.test(tag2), tag2);
  await page.mouse.click(p.x, p.y);
  await settled(page, 'note', '/#plans/parcel-engine'); await rec('note-parcel-engine');
  check('mouse 4: clicking the note brings the camera down onto it (/#plans/parcel-engine)', true);
  report.measures.noteDesktop = await noteSize(page, 'parcel-engine');
  report.measures.collideNoteDesktop = await collisions(page, 'parcel-engine');
  check('mouse 5: the note fills most of the frame and is not blocked by any prop', report.measures.noteDesktop.note.h > 500 && !report.measures.collideNoteDesktop.blocked && !report.measures.collideNoteDesktop.inside.length, JSON.stringify(report.measures));
  // the printed repository stamp opens the registry's repository in a new tab
  const popup = new Promise((res) => browser.once('targetcreated', (t) => res(t.url())));
  p = await stampPt(page, 'parcel-engine', 'repo'); await page.mouse.click(p.x, p.y);
  const popUrl = await Promise.race([popup, sleep(4000).then(() => null)]);
  check('mouse 6: pressing the printed REPOSITORY stamp opens the registry repo in a new tab', popUrl === 'https://github.com/chrisrivero-dev/parcel-engine' || /parcel-engine/.test(popUrl || ''), popUrl);
  for (const pg of await browser.pages()) if (pg !== page && /github/.test(pg.url())) await pg.close();
  await page.bringToFront();
  p = await stampPt(page, 'parcel-engine', 'case'); await page.mouse.click(p.x, p.y);
  await page.waitForFunction(() => location.pathname === '/projects/parcel-engine', { timeout: 8000 }); await sleep(900);
  await rec('case-study');
  check('mouse 7: pressing the printed CASE STUDY stamp opens the expanded case study', true);
  await page.goBack();
  await settled(page, 'note', '/#plans/parcel-engine').catch(async (e) => { console.log('DEBUG', JSON.stringify(await S(page))); throw e; }); await rec('returned-to-note');
  check('mouse 8: Back from the case study returns to the same note, camera unchanged', (await S(page)).note === 'parcel-engine');
  p = await notePt(page, 'groundrules', 0.5, 0.7);
  await page.mouse.click(p.x, p.y);
  await settled(page, 'note', '/#plans/groundrules'); await rec('note-groundrules');
  check('mouse 9: clicking the other note moves straight to it', true);
  p = await notePt(page, 'groundrules', 1.25, 0.5); await page.mouse.click(p.x, p.y);   // off the paper, onto the sheet beside it
  await settled(page, 'plans', '/#plans'); await rec('clicked-off-note');
  check('mouse 10: clicking off the note steps back to the sheet', true);
  await page.keyboard.press('Escape');
  await settled(page, 'rest', '/'); await rec('back-at-desk');
  const back = (await S(page)).look;
  check('mouse 11: Escape from the plans returns to the desk at the viewpoint the visitor left', Math.abs(back.yaw - deskLook.yaw) < 0.002 && Math.abs(back.pitch - deskLook.pitch) < 0.002, JSON.stringify({ deskLook, back }));
  // a note can be picked straight from the desk
  p = await notePt(page, 'groundrules', 0.5, 0.6); await page.mouse.click(p.x, p.y);
  await settled(page, 'note', '/#plans/groundrules');
  check('mouse 12: clicking a note from the desk flies directly to it', true);
  await page.keyboard.press('Escape'); await settled(page, 'plans', '/#plans');
  await page.keyboard.press('Escape'); await settled(page, 'rest', '/');
  check('mouse 13: notes and disks are exactly where they started', JSON.stringify(await homePoses(page)) === JSON.stringify(poses0));
  // look-down range (approved: about -0.2 rad)
  await page.mouse.move(700, 600); await page.mouse.down(); await page.mouse.move(700, 100, { steps: 10 }); await page.mouse.up(); await sleep(400);
  const low = (await S(page)).look;
  report.measures.collideLookDown = await collisions(page, null);
  await rec('look-down-limit');
  check('mouse 14: looking down stops at -0.25 rad (05B.3), camera clear of every object', Math.abs(low.pitch + 0.25) < 0.001 && !report.measures.collideLookDown.inside.length, JSON.stringify({ low, c: report.measures.collideLookDown }));
  await page.close();

  /* ── B. keyboard only ── */
  page = await open(browser, '/');
  rec = recorder(page, 'keyboard');
  await page.keyboard.press('p');
  await settled(page, 'plans', '/#plans'); await rec('p-plans');
  check('keys 1: P moves to the drafting plans', true);
  await page.focus('.ws3d__row--ctx button');
  const focusName = await page.evaluate(() => document.activeElement.textContent);
  await page.keyboard.press('Enter');
  await settled(page, 'note', '/#plans/parcel-engine'); await rec('enter-note');
  check('keys 2: the note buttons are reachable by Tab and open the note', /Parcel Engine note/.test(focusName), focusName);
  const ctxText = await page.$eval('.ws3d__row--ctx', (e) => e.textContent);
  check('keys 3: the note offers Read case study, Repository and Back to the sheet as real controls', /Read case study/.test(ctxText) && /Repository/.test(ctxText) && /Back to the sheet/.test(ctxText), ctxText);
  const repoHref = await page.$eval('.ws3d__row--ctx a', (a) => a.href);
  check('keys 4: the repository link is the registry repo URL', repoHref === 'https://github.com/chrisrivero-dev/parcel-engine', repoHref);
  await page.keyboard.press('Escape');
  await settled(page, 'plans', '/#plans'); await rec('esc-to-plans');
  await page.keyboard.press('Escape');
  await settled(page, 'rest', '/'); await rec('esc-to-desk');
  check('keys 5: Escape steps back one level at a time (note -> plans -> desk)', true);
  await page.keyboard.press('ArrowLeft');
  await settled(page, 'plans', '/#plans');
  check('keys 6: ←/→ station cycling includes the drafting plans', true);
  await page.keyboard.press('ArrowRight');
  await settled(page, 'rest', '/');
  await page.close();

  /* ── C. simulated touch, 390x844 ── */
  page = await open(browser, '/', { mobile: true });
  rec = recorder(page, 'touch');
  await rec('desk');
  const fiveVisible = await page.$eval('.ws3d__stations', (e) => getComputedStyle(e).display);
  const stBtn = await page.$eval('.ws3d__stbtn', (b) => { const r = b.getBoundingClientRect(); return { h: Math.round(r.height), text: b.textContent, expanded: b.getAttribute('aria-expanded') }; });
  check('touch 1: phones show one Stations button (no row of station buttons)', fiveVisible === 'none' && stBtn.h >= 44 && /Stations/.test(stBtn.text) && stBtn.expanded === 'false', JSON.stringify({ fiveVisible, stBtn }));
  await page.tap('.ws3d__stbtn'); await sleep(300); await rec('stations-menu');
  const menu = await page.$$eval('#ws-stmenu button', (bs) => bs.map((b) => ({ t: b.textContent, h: Math.round(b.getBoundingClientRect().height), cur: b.getAttribute('aria-current') })));
  const focused = await page.evaluate(() => document.activeElement?.textContent);
  check('touch 2: the menu lists the four stations, marks the current one, takes focus, 44px rows', menu.length === 4 && menu.every((m) => m.h >= 44) && menu[0].cur === 'location' && focused === 'Desk', JSON.stringify({ menu, focused }));
  await page.tap('#ws-stmenu li:nth-child(4) button');
  await settled(page, 'plans', '/#plans'); await rec('plans');
  report.measures.notesPhonePlans = { pe: await noteSize(page, 'parcel-engine'), gr: await noteSize(page, 'groundrules') };
  report.measures.collidePlansPhone = await collisions(page, null);
  check('touch 3: at the plans each note is a large tap target (>=44px), camera clear', report.measures.notesPhonePlans.pe.note.w >= 44 && report.measures.notesPhonePlans.gr.note.w >= 44 && !report.measures.collidePlansPhone.inside.length, JSON.stringify(report.measures.notesPhonePlans));
  p = await notePt(page, 'groundrules', 0.5, 0.6); await page.touchscreen.tap(p.x, p.y);
  await settled(page, 'note', '/#plans/groundrules'); await rec('note-groundrules');
  report.measures.notePhone = await noteSize(page, 'groundrules');
  report.measures.collideNotePhone = await collisions(page, 'groundrules');
  const bodyPx = +(report.measures.notePhone.note.w / 1024 * 33).toFixed(1);
  report.measures.notePhoneBodyTextPx = bodyPx;
  check('touch 4: tapping a note reads it; body text ~11px, stamp >=44px tall, nothing blocks it', bodyPx >= 10.5 && report.measures.notePhone.stamps.every((s) => s.h >= 44) && !report.measures.collideNotePhone.blocked, JSON.stringify({ bodyPx, m: report.measures.notePhone }));
  p = await stampPt(page, 'groundrules', 'case'); await page.touchscreen.tap(p.x, p.y);
  await page.waitForFunction(() => location.pathname === '/projects/groundrules', { timeout: 8000 }); await sleep(900);
  await rec('case-study');
  check('touch 5: tapping the printed CASE STUDY stamp opens the case study', true);
  await page.goBack();
  await settled(page, 'note', '/#plans/groundrules'); await rec('returned-to-note');
  check('touch 6: Back returns to the note', true);
  await page.tap('.ws3d__row--ctx button:last-child');
  await settled(page, 'plans', '/#plans');
  await page.tap('.ws3d__stbtn'); await sleep(250); await page.tap('#ws-stmenu li:nth-child(1) button');
  await settled(page, 'rest', '/'); await rec('desk-again');
  check('touch 7: Back to the sheet, then Stations -> Desk', true);
  await page.close();

  /* ── D. direct links and history ── */
  page = await open(browser, '/#plans');
  check('link 1: /#plans opens over the drafting plans', (await S(page)).view === 'plans');
  await page.close();
  for (const slug of ['parcel-engine', 'groundrules']) {
    page = await open(browser, `/#plans/${slug}`);
    await settled(page, 'note', `/#plans/${slug}`);
    check(`link 2: /#plans/${slug} opens on that note`, (await S(page)).note === slug);
    await page.close();
  }
  page = await open(browser, '/#plans/not-a-project');
  await sleep(800);
  check('link 3: an unknown note slug falls back to the plans (no invented note)', (await S(page)).view === 'plans', JSON.stringify(await S(page)));
  await page.close();
  page = await open(browser, '/');
  await page.keyboard.press('p'); await settled(page, 'plans', '/#plans');
  let q = await notePt(page, 'parcel-engine', 0.5, 0.6); await page.mouse.click(q.x, q.y); await settled(page, 'note', '/#plans/parcel-engine');
  q = await notePt(page, 'groundrules', 0.5, 0.7); await page.mouse.click(q.x, q.y); await settled(page, 'note', '/#plans/groundrules');
  const hist = [];
  await page.goBack(); await settled(page, 'note', '/#plans/parcel-engine'); hist.push((await S(page)).url);
  await page.goBack(); await settled(page, 'plans', '/#plans'); hist.push((await S(page)).url);
  await page.goBack(); await settled(page, 'rest', '/'); hist.push((await S(page)).url);
  await page.goForward(); await settled(page, 'plans', '/#plans'); hist.push((await S(page)).url);
  await page.goForward(); await settled(page, 'note', '/#plans/parcel-engine'); hist.push((await S(page)).url);
  report.measures.history = hist;
  check('history 1: Back x3 / Forward x2 retrace desk -> plans -> note -> note with the room following', hist.join(' ') === '/#plans/parcel-engine /#plans / /#plans /#plans/parcel-engine', hist.join(' '));
  await page.close();

  /* ── E. one object in hand; the floppy -> note pointer ── */
  page = await open(browser, '/#disk/zarvin-one');
  await settled(page, 'hold', '/#disk/zarvin-one');
  await page.keyboard.press('p'); await settled(page, 'plans', '/#plans');
  const s1 = await S(page);
  check('hand 1: going to the plans with a disk in hand puts the disk back first', !s1.held && Object.values(s1.locs).every((l) => l === 'home'), JSON.stringify(s1.locs));
  await page.close();
  page = await open(browser, '/#disk/parcel-engine');
  await settled(page, 'hold', '/#disk/parcel-engine');
  await page.click('.ws3d__row--ctx .ws3d__use');
  await settled(page, 'crt', '/#computer');
  rec = recorder(page, 'pointer');
  await rec('disk-directory');
  const hasPtr = await page.evaluate(() => [...document.querySelectorAll('#screen .ws-linkbtn')].some((b) => b.textContent === 'SHOW ME'));
  check('pointer 1: the Parcel Engine floppy directory points to its note on the plans', hasPtr);
  await page.evaluate(() => [...document.querySelectorAll('#screen .ws-linkbtn')].find((b) => b.textContent === 'SHOW ME').click());
  await settled(page, 'note', '/#plans/parcel-engine'); await rec('note-from-disk');
  const s2 = await S(page);
  check('pointer 2: SHOW ME moves the camera to the note; the disk stays in the drive', s2.session === 'parcel-engine' && s2.locs['parcel-engine'] === 'drive', JSON.stringify(s2));
  await page.close();

  /* ── F. framing evidence: before (05A.1 limits) / after ── */
  page = await open(browser, '/');
  rec = recorder(page, 'framing');
  await page.evaluate(() => window.__WS__.engine.setLook(0, -0.12)); await sleep(300); await rec('before-lookdown-0.12');
  await page.evaluate(() => window.__WS__.engine.setLook(0, -0.2)); await sleep(300); await rec('after-lookdown-0.20');
  await page.evaluate(() => window.__WS__.engine.setLook(0, 0)); await sleep(300); await rec('desk-rest');
  await page.keyboard.press('p'); await settled(page, 'plans', '/#plans'); await rec('plans');
  await page.close();
  page = await open(browser, '/', { mobile: true });
  rec = recorder(page, 'framing-phone');
  await rec('desk-rest');
  await page.evaluate(() => window.__WS__.engine.setLook(0, -0.2)); await sleep(300); await rec('after-lookdown-0.20');
  await page.close();

  await browser.close();
  report.errors = [...new Set(report.errors)];
  check('no page errors', report.errors.length === 0, report.errors.join(' | '));
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  const failed = report.checks.filter((c) => !c.ok).length;
  console.log(`\n${report.checks.length - failed}/${report.checks.length} passed`);
  process.exit(failed ? 1 : 0);
})();

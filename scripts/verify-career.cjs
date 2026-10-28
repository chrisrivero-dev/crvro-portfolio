/* 06 career notebook acceptance. Phone runs are Chromium emulation (390x844, touch), not a real device.
 * Covers: opening/closing, page navigation, deep links, history, drag vs tap (mouse and touch), keyboard, the reading surface,
 * LO-FI parity (without loading the 3D engine), withheld facts, object overlap, memory and idle-frame behaviour.
 * Frames: captures/career/tests/. Run with BASE=http://localhost:5192 (dev) or the production preview. */
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));
const BASE = process.env.BASE || 'http://localhost:5192';
const OUT = path.join(__dirname, '..', 'captures', 'career', 'tests');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = []; let pass = 0, fail = 0;
const check = (n, ok, d) => { ok ? pass++ : fail++; console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : (d ?? '')); };
const S = (p) => p.evaluate(() => { const s = window.__WS__.ctl.state; const l = window.__WS__.engine.look; return { view: s.view, page: s.page, busy: s.busy, yaw: +l.yaw.toFixed(2), pitch: +l.pitch.toFixed(2), url: location.pathname + location.hash }; });
const settled = (p, v, page) => p.waitForFunction((v, page) => { const s = window.__WS__.ctl.state; return s.view === v && !s.busy && (!page || s.page === page); }, { timeout: 15000, polling: 60 }, v, page).then(() => sleep(1300), async (e) => { console.log('TIMEOUT waiting for', v, page, 'state:', JSON.stringify(await S(p).catch(() => null)), p.url()); throw e; });
const shot = (p, n) => p.screenshot({ path: path.join(OUT, n + '.png') });
const PHONE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
async function open(b, url, mobile, opts = {}) {
  const p = await b.newPage();
  await p.setViewport(mobile ? PHONE : (opts.vp || { width: 1280, height: 800 }));
  if (opts.reduced) await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  p.on('pageerror', (e) => errors.push(`${url}: ${e}`));
  await p.goto(BASE + url, { waitUntil: 'networkidle0' });
  if (!opts.lofi) {
    await p.waitForFunction(() => window.__WS__ && !window.__WS__.ctl.state.busy, { timeout: 25000 });
    await sleep(1500);
  } else await sleep(500);
  return p;
}
/** CSS px of the closed book's centre under the current camera, and whether it is on screen above the dock. */
const bookPt = (p) => p.evaluate(() => { const { book, camera, THREE } = window.__WS__.engine; const v = book.group.localToWorld(new THREE.Vector3(0, 30, 0)); v.project(camera); const dk = document.querySelector('.ws3d__dock').getBoundingClientRect(); const x = (v.x * 0.5 + 0.5) * innerWidth, y = (-v.y * 0.5 + 0.5) * innerHeight; return { x, y, on: x > 12 && x < innerWidth - 12 && y > 70 && y < dk.top - 8 && v.z < 1 }; });
/** Look around (as a visitor would) until the book is on screen. */
async function bringBook(p) {
  for (const yaw of [0, 0.5, 0.8, 1.0, -0.3, -0.6, -1.0]) for (const pitch of [0.2, 0, 0.45]) {
    await p.evaluate((y, pi) => window.__WS__.engine.setLook(y, pi), yaw, pitch); await sleep(120);
    const m = await bookPt(p); if (m.on) return m;
  }
  return bookPt(p);
}
async function dragTouch(p, x0, y0, x1, y1) {
  await p.touchscreen.touchStart(x0, y0);
  for (let i = 1; i <= 10; i++) { await p.touchscreen.touchMove(x0 + ((x1 - x0) * i) / 10, y0 + ((y1 - y0) * i) / 10); await sleep(16); }
  await p.touchscreen.touchEnd(); await sleep(500);
}
const paperInfo = (p) => p.evaluate(() => {
  const el = document.querySelector('.nb-paper'); if (!el || el.hidden) return null;
  const r = el.getBoundingClientRect(), dk = document.querySelector('.ws3d__dock').getBoundingClientRect(), body = el.querySelector('.nb-body');
  return { l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), b: Math.round(r.bottom), dockTop: Math.round(dk.top), vw: innerWidth, vh: innerHeight, font: parseFloat(getComputedStyle(body).fontSize), h2: el.querySelector('h2')?.textContent, label: el.getAttribute('aria-label') };
});
const norm = (t) => t.replace(/\s+/g, ' ').trim();

(async () => {
  const mod = await import(pathToFileURL(path.join(__dirname, '..', 'src', 'data', 'career.js')).href);
  const { ROLES, HIGHLIGHTS, CONTACT, CAREER_PAGES, CAREER_REVIEW, careerProofOk } = mod;
  const b = await puppeteer.launch({ headless: 'new', args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });

  /* ── data source ─────────────────────────────────────────────── */
  check('data: three roles with employer, title and dates, in order', ROLES.length === 3 && ROLES.every((r) => r.employer && r.title && r.dates), JSON.stringify(ROLES.map((r) => r.id)));
  check('data: dates match the résumé drafts', ROLES[0].dates === 'July 2025 – Present' && ROLES[1].dates === 'January 2014 – Present' && ROLES[2].dates === '2007 – 2014', JSON.stringify(ROLES.map((r) => r.dates)));
  check('data: every highlight that links a case study links one in the registry', careerProofOk());
  check('data: the review list is kept (conflicts and withheld claims are not silently dropped)', CAREER_REVIEW.length >= 8 && CAREER_REVIEW.some((r) => r.id === 'linkedin-url') && CAREER_REVIEW.some((r) => r.id === 'resume-pdf'));
  check('data: no PDF is offered (none is approved)', CONTACT.resumePdf === null);

  /* ── desktop ─────────────────────────────────────────────────── */
  let p = await open(b, '/', false);
  await shot(p, 'd01-desk');
  const rest = await bookPt(p);
  check('desktop desk: the closed notebook is on screen at rest', rest.on, JSON.stringify(rest));
  // overlap audit: nothing but the desk touches the closed or the open book, and nothing sits between the camera and the book
  const audit = await p.evaluate(() => {
    const { scene, camera, book, THREE } = window.__WS__.engine;
    const inBook = (o) => { for (let q = o; q; q = q.parent) if (q === book.group) return true; return false; };
    const hits = (label) => {
      const bb = new THREE.Box3().setFromObject(book.group, false);
      // the invisible fingertip slab is not part of the physical book
      const parts = []; book.group.traverse((o) => { if (o.isMesh && o.material.visible !== false) parts.push(o); });
      bb.makeEmpty(); parts.forEach((o) => bb.expandByObject(o));
      const out = [];
      scene.traverse((o) => { if (!o.isMesh || inBook(o) || o.material?.visible === false || o.material?.depthWrite === false) return; const ob = new THREE.Box3().setFromObject(o); if (ob.getSize(new THREE.Vector3()).length() > 2400) return; if (ob.intersectsBox(bb)) out.push(`${label}:${o.name || o.geometry.type}`); });
      return { out, bb: [bb.min.toArray().map(Math.round), bb.max.toArray().map(Math.round)] };
    };
    const closed = hits('closed');
    book.pose(1, [0, 0, 0]); book.group.updateMatrixWorld(true);
    const opened = hits('open');
    book.pose(1, [1, 1, 1]);
    const turned = hits('turned');
    book.pose(0, []);
    return { closed, opened, turned };
  });
  check('overlap: no desk object touches the closed notebook', !audit.closed.out.length, JSON.stringify(audit.closed));
  check('overlap: no desk object touches the opened notebook (cover swung over, pages turned)', !audit.opened.out.length && !audit.turned.out.length, JSON.stringify([audit.opened, audit.turned]));
  const occl = await p.evaluate(() => {
    const { scene, camera, book, machine, tray, mug, sheet, THREE } = window.__WS__.engine;
    const ray = new THREE.Raycaster(); const res = {};
    const first = (target) => { const c = new THREE.Box3().setFromObject(target).getCenter(new THREE.Vector3()); ray.set(camera.position, c.clone().sub(camera.position).normalize()); const objs = []; scene.traverse((o) => { if (o.isMesh && o.material.visible !== false && o.material.depthWrite !== false) objs.push(o); }); const h = ray.intersectObjects(objs, false)[0]; let q = h?.object, name = 'none'; while (q) { if (q === book.group) { name = 'book'; break; } if (q === machine) { name = 'machine'; break; } if (q === tray) { name = 'tray'; break; } if (q === mug) { name = 'mug'; break; } q = q.parent; } return name; };
    return { book: first(book.group), machine: first(machine), tray: first(tray), mug: first(mug) };
  });
  check('overlap: at the rest view the book hides none of the computer, disk tray or mug, and nothing hides the book', occl.book === 'book' && occl.machine === 'machine' && occl.tray === 'tray' && occl.mug === 'mug', JSON.stringify(occl));
  await p.mouse.move(rest.x, rest.y); await sleep(350);
  const tag = await p.evaluate(() => document.querySelector('.ws3d__tag')?.textContent || '');
  check('desktop: hovering the notebook says what it is', /career notebook/i.test(tag), tag);
  // a drag that starts on the book looks around and does not open it
  await p.mouse.move(rest.x, rest.y); await p.mouse.down(); await p.mouse.move(rest.x + 220, rest.y + 10, { steps: 8 }); await p.mouse.up(); await sleep(400);
  let s = await S(p);
  check('desktop: dragging from the notebook looks around and does not open it', s.view === 'rest' && s.yaw !== 0, JSON.stringify(s));
  await p.evaluate(() => window.__WS__.engine.setLook(0.3, 0.1)); await sleep(300);
  const m1 = await bookPt(p);
  await p.mouse.click(m1.x, m1.y); await sleep(350);
  check('desktop: the reading page is not shown while the camera is still flying to the book', await p.evaluate(() => { const e = document.querySelector('.nb-paper'); return !e || e.hidden; }));
  await settled(p, 'book', 'work'); s = await S(p);
  await shot(p, 'd02-open-work');
  check('desktop: clicking the notebook opens it at /#career', s.view === 'book' && s.page === 'work' && s.url === '/#career', JSON.stringify(s));
  let pi = await paperInfo(p);
  check('desktop: the reading page is on screen, above the dock, and its type is 14px or larger', pi && pi.l >= 0 && pi.t >= 0 && pi.l + pi.w <= pi.vw && pi.b <= pi.dockTop + 2 && pi.font >= 14, JSON.stringify(pi));
  check('desktop: the page is announced with its number and title', pi && /page 1 of 3: Work history/.test(pi.label), JSON.stringify(pi));
  const foc = await p.evaluate(() => document.activeElement?.tagName + ':' + document.activeElement?.textContent);
  check('desktop: focus lands on the page heading so a screen reader starts at the content', /^H2:Work history/.test(foc), foc);
  // content: every role's employer, title and dates are on page 1
  const workText = norm(await p.evaluate(() => document.querySelector('.nb-paper [data-career-page="work"]').textContent));
  check('desktop: page 1 lists every role (employer, title, dates)', ROLES.every((r) => workText.includes(r.employer) && workText.includes(r.title) && workText.includes(r.dates)), workText.slice(0, 200));
  // page navigation
  const btn = (p, re) => p.evaluate((re) => { const b = [...document.querySelectorAll('.ws3d__row--ctx button')].find((x) => new RegExp(re, 'i').test(x.getAttribute('aria-label') || x.textContent)); if (!b) return false; b.click(); return true; }, re);
  check('desktop: Previous is disabled on the first page', await p.evaluate(() => [...document.querySelectorAll('.ws3d__row--ctx button')].find((x) => /Previous/.test(x.getAttribute('aria-label')))?.disabled === true));
  await btn(p, 'Next page'); await settled(p, 'book', 'highlights'); s = await S(p);
  check('desktop: Next turns to Selected highlights at /#career/highlights', s.page === 'highlights' && s.url === '/#career/highlights', JSON.stringify(s));
  await shot(p, 'd03-open-highlights');
  const hlText = norm(await p.evaluate(() => document.querySelector('.nb-paper [data-career-page="highlights"]').textContent));
  check('desktop: highlights show problem, what I did and the documented result, and link the case studies', /Problem/.test(hlText) && /What I did/.test(hlText) && /Result/.test(hlText) && (await p.$$eval('.nb-paper a[href^="/projects/"]', (a) => a.length)) === HIGHLIGHTS.filter((h) => h.proof).length, hlText.slice(0, 200));
  await p.keyboard.press('ArrowRight'); await settled(p, 'book', 'resume'); s = await S(p);
  check('keyboard: ArrowRight turns to the last page (/#career/resume)', s.page === 'resume' && s.url === '/#career/resume', JSON.stringify(s));
  await shot(p, 'd04-open-resume');
  await p.keyboard.press('ArrowRight'); await settled(p, 'rest');
  check('keyboard: past the last page ArrowRight moves on to the next station (the desk)', (await S(p)).view === 'rest' && (await S(p)).url === '/');
  await p.keyboard.press('ArrowLeft'); await settled(p, 'book', 'work');
  check('keyboard: ArrowLeft from the desk comes back to the notebook (cycle: ... plans, notebook, desk)', (await S(p)).url === '/#career');
  await p.evaluate(() => window.__WS__.ctl.turnPage('resume')); await settled(p, 'book', 'resume');
  const links = await p.$$eval('.nb-paper a', (a) => a.map((x) => ({ t: x.textContent.trim(), h: x.getAttribute('href'), target: x.target })));
  check('desktop: the contact page offers LinkedIn and email, and no PDF download', links.some((l) => /LinkedIn/.test(l.t) && l.h === CONTACT.linkedin.href) && links.some((l) => l.h === CONTACT.email.href) && !links.some((l) => /\.pdf/i.test(l.h || '')), JSON.stringify(links));
  check('desktop: external links open in a new tab safely', (await p.$$eval('.nb-paper a[href^="http"]', (a) => a.every((x) => x.target === '_blank' && /noopener/.test(x.rel)))));
  await p.keyboard.press('ArrowLeft'); await settled(p, 'book', 'highlights'); s = await S(p);
  check('keyboard: ArrowLeft turns back one page', s.page === 'highlights');
  await p.evaluate(() => [...document.querySelectorAll('.nb-tabs button')].find((x) => /Work history/.test(x.textContent)).click()); await settled(p, 'book', 'work');
  check('desktop: the page tabs on the paper turn to that page', (await S(p)).page === 'work');
  // Escape returns to the desk at the viewpoint left
  await p.keyboard.press('Escape'); await settled(p, 'rest'); s = await S(p);
  check('desktop: Escape returns to the desk at /', s.view === 'rest' && s.url === '/', JSON.stringify(s));
  check('desktop: the desk look is restored exactly', Math.abs(s.yaw - 0.3) < 0.03 && Math.abs(s.pitch - 0.1) < 0.03, JSON.stringify(s));
  check('desktop: the reading page is gone from the room', (await p.$('.nb-paper')) === null);
  // history: Back/Forward retrace the visit
  await p.goBack(); await settled(p, 'book', 'work'); s = await S(p);
  check('history: Back from the desk returns to the open notebook', s.view === 'book' && s.url === '/#career', JSON.stringify(s));
  await p.goBack(); await settled(p, 'book', 'highlights'); check('history: Back again returns to the highlights page', (await S(p)).page === 'highlights');
  await p.goForward(); await settled(p, 'book', 'work'); check('history: Forward returns to the work page', (await S(p)).page === 'work');
  await p.goForward(); await settled(p, 'rest'); check('history: Forward returns to the desk', (await S(p)).view === 'rest');
  // Back to the desk button; tap off the book; a drag inside the open book does not close it
  await p.keyboard.press('n'); await settled(p, 'book', 'work');
  check('keyboard: N opens the notebook', (await S(p)).view === 'book');
  await p.mouse.move(200, 300); await p.mouse.down(); await p.mouse.move(120, 330, { steps: 6 }); await p.mouse.up(); await sleep(400);
  check('desktop: a drag across the open book does not close it', (await S(p)).view === 'book');
  await btn(p, 'Back to the desk'); await settled(p, 'rest'); check('desktop: "Back to the desk" returns to the desk', (await S(p)).url === '/');
  await p.keyboard.press('n'); await settled(p, 'book');
  await p.mouse.click(40, 300); await settled(p, 'rest'); check('desktop: a click on the empty desk beside the open book steps back', (await S(p)).view === 'rest');
  // other stations still work from the book, and the station nav shows where we are
  await p.keyboard.press('n'); await settled(p, 'book');
  check('desktop: the station switcher marks the notebook', await p.evaluate(() => document.querySelector('.ws3d__stations [aria-current]')?.textContent === 'Career notebook'));
  await p.keyboard.press('p'); await settled(p, 'plans'); check('P goes from the notebook to the plans', (await S(p)).view === 'plans');
  await p.waitForFunction(() => window.__WS__.engine.book.group && true); await sleep(900);
  const closedAgain = await p.evaluate(() => { const c = window.__WS__.engine.book.group.children; return Math.abs(c.find((x) => x.isGroup && x.children.length > 3)?.rotation.z ?? 0) < 0.01; });
  check('the notebook closes again when the camera leaves it', closedAgain);
  await p.keyboard.press('c'); await settled(p, 'crt'); check('C still goes to the computer', (await S(p)).view === 'crt');
  await p.keyboard.press('Escape'); await settled(p, 'rest');
  await p.keyboard.press('d'); await settled(p, 'drive'); check('D still goes to the disks', (await S(p)).view === 'drive');
  await p.keyboard.press('Escape'); await settled(p, 'rest');
  // case study link from the highlights and back
  await p.goto(BASE + '/#career/highlights'); await settled(p, 'book', 'highlights');
  await p.evaluate(() => document.querySelector('.nb-paper a[href="/projects/sidecar"]').click()); await sleep(1500);
  check('highlights: the case-study link opens the case study', /\/projects\/sidecar/.test(await p.evaluate(() => location.pathname)));
  await p.goBack(); await p.waitForFunction(() => window.__WS__ && window.__WS__.ctl.state.view === 'book' && !window.__WS__.ctl.state.busy, { timeout: 15000 }); await sleep(1200);
  s = await S(p);
  check('highlights: Back from the case study returns to the open notebook at the highlights', s.view === 'book' && s.page === 'highlights' && s.url === '/#career/highlights', JSON.stringify(s));
  await p.close();

  /* ── memory and idle behaviour ──────────────────────────────── */
  p = await open(b, '/', false);
  await p.keyboard.press('n'); await settled(p, 'book'); await p.keyboard.press('ArrowRight'); await sleep(700); await p.keyboard.press('Escape'); await settled(p, 'rest');   // warm-up: first draws upload the book's textures
  const mem0 = await p.evaluate(() => { const i = window.__WS__.engine.renderer.info; return { tex: i.memory.textures, geo: i.memory.geometries }; });
  for (let i = 0; i < 4; i++) { await p.keyboard.press('n'); await settled(p, 'book'); await p.keyboard.press('ArrowRight'); await sleep(700); await p.keyboard.press('Escape'); await settled(p, 'rest'); }
  const mem1 = await p.evaluate(() => { const i = window.__WS__.engine.renderer.info; return { tex: i.memory.textures, geo: i.memory.geometries }; });
  check('memory: opening and closing the notebook four times creates no new textures or geometries', mem1.tex <= mem0.tex && mem1.geo <= mem0.geo, JSON.stringify([mem0, mem1]));
  await p.keyboard.press('n'); await settled(p, 'book'); await sleep(600);
  const f0 = await p.evaluate(() => window.__WS__.engine.frames); await sleep(900); const f1 = await p.evaluate(() => window.__WS__.engine.frames);
  check('idle: no frames are drawn while the open notebook sits still', f1 === f0, `${f0} -> ${f1}`);
  await p.close();

  /* ── deep links, desktop and 1920 ───────────────────────────── */
  for (const [url, page] of [['/#career', 'work'], ['/#career/work', 'work'], ['/#career/highlights', 'highlights'], ['/#career/resume', 'resume'], ['/#career/not-a-page', 'work']]) {
    p = await open(b, url, false); await settled(p, 'book', page); s = await S(p);
    check(`deep link ${url} opens the ${page} page`, s.view === 'book' && s.page === page, JSON.stringify(s));
    if (url === '/#career/highlights') await shot(p, 'd05-deeplink-highlights');
    await p.close();
  }
  p = await open(b, '/#career', false, { vp: { width: 1920, height: 1080 } }); await settled(p, 'book');
  pi = await paperInfo(p); await shot(p, 'd06-1920-work');
  check('1920x1080: the reading page is on screen above the dock', pi && pi.b <= pi.dockTop + 2 && pi.l >= 0 && pi.l + pi.w <= pi.vw, JSON.stringify(pi));
  await p.close();
  p = await open(b, '/#career', false, { reduced: true });
  await p.waitForFunction(() => document.querySelector('.nb-paper') && !document.querySelector('.nb-paper').hidden, { timeout: 8000 }).catch(() => {});
  check('reduced motion: the notebook opens as a cut and the page appears', !!(await paperInfo(p)));
  await p.close();

  /* ── phone ──────────────────────────────────────────────────── */
  p = await open(b, '/', true);
  await shot(p, 'm01-desk');
  const lab = await p.evaluate(() => document.querySelector('.ws3d__row--rest .ws3d__label, .ws3d__row--ctx .ws3d__label')?.textContent || '');
  check('phone: the desk label names the notebook', /notebook/i.test(lab), lab);
  const mp = await bookPt(p);
  check('phone: the notebook is on screen at the rest view (standing on the shelf)', mp.on, JSON.stringify(mp));
  const shelfAudit = await p.evaluate(() => {
    const { scene, book, THREE } = window.__WS__.engine;
    const inBook = (o) => { for (let q = o; q; q = q.parent) if (q === book.group) return true; return false; };
    const bb = new THREE.Box3(); book.group.traverse((o) => { if (o.isMesh && o.material.visible !== false) bb.expandByObject(o); });
    const out = []; scene.traverse((o) => { if (!o.isMesh || inBook(o) || o.material?.visible === false || o.material?.depthWrite === false) return; const ob = new THREE.Box3().setFromObject(o); if (ob.getSize(new THREE.Vector3()).length() > 2400) return; if (ob.intersectsBox(bb)) out.push(o.name || o.geometry.type); });
    return { portrait: book.portrait(), out, bb: [bb.min.toArray().map(Math.round), bb.max.toArray().map(Math.round)] };
  });
  check('phone overlap: on the shelf the notebook touches no binder, bracket or other object', shelfAudit.portrait && !shelfAudit.out.length, JSON.stringify(shelfAudit));
  const occP = await p.evaluate(() => {
    const { scene, camera, book, machine, tray, mug, THREE } = window.__WS__.engine;
    const ray = new THREE.Raycaster();
    const first = (target) => { const c = new THREE.Box3().setFromObject(target).getCenter(new THREE.Vector3()); ray.set(camera.position, c.clone().sub(camera.position).normalize()); const objs = []; scene.traverse((o) => { if (o.isMesh && o.material.visible !== false && o.material.depthWrite !== false) objs.push(o); }); const h = ray.intersectObjects(objs, false)[0]; let q = h?.object, name = 'none'; while (q) { if (q === book.group) { name = 'book'; break; } if (q === machine) { name = 'machine'; break; } if (q === tray) { name = 'tray'; break; } if (q === mug) { name = 'mug'; break; } q = q.parent; } return name; };
    return { book: first(book.group), machine: first(machine), tray: first(tray), mug: first(mug) };
  });
  check('phone overlap: at the rest view the shelf book hides none of the computer, tray or mug', occP.book === 'book' && occP.machine === 'machine' && occP.tray === 'tray' && occP.mug === 'mug', JSON.stringify(occP));
  await shot(p, 'm02-notebook-on-shelf');
  s = await S(p);
  // touch drag that starts on the book looks around and does not open it
  await dragTouch(p, mp.x, mp.y, mp.x + 150, mp.y);
  let s2 = await S(p);
  check('phone: a touch drag starting on the notebook looks around and does not open it', s2.view === 'rest' && (s2.yaw !== s.yaw), JSON.stringify([s, s2]));
  await p.evaluate(() => window.__WS__.engine.setLook(0, 0)); await sleep(300);
  const mp2 = await bookPt(p);
  await p.touchscreen.tap(mp2.x, mp2.y); await sleep(600);
  check('phone: the reading page is not shown while the book is carried to the desk', await p.evaluate(() => { const e = document.querySelector('.nb-paper'); return !e || e.hidden; }));
  await settled(p, 'book', 'work'); s = await S(p);
  await shot(p, 'm03-open-work');
  check('phone: tapping the notebook on the shelf opens it', s.view === 'book' && s.url === '/#career', JSON.stringify(s));
  const carried = await p.evaluate(() => { const { book, THREE } = window.__WS__.engine; const q = book.group.localToWorld(new THREE.Vector3(0, 0, 0)); return { x: Math.round(q.x), y: Math.round(q.y) }; });
  check('phone: the book was carried to the desk to be read', carried.y < -300 && carried.x < -1000, JSON.stringify(carried));
  pi = await paperInfo(p);
  check('phone: readable without pinch-zoom (type 14px or larger, page fills the width)', pi && pi.font >= 14 && pi.w >= 300 && pi.l >= 0 && pi.l + pi.w <= pi.vw, JSON.stringify(pi));
  check('phone: the page sits clear of the dock', pi && pi.b <= pi.dockTop + 2, JSON.stringify(pi));
  const ctrl = await p.evaluate(() => [...document.querySelectorAll('.ws3d__row--ctx button, .nb-tabs button')].map((b) => ({ t: (b.getAttribute('aria-label') || b.textContent).trim(), h: Math.round(b.getBoundingClientRect().height) })));
  check('phone: every notebook control is at least 44 px tall', ctrl.length >= 6 && ctrl.every((c) => c.h >= 44), JSON.stringify(ctrl));
  // scrolling the page with a touch drag stays inside the page (no close, no look)
  const lk = (await S(p));
  await dragTouch(p, 200, 560, 200, 360);
  const sc = await p.evaluate(() => document.querySelector('.nb-body').scrollTop);
  check('phone: a touch drag on the page scrolls the page and does not leave the notebook', sc > 20 && (await S(p)).view === 'book', JSON.stringify({ sc, lk }));
  await shot(p, 'm04-scrolled-work');
  await p.evaluate(() => [...document.querySelectorAll('.ws3d__row--ctx button')].find((x) => /Next page/.test(x.getAttribute('aria-label'))).click()); await settled(p, 'book', 'highlights');
  await shot(p, 'm05-highlights');
  await p.evaluate(() => [...document.querySelectorAll('.ws3d__row--ctx button')].find((x) => /Next page/.test(x.getAttribute('aria-label'))).click()); await settled(p, 'book', 'resume');
  await shot(p, 'm06-resume');
  const rl = await p.$$eval('.nb-paper .career-contact a', (a) => a.map((x) => Math.round(x.getBoundingClientRect().height)));
  check('phone: contact links are present and are 44 px tap targets', rl.length >= 3 && rl.every((h) => h >= 44), JSON.stringify(rl));
  await p.evaluate(() => [...document.querySelectorAll('.ws3d__row--ctx button')].find((x) => /Back to the desk/.test(x.textContent)).click()); await settled(p, 'rest'); s = await S(p);
  check('phone: Back to the desk returns to the desk', s.view === 'rest' && s.url === '/', JSON.stringify(s));
  await sleep(1200);
  const homeAgain = await p.evaluate(() => { const { book, THREE } = window.__WS__.engine; const q = book.group.localToWorld(new THREE.Vector3(0, 0, 0)); return { x: Math.round(q.x), y: Math.round(q.y) }; });
  check('phone: the notebook is back on the shelf, closed', homeAgain.y > 300 && Math.abs(homeAgain.x + 700) < 40, JSON.stringify(homeAgain));
  // the Stations list carries the notebook
  await p.tap('.ws3d__stbtn'); await sleep(400);
  const st = await p.evaluate(() => [...document.querySelectorAll('.ws3d__stlist button')].map((b) => ({ t: b.textContent.trim(), h: Math.round(b.getBoundingClientRect().height) })));
  check('phone: the Stations list has Career notebook (44 px rows)', st.some((x) => /Career notebook/.test(x.t)) && st.every((x) => x.h >= 44), JSON.stringify(st));
  await shot(p, 'm07-stations-menu');
  await p.evaluate(() => [...document.querySelectorAll('.ws3d__stlist button')].find((b) => /Career notebook/.test(b.textContent)).click()); await settled(p, 'book', 'work');
  check('phone: choosing it from the list opens the notebook', (await S(p)).view === 'book');
  await p.close();
  for (const [url, page] of [['/#career', 'work'], ['/#career/highlights', 'highlights'], ['/#career/resume', 'resume']]) {
    p = await open(b, url, true); await settled(p, 'book', page); s = await S(p);
    check(`phone deep link ${url}`, s.view === 'book' && s.page === page, JSON.stringify(s));
    await p.close();
  }

  /* ── LO-FI: the same content, without the 3D engine ────────── */
  const ctx = await b.createBrowserContext();
  const lp = await ctx.newPage();
  await lp.setViewport({ width: 1280, height: 800 });
  const reqs = []; lp.on('request', (r) => reqs.push(r.url())); lp.on('pageerror', (e) => errors.push(`lofi: ${e}`));
  await lp.goto(BASE + '/?view=2d#career', { waitUntil: 'networkidle0' }); await sleep(600);
  check('LO-FI: /#career shows the plain career page', (await lp.$('main.career-flat h1')) !== null && /Career/.test(await lp.$eval('main.career-flat h1', (e) => e.textContent)));
  check('LO-FI: the 3D engine is not loaded (no workspace3d / three module requested, no canvas)', !reqs.some((u) => /workspace3d|three/i.test(u)) && (await lp.$('canvas')) === null, reqs.filter((u) => /workspace3d|three/i.test(u)).join(', '));
  const lofi = {};
  for (const pg of CAREER_PAGES) lofi[pg.id] = norm(await lp.$eval(`[data-career-page="${pg.id}"]`, (e) => e.textContent));
  check('LO-FI: every role (employer, title, dates) is on the page', ROLES.every((r) => lofi.work.includes(r.employer) && lofi.work.includes(r.title) && lofi.work.includes(r.dates)));
  check('LO-FI: every highlight and its case-study link is on the page', HIGHLIGHTS.every((h) => lofi.highlights.includes(h.topic)) && (await lp.$$eval('[data-career-page="highlights"] a[href^="/projects/"]', (a) => a.length)) === HIGHLIGHTS.filter((h) => h.proof).length);
  check('LO-FI: LinkedIn and email are offered; no PDF link', (await lp.$$eval('[data-career-page="resume"] a', (a) => a.map((x) => x.getAttribute('href')))).includes(CONTACT.linkedin.href) && !(await lp.$$eval('a', (a) => a.some((x) => /\.pdf/i.test(x.getAttribute('href') || '')))));
  await lp.screenshot({ path: path.join(OUT, 'l01-lofi-career.png') });
  // parity with the notebook's reading surface: same text, page by page
  const hp = await open(b, '/#career', false); await settled(p = hp, 'book', 'work');
  for (const pg of CAREER_PAGES) {
    await hp.evaluate((id) => window.__WS__.ctl.turnPage(id), pg.id); await settled(hp, 'book', pg.id);
    const t = norm(await hp.$eval(`.nb-paper [data-career-page="${pg.id}"]`, (e) => e.textContent));
    check(`parity: the notebook's ${pg.id} page has exactly the LO-FI page's text`, t === lofi[pg.id], `${t.slice(0, 80)} | ${lofi[pg.id].slice(0, 80)}`);
  }
  // withheld facts appear nowhere
  const all = Object.values(lofi).join(' ');
  const withheld = ['60%', '250', '350 ', '10+', 'Apollo', '12 years', '18+', 'christopher-rivero-47b03b97', '562-', 'Lakewood'];
  check('withheld: no unverified figure, conflicting URL or personal detail is published', withheld.every((w) => !all.includes(w)), withheld.filter((w) => all.includes(w)).join(', '));
  await hp.close();
  // links in and out of LO-FI
  await lp.goto(BASE + '/?view=2d', { waitUntil: 'networkidle0' }); await sleep(400);
  check('LO-FI home: links to the career page', (await lp.$('a[href="/#career"]')) !== null);
  await lp.click('a[href="/#career"]'); await sleep(500);
  check('LO-FI home: the link opens the career page', (await lp.$('main.career-flat')) !== null && (await lp.evaluate(() => location.hash)) === '#career');
  await lp.goto(BASE + '/?view=2d#career/highlights', { waitUntil: 'networkidle0' }); await sleep(700);
  const top = await lp.evaluate(() => Math.round(document.getElementById('career-highlights').getBoundingClientRect().top));
  check('LO-FI: /#career/highlights scrolls to the highlights section', top >= 0 && top < 200, String(top));
  // from LO-FI to the notebook
  await lp.evaluate(() => [...document.querySelectorAll('.flat-modeswitch button')].find((b) => /HI-FI/.test(b.textContent)).click());
  await lp.waitForFunction(() => window.__WS__ && window.__WS__.ctl.state.view === 'book' && !window.__WS__.ctl.state.busy, { timeout: 20000 }).catch(() => {});
  check('LO-FI -> HI-FI keeps the page: the notebook opens at the highlights', (await lp.evaluate(() => window.__WS__?.ctl.state.page)) === 'highlights');
  // and back: the room's LO-FI switch keeps the career page
  await lp.evaluate(() => [...document.querySelectorAll('.ws3d__mode button')].find((b) => /LO-FI/.test(b.textContent)).click()); await sleep(800);
  check('HI-FI -> LO-FI keeps the page: the plain career page is shown', (await lp.$('main.career-flat')) !== null);
  await lp.close(); await ctx.close();

  check('no page errors', errors.length === 0, errors.join(' | '));
  console.log(`\n${pass}/${pass + fail} passed`);
  await b.close();
  process.exit(fail ? 1 : 0);
})();

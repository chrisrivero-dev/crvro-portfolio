/* Regression suite (04B-04D checks, ported to the 05A station model): drives the real app (vite dev server on :5190) with real pointer, keyboard and touch input,
 * against the real Project World / Destination Lookup / case-study components. Writes captures/iter-05a/regression/*.png and report.json.
 * Run: node scripts/verify-04d.cjs   (needs `vite` running on 5190; puppeteer is resolved from the shared scratch install) */
const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(process.env.HOME, '.hermes/cache/scratch/crvro-m1-node/node_modules/puppeteer'));
const OUT = path.join(__dirname, '..', 'captures', 'iter-05a/regression');
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE || 'http://127.0.0.1:5190';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const report = { checks: [], errors: [] };
const check = (name, ok, detail) => { report.checks.push({ name, ok: !!ok, detail }); console.log(ok ? 'PASS' : 'FAIL', name, ok ? '' : (detail ?? '')); };
const ARGS = ['--use-angle=metal', '--ignore-gpu-blocklist'];

async function open(browser, url, { w = 1600, h = 1000, mobile = false, reduce = false, wait3d = true } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  if (reduce) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  page.on('pageerror', (e) => report.errors.push(`${url} :: ${e}`));
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource|ERR_NAME_NOT_RESOLVED|favicon/.test(m.text()) && report.errors.push(`${url} :: ${m.text()}`));
  await page.goto(BASE + url, { waitUntil: 'networkidle0' });
  if (wait3d) { await page.waitForFunction(() => window.__WS__, { timeout: 25000 }); await sleep(1200); }
  return page;
}
const shot = (page, name) => page.screenshot({ path: path.join(OUT, name + '.png') });
const ws = (page) => page.evaluate(() => ({ ...window.__WS__.ctl.state, frames: window.__WS__.engine.frames, suspended: window.__WS__.engine.suspended }));
const waitFor = (page, fn, arg, ms = 12000) => page.waitForFunction(fn, { timeout: ms, polling: 50 }, arg);
const hash = (page) => page.evaluate(() => location.pathname + location.hash);
const frames = (page) => page.evaluate(() => window.__WS__?.engine.frames ?? -1);
const scrollY = (page) => page.evaluate(() => Math.round(window.scrollY));
const pwStop = (page) => page.$eval('.pw-progress span', (e) => e.textContent.trim()).catch(() => null);

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ARGS });

  /* ── 1. home: one computer, the room, the real hero sentence ── */
  let page = await open(browser, '/');
  await shot(page, '01-home');
  check('home is the 3D room (no old CSS computer in the DOM)', await page.evaluate(() => !document.querySelector('.retro-crt') && !!document.querySelector('canvas#gl')));
  check('exactly one computer, and the 3D tray holds seven registry disks', await page.evaluate(() => window.__WS__.engine.diskList.length) === 7);
  // 05A: the dock is a station switcher plus actions for the current station
  const chips = await page.evaluate(() => [...document.querySelectorAll('.ws3d__stations button')].map((b) => b.textContent.trim() + (b.getAttribute('aria-current') ? '*' : '')));
  check('station switcher lists Desk, Computer, Disk tray with the current one marked', JSON.stringify(chips) === JSON.stringify(['Desk*', 'Computer', 'Disk tray']), JSON.stringify(chips));
  // focus order of the room, recorded for the report
  await page.evaluate(() => { window.scrollTo(0, 0); document.activeElement.blur(); });
  const order = [];
  for (let i = 0; i < 13; i++) { await page.keyboard.press('Tab'); order.push(await page.evaluate(() => { const e = document.activeElement; return (e.getAttribute('aria-label') || e.textContent || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 40) + (e.closest('#screen') ? ' [CRT]' : ''); })); }
  while (order.length && !/\[CRT\]|[A-Za-z]/.test(order[0].replace(/^\(function.*/, ''))) order.shift();
  if (/^\(function/.test(order[0])) order.shift();   // the first Tab can land on the document itself
  report.focusOrderRoom = order;
  check('room focus order: skip/quick links, then the HI-FI/LO-FI switch, the CRT control, then the stations', /without 3D/i.test(order[0]) && order.findIndex((x) => /LO-FI/.test(x)) > 5 && order.findIndex((x) => /USE THE COMPUTER/.test(x) && /CRT/.test(x)) > order.findIndex((x) => /LO-FI/.test(x)) && order.findIndex((x) => /^Desk/.test(x)) > order.findIndex((x) => /CRT/.test(x)), JSON.stringify(order));
  await page.evaluate(() => document.activeElement.blur());
  check('screen shows the production hero sentence', await page.evaluate(() => /I turn difficult support and mapping workflows into controlled, testable software\./.test(document.getElementById('screen').innerText)));
  check('document has one h1 and real text for crawlers/AT', await page.evaluate(() => document.querySelectorAll('h1').length === 1 && /Python automation/.test(document.body.innerText)));
  const idle0 = await page.evaluate(() => window.__WS__.engine.frames); await sleep(1200);
  check('idle room renders no frames (on-demand) apart from steam in view', ((await frames(page)) - idle0) <= 25, `${(await frames(page)) - idle0} frames/1.2s`);

  /* ── 2. floppy -> directory -> real case-study route -> Back ── */
  const diskXY = (slug) => page.evaluate((s) => { const { scene, camera } = window.__WS__.engine; let g; scene.traverse((o) => { if (o.userData?.project?.slug === s && !o.userData.loose && !g) g = o; }); const v = g.getWorldPosition(g.position.clone()).project(camera); return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight + 30 }; }, 'zarvin-one');
  const dz = await diskXY();
  await page.mouse.move(dz.x, dz.y); await sleep(700);
  const camBefore = await page.evaluate(() => window.__WS__.engine.camera.position.toArray().map(Math.round));
  check('hover over a disk labels it and does not move the camera', !!(await page.$('.ws3d__tag')) && JSON.stringify(camBefore) === JSON.stringify(await page.evaluate(() => window.__WS__.engine.camera.position.toArray().map(Math.round))));
  await page.mouse.click(dz.x, dz.y);
  await page.waitForFunction(() => window.__WS__.ctl.state.view === 'hold', { timeout: 10000 }); await sleep(300);
  await shot(page, '02-held');
  await page.evaluate(() => [...document.querySelectorAll('.ws3d__dock button')].find((b) => /Insert into drive/.test(b.textContent)).click());
  await sleep(1500); await shot(page, '02a-disk-travelling');
  await sleep(700); await shot(page, '02b-disk-insertion');
  await waitFor(page, () => window.__WS__.ctl.state.session === 'zarvin-one' && document.querySelector('.ws-view'), null, 15000);
  await sleep(1300);
  await shot(page, '02-disk-zarvin');
  const dir = await page.evaluate(() => ({ vol: document.querySelector('.ws-vol')?.textContent, view: document.querySelector('.ws-view')?.innerText, link: document.querySelector('.ws-view .ws-link')?.getAttribute('href') }));
  check('disk label/volume carries its stable case ID (Zarvin One = C-06)', /CASE C-06/.test(dir.vol), dir.vol);
  check('directory content is the registry description', /A personal AI operating system that takes responsibility for work\./.test(dir.view));
  for (let i = 0; i < 4; i++) { await page.keyboard.press('ArrowDown'); await sleep(250); }
  await waitFor(page, () => !!document.querySelector('.ws-view .ws-link'), null, 4000);
  check('CASE.LNK is the real in-app route /projects/zarvin-one', (await page.$eval('.ws-view .ws-link', (a) => a.getAttribute('href'))) === '/projects/zarvin-one');
  await page.click('.ws-view .ws-link');
  await waitFor(page, () => location.pathname === '/projects/zarvin-one' && document.querySelector('.case-back, .back-link, h1'), null, 8000);
  await sleep(500);
  await shot(page, '03-case-study');
  check('case study opens inside the same immersive interface', await page.evaluate(() => !!document.querySelector('.os[data-os="case"]') && /CASE C-06/.test(document.querySelector('.os__path').textContent) && !document.querySelector('.site-header')));
  const sus = await page.evaluate(() => window.__WS__.engine.suspended);
  check('3D is suspended while a case study is open', sus === true);
  const f0 = await frames(page); await sleep(1500);
  check('suspended engine renders zero frames (steam stopped too)', (await frames(page)) === f0, `${(await frames(page)) - f0} frames`);
  await page.goBack();
  await waitFor(page, () => location.pathname === '/' && window.__WS__ && !window.__WS__.engine.suspended, null, 8000);
  await sleep(1200);
  const back = await ws(page);
  check('Back from the case study returns to the room with the disk still seated', back.session === 'zarvin-one' && back.view === 'crt', JSON.stringify(back));
  await page.evaluate(() => [...document.querySelectorAll('.ws3d__dock button')].find((b) => /Eject disk/.test(b.textContent)).click());
  await waitFor(page, () => window.__WS__.ctl.state.session === null && Object.values(window.__WS__.ctl.state ? {} : {}).length === 0, null, 3000).catch(() => {});
  // 05A: eject ends at the organizer (the visitor can pick another disk); Escape then returns to the desk
  await waitFor(page, () => { const s = window.__WS__.ctl.state; return s.view === 'drive' && !s.session && !s.busy && s.locs['zarvin-one'] === 'home'; }, null, 12000);
  check('eject returns the disk to its slot and leaves the camera at the organizer', true);
  await page.keyboard.press('Escape');
  await waitFor(page, () => { const s = window.__WS__.ctl.state; return s.view === 'rest' && !s.busy; }, null, 8000);
  await sleep(600);

  /* ── 3. CRT menu -> Project World (full viewport, real component) ── */
  const tUse0 = Date.now();
  await page.click('.ws3d__stations button:nth-child(2)');
  await waitFor(page, () => document.querySelectorAll('[data-entry]').length === 6, null, 8000);
  check('CRT menu appears at once (no typing or staged loading)', Date.now() - tUse0 < 500, `${Date.now() - tUse0}ms`);
  await sleep(1300);
  await shot(page, '04-crt-menu');
  const menu = await page.evaluate(() => [...document.querySelectorAll('[data-entry]')].map((b) => b.querySelector('.ws-fn').textContent + '.' + b.querySelector('.ws-fe').textContent));
  check('CRT menu lists the experiences', JSON.stringify(menu) === JSON.stringify(['WORLD.MAP', 'ASK.EXE', 'ABOUT.TXT', 'SKILLS.TXT', 'CONSULT.EXE', 'CONTACT.TXT']), JSON.stringify(menu));
  check('keyboard focus lands in the menu', await page.evaluate(() => !!document.activeElement?.closest('[data-entry]') || document.activeElement?.hasAttribute('data-entry')));
  await page.click('[data-entry="work"]');
  await sleep(350); await shot(page, '05-handoff-fill');
  await waitFor(page, () => location.hash === '#work', null, 10000);
  await sleep(80);
  const handoff = await page.evaluate(() => ({ os: !!document.querySelector('.os'), roomStillUnder: !!document.querySelector('.ws3d--leaving'), dark: getComputedStyle(document.body).backgroundColor }));
  check('hand-off is a crossfade: the interface mounts while the room fades out underneath', handoff.os && handoff.roomStillUnder, JSON.stringify(handoff));
  await shot(page, '05b-handoff-crossfade');
  await waitFor(page, () => document.querySelector('.project-world'), null, 10000);
  await sleep(900);
  await shot(page, '06-project-world');
  check('Project World runs inside the immersive computer interface (dark phosphor frame, tabs, return action)', await page.evaluate(() => { const os = document.querySelector('.os[data-os="work"]'); if (!os) return false; const bg = getComputedStyle(document.body).backgroundColor.match(/\d+/g).map(Number); const r = document.querySelector('.os__return').getBoundingClientRect(); return bg[0] < 40 && !!document.querySelector('.os__tab.is-on') && r.height >= 40 && r.right <= innerWidth && !document.querySelector('.site-header'); }));
  // Skip Journey: skips the journey to what follows it, in place
  const skipBefore = await page.evaluate(() => location.hash);
  await page.evaluate(() => [...document.querySelectorAll('.pwbtn')].find((b) => /skip journey/i.test(b.textContent)).click());
  await waitFor(page, () => { const b = document.querySelector('#navigator .retro-crt').getBoundingClientRect(); return b.top >= 0 && b.bottom <= innerHeight; }, null, 9000).catch(() => {});
  await sleep(300);
  const skip = await page.evaluate(() => { const n = document.getElementById('navigator').getBoundingClientRect(); const box = document.querySelector('#navigator .retro-crt').getBoundingClientRect(); return { hash: location.hash, navTop: Math.round(n.top), inView: box.top >= 0 && box.bottom <= innerHeight, about: !!document.querySelector('section#about'), stillWorld: !!document.querySelector('.project-world') }; });
  check('"Skip journey" skips to the Destination Lookup that follows the voyage (not About), staying in Project World', skipBefore === '#work' && skip.hash === '#work' && skip.inView && !skip.about && skip.stillWorld, JSON.stringify(skip));
  await shot(page, '06b-skip-journey');
  check('post-journey Lookup keeps its original "journey complete" intro after Project World', await page.evaluate(() => /journey complete/.test(document.getElementById('navigator').innerText)));
  await page.evaluate(() => window.scrollTo(0, 0)); await sleep(800);
  check('WORLD.MAP opens the existing Project World at /#work', (await hash(page)) === '/#work');
  check('Project World is the real component (map, ship, voyage log controls)', await page.evaluate(() => !!document.querySelector('.pw-map-wrap svg') && !!document.querySelector('.pw-dots')));
  check('no second computer in the experience (hero CSS computer absent)', await page.evaluate(() => !document.querySelector('.retro-crt--chrome-full')));
  check('Project World is a real full-viewport stage (sticky, not a tiny CRT)', await page.evaluate(() => { const r = document.querySelector('.pw-stage').getBoundingClientRect(); return r.width > innerWidth * 0.7 && r.height > innerHeight * 0.75; }));
  check('focus moved to the new experience (main)', await page.evaluate(() => document.activeElement?.id === 'main'));
  const f1 = await frames(page); await sleep(1500);
  check('room is suspended behind Project World (0 frames)', (await frames(page)) === f1 && (await ws(page)).suspended);
  check('the destination lookup follows the voyage (post-journey placement preserved)', await page.evaluate(() => { const w = document.querySelector('#work'), n = document.querySelector('#navigator'); return !!n && !!(w.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING); }));

  /* ── 4. progress + scroll restoration inside Project World ── */
  await page.click('.pw-dot:nth-child(3)');
  await sleep(1800);
  const stopA = await pwStop(page), yA = await scrollY(page);
  check('journey advanced to stop 03', /STOP 03/.test(stopA), stopA);
  await shot(page, '07-world-stop3');
  const cta = await page.$('.pw-card.active .pr-cta-link');
  check('stop card has the real case-study link', !!cta);
  const href = await page.$eval('.pw-card.active .pr-cta-link', (a) => a.getAttribute('href'));
  await page.click('.pw-card.active .pr-cta-link');
  await waitFor(page, (h) => location.pathname === h, href, 8000);
  await sleep(500);
  await page.goBack();
  await waitFor(page, () => location.hash === '#work' && document.querySelector('.pw-progress'), null, 8000);
  await sleep(1800);
  const stopB = await pwStop(page), yB = await scrollY(page);
  check('Back from a case study restores the journey stop', stopB === stopA, `${stopA} -> ${stopB}`);
  check('Back restores window.scrollY', Math.abs(yB - yA) < 40, `${yA} -> ${yB}`);

  /* ── 5. return to the computer: button and browser Back ── */
  await page.click('.os__return');
  await waitFor(page, () => location.pathname === '/' && location.hash === '#computer' && window.__WS__ && !window.__WS__.engine.suspended, null, 8000);
  await sleep(1600);
  await shot(page, '08-return-to-crt');
  const r1 = await ws(page);
  check('"Computer" returns to the room at the CRT menu (not the start)', r1.view === 'crt' && r1.lastEntry === 'work', JSON.stringify(r1));
  check('focus returns to the WORLD.MAP entry', await page.evaluate(() => document.activeElement?.dataset?.entry === 'work'));
  check('room renders again after resume', (await frames(page)) > f1);
  await page.goBack(); // history: / (room) <- /#work : Back from room goes to previous entry (/#work)
  await waitFor(page, () => location.hash === '#work', null, 8000).catch(() => {});
  const wentBack = await hash(page);
  check('browser Back moves through the real history (room <-> World)', wentBack === '/#work' || wentBack === '/');
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__WS__, { timeout: 20000 }); await sleep(1200);

  /* ── 6. Destination Lookup through the computer (real component, real routes) ── */
  const api = [];
  page.on('request', (r) => /\/api\//.test(r.url()) && api.push(`${r.method()} ${new URL(r.url()).pathname}`));
  await page.click('.ws3d__stations button:nth-child(2)'); await waitFor(page, () => document.querySelectorAll('[data-entry]').length === 6, null, 8000); await sleep(1200);
  await page.click('[data-entry="navigator"]');
  // 05A: ASK.EXE opens on the physical CRT first; FULL SCREEN expands it into the full interface
  await waitFor(page, () => !!document.querySelector('#screen .retro-term-input'), null, 6000);
  check('ASK.EXE opens on the physical CRT', true);
  await page.evaluate(() => [...document.querySelectorAll('#screen .ws-linkbtn')].find((b) => /FULL SCREEN/.test(b.textContent)).click());
  await waitFor(page, () => location.hash === '#navigator' && document.querySelector('.os .retro-term-input'), null, 10000);
  await sleep(700);
  await shot(page, '09-ask-open');
  check('ASK.EXE opens the existing PortfolioNavigator', await page.evaluate(() => /SYSTEM RETURN · DESTINATION LOOKUP/.test(document.body.innerText) && !!document.querySelector('.retro-crt--navigator')));
  await page.type('.retro-term-input', 'how do I contact you?'); await page.keyboard.press('Enter');
  await waitFor(page, () => document.querySelector('.retro-term-result a.retro-term-link'), null, 5000);
  const det = await page.$eval('.retro-term-result a.retro-term-link', (a) => a.getAttribute('href'));
  check('deterministic matching answers instantly with no network call', det === '/#contact' && api.length === 0, JSON.stringify({ det, api }));
  await shot(page, '10-ask-deterministic');
  await page.click('.retro-term-result a.retro-term-link');
  await waitFor(page, () => location.hash === '#contact' && document.querySelector('section#contact'), null, 6000);
  check('a lookup result link opens the Contact experience in-app', true);
  await page.goBack(); await waitFor(page, () => location.hash === '#navigator', null, 6000); await sleep(500);
  await page.$eval('.retro-term-input', (i) => { i.value = ''; });
  await page.click('.retro-term-input', { clickCount: 3 });
  await page.type('.retro-term-input', 'xylophone quantum marmalade'); await page.keyboard.press('Enter');
  await waitFor(page, () => /temporarily offline/.test(document.body.innerText), null, 15000);
  await sleep(300);
  await shot(page, '11-ask-offline');
  check('open-ended question went to POST /api/ask (the real broker route)', api.includes('POST /api/ask'), JSON.stringify(api));
  check('with no backend the page says "temporarily offline" and keeps manual categories', await page.evaluate(() => document.querySelectorAll('.retro-term-offline-categories button').length === 5));
  await page.click('.retro-term-offline-categories button:nth-child(5)'); // [Contact] -> deterministic
  await waitFor(page, () => document.querySelector('.retro-term-result a.retro-term-link[href="/#contact"]'), null, 4000);
  check('offline fallback category still resolves deterministically', true);

  /* ── 7. About / Skills / Consult / Contact through the CRT ── */
  for (const [id, sel] of [['about', 'section#about'], ['skills', 'section#skills'], ['ai-consultation', 'section#ai-consultation'], ['contact', 'section#contact']]) {
    await page.click('.os__return'); await waitFor(page, () => location.pathname === '/' && location.hash === '#computer' && !window.__WS__.engine.suspended, null, 8000); await sleep(1500);
    await waitFor(page, () => document.querySelectorAll('[data-entry]').length === 6, null, 6000);
    await page.click(`[data-entry="${id}"]`);
    if (id === 'contact') { await sleep(500); await page.evaluate(() => [...document.querySelectorAll('#screen .ws-linkbtn')].find((b) => /FULL SCREEN/.test(b.textContent)).click()); }   // 05A: CONTACT.TXT opens on the CRT first
    await waitFor(page, (h) => location.hash === '#' + h, id, 8000); await sleep(900);
    const ok = await page.evaluate((s) => { const el = document.querySelector(s); if (!el) return false; const reveal = el.querySelector('.reveal'); return !reveal || getComputedStyle(reveal).opacity !== '0'; }, sel);
    check(`${id.toUpperCase()} opens the real section and its content is visible`, ok);
    if (id === 'about') await shot(page, '12-about');
  }
  await page.close();

  /* ── 8. deep links bypass the room entirely ── */
  for (const [u, test, name] of [
    ['/#work', () => !!document.querySelector('.project-world') && !window.__WS__, '/#work (no 3D mounted)'],
    ['/#navigator', () => !!document.querySelector('.retro-term-input') && !window.__WS__, '/#navigator'],
    ['/#about', () => !!document.querySelector('section#about'), '/#about'],
    ['/projects/proof-first', () => /Proof First/.test(document.title) && !window.__WS__, '/projects/proof-first'],
    ['/projects/predmkt-bot', () => /Predmkt/.test(document.title), '/projects/predmkt-bot (unlisted, direct link)'],
    ['/projects/parcel-engine', () => /Parcel Engine/.test(document.title), '/projects/parcel-engine'],
  ]) {
    const p = await open(browser, u, { wait3d: false }); await sleep(900);
    check(`deep link ${name} works`, await p.evaluate(test));
    if (u === '/#work') await shot(p, '13-deeplink-world');
    await p.close();
  }
  { const p = await open(browser, '/?classic=1', { wait3d: false }); await sleep(900);
    check('the original stacked home page is preserved at /?classic=1', await p.evaluate(() => !!document.querySelector('.retro-crt--chrome-full') && !!document.querySelector('#work') && !!document.querySelector('#navigator') && !window.__WS__));
    await shot(p, '14-classic'); await p.close(); }

  /* ── 9. keyboard-only path ── */
  page = await open(browser, '/');
  await page.keyboard.press('Tab');
  check('first Tab stop is the skip/quick-link nav', await page.evaluate(() => !!document.activeElement?.closest('.ws3d__quick')));
  await page.focus('.ws3d__stations button:nth-child(2)'); await page.keyboard.press('Enter');
  await waitFor(page, () => document.querySelectorAll('[data-entry]').length === 6, null, 8000); await sleep(1300);
  await page.keyboard.press('ArrowDown'); await sleep(200);
  check('arrow keys move through the CRT menu', await page.evaluate(() => document.activeElement?.dataset?.entry === 'navigator'));
  await page.keyboard.press('Escape'); await sleep(1300);
  check('Escape pulls back from the screen to the room', (await ws(page)).view === 'rest');
  await page.focus('.ws3d__stations button:nth-child(2)'); await page.keyboard.press('Enter'); await waitFor(page, () => document.querySelectorAll('[data-entry]').length === 6, null, 8000); await sleep(1300);
  await page.focus('[data-entry="about"]'); await page.keyboard.press('Enter');
  await waitFor(page, () => location.hash === '#about', null, 8000);
  check('Enter on a menu entry opens it and focuses the page', await page.evaluate(() => document.activeElement?.id === 'main'));
  await page.keyboard.press('Tab');
  check('the "Computer" return link is reachable by keyboard', await page.evaluate(() => !!document.querySelector('.os__return')));
  await page.close();

  /* ── 10. reduced motion ── */
  page = await open(browser, '/', { reduce: true });
  const t0 = Date.now();
  await page.click('.ws3d__stations button:nth-child(2)');
  await waitFor(page, () => document.querySelectorAll('[data-entry]').length === 6, null, 3000);
  const tUse = Date.now() - t0;
  await page.click('[data-entry="work"]');
  await waitFor(page, () => location.hash === '#work' && document.querySelector('.project-world'), null, 6000);
  check('reduced motion: the whole hand-off to Project World is a jump cut', Date.now() - t0 < 2500, `${Date.now() - t0}ms (menu ${tUse}ms)`);
  await page.close();

  /* ── 11. phone portrait, touch ── */
  page = await open(browser, '/', { w: 390, h: 844, mobile: true });
  await shot(page, '15-mobile-home');
  const bh = await page.evaluate(() => Math.min(...[...document.querySelectorAll('.ws3d__dock button')].map((b) => b.getBoundingClientRect().height)));
  check('mobile: every dock control is at least 44px tall', bh >= 44, bh);
  const fit = await page.evaluate(() => { const { camera, machine } = window.__WS__.engine; const v = machine.getWorldPosition(machine.position.clone()).project(camera); return Math.abs(v.x) < 1 && Math.abs(v.y) < 1; });
  check('mobile: the computer is inside the viewport at rest', fit);
  await page.tap('.ws3d__stations button:nth-child(2)');
  await waitFor(page, () => document.querySelectorAll('[data-entry]').length === 6, null, 10000); await sleep(1400);
  await shot(page, '16-mobile-menu');
  const mfs = await page.evaluate(() => { const b = document.querySelector('[data-entry="work"] .ws-fn'); const s = document.getElementById('screen').getBoundingClientRect(); return { px: parseFloat(getComputedStyle(b).fontSize) * (s.width / 600), sw: s.width }; });
  check('mobile: menu text renders at 9px or larger and the screen fits the viewport', mfs.px >= 9 && mfs.sw <= 390, JSON.stringify(mfs));
  await page.tap('[data-entry="work"]');
  await waitFor(page, () => location.hash === '#work' && document.querySelector('.project-world'), null, 10000); await sleep(900);
  await shot(page, '17-mobile-world');
  check('mobile: Project World is the real mobile journey', await page.evaluate(() => !!document.querySelector('.pwm-journey, [id^="pw-stop-"]')));
  await page.evaluate(() => window.scrollTo(0, 1500)); await sleep(500);
  const y1 = await scrollY(page);
  await page.tap('.os__return');
  await waitFor(page, () => location.pathname === '/' && location.hash === '#computer', null, 8000); await sleep(1500);
  check('mobile: "Computer" returns to the room', (await ws(page)).view === 'crt');
  await page.goBack(); await waitFor(page, () => location.hash === '#work', null, 8000); await sleep(1200);
  const y2 = await scrollY(page);
  check('mobile: Back restores the scroll position in Project World', Math.abs(y2 - y1) < 60, `${y1} -> ${y2}`);
  await page.close();

  /* ── 12. WebGL context loss ── */
  page = await open(browser, '/');
  await page.evaluate(() => { window.__lose = window.__WS__.engine.renderer.getContext().getExtension('WEBGL_lose_context'); window.__lose.loseContext(); });
  await sleep(400);
  check('context loss shows a status message instead of a frozen canvas', await page.evaluate(() => /Graphics reset/.test(document.body.innerText)));
  await page.evaluate(() => window.__lose.restoreContext()); await sleep(1500);
  check('a restored context recovers the room (no fallback)', await page.evaluate(() => !/Graphics reset/.test(document.body.innerText) && !!window.__WS__));
  await page.evaluate(() => window.__WS__.engine.markDirty()); const fr = await frames(page); await sleep(500);
  check('rendering continues after restore', (await frames(page)) >= fr);
  await page.evaluate(() => { window.__lose2 = window.__WS__.engine.renderer.getContext().getExtension('WEBGL_lose_context'); window.__lose2.loseContext(); });
  await waitFor(page, () => !!document.querySelector('.flat-home'), null, 9000);
  await shot(page, '18-context-lost-fallback');
  check('a context that never returns falls back to the plain 2D page with an explanation', await page.evaluate(() => /graphics were reset/.test(document.querySelector('.flat-notice')?.textContent || '')));
  await page.close();

  /* ── 13. 2D choice + no-WebGL2 browser ── */
  page = await open(browser, '/');
  await page.click('.ws3d__flat');
  await waitFor(page, () => !!document.querySelector('.flat-home'), null, 6000); await sleep(400);
  await shot(page, '19-flat-home');
  check('"2D view" shows the plain page (one h1, no canvas, no retro computer)', await page.evaluate(() => document.querySelectorAll('h1').length === 1 && !document.querySelector('canvas') && !document.querySelector('.retro-crt')));
  check('plain page lists every experience and the registry case studies', await page.evaluate(() => document.querySelectorAll('.flat-list li').length === 6 + 7));
  await page.click('.flat-list a[href="/#work"]'); await waitFor(page, () => !!document.querySelector('.project-world'), null, 8000);
  check('plain-page links open the same real experiences', true);
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' }); await sleep(600);
  check('the 2D choice persists', await page.evaluate(() => !!document.querySelector('.flat-home')));
  await page.click('.flat-home button.btn'); await page.waitForFunction(() => window.__WS__, { timeout: 20000 });
  check('"Try the 3D workspace" returns to the room', true);
  await page.close();

  const nogl = await puppeteer.launch({ headless: 'new', args: ['--disable-3d-apis', '--disable-gpu'] });
  page = await open(nogl, '/', { wait3d: false }); await sleep(1500);
  check('a browser without WebGL2 gets the plain page with a notice', await page.evaluate(() => !!document.querySelector('.flat-home') && /can't run the 3D workspace/.test(document.querySelector('.flat-notice')?.textContent || '')));
  await shot(page, '20-no-webgl');
  await page.goto(BASE + '/projects/proof-first', { waitUntil: 'networkidle0' }); await sleep(700);
  check('no-WebGL2 browser: a case-study deep link renders the original page (no 3D dependency)', await page.evaluate(() => !document.querySelector('.os') && /Proof First/.test(document.title)));
  await page.close(); await nogl.close();


  /* ── 14. 04C: ASK.EXE intro, 429, back-link, tray/CRT targets ── */
  page = await open(browser, '/#navigator', { wait3d: false }); await sleep(1000);
  check('ASK.EXE entered directly does not claim a completed journey', await page.evaluate(() => !/journey complete/.test(document.getElementById('navigator').innerText) && /selected systems indexed/.test(document.getElementById('navigator').innerText)));
  await page.close();
  { const p = await browser.newPage(); await p.setViewport({ width: 1400, height: 900 });
    await p.setRequestInterception(true);
    const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
    p.on('request', (r) => { if (new URL(r.url()).pathname === '/api/ask') (r.method() === 'OPTIONS' ? r.respond({ status: 204, headers: CORS }) : r.respond({ status: 429, headers: CORS, contentType: 'application/json', body: '{"error":"rate_limited"}' })); else r.continue(); });
    await p.goto(BASE + '/#navigator', { waitUntil: 'networkidle0' }); await p.waitForSelector('.retro-term-input'); await sleep(500);
    await p.type('.retro-term-input', 'xylophone quantum marmalade'); await p.keyboard.press('Enter'); await sleep(1500);
    const t = await p.$eval('.retro-term-result-region', (e) => e.innerText.replace(/\s+/g, ' '));
    check('HTTP 429 shows an accurate rate-limit message, not "offline" (simulated response)', /too many questions/.test(t) && !/offline/i.test(t), t);
    check('rate-limit message keeps the manual categories', await p.evaluate(() => document.querySelectorAll('.retro-term-offline-categories button').length === 5));
    await shot(p, '11b-ask-rate-limited'); await p.close(); }

  page = await open(browser, '/');
  // CRT and tray are primary pointer targets (not only the dock)
  const bezel = await page.evaluate(() => { const { camera, THREE } = window.__WS__.engine; const v = new THREE.Vector3(-355, 39, 300).project(camera); return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight }; });
  await page.mouse.move(bezel.x, bezel.y); await sleep(500);
  check('hovering the computer labels it', await page.evaluate(() => /The computer/.test(document.querySelector('.ws3d__tag')?.textContent || '')));
  await page.mouse.click(bezel.x, bezel.y);
  await waitFor(page, () => window.__WS__.ctl.state.view === 'crt', null, 6000);
  check('clicking the computer itself approaches the CRT', true);
  await sleep(1200); await page.keyboard.press('Escape'); await sleep(1500);
  const tray = await page.evaluate(() => { const { camera, tray } = window.__WS__.engine; const v = tray.localToWorld(tray.position.clone().set(0, 30, 330)).project(camera); return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight }; });
  await page.mouse.move(tray.x, tray.y); await sleep(500);
  check('hovering the tray labels it', await page.evaluate(() => /Floppy organizer/.test(document.querySelector('.ws3d__tag')?.textContent || '')));
  await page.mouse.click(tray.x, tray.y);
  await waitFor(page, () => window.__WS__.ctl.state.view === 'drive', null, 6000); await sleep(1300);
  await shot(page, '21-tray-closeup');
  check('clicking the tray frames the disks and the drive without loading anything', (await ws(page)).view === 'drive' && (await ws(page)).session === null && (await ws(page)).pending === null);
  const dz2 = await page.evaluate(() => { const { scene, camera } = window.__WS__.engine; let g; scene.traverse((o) => { if (o.userData?.project?.slug === 'proof-first' && !o.userData.loose && !g) g = o; }); const v = g.getWorldPosition(g.position.clone()).project(camera); return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight + 40 }; });
  // aim at the disk's own shutter strip (the part of a back disk that shows above the one in front of it)
  const dz3 = await page.evaluate(() => { const { scene, camera, THREE } = window.__WS__.engine; let g; scene.traverse((o) => { if (o.userData?.project?.slug === 'proof-first' && !o.userData.loose && !g) g = o; }); const v = g.localToWorld(new THREE.Vector3(0, 80, 0)).project(camera); return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight }; });
  await page.mouse.click(dz3.x, dz3.y);
  await waitFor(page, () => window.__WS__.ctl.state.held === 'proof-first', null, 15000);
  await page.evaluate(() => [...document.querySelectorAll('.ws3d__dock button')].find((b) => /Insert into drive/.test(b.textContent)).click());
  await waitFor(page, () => window.__WS__.ctl.state.session === 'proof-first', null, 15000);
  check('from the tray close-up, a disk is lifted and then inserted', true);
  await sleep(1300); await shot(page, '22-proof-first-directory');
  // back-link from a case study returns to the journey place
  await page.keyboard.press('Escape'); await sleep(1200);
  await page.close();

  page = await open(browser, '/');
  await page.click('.ws3d__stations button:nth-child(2)'); await waitFor(page, () => document.querySelectorAll('[data-entry]').length === 6, null, 8000); await sleep(1100);
  await page.click('[data-entry="work"]'); await waitFor(page, () => location.hash === '#work' && document.querySelector('.pw-dots'), null, 10000); await sleep(900);
  await page.click('.pw-dot:nth-child(4)'); await sleep(1800);
  const st4 = await pwStop(page), y4 = await scrollY(page);
  await page.click('.pw-card.active .pr-cta-link'); await waitFor(page, () => location.pathname.startsWith('/projects/'), null, 8000); await sleep(800);
  await shot(page, '23-case-from-world');
  await page.click('.os .back-link');
  await waitFor(page, () => location.hash === '#work' && document.querySelector('.pw-progress'), null, 8000); await sleep(1800);
  check('"Back to all work" in a case study returns to Project World at the same stop and scroll', (await pwStop(page)) === st4 && Math.abs((await scrollY(page)) - y4) < 40, `${st4} ${y4} -> ${await pwStop(page)} ${await scrollY(page)}`);
  // Forward restores too
  await page.goBack(); await sleep(1200);
  await page.goForward(); await sleep(1800);
  check('Back then Forward restores the same journey stop', (await pwStop(page)) === st4 || (await hash(page)) === '/#work', await pwStop(page));
  await page.close();

  /* ── 15. 04C mobile: slim dock, disk list on demand, shell on a phone ── */
  page = await open(browser, '/', { w: 390, h: 844, mobile: true });
  const dockH = await page.evaluate(() => Math.round(document.querySelector('.ws3d__dock').getBoundingClientRect().height));
  check('mobile: the resting controls (actions + station switcher) stay under 16% of the viewport height', dockH <= 844 * 0.16, `${dockH}px`);
  await page.tap('.ws3d__stations button:nth-child(3)'); await waitFor(page, () => window.__WS__.ctl.state.view === 'drive', null, 8000); await sleep(400);
  await page.tap('.ws3d__dock [aria-controls="ws-disklist"]'); await sleep(300);
  await shot(page, '24-mobile-disk-list');
  check('mobile: the disk list opens on demand with all seven case IDs', await page.evaluate(() => document.querySelectorAll('#ws-disklist li').length === 7 && /C-06/.test(document.getElementById('ws-disklist').innerText)));
  await page.tap('#ws-disklist li:nth-child(2) button');
  await waitFor(page, () => window.__WS__.ctl.state.held === 'proof-first', null, 15000); await sleep(300);
  await page.tap('.ws3d__row--ctx .ws3d__use');
  await waitFor(page, () => window.__WS__.ctl.state.session === 'proof-first', null, 15000); await sleep(1500);
  await shot(page, '25-mobile-disk-directory');
  check('mobile: a disk loads by touch and shows its directory', await page.evaluate(() => /PROOF FIRST/.test(document.getElementById('screen').innerText) && /C-07/.test(document.getElementById('screen').innerText)));
  await page.tap('.ws-view .ws-link, [data-ws]').catch(() => {});
  await page.close();

  page = await open(browser, '/#work', { w: 390, h: 844, mobile: true, wait3d: false }); await sleep(1200);
  await shot(page, '26-mobile-os-world');
  check('mobile: the immersive interface bar fits (tabs scroll, Return is 44px, no horizontal overflow)', await page.evaluate(() => { const r = document.querySelector('.os__return').getBoundingClientRect(); return r.height >= 44 && r.right <= innerWidth + 1 && document.documentElement.scrollWidth <= innerWidth + 1; }));
  await page.close();
  page = await open(browser, '/projects/zarvin-one', { w: 390, h: 844, mobile: true, wait3d: false }); await sleep(1000);
  await shot(page, '27-mobile-os-case');
  await page.close();

  /* ── 16. 2D choice keeps the original light pages for experiences and case studies ── */
  page = await open(browser, '/?view=2d', { wait3d: false }); await sleep(900);
  await page.goto(BASE + '/projects/zarvin-one', { waitUntil: 'networkidle0' }); await sleep(600);
  check('2D mode: case studies are the original light pages (no immersive shell)', await page.evaluate(() => !document.querySelector('.os') && !!document.querySelector('.site-header')));
  await page.goto(BASE + '/#work', { waitUntil: 'networkidle0' }); await sleep(800);
  check('2D mode: Project World opens in the original page layout', await page.evaluate(() => !document.querySelector('.os') && !!document.querySelector('.project-world') && !!document.querySelector('.site-header')));
  await page.evaluate(() => localStorage.setItem('crvro.view', '3d'));
  await page.close();


  /* ── 17. 04D: the interface is the monitor; phone composition; file menu; focus ── */
  page = await open(browser, '/#work', { wait3d: false }); await sleep(1100);
  const ident = await page.evaluate(() => {
    const g = document.querySelector('.os__glass'), b = document.querySelector('.os__bar'), bad = document.querySelector('.os__badge');
    const gr = g.getBoundingClientRect(), br = b.getBoundingClientRect();
    return { radius: parseFloat(getComputedStyle(g).borderTopLeftRadius), inset: [Math.round(gr.left), Math.round(gr.top), Math.round(innerWidth - gr.right), Math.round(innerHeight - gr.bottom)], barInside: br.left >= gr.left && br.right <= gr.right && br.top >= gr.top, badge: bad && bad.textContent, led: !!document.querySelector('.os__led'), shadow: getComputedStyle(g).boxShadow.includes('rgb(138, 95, 51)') };
  });
  check('desktop interface is a monitor: rounded glass, copper ring, bezel inset, bar inside the glass, CRVRO badge + LED', ident.radius >= 20 && ident.inset.every((n) => n >= 14) && ident.barInside && /CRVRO/.test(ident.badge) && ident.led && ident.shadow, JSON.stringify(ident));
  check('content is still real, full-size HTML (h-level text selectable, no transform/filter on the page)', await page.evaluate(() => { const h = document.querySelector('.os .section-head .h'); const cs = getComputedStyle(document.querySelector('.os')); return !!h && cs.transform === 'none' && cs.filter === 'none' && parseFloat(getComputedStyle(h).fontSize) >= 30; }));
  await shot(page, '28-desktop-os-world');
  await page.goto(BASE + '/#about', { waitUntil: 'networkidle0' }); await sleep(900); await shot(page, '29-desktop-os-about');
  await page.close();

  page = await open(browser, '/#work', { w: 390, h: 844, mobile: true, wait3d: false }); await sleep(1300);
  const mw = await page.evaluate(() => {
    const top = (s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().top + scrollY) : null; };
    const bar = document.querySelector('.os__bar').getBoundingClientRect(), glass = document.querySelector('.os__glass').getBoundingClientRect(), mb = document.querySelector('.pwm-mapbtn').getBoundingClientRect();
    return { headTopBelowBar: Math.round(top('.section-head') - bar.bottom), firstStop: top('.pwm-stop'), tabsHidden: getComputedStyle(document.querySelector('.os__tabs')).display === 'none', filesVisible: getComputedStyle(document.querySelector('.os__files')).display !== 'none', filesH: Math.round(document.querySelector('.os__files').getBoundingClientRect().height), mapTopVsGlassBottom: Math.round(mb.top - glass.bottom), mapH: Math.round(mb.height), overflowX: document.documentElement.scrollWidth - innerWidth };
  });
  check('mobile World: heading starts within 40px of the bar (was ~96px of dead space)', mw.headTopBelowBar <= 40, JSON.stringify(mw));
  check('mobile World: first island starts above 470px (was 537px)', mw.firstStop <= 470, JSON.stringify(mw));
  check('mobile World: the floating WORLD MAP control sits in the lower bezel, below the glass, so it covers no content', mw.mapTopVsGlassBottom >= -2 && mw.mapH >= 34, JSON.stringify(mw));
  check('mobile World: no horizontal overflow', mw.overflowX <= 1, JSON.stringify(mw));
  check('mobile: tabs are replaced by a 44px FILES button', mw.tabsHidden && mw.filesVisible && mw.filesH >= 44, JSON.stringify(mw));
  await shot(page, '30-mobile-world-after');
  // file menu: discoverable + accessible
  const fb = '.os__files';
  check('FILES button is collapsed by default and names the current file', await page.evaluate(() => { const b = document.querySelector('.os__files'); return b.getAttribute('aria-expanded') === 'false' && /WORLD\.MAP/.test(b.textContent); }));
  await page.tap(fb); await sleep(300);
  const fmenu = await page.evaluate(() => ({ exp: document.querySelector('.os__files').getAttribute('aria-expanded'), n: document.querySelectorAll('#os-files a').length, cur: document.querySelector('#os-files [aria-current="page"]')?.textContent, focusIn: !!document.activeElement.closest('#os-files'), minH: Math.min(...[...document.querySelectorAll('#os-files a')].map((a) => a.getBoundingClientRect().height)) }));
  check('file menu lists all six files with descriptions, marks the current page, takes focus and has 44px+ targets', fmenu.exp === 'true' && fmenu.n === 6 && /WORLD/.test(fmenu.cur) && fmenu.focusIn && fmenu.minH >= 44, JSON.stringify(fmenu));
  await shot(page, '31-mobile-file-menu');
  await page.keyboard.press('Escape'); await sleep(250);
  check('Escape closes the file menu and returns focus to the FILES button', await page.evaluate(() => !document.getElementById('os-files') && document.activeElement.classList.contains('os__files')));
  await page.tap(fb); await sleep(200); await page.tap('.os__main'); await sleep(250);
  check('tapping outside closes the file menu', await page.evaluate(() => !document.getElementById('os-files')));
  await page.tap(fb); await sleep(200);
  await page.evaluate(() => [...document.querySelectorAll('#os-files a')].find((a) => /ASK/.test(a.textContent)).click());
  await waitFor(page, () => location.hash === '#navigator' && document.querySelector('.retro-term-input'), null, 8000); await sleep(400);
  check('choosing ASK.EXE navigates, closes the menu and focuses the content', await page.evaluate(() => !document.getElementById('os-files') && document.activeElement.id === 'main' && /ASK\.EXE/.test(document.querySelector('.os__files').textContent)));
  await shot(page, '32-mobile-ask-after');
  // After a page opens, focus is on <main> (so a screen-reader or keyboard user starts at the content). Tab moves into it; Shift+Tab reaches
  // the interface bar: Return to workspace, then the FILES menu. Both orders are recorded for the report.
  await page.reload({ waitUntil: 'networkidle0' }); await sleep(1100);   // a fresh document load of the same URL
  const lab = () => page.evaluate(() => { const e = document.activeElement; return (e.getAttribute('aria-label') || e.textContent || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 36); });
  const startAt = await page.evaluate(() => document.activeElement.id);
  await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); const s1 = await lab(); await page.keyboard.press('Tab'); const s2 = await lab(); await page.keyboard.up('Shift');
  const fwd = []; for (let i = 0; i < 3; i++) { await page.keyboard.press('Tab'); fwd.push(await lab()); }
  report.focusOrderMobileShell = { startsAt: startAt, shiftTab: [s1, s2], thenForward: fwd };
  check('mobile interface: focus starts on the content; Shift+Tab reaches Return to workspace then FILES; forward Tab returns to Return then the content', startAt === 'main' && /Return to workspace/.test(s1) && /FILES/.test(s2) && /Return to workspace/.test(fwd[0]), JSON.stringify(report.focusOrderMobileShell));
  await page.close();

  report.errors = [...new Set(report.errors)];
  check('no uncaught page errors in any run', report.errors.length === 0, JSON.stringify(report.errors.slice(0, 5)));
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`${report.checks.filter((c) => c.ok).length}/${report.checks.length} checks passed`);
  await browser.close();
})().catch((e) => { console.error(e); fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2)); process.exit(1); });

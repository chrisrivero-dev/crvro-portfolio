/* Iteration 03 interaction: click (or press) a project floppy -> the disk lifts out of the organizer, crosses the desk and slides
 * into the drive while the camera moves to a purposeful shot; the CRT then shows a directory of that project built from the real
 * registry (project-data.js is a verbatim snapshot). The visitor can return to the workspace or eject at any time.
 *
 * Every action is "go to state X from wherever things are now": a new action bumps `epoch`, in-flight tweens see alive() go false
 * and stop, and the next action starts from the disk's and camera's current pose. Nothing moves on hover.
 * Reduced motion: ctx.run() collapses each tween into one step, so the same sequence becomes jump cuts with no typing. */
import { SCREEN_PROJECTS } from './project-data.js';

const ENABLED = ['zarvin-one', 'proof-first'];
const SITE = 'https://crvro.com';
const REST_VIEW = 'threeQuarter';

export function setupWorkspace(ctx) {
  const { THREE, scene, camera, markDirty, run, flyTo, reduceMotion, screenEl, lockParallax, driveSlot, built, EASE } = ctx;
  const byslug = Object.fromEntries(SCREEN_PROJECTS.map((p) => [p.slug, p]));
  const disks = Object.fromEntries((built.diskList || []).filter((d) => ENABLED.includes(d.userData.project?.slug)).map((d) => [d.userData.project.slug, d]));
  const allDisks = built.diskList || [];
  const home = {};
  for (const [slug, d] of Object.entries(disks)) home[slug] = { parent: d.parent, pos: d.position.clone(), quat: d.quaternion.clone(), loc: 'home' };

  const dock = document.getElementById('dock');
  const sessionRow = document.getElementById('dock-session');
  const nowEl = document.getElementById('dock-now');
  const live = document.getElementById('live');
  const tag = document.getElementById('disk-tag');
  const say = (t) => { if (live) live.textContent = t; };

  /* ── screen ─────────────────────────────────────────────────────── */
  const homePane = screenEl.querySelector('[data-pane="home"]');
  const dirPane = screenEl.querySelector('[data-pane="dir"]');
  const sleep = (ms, alive) => run(ms, () => {}, alive, (t) => t);

  const FILES = (p) => {
    const stack = [...(p.tags || [])];
    for (const g of p.stack || []) stack.push(`${g.group}: ${g.items.join(', ')}`);
    const files = [
      { name: 'README', ext: 'TXT', head: `${p.title.toUpperCase()}  ·  ${p.kind}`, body: [p.titleEm, p.desc] },
      { name: 'STATUS', ext: 'TXT', head: p.statusBadge ? p.statusBadge.toUpperCase() : 'STATUS', body: [p.status] },
      { name: 'ROLE', ext: 'TXT', head: `${p.year}`, body: [p.role] },
    ];
    if (stack.length) files.push({ name: 'STACK', ext: 'TXT', head: 'BUILT WITH', body: stack });
    files.push({ name: 'CASE', ext: 'LNK', head: 'CASE STUDY', body: ['The full write-up lives on crvro.com.'], link: { href: `${SITE}/projects/${p.slug}`, label: 'OPEN CASE STUDY' } });
    if (p.demo) files.push({ name: 'DEMO', ext: 'LNK', head: 'DEMO', body: ['A hosted demo.'], link: { href: p.demo, label: 'OPEN DEMO' } });
    else if (p.site) files.push({ name: 'SITE', ext: 'LNK', head: 'PRODUCT SITE', body: ['The product site.'], link: { href: p.site, label: 'OPEN SITE' } });
    return files;
  };

  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  async function typeInto(node, text, perChar, alive) {
    if (reduceMotion.matches || !perChar) { node.textContent = text; return true; }
    node.textContent = '';
    for (const ch of text) { if (!alive()) return false; node.textContent += ch; if (!(await sleep(perChar, alive))) return false; }
    return true;
  }

  let files = [], selected = 0, promptCmd = null, viewEl = null, listEl = null;
  function renderViewer(i) {
    const f = files[i];
    viewEl.replaceChildren();
    viewEl.setAttribute('aria-label', `${f.name}.${f.ext}`);
    viewEl.appendChild(el('div', 'dos__vhead', f.head));
    for (const para of f.body) viewEl.appendChild(el('p', 'dos__vp', para));
    if (f.link) {
      const a = el('a', 'dos__link', `${f.link.label} →`);
      a.href = f.link.href; a.target = '_blank'; a.rel = 'noopener noreferrer';
      viewEl.appendChild(a);
      viewEl.appendChild(el('span', 'dos__note', 'opens in a new tab'));
    }
  }
  let selTok = 0;
  async function select(i, alive0 = () => true, animate = true) {
    const tok = ++selTok, alive = () => alive0() && selTok === tok;   // a newer selection cancels an older one's typing
    selected = i;
    [...listEl.children].forEach((b, k) => { b.setAttribute('aria-current', String(k === i)); b.classList.toggle('is-on', k === i); });
    if (animate && !reduceMotion.matches) {
      if (!(await typeInto(promptCmd, `TYPE ${files[i].name}.${files[i].ext}`, 14, alive))) return;
    } else promptCmd.textContent = `TYPE ${files[i].name}.${files[i].ext}`;
    renderViewer(i);
  }
  function showHome() {
    dirPane.hidden = true; dirPane.replaceChildren();
    homePane.hidden = false;
  }
  async function boot(slug, alive) {
    const p = byslug[slug];
    files = FILES(p);
    homePane.hidden = true; dirPane.hidden = false; dirPane.replaceChildren();
    const prompt = el('div', 'dos__prompt');
    const ps = el('span', 'dos__ps', 'A:\\>'); promptCmd = el('span', 'dos__cmd');
    prompt.append(ps, ' ', promptCmd, el('span', 'dos__cursor'));
    dirPane.append(prompt);
    if (!(await typeInto(promptCmd, 'DIR', 90, alive))) return false;
    if (!(await sleep(220, alive))) return false;
    dirPane.append(el('div', 'dos__vol', `Volume in drive A is ${p.slug.toUpperCase().replace(/-/g, ' ')}`), el('div', 'dos__vol', 'Directory of A:\\'));
    const body = el('div', 'dos__body');
    listEl = el('div', 'dos__list'); listEl.setAttribute('role', 'group'); listEl.setAttribute('aria-label', 'Files on the disk');
    viewEl = el('div', 'dos__view'); viewEl.tabIndex = 0; viewEl.setAttribute('role', 'region');
    body.append(listEl, viewEl); dirPane.append(body);
    for (let i = 0; i < files.length; i++) {
      const b = el('button', 'dos__file'); b.type = 'button';
      b.append(el('span', 'dos__fn', files[i].name), el('span', 'dos__fe', files[i].ext));
      b.addEventListener('click', () => select(i));
      b.addEventListener('keydown', (e) => {
        const d = { ArrowDown: 1, ArrowUp: -1 }[e.key];
        if (!d) return;
        e.preventDefault();
        const n = (i + d + files.length) % files.length;
        listEl.children[n].focus({ preventScroll: true });
        select(n);
      });
      listEl.append(b);
      if (!(await sleep(70, alive))) return false;
    }
    dirPane.append(el('div', 'dos__sum', `${files.length} file(s)   ·   Esc: back to the workspace`));
    await select(0, alive, false);
    listEl.children[0].setAttribute('aria-current', 'true'); listEl.children[0].classList.add('is-on');
    promptCmd.textContent = 'TYPE README.TXT';
    return true;
  }

  /* ── disk choreography ──────────────────────────────────────────── */
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const FLAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)); // label up, shutter toward the machine
  const STAGE = driveSlot.clone().add(V(0, 0, 330));
  const SEATED = driveSlot.clone().add(V(0, 0, -68));  // ~15 mm of the disk stays out, like a real seated disk
  const homeWorld = (h) => {
    h.parent.updateMatrixWorld(true);
    const m = new THREE.Matrix4().compose(h.pos, h.quat, V(1, 1, 1)).premultiply(h.parent.matrixWorld);
    const pos = V(0, 0, 0), q = new THREE.Quaternion();
    m.decompose(pos, q, V(1, 1, 1));
    return { pos, q };
  };
  function move(d, pos, q, ms, alive, arc = 0, easing = EASE.io) {
    const fp = d.position.clone(), fq = d.quaternion.clone();
    return run(ms, (e) => { d.position.lerpVectors(fp, pos, e); d.position.y += Math.sin(Math.PI * e) * arc; d.quaternion.slerpQuaternions(fq, q, e); }, alive, easing);
  }

  async function diskIn(slug, alive) {            // organizer -> drive
    const d = disks[slug], h = home[slug];
    if (h.loc === 'drive') return true;
    if (h.loc === 'home') { scene.attach(d); h.loc = 'free'; const w = homeWorld(h); if (!(await move(d, w.pos.clone().add(V(0, 240, 0)), w.q, 380, alive, 0, EASE.out))) return false; }
    h.loc = 'free';
    if (!(await move(d, STAGE, FLAT, 760, alive, 70))) return false;
    if (!(await move(d, SEATED, FLAT, 560, alive))) return false;
    h.loc = 'drive';
    return true;
  }
  async function diskOut(slug, alive) {           // drive -> organizer
    const d = disks[slug], h = home[slug];
    if (h.loc === 'home') return true;
    h.loc = 'free';
    const w = homeWorld(h);
    if (!(await move(d, STAGE, FLAT, 520, alive))) return false;
    if (!(await move(d, w.pos.clone().add(V(0, 240, 0)), w.q, 760, alive, 70))) return false;
    if (!(await move(d, w.pos, w.q, 340, alive, 0, EASE.out))) return false;
    h.parent.attach(d); d.position.copy(h.pos); d.quaternion.copy(h.quat); markDirty();
    h.loc = 'home';
    return true;
  }

  /* ── state + UI ─────────────────────────────────────────────────── */
  let epoch = 0, session = null, pending = null, view = 'rest';
  const mine = () => { const my = ++epoch; return () => epoch === my; };
  function syncUI() {
    document.body.dataset.view = view;
    dock.querySelectorAll('[data-load]').forEach((b) => b.setAttribute('aria-pressed', String(session?.slug === b.dataset.load)));
    const cur = session?.slug || pending;
    sessionRow.hidden = !cur;
    if (cur) {
      nowEl.textContent = `A: ${byslug[cur].title.toUpperCase()}${session ? '' : ' …'}`;
      sessionRow.querySelector('[data-act="approach"]').hidden = !session || view === 'crt';
      sessionRow.querySelector('[data-act="return"]').hidden = !session || view !== 'crt';
      sessionRow.querySelector('[data-act="eject"]').textContent = session ? 'Eject disk' : 'Cancel & return disk';
    }
    lockParallax(view === 'crt');
    tag.hidden = true;
  }
  const focusSoon = (node) => setTimeout(() => node?.focus({ preventScroll: true }), 30);

  async function load(slug) {
    if (!disks[slug]) return;
    const alive = mine();
    const others = Object.keys(home).filter((k) => k !== slug && home[k].loc !== 'home');
    if (others.length) {                       // another disk is loaded or mid-flight: put it back first, wherever it is
      say(`Returning ${others.map((k) => byslug[k].title).join(' and ')} to the tray.`);
      session = null; pending = null; showHome(); view = 'drive'; syncUI();
      flyTo('drive', 700, alive);
      for (const o of others) if (!(await diskOut(o, alive))) return;
    }
    if (session?.slug === slug) return approach();
    const p = byslug[slug];
    say(`Loading ${p.title} into the drive.`);
    pending = slug; view = 'drive'; syncUI();
    flyTo('drive', 900, alive);
    if (!(await diskIn(slug, alive))) return;
    session = { slug }; pending = null;
    view = 'crt'; syncUI();
    const cam = flyTo('crt', 1100, alive);
    await sleep(350, alive);
    const ok = await boot(slug, alive);
    await cam;
    if (!alive() || !ok) return;
    say(`${p.title} loaded. Directory shown on the screen. Press Escape to return to the workspace.`);
    focusSoon(listEl?.children[0]);
  }
  async function approach() {
    if (!session) return;
    const alive = mine();
    view = 'crt'; syncUI();
    if (!(await flyTo('crt', 1000, alive))) return;
    focusSoon(listEl?.children[selected]);
  }
  async function back() {
    const alive = mine();
    view = 'rest'; syncUI();
    say('Back at the workspace.');
    if (!(await flyTo(REST_VIEW, 1000, alive))) return;
    focusSoon(dock.querySelector(session ? '[data-act="approach"]' : '[data-load]'));
  }
  async function eject() {
    const slug = session?.slug || pending;
    if (!slug) return;
    const alive = mine();
    session = null; pending = null; showHome(); view = 'drive'; syncUI();
    say(`Ejecting ${byslug[slug].title}.`);
    const cam = flyTo('drive', 700, alive);
    if (!(await diskOut(slug, alive))) return;
    await cam;
    view = 'rest'; syncUI();
    if (!(await flyTo(REST_VIEW, 900, alive))) return;
    say('Disk returned to the organizer.');
    focusSoon(dock.querySelector(`[data-load="${slug}"]`));
  }

  dock.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.load) load(b.dataset.load);
    else if (b.dataset.act === 'approach') approach();
    else if (b.dataset.act === 'return') back();
    else if (b.dataset.act === 'eject') eject();
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && session && view === 'crt' && !ctx.isInspecting()) { e.preventDefault(); back(); }
  });

  /* ── pointer: tap a disk in the scene (hover only labels, never moves the camera) ── */
  const ray = new THREE.Raycaster();
  const pick = (e) => {
    ray.setFromCamera({ x: (e.clientX / innerWidth) * 2 - 1, y: -(e.clientY / innerHeight) * 2 + 1 }, camera);
    let g = ray.intersectObjects(allDisks, true)[0]?.object;
    while (g && !g.userData.project) g = g.parent;
    return g;
  };
  let down = null;
  addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now(), ui: !!e.target.closest('a, button, #screen, #dock') }; });
  addEventListener('pointerup', (e) => {
    if (!down || down.ui || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8 || performance.now() - down.t > 600) { down = null; return; }
    down = null;
    if (view === 'crt') return;
    const g = pick(e);
    const slug = g?.userData.project.slug;
    if (slug && disks[slug]) { if (session?.slug === slug) approach(); else load(slug); }
  });
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || view === 'crt' || e.target.closest?.('#dock, #screen, a, button')) { tag.hidden = true; document.body.classList.remove('is-pick'); return; }
    const g = pick(e);
    const p = g?.userData.project;
    document.body.classList.toggle('is-pick', !!(p && disks[p.slug]));
    if (!p) { tag.hidden = true; return; }
    tag.textContent = disks[p.slug] ? `${p.label} — click to load` : `${p.label} — not loadable in this iteration`;
    tag.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px)`;
    tag.hidden = false;
  }, { passive: true });
  // keyboard focus on a dock button points at its disk, without moving the camera
  dock.addEventListener('focusin', (e) => {
    const slug = e.target.dataset?.load;
    if (!slug || session?.slug === slug || view !== 'rest' || !e.target.matches(':focus-visible')) { tag.hidden = true; return; }
    const d = disks[slug], v = d.getWorldPosition(V(0, 0, 0)).project(camera);
    tag.textContent = `${d.userData.project.label} — Enter to load`;
    tag.style.transform = `translate(${(v.x * 0.5 + 0.5) * innerWidth + 18}px, ${(-v.y * 0.5 + 0.5) * innerHeight - 8}px)`;
    tag.hidden = false;
  });
  dock.addEventListener('focusout', () => { tag.hidden = true; });
  addEventListener('resize', () => { markDirty(); });

  // phone portrait: the screen gets larger type and a one-column layout, because the whole 600 px screen must fit a ~390 px viewport
  const compact = matchMedia('(max-width: 700px), (max-aspect-ratio: 4/5)');
  const syncCompact = () => screenEl.classList.toggle('is-compact', compact.matches);
  compact.addEventListener('change', syncCompact); syncCompact();

  window.__I3__ = { load, eject, back, approach, state: () => ({ view, session: session?.slug || null, locs: Object.fromEntries(Object.entries(home).map(([k, v]) => [k, v.loc])) }), driveSlot, ENABLED };
  syncUI();
  if (compact.matches) ctx.setView(REST_VIEW);   // start on the portrait framing
}

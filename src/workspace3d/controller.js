/* Workspace controller: stations, look-around, floppy choreography and camera states. No DOM of its own.
 *
 * 05A station model (the room is the navigation):
 *   desk      the room; the visitor can drag to look around (within limits) and select objects
 *   computer  the camera at the CRT (menu, Ask, Contact, or a loaded disk's directory)
 *   disks     the camera at the floppy organizer
 *   hold      a disk lifted out of the organizer and held in front of the camera for inspection
 *   plans     (05B.1) the camera over the survey sheet; project notes are pinned to it
 *   note      (05B.1) the camera down on one note (`st.note`), reading it square-on
 *   mug       (05B.3) the camera close on the coffee mug so its lettering reads
 *   corner    (07) the reading corner by the window: lounge chair, side table, record player
 *   seat      (07) seated in the lounge chair, looking at the desk
 *   record    (07) the record player close up; `st.playing` while it turns (silent; it stops when the camera leaves)
 *   book      (06) the camera straight over the open career notebook (`st.page`: work, highlights or resume); the words are DOM laid on its page
 * plus `fill` (the screen fills the viewport just before the expanded interface opens).
 *
 * Every action is "go to state X from wherever things are now": a new action bumps `epoch`, in-flight tweens see alive()
 * go false and stop, and the next action starts from the disk's and camera's current pose. Nothing moves on hover.
 * Multi-step actions set `busy` so the page does not write an intermediate state into the URL.
 * Reduced motion: engine.run() collapses each tween into one step (jump cuts). */

// look-around at the desk (radians), layered on the rest pose. 09: first-person and a full turn in yaw (the room is finished on every
// side); pitch goes from a little above level (the ceiling line and the door head) down to the desk top in front.
const LOOK = { pitchUp: 0.45, pitchDown: 0.45 };

import { noteView } from './plans.js';
import { CAREER_PAGE_IDS } from '../data/career.js';

export function createController(engine, { onChange, onHover, onLaunch, onNoteLink }) {
  const { THREE, scene, camera, run, flyTo, markDirty, EASE, diskList } = engine;
  const notes = Object.fromEntries((engine.notes || []).map((m) => [m.userData.note.slug, m]));
  const disks = Object.fromEntries(diskList.map((d) => [d.userData.project.slug, d]));
  const home = {};
  for (const [slug, d] of Object.entries(disks)) home[slug] = { parent: d.parent, pos: d.position.clone(), quat: d.quaternion.clone(), loc: 'home' };

  let epoch = 0;
  const st = { view: 'rest', session: null, pending: null, held: null, busy: false, lastEntry: null, note: null, page: null, fit: 0, playing: false, labNode: null };
  let deskLook = { yaw: 0, pitch: 0 };          // where the visitor was looking at the desk; restored on return
  // 08: the reading corner is framed from further off than the desk; the dusk haze thins while there so the corner keeps its colour
  let hazeOn = false, hazeTok = 0;
  const cornerHaze = (on) => {
    if (hazeOn === on) return;
    hazeOn = on;
    const a = engine.haze, b = on ? (matchMedia('(max-aspect-ratio: 4/5)').matches ? 2 : 1) : 0, tok = ++hazeTok;
    run(900, (e) => engine.setHaze(a + (b - a) * e), () => hazeTok === tok);
  };
  const emit = () => { if (st.playing && st.view !== 'record') setPlaying(false); cornerHaze(['corner', 'seat', 'record', 'lab', 'camera'].includes(st.view)); syncBook(); engine.lockParallax(st.view !== 'rest'); onChange?.({ ...st, locs: Object.fromEntries(Object.entries(home).map(([k, v]) => [k, v.loc])) }); };
  const mine = () => { const my = ++epoch; return () => epoch === my; };
  // only a settled desk view is remembered (never a half-finished return flight)
  const leaveDesk = () => { if (st.view === 'rest' && !st.busy) deskLook = { yaw: engine.look.yaw, pitch: engine.look.pitch }; };

  /* ── the career notebook: the cover and the leaves follow the state (view 'book', page) and nothing else ── */
  const book = engine.book;
  const BK = { open: 0, carry: 0, turned: CAREER_PAGE_IDS.map(() => 0) };
  let bookGoal = { open: 0, page: 0 }, bookTok = 0;
  const ramp = (e, a, b) => Math.min(1, Math.max(0, (e - a) / (b - a)));
  function bookTo(open, page) {
    const tok = ++bookTok, alive = () => bookTok === tok;
    const from = { open: BK.open, carry: BK.carry, turned: [...BK.turned] };
    const to = { carry: open ? 1 : 0, turned: CAREER_PAGE_IDS.map((_, i) => (open && i < page ? 1 : 0)) };
    const lifted = book.portrait();                  // resting on the shelf: it is carried to the desk to be read, and back again
    const changes = from.open !== open;
    const ms = !changes ? 480 : lifted ? 1150 : 800;
    return run(ms, (e) => {
      if (!changes) {                                // only the leaves turn
        BK.turned = from.turned.map((f, i) => f + (to.turned[i] - f) * e);
      } else if (open) {                             // opening: carried down (if on the shelf), then the cover, then any leaves a deep link asks for
        const c = lifted ? ramp(e, 0, 0.5) : 1;
        BK.carry = from.carry + (1 - from.carry) * c;
        BK.open = from.open + (1 - from.open) * ramp(e, lifted ? 0.4 : 0, 1);
        BK.turned = from.turned.map((f, i) => f + (to.turned[i] - f) * ramp(e, lifted ? 0.7 : 0.4, 1));
      } else {                                       // closing: the leaves settle and the cover shuts, then it is carried back
        BK.open = from.open * (1 - ramp(e, 0, lifted ? 0.45 : 1));
        BK.turned = from.turned.map((f) => f * (1 - ramp(e, 0, lifted ? 0.45 : 1)));
        BK.carry = lifted ? from.carry * (1 - ramp(e, 0.4, 1)) : 0;
      }
      book.carry(BK.carry);
      book.pose(BK.open, BK.turned);
    }, alive);
  }
  function syncBook() {
    if (!book) return;
    const open = st.view === 'book' ? 1 : 0;
    const page = open ? Math.max(0, CAREER_PAGE_IDS.indexOf(st.page)) : 0;
    if (open === bookGoal.open && page === bookGoal.page) return;
    bookGoal = { open, page };
    bookTo(open, page);
  }
  /** A resize can cross between a landscape and a portrait screen: a closed, idle book moves to the resting place that screen frames. */
  let restedPortrait = book ? book.portrait() : false;
  function rePlace() {
    if (!book || BK.open > 0 || bookGoal.open || book.portrait() === restedPortrait) return;
    restedPortrait = book.portrait(); book.carry(0); engine.markDirty();
  }
  /** The reading pose for the room as it is laid out now: the book centred in the space the dock and the mode switch leave free. */
  function bookPose() {
    const s = engine.size, r = engine.stage.getBoundingClientRect();
    const dock = engine.stage.parentElement?.querySelector('.ws3d__dock')?.getBoundingClientRect();
    const bottom = dock && dock.height ? Math.max(0, r.bottom - dock.top) + 10 : s.vw < 700 ? 230 : 160;
    return book.readingView({ aspect: s.aspect, fov: s.fov, vw: s.vw, vh: s.vh, top: 64, bottom });
  }
  /** Re-fit the reading pose after the layout changed (a resize, or the dock's size changed). */
  let flying = false;                                  // the camera is on its way to the book: its pose is not touched, and the reading page is not placed yet
  function refit() {
    if (!book || st.view !== 'book' || st.busy || flying) return;
    engine.setView(bookPose());
    st.fit++; emit();
  }
  const offResize = engine.on('resize', () => { rePlace(); refit(); });

  /* ── disk choreography ──────────────────────────────────────────── */
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const FLAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)); // label up, shutter toward the machine
  const slot = engine.driveSlot;
  const STAGE = slot.clone().add(V(0, 0, 330));
  const SEATED = slot.clone().add(V(0, 0, -68));  // ~15 mm of the disk stays out, like a real seated disk
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
  /** In front of the camera, label toward the viewer, sized so the label is readable (portrait phones hold it further away). */
  function holdPose() {
    camera.updateMatrixWorld();
    const tan = Math.tan(THREE.MathUtils.degToRad(engine.size.fov / 2));
    const dist = Math.max(200 / (2 * tan * 0.5), 191 / (2 * tan * camera.aspect * 0.72));
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const pos = camera.position.clone().addScaledVector(dir, dist).add(new THREE.Vector3(0, -12, 0));
    const q = camera.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.1, 0.12, 0.03)));
    return { pos, q };
  }
  async function lift(slug, alive) {            // tray -> up out of its slot
    const d = disks[slug], h = home[slug];
    if (h.loc !== 'home') return true;
    scene.attach(d); h.loc = 'free';
    const w = homeWorld(h);
    return move(d, w.pos.clone().add(V(0, 240, 0)), w.q, 380, alive, 0, EASE.out);
  }
  async function diskIn(slug, alive) {            // wherever it is -> drive
    const d = disks[slug], h = home[slug];
    if (h.loc === 'drive') return true;
    if (h.loc === 'home' && !(await lift(slug, alive))) return false;
    h.loc = 'free';
    if (!(await move(d, STAGE, FLAT, 760, alive, 70))) return false;
    if (!(await move(d, SEATED, FLAT, 560, alive))) return false;
    h.loc = 'drive';
    return true;
  }
  async function diskOut(slug, alive) {           // wherever it is -> exactly back in its slot
    const d = disks[slug], h = home[slug];
    if (h.loc === 'home') return true;
    const fromDrive = h.loc === 'drive';
    h.loc = 'free';
    const w = homeWorld(h);
    if (fromDrive && !(await move(d, STAGE, FLAT, 520, alive))) return false;
    if (!(await move(d, w.pos.clone().add(V(0, 240, 0)), w.q, 760, alive, 70))) return false;
    if (!(await move(d, w.pos, w.q, 340, alive, 0, EASE.out))) return false;
    h.parent.attach(d); d.position.copy(h.pos); d.quaternion.copy(h.quat); markDirty();
    h.loc = 'home';
    return true;
  }
  async function returnOthers(keep, alive) {
    const others = Object.keys(home).filter((k) => k !== keep && home[k].loc !== 'home');
    if (!others.length) return true;
    st.session = null; st.pending = null; st.held = null; emit();
    for (const o of others) if (!(await diskOut(o, alive))) return false;
    return true;
  }

  /* ── stations and actions ───────────────────────────────────────── */
  async function back() {                         // to the desk, at the viewpoint the visitor left it; a loaded disk stays seated
    const alive = mine();
    if (st.held) return putBack();
    st.view = 'rest'; st.note = null; st.page = null; st.busy = true; emit();
    if (await flyTo('threeQuarter', 1000, alive, deskLook)) { st.busy = false; emit(); }
  }
  async function approach() {                     // the computer: menu, or the loaded disk's directory
    const alive = mine();
    leaveDesk();
    if (st.held) { st.busy = true; emit(); if (!(await diskOut(st.held, alive))) return; st.held = null; }
    st.view = 'crt'; st.busy = false; emit();
    await flyTo('crt', 1000, alive);
  }
  async function focusTray() {                    // the disk organizer
    const alive = mine();
    leaveDesk();
    if (st.held) { const s = st.held; st.held = null; st.busy = true; emit(); if (!(await diskOut(s, alive))) return; }
    st.view = 'drive'; st.busy = false; emit();
    await flyTo('drive', 900, alive);
  }
  /** Lift a disk out of the organizer and hold it up to the camera for inspection. */
  async function pickUp(slug) {
    if (!disks[slug]) return;
    const alive = mine();
    leaveDesk();
    st.busy = true; emit();
    if (!(await returnOthers(slug, alive))) return;
    if (st.session === slug) { st.session = null; }
    if (st.view !== 'drive' || st.held) { st.view = 'drive'; emit(); if (!(await flyTo('drive', 800, alive))) return; }
    if (home[slug].loc === 'drive') { if (!(await move(disks[slug], STAGE, FLAT, 500, alive))) return; home[slug].loc = 'free'; }
    if (!(await lift(slug, alive))) return;
    const p = holdPose();
    if (!(await move(disks[slug], p.pos, p.q, 650, alive, 40))) return;
    st.held = slug; st.view = 'hold'; st.busy = false; emit();
  }
  /** Put the held disk back in its slot; the camera stays at the organizer. */
  async function putBack() {
    const slug = st.held;
    if (!slug) return;
    const alive = mine();
    st.busy = true; emit();
    if (!(await diskOut(slug, alive))) return;
    st.held = null; st.view = 'drive'; st.busy = false; emit();
  }
  /** Insert a disk (held, in the tray, or anywhere) into the drive, then look at its directory on the CRT. */
  async function load(slug) {
    if (!disks[slug]) return;
    const alive = mine();
    leaveDesk();
    st.busy = true; emit();
    if (!(await returnOthers(slug, alive))) return;
    if (st.session === slug) { st.view = 'crt'; st.busy = false; emit(); await flyTo('crt', 1000, alive); return; }
    st.held = null; st.pending = slug; st.view = 'drive'; emit();
    flyTo('drive', 900, alive);
    if (!(await diskIn(slug, alive))) return;
    st.session = slug; st.pending = null; st.view = 'crt'; st.busy = false; emit();
    await flyTo('crt', 1100, alive);
  }
  async function eject() {
    const slug = st.session || st.pending;
    if (!slug) return;
    const alive = mine();
    st.session = null; st.pending = null; st.view = 'drive'; st.busy = true; emit();
    const cam = flyTo('drive', 700, alive);
    if (!(await diskOut(slug, alive))) return;
    await cam;
    st.busy = false; emit();                    // ends at the organizer: the visitor can pick another disk
  }
  /** A held disk goes home before the camera leaves for another station (one object in hand at a time). */
  async function dropHeld(alive) {
    if (!st.held) return true;
    const s = st.held; st.held = null; st.busy = true; emit();
    return diskOut(s, alive);
  }
  /** The drafting plans: over the survey sheet with its pinned notes. From a note, this is one step back. */
  async function goPlans() {
    const alive = mine();
    leaveDesk();
    if (!(await dropHeld(alive))) return;
    st.view = 'plans'; st.note = null; st.busy = false; emit();
    await flyTo('plans', 1000, alive);
  }
  /** The coffee mug, close up. Esc, a tap off the mug or Back returns to the desk at the viewpoint the visitor left it. */
  async function goMug() {
    const alive = mine();
    leaveDesk();
    if (!(await dropHeld(alive))) return;
    st.view = 'mug'; st.note = null; st.busy = false; emit();
    await flyTo('mug', 900, alive);
  }
  /** Bring the camera down onto one note so it can be read. */
  async function inspectNote(slug) {
    const m = notes[slug];
    if (!m) return goPlans();
    const alive = mine();
    leaveDesk();
    if (!(await dropHeld(alive))) return;
    st.view = 'note'; st.note = slug; st.busy = false; emit();
    await flyTo(noteView(THREE, m), 900, alive);
  }

  /** The career notebook: the camera goes over the book, the cover swings open, and the reading page lays over its right-hand page. */
  async function openBook(page = 'work') {
    if (!book) return back();
    const p = CAREER_PAGE_IDS.includes(page) ? page : 'work';
    if (st.view === 'book') return turnPage(p);
    const alive = mine();
    leaveDesk();
    if (!(await dropHeld(alive))) return;
    st.view = 'book'; st.page = p; st.note = null; st.busy = false; st.fit = 0; flying = true; emit();
    const arrived = await flyTo(bookPose(), 1000, alive);
    flying = false;
    if (arrived) refit();                              // fit > 0 from here on: the reading page can be laid on the open book
  }
  /** Turn to another page of the open notebook (the camera stays; the leaves turn). */
  function turnPage(page) {
    if (!CAREER_PAGE_IDS.includes(page) || st.view !== 'book' || st.page === page) return;
    st.page = page; emit();
  }

  /* ── 07: the reading corner ── */
  const lounge = engine.lounge;
  async function goCorner() {
    if (!lounge) return back();
    const alive = mine();
    leaveDesk();
    if (!(await dropHeld(alive))) return;
    st.view = 'corner'; st.note = null; st.page = null; st.busy = false; emit();
    await flyTo('corner', 1000, alive);
  }
  /** Sit in the lounge chair: the camera at a seated eye height, looking across at the desk. Back returns to the desk view. */
  async function sit() {
    if (!lounge) return back();
    const alive = mine();
    leaveDesk();
    if (!(await dropHeld(alive))) return;
    st.view = 'seat'; st.note = null; st.page = null; st.busy = false; emit();
    await flyTo('seat', 1100, alive);
  }
  /** The record player, close up. A tap on it (or Play) starts and stops it. */
  async function inspectRecord() {
    if (!lounge) return back();
    const alive = mine();
    leaveDesk();
    if (!(await dropHeld(alive))) return;
    st.view = 'record'; st.note = null; st.page = null; st.busy = false; emit();
    await flyTo('record', 900, alive);
  }
  // the platter turns at 33⅓ rpm only while playing: a rAF loop that exists only then, and only while the page is shown and motion is allowed
  let spinRaf = 0, spinA = 0, spinT = 0, armTok = 0;
  const spinStep = (now) => {
    spinRaf = 0;
    if (!st.playing || engine.suspended || document.hidden) return;
    spinA += ((now - (spinT || now)) / 1000) * ((33.333 * 2 * Math.PI) / 60);
    spinT = now;
    lounge.spin(spinA);
    markDirty();
    spinRaf = requestAnimationFrame(spinStep);
  };
  const startSpin = () => { if (!spinRaf && !engine.reduceMotion.matches) { spinT = 0; spinRaf = requestAnimationFrame(spinStep); } };
  const stopSpin = () => { cancelAnimationFrame(spinRaf); spinRaf = 0; };
  const onVis = () => { if (document.hidden) stopSpin(); else if (st.playing) startSpin(); };
  document.addEventListener('visibilitychange', onVis);
  function setPlaying(on) {
    if (!lounge || st.playing === on) return;
    st.playing = on;
    const tok = ++armTok, from = lounge.armT ?? (on ? 0 : 1);
    if (!on) stopSpin();
    run(on ? 900 : 700, (e) => { lounge.armT = from + ((on ? 1 : 0) - from) * e; lounge.armTo(lounge.armT); }, () => armTok === tok)
      .then((done) => { if (done && on && st.playing) startSpin(); });
  }
  function togglePlay() {
    if (st.view !== 'record') return inspectRecord();
    setPlaying(!st.playing); emit();
  }

  /* ── 11: the Daventry One lab drawing above the bookcase, close up. A node (on the drawing or in the bar) is outlined and described. ── */
  const lab = engine.room?.lab;
  async function inspectLab() {
    if (!lab) return back();
    const alive = mine();
    leaveDesk();
    if (!(await dropHeld(alive))) return;
    st.view = 'lab'; st.note = null; st.page = null; st.busy = false; emit();
    await flyTo('lab', 1000, alive);
  }
  /** 11: the instant camera on the cubby bookcase, close up (the photograph collection is listed in the bar). */
  const instant = engine.room?.camera;
  async function inspectCamera() {
    if (!instant) return back();
    const alive = mine();
    leaveDesk();
    if (!(await dropHeld(alive))) return;
    st.view = 'camera'; st.note = null; st.page = null; st.busy = false; emit();
    const c = new THREE.Box3().setFromObject(instant).getCenter(new THREE.Vector3());
    await flyTo({ yaw: -Math.PI / 2 + 0.2, pitch: 0.16, dist: 1100, fitW: 700, target: c }, 900, alive);
  }
  function selectLabNode(id) {
    if (!lab) return;
    st.labNode = st.labNode === id ? null : id;
    lab.select(st.labNode); markDirty(); emit();
  }

  /** Menu entry chosen: the screen fills the viewport, then the page takes over (the owner swaps the layers). */
  async function launch(entry) {
    const alive = mine();
    st.lastEntry = entry.id; st.view = 'fill'; emit();
    await flyTo('crtFill', 700, alive);
    if (alive()) onLaunch?.(entry);
  }
  /** Back from a full-page experience: pull back out of the screen to the legible CRT pose. Other states are kept as they were. */
  async function returnFromScreen() {
    const alive = mine();
    if (st.view === 'fill') { st.view = 'crt'; emit(); await flyTo('crt', 750, alive); }
    else emit();
  }

  /* ── pointer: look around by dragging; select objects by clicking/tapping ── */
  const ray = new THREE.Raycaster();
  const pick = (e) => {
    const r = engine.stage.getBoundingClientRect();
    ray.setFromCamera({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 }, camera);
    const hit = ray.intersectObjects([...diskList, engine.machine, engine.tray, ...Object.values(notes), ...(engine.sheet ? [engine.sheet] : []), ...(engine.mug ? [engine.mug] : []), ...(book ? [book.group] : []), ...(lounge ? [lounge.chair, lounge.table] : []), ...(lab ? [lab.sheet] : []), ...(instant ? [instant] : [])], true)[0];
    if (hit?.object.userData.note) {
      const n = hit.object.userData.note;
      const r = n.rects.find((q) => hit.uv.x >= q.u0 && hit.uv.x <= q.u1 && hit.uv.y >= q.v0 && hit.uv.y <= q.v1);
      return { note: n.slug, title: n.title, caseId: n.caseId, stamp: r?.kind || null };
    }
    if (hit && instant) { let o = hit.object; while (o && o !== instant) o = o.parent; if (o) return { camera: true }; }
    if (hit && lab && hit.object === lab.sheet) {
      const n = hit.object.userData.lab.rects.find((q) => hit.uv.x >= q.u0 && hit.uv.x <= q.u1 && hit.uv.y >= q.v0 && hit.uv.y <= q.v1);
      return { lab: true, labNode: n?.id || null };
    }
    if (hit && hit.object === engine.sheet) return { sheet: true };
    if (hit && engine.mug && hit.object.parent === engine.mug) return { mug: true, proxy: !!hit.object.userData.proxy };
    if (hit && lounge) { let o = hit.object; while (o && o !== lounge.player && o !== lounge.chair && o !== lounge.table) o = o.parent; if (o === lounge.player) return { player: true }; if (o === lounge.chair) return { chair: true }; if (o === lounge.table) return { table: true }; }
    if (hit && book) { let o = hit.object; while (o && o !== book.group) o = o.parent; if (o) return { book: true }; }
    let g = hit?.object;
    while (g && !g.userData.project && g !== engine.machine && g !== engine.tray) g = g.parent;
    if (g === engine.machine) return { machine: true };
    if (g === engine.tray) return { tray: true };
    return g ? { slug: g.userData.project.slug, label: g.userData.project.label, caseId: g.userData.project.caseId } : null;
  };
  let down = null;
  const canLook = () => st.view === 'rest' && !st.busy;
  const onDown = (e) => {
    const ui = !!e.target.closest('a, button, input, textarea, select, label');   // real controls; the screen's background is part of the room
    down = { x: e.clientX, y: e.clientY, t: performance.now(), ui, onScreen: !!e.target.closest('#screen'), lookY: engine.look.yaw, lookP: engine.look.pitch, dragging: false, id: e.pointerId };
  };
  const onUp = (e) => {
    const d = down; down = null;
    if (!d || d.ui || engine.suspended) return;
    if (d.dragging) { engine.stage.classList.remove('is-looking'); return; }
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8 || performance.now() - d.t > 700) return;
    if (st.busy || st.view === 'crt' || st.view === 'fill' || st.pending) return;
    if (d.onScreen && st.view === 'rest') { approach(); return; }   // clicking the CRT's glass uses the computer
    const hit = pick(e);
    if (st.view === 'hold') { if (!hit || hit.slug !== st.held) putBack(); return; }   // clicking away puts the disk back
    if (st.view === 'note') {                     // reading a note: press a printed stamp, pick the other note, or click off the paper to step back
      if (hit?.note === st.note) { if (hit.stamp) onNoteLink?.(st.note, hit.stamp); }
      else if (hit?.note) inspectNote(hit.note);
      else goPlans();
      return;
    }
    if (st.view === 'mug') { if (!hit?.mug || hit.proxy) back(); return; }   // the mug close-up: a tap off the mug steps back
    if (st.view === 'book') { if (!hit?.book) back(); return; }               // the open notebook: a tap off the book steps back to the desk
    if (st.view === 'record') { if (hit?.player || hit?.table) togglePlay(); else if (hit?.chair) sit(); else back(); return; }   // the record player: a tap on it plays or stops it
    if (st.view === 'seat') { if (hit?.player) inspectRecord(); else back(); return; }         // seated: a tap anywhere stands up, back at the desk
    if (st.view === 'camera') { if (!hit?.camera) back(); return; }   // the camera close-up: a tap off the camera steps back
    if (st.view === 'lab') { if (hit?.labNode) selectLabNode(hit.labNode); else if (!hit?.lab) back(); return; }   // the lab drawing: a tap on a model outlines it; off the drawing steps back
    if (st.view === 'corner') { if (hit?.chair) sit(); else if (hit?.player || hit?.table) inspectRecord(); else back(); return; }
    if (hit?.note) { inspectNote(hit.note); return; }
    if (hit?.sheet) { if (st.view !== 'plans') goPlans(); return; }
    if (hit?.slug) { if (st.session === hit.slug) approach(); else pickUp(hit.slug); }
    else if (hit?.lab) inspectLab();
    else if (hit?.camera) inspectCamera();
    else if (hit?.mug) goMug();
    else if (hit?.book) openBook('work');
    else if (hit?.chair) sit();
    else if (hit?.player || hit?.table) inspectRecord();
    else if (hit?.machine) approach();
    else if (hit?.tray) focusTray();
  };
  const onMove = (e) => {
    if (down && !down.ui && canLook()) {
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (!down.dragging && Math.hypot(dx, dy) > 8) { down.dragging = true; engine.stage.classList.add('is-looking'); onHover?.(null); }
      if (down.dragging) {
        const r = engine.stage.getBoundingClientRect();
        const k = 2.6 / Math.max(r.width, 1);   // a full-width drag turns about 2.6 rad (about 1.4 rad vertically, then clamped)
        engine.setLook(
          down.lookY - dx * k,
          THREE.MathUtils.clamp(down.lookP + dy * k * 0.55, -LOOK.pitchDown, LOOK.pitchUp),
        );
        return;
      }
    }
    if (e.pointerType === 'touch' || engine.suspended || st.view === 'crt' || st.view === 'fill' || e.target.closest?.('a, button, #screen')) { onHover?.(null); engine.stage.style.cursor = ''; return; }
    const hit = pick(e);
    engine.stage.style.cursor = hit && (st.view !== 'note' || hit.note !== st.note || hit.stamp) && !(hit.sheet && st.view === 'plans') ? 'pointer' : '';
    onHover?.(hit ? { ...hit, x: e.clientX, y: e.clientY } : null);
  };
  engine.stage.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  engine.stage.addEventListener('pointermove', onMove, { passive: true });
  const dispose = () => {
    engine.stage.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointerup', onUp);
    engine.stage.removeEventListener('pointermove', onMove);
    epoch++; bookTok++; armTok++; offResize(); stopSpin(); document.removeEventListener('visibilitychange', onVis);
  };

  emit();
  return {
    load, eject, approach, focusTray, pickUp, putBack, back, launch, returnFromScreen, dispose, goPlans, inspectNote, goMug, openBook, turnPage, refit, goCorner, sit, inspectRecord, togglePlay, inspectLab, selectLabNode, inspectCamera,
    pages: CAREER_PAGE_IDS,
    noteSlugs: Object.keys(notes),
    /** Keyboard look-around at the desk (secondary to dragging). */
    nudgeLook(dy, dp) {
      if (!canLook()) return;
      engine.setLook(engine.look.yaw + dy, THREE.MathUtils.clamp(engine.look.pitch + dp, -LOOK.pitchDown, LOOK.pitchUp));
    },
    get state() { return { ...st, locs: Object.fromEntries(Object.entries(home).map(([k, v]) => [k, v.loc])) }; },
    get deskLook() { return { ...deskLook }; },
  };
}

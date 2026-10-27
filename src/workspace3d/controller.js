/* Workspace controller: floppy choreography + camera states, with no DOM of its own.
 *
 * Port of m15/src/interact.js (iteration 03, approved). The screen UI now lives in React (CrtScreen.jsx), so this module only
 * moves things in the scene and reports state. Every action is "go to state X from wherever things are now": a new action bumps
 * `epoch`, in-flight tweens see alive() go false and stop, and the next action starts from the disk's and camera's current pose.
 * Nothing moves on hover. Reduced motion: engine.run() collapses each tween into one step (jump cuts).
 *
 * view:  rest   the room, three-quarter
 *        drive  the tray and the drive, while a disk travels
 *        crt    the screen, legible (menu or a disk's directory)
 *        fill   the screen fills the viewport: the hand-off pose just before a full-page experience opens */

export function createController(engine, { onChange, onHover, onLaunch }) {
  const { THREE, scene, camera, run, flyTo, markDirty, EASE, diskList } = engine;
  const disks = Object.fromEntries(diskList.map((d) => [d.userData.project.slug, d]));
  const home = {};
  for (const [slug, d] of Object.entries(disks)) home[slug] = { parent: d.parent, pos: d.position.clone(), quat: d.quaternion.clone(), loc: 'home' };

  let epoch = 0;
  const st = { view: 'rest', session: null, pending: null, lastEntry: null };
  const emit = () => { engine.lockParallax(st.view !== 'rest'); onChange?.({ ...st, locs: Object.fromEntries(Object.entries(home).map(([k, v]) => [k, v.loc])) }); };
  const mine = () => { const my = ++epoch; return () => epoch === my; };
  const sleep = (ms, alive) => run(ms, () => {}, alive, (t) => t);

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
  async function diskIn(slug, alive) {            // tray -> drive
    const d = disks[slug], h = home[slug];
    if (h.loc === 'drive') return true;
    if (h.loc === 'home') { scene.attach(d); h.loc = 'free'; const w = homeWorld(h); if (!(await move(d, w.pos.clone().add(V(0, 240, 0)), w.q, 380, alive, 0, EASE.out))) return false; }
    h.loc = 'free';
    if (!(await move(d, STAGE, FLAT, 760, alive, 70))) return false;
    if (!(await move(d, SEATED, FLAT, 560, alive))) return false;
    h.loc = 'drive';
    return true;
  }
  async function diskOut(slug, alive) {           // drive -> tray, exactly where it started
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

  /* ── actions ────────────────────────────────────────────────────── */
  async function load(slug) {
    if (!disks[slug]) return;
    const alive = mine();
    const others = Object.keys(home).filter((k) => k !== slug && home[k].loc !== 'home');
    if (others.length) {                          // another disk is loaded or mid-flight: put it back first, wherever it is
      st.session = null; st.pending = null; st.view = 'drive'; emit();
      flyTo('drive', 700, alive);
      for (const o of others) if (!(await diskOut(o, alive))) return;
    }
    if (st.session === slug) return approach();
    st.pending = slug; st.view = 'drive'; emit();
    flyTo('drive', 900, alive);
    if (!(await diskIn(slug, alive))) return;
    st.session = slug; st.pending = null; st.view = 'crt'; emit();
    await flyTo('crt', 1100, alive);
  }
  /** Look closer at the tray: the camera frames the disks and the drive. Selecting a disk (or the dock) then loads it. */
  async function focusTray() {
    const alive = mine();
    st.view = 'drive'; emit();
    await flyTo('drive', 900, alive);
  }
  async function approach() {                     // to the screen: menu when no disk is loaded, the disk's directory when one is
    const alive = mine();
    st.view = 'crt'; emit();
    await flyTo('crt', 1000, alive);
  }
  async function back() {                         // to the room; a loaded disk stays seated
    const alive = mine();
    st.view = 'rest'; emit();
    await flyTo('threeQuarter', 1000, alive);
  }
  async function eject() {
    const slug = st.session || st.pending;
    if (!slug) return;
    const alive = mine();
    st.session = null; st.pending = null; st.view = 'drive'; emit();
    const cam = flyTo('drive', 700, alive);
    if (!(await diskOut(slug, alive))) return;
    await cam;
    st.view = 'rest'; emit();
    await flyTo('threeQuarter', 900, alive);
  }
  /** Menu entry chosen: the screen fills the viewport, then the page takes over (the owner swaps the layers). */
  async function launch(entry) {
    const alive = mine();
    st.lastEntry = entry.id; st.view = 'fill'; emit();
    await flyTo('crtFill', 700, alive);
    if (alive()) onLaunch?.(entry);
  }
  /** Back from a full-page experience: pull back out of the screen to the legible CRT pose. */
  async function returnFromScreen() {
    const alive = mine();
    if (st.view === 'fill') { st.view = 'crt'; emit(); await flyTo('crt', 750, alive); }
    else emit();
  }

  /* ── pointer: tap a disk or the computer in the scene ───────────── */
  const ray = new THREE.Raycaster();
  const pick = (e) => {
    const r = engine.stage.getBoundingClientRect();
    ray.setFromCamera({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 }, camera);
    const hit = ray.intersectObjects([...diskList, engine.machine, engine.tray], true)[0];
    let g = hit?.object;
    while (g && !g.userData.project && g !== engine.machine && g !== engine.tray) g = g.parent;
    if (g === engine.machine) return { machine: true };
    if (g === engine.tray) return { tray: true };
    return g ? { slug: g.userData.project.slug, label: g.userData.project.label } : null;
  };
  let down = null;
  const onDown = (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now(), ui: !!e.target.closest('a, button, input, #screen') }; };
  const onUp = (e) => {
    const d = down; down = null;
    if (!d || d.ui || engine.suspended || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8 || performance.now() - d.t > 600) return;
    if (st.view === 'crt' || st.view === 'fill' || st.pending) return;
    const hit = pick(e);
    if (hit?.slug) { if (st.session === hit.slug) approach(); else load(hit.slug); }
    else if (hit?.machine) approach();
    else if (hit?.tray) focusTray();
  };
  const onMove = (e) => {
    if (e.pointerType === 'touch' || engine.suspended || st.view === 'crt' || st.view === 'fill' || e.target.closest?.('a, button, #screen')) { onHover?.(null); return; }
    const hit = pick(e);
    onHover?.(hit ? { ...hit, x: e.clientX, y: e.clientY } : null);
  };
  engine.stage.addEventListener('pointerdown', onDown);
  engine.stage.addEventListener('pointerup', onUp);
  engine.stage.addEventListener('pointermove', onMove, { passive: true });
  const dispose = () => {
    engine.stage.removeEventListener('pointerdown', onDown);
    engine.stage.removeEventListener('pointerup', onUp);
    engine.stage.removeEventListener('pointermove', onMove);
    epoch++;
  };

  emit();
  return { load, eject, approach, focusTray, back, launch, returnFromScreen, dispose, get state() { return { ...st }; } };
}

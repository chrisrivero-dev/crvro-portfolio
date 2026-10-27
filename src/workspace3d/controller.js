/* Workspace controller: stations, look-around, floppy choreography and camera states. No DOM of its own.
 *
 * 05A station model (the room is the navigation):
 *   desk      the room; the visitor can drag to look around (within limits) and select objects
 *   computer  the camera at the CRT (menu, Ask, Contact, or a loaded disk's directory)
 *   disks     the camera at the floppy organizer
 *   hold      a disk lifted out of the organizer and held in front of the camera for inspection
 * plus `fill` (the screen fills the viewport just before the expanded interface opens).
 *
 * Every action is "go to state X from wherever things are now": a new action bumps `epoch`, in-flight tweens see alive()
 * go false and stop, and the next action starts from the disk's and camera's current pose. Nothing moves on hover.
 * Multi-step actions set `busy` so the page does not write an intermediate state into the URL.
 * Reduced motion: engine.run() collapses each tween into one step (jump cuts). */

const LOOK = { yaw: 0.45, pitchUp: 0.16, pitchDown: 0.12 };   // look-around limits at the desk (radians)

export function createController(engine, { onChange, onHover, onLaunch }) {
  const { THREE, scene, camera, run, flyTo, markDirty, EASE, diskList } = engine;
  const disks = Object.fromEntries(diskList.map((d) => [d.userData.project.slug, d]));
  const home = {};
  for (const [slug, d] of Object.entries(disks)) home[slug] = { parent: d.parent, pos: d.position.clone(), quat: d.quaternion.clone(), loc: 'home' };

  let epoch = 0;
  const st = { view: 'rest', session: null, pending: null, held: null, busy: false, lastEntry: null };
  let deskLook = { yaw: 0, pitch: 0 };          // where the visitor was looking at the desk; restored on return
  const emit = () => { engine.lockParallax(st.view !== 'rest'); onChange?.({ ...st, locs: Object.fromEntries(Object.entries(home).map(([k, v]) => [k, v.loc])) }); };
  const mine = () => { const my = ++epoch; return () => epoch === my; };
  // only a settled desk view is remembered (never a half-finished return flight)
  const leaveDesk = () => { if (st.view === 'rest' && !st.busy) deskLook = { yaw: engine.look.yaw, pitch: engine.look.pitch }; };

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
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
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
    st.view = 'rest'; st.busy = true; emit();
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
    const hit = ray.intersectObjects([...diskList, engine.machine, engine.tray], true)[0];
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
    if (hit?.slug) { if (st.session === hit.slug) approach(); else pickUp(hit.slug); }
    else if (hit?.machine) approach();
    else if (hit?.tray) focusTray();
  };
  const onMove = (e) => {
    if (down && !down.ui && canLook()) {
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (!down.dragging && Math.hypot(dx, dy) > 8) { down.dragging = true; engine.stage.classList.add('is-looking'); onHover?.(null); }
      if (down.dragging) {
        const r = engine.stage.getBoundingClientRect();
        const k = 1.6 / Math.max(r.width, 1);   // a full-width drag turns about 1.6 rad before clamping
        engine.setLook(
          THREE.MathUtils.clamp(down.lookY - dx * k, -LOOK.yaw, LOOK.yaw),
          THREE.MathUtils.clamp(down.lookP + dy * k, -LOOK.pitchDown, LOOK.pitchUp),
        );
        return;
      }
    }
    if (e.pointerType === 'touch' || engine.suspended || st.view === 'crt' || st.view === 'fill' || e.target.closest?.('a, button, #screen')) { onHover?.(null); return; }
    const hit = pick(e);
    onHover?.(hit ? { ...hit, x: e.clientX, y: e.clientY } : null);
  };
  engine.stage.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  engine.stage.addEventListener('pointermove', onMove, { passive: true });
  const dispose = () => {
    engine.stage.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointerup', onUp);
    engine.stage.removeEventListener('pointermove', onMove);
    epoch++;
  };

  emit();
  return {
    load, eject, approach, focusTray, pickUp, putBack, back, launch, returnFromScreen, dispose,
    /** Keyboard look-around at the desk (secondary to dragging). */
    nudgeLook(dy, dp) {
      if (!canLook()) return;
      engine.setLook(THREE.MathUtils.clamp(engine.look.yaw + dy, -LOOK.yaw, LOOK.yaw), THREE.MathUtils.clamp(engine.look.pitch + dp, -LOOK.pitchDown, LOOK.pitchUp));
    },
    get state() { return { ...st, locs: Object.fromEntries(Object.entries(home).map(([k, v]) => [k, v.loc])) }; },
    get deskLook() { return { ...deskLook }; },
  };
}

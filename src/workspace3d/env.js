/* Iteration 03 — D2 Cinematic Archive with restrained D1 fill (approved direction), plus the interactive workspace.
 * Derived from env-d.js (iteration 02, kept unchanged). New here: refined survey drawings, the mug, steam.
 * Production copy of m15/src/env-i3.js: disks come from the registry (data/caseIds.js), the tray has one slot per disk.
 * Option D — hybrid workspace (iteration 02).
 * C's steel flat-file cabinet is the desk base, topped with A's oak drafting
 * board and taped survey sheet; B contributes a detached keyboard on a coiled
 * lead. The project disks sit in a stepped index organizer right beside the
 * machine's drive, labels toward the visitor. Real architecture closes the
 * space: corner walls with a window, wainscot, a wall shelf of binders, a
 * plan rack, and an articulated lamp that is the actual light source.
 *
 * Geometry is shared by D1 and D2; only `lighting(mood)` differs. */
import * as THREE from 'three';
import { box, DESK_FRONT, DESK_BACK, FLOOR_Y } from './env-common.js';
import { surveyTexture } from './drafting.js';
import { DISK_PROJECTS } from '../data/caseIds.js';

const TOP = -390;                    // desk surface
const WALL_Z = DESK_BACK - 140;      // back wall plane
const LEFT_X = -2300;                // left wall plane (window wall)

function cardCanvas(text, w = 256, h = 80, paper = '#efe8d6') {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = paper; x.fillRect(0, 0, w, h);
  x.fillStyle = '#1d2430';
  let size = 40;
  x.font = `700 ${size}px "JetBrains Mono", monospace`;
  while (x.measureText(text).width > w - 20 && size > 12) x.font = `700 ${(size -= 2)}px "JetBrains Mono", monospace`;
  x.textBaseline = 'middle';
  x.fillText(text, 10, h / 2 + 2);
  return c;
}

/* Framed survey plat for the wall: drafting texture under a mat. */
function framed(THREE, props, w, h, mat) {
  const g = new THREE.Group();
  g.add(box(w, h, 26, mat, [0, 0, 0]));
  const mount = new THREE.Mesh(new THREE.PlaneGeometry(w - 60, h - 60), new THREE.MeshStandardMaterial({ color: '#e8e1cf', roughness: 0.95 }));
  mount.position.z = 13.5;
  const art = new THREE.Mesh(new THREE.PlaneGeometry(w - 130, h - 130),
    new THREE.MeshStandardMaterial({ map: props.tex(surveyTexture({ seed: 23, title: 'TRACT INDEX · SHEET 1' })), roughness: 0.9 }));
  art.position.z = 14;
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w - 60, h - 60),
    new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.05, transparent: true, opacity: 0.08, metalness: 0 }));
  glass.position.z = 15;
  g.add(mount, art, glass);
  g.traverse((o) => { if (o.isMesh) o.receiveShadow = true; });
  return g;
}

export const target = new THREE.Vector3(-120, -180, 120);
export const views = {
  threeQuarter: { yaw: 0.34, pitch: 0.3, dist: 3200, fitW: 1900 },
  front:        { yaw: 0.0,  pitch: 0.3, dist: 3600, fitW: 1900 },
  side:         { yaw: 1.15, pitch: 0.26, dist: 2900 },
  top:          { yaw: 0.15, pitch: 1.15, dist: 3300 },
  wide:         { yaw: 0.42, pitch: 0.16, dist: 4300, target: new THREE.Vector3(-300, 0, 0) },
  // the disks, the drive and the path between them
  drive:        { yaw: 0.34, pitch: 0.42, dist: 1500, fitW: 1100, target: new THREE.Vector3(-380, -250, 340) },
  // the screen, square-on and filling the frame; fitW keeps all of it visible on a portrait phone
  crt:          { yaw: 0.0,  pitch: 0.02, dist: 1180, fitW: 618, target: new THREE.Vector3(0, 40, 254) },
  // phone portrait: computer + tray fill the width, camera a little lower so the desk (not the wall) fills the frame
  restPortrait: { yaw: 0.3, pitch: 0.26, dist: 3000, fitW: 1150, target: new THREE.Vector3(-170, -110, 150) },
  // 05B.1 drafting plans: over the survey sheet, looking down at the pinned notes (fitW keeps both notes on a phone)
  plans:        { yaw: 0.1, pitch: 0.95, dist: 1650, fitW: 860, target: new THREE.Vector3(870, -390, 60) },
  mug:          { yaw: 0.2,  pitch: 0.16, dist: 620, target: new THREE.Vector3(520, -270, 575) },
  closeup:      { yaw: 0.42, pitch: 0.34, dist: 1250, target: new THREE.Vector3(-380, -280, 360) },
};

/** The rest pose differs on a portrait phone; every 'threeQuarter' request (reset, return, eject) resolves through here. */
export const resolveView = (name) => (name === 'threeQuarter' && matchMedia('(max-aspect-ratio: 4/5)').matches ? 'restPortrait' : name);

export function build({ props, scene, plasticDark, plasticDeep, rubber }) {
  const wood = (base, seed, repeat = 1) => new THREE.MeshStandardMaterial({ map: props.tex(props.woodTexture({ base, seed }), { repeat }), roughness: 0.5 });
  const plaster = new THREE.MeshStandardMaterial({ map: props.tex(props.plasterTexture({ base: '#b9ad97' }), { repeat: 3 }), roughness: 0.95 });
  const steel = new THREE.MeshStandardMaterial({ color: '#5d6459', metalness: 0.6, roughness: 0.42 });
  const steelDark = new THREE.MeshStandardMaterial({ color: '#3e433c', metalness: 0.5, roughness: 0.55 });
  const brass = new THREE.MeshStandardMaterial({ color: '#a8884f', metalness: 1, roughness: 0.32 });
  const paper = new THREE.MeshStandardMaterial({ color: '#ece4cf', roughness: 0.95 });
  const blackMetal = new THREE.MeshStandardMaterial({ color: '#1c1b19', metalness: 0.7, roughness: 0.35 });

  /* ── architecture ─────────────────────────────────────────────── */
  const back = new THREE.Mesh(new THREE.PlaneGeometry(9000, 5200), plaster);
  back.position.set(LEFT_X + 4500, FLOOR_Y + 2600, WALL_Z);
  back.receiveShadow = true;
  scene.add(back);
  // left wall with a window opening (four panels around the hole)
  const win = { z0: -400, z1: 700, y0: TOP + 250, y1: TOP + 1900 };
  const lw = (z0, z1, y0, y1) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(z1 - z0, y1 - y0), plaster);
    m.rotation.y = Math.PI / 2;
    m.position.set(LEFT_X, (y0 + y1) / 2, (z0 + z1) / 2);
    m.receiveShadow = true; m.castShadow = true;
    scene.add(m);
  };
  lw(WALL_Z, win.z0, FLOOR_Y, FLOOR_Y + 5200);
  lw(win.z1, 3000, FLOOR_Y, FLOOR_Y + 5200);
  lw(win.z0, win.z1, FLOOR_Y, win.y0);
  lw(win.z0, win.z1, win.y1, FLOOR_Y + 5200);
  // window frame + mullions (cast the daylight pattern)
  const frameW = wood('#d9cfbb', 31);
  for (const z of [win.z0, win.z1, (win.z0 + win.z1) / 2]) scene.add(box(90, win.y1 - win.y0, 30, frameW, [LEFT_X, (win.y0 + win.y1) / 2, z]));
  for (const y of [win.y0, win.y1, (win.y0 + win.y1) / 2]) scene.add(box(90, 30, win.z1 - win.z0, frameW, [LEFT_X, y, (win.z0 + win.z1) / 2]));
  scene.add(box(160, 24, win.z1 - win.z0 + 80, frameW, [LEFT_X + 60, win.y0 - 12, (win.z0 + win.z1) / 2]));
  // wainscot + chair rail + skirting on the back wall
  const panel = wood('#5b3f29', 41, 2);
  const wH = TOP + 260 - FLOOR_Y;
  scene.add(box(9000, wH, 18, panel, [LEFT_X + 4500, FLOOR_Y + wH / 2, WALL_Z + 9]));
  scene.add(box(9000, 40, 40, wood('#4a321f', 42), [LEFT_X + 4500, FLOOR_Y + wH + 20, WALL_Z + 20]));
  // floor boards
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(9000, 6000), new THREE.MeshStandardMaterial({ map: props.tex(props.woodTexture({ base: '#4a3424', seed: 51 }), { repeat: 4 }), roughness: 0.6 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, FLOOR_Y, 1000);
  floor.receiveShadow = true;
  scene.add(floor);

  /* ── furniture: flat-file cabinet base + oak drafting top ─────── */
  const cabW = 2900, cx0 = -250, depth = DESK_FRONT - DESK_BACK, zc = (DESK_FRONT + DESK_BACK) / 2;
  const topT = 46;
  scene.add(box(cabW + 80, topT, depth + 40, wood('#80593a', 7), [cx0, TOP - topT / 2, zc + 10]));
  // breadboard edge along the front: reads as a drafting board, not a shelf
  scene.add(box(cabW + 80, topT + 14, 34, wood('#6a4830', 8), [cx0, TOP - topT / 2 - 7, DESK_FRONT + 30]));
  const cabTop = TOP - topT, H = cabTop - (FLOOR_Y + 90);
  scene.add(box(cabW, H, depth - 60, steelDark, [cx0, FLOOR_Y + 90 + H / 2, zc - 20]));
  scene.add(box(cabW - 40, 90, depth - 120, blackMetal, [cx0, FLOOR_Y + 45, zc - 30])); // recessed plinth
  const rows = 6, dh = H / rows;
  const drawerNames = ['PLATS', 'SURVEY', 'CAD SHEETS', 'RECORDS', 'INDEX', 'DRAFTS'];
  for (let r = 0; r < rows; r++) {
    const y = cabTop - dh / 2 - r * dh;
    for (const half of [-1, 1]) {
      const cx = cx0 + half * cabW / 4;
      scene.add(box(cabW / 2 - 20, dh - 12, 18, steel, [cx, y, DESK_FRONT - 18]));
      scene.add(box(240, 12, 16, brass, [cx, y - dh * 0.18, DESK_FRONT - 2]));
      scene.add(box(132, 54, 4, brass, [cx, y + dh * 0.17, DESK_FRONT - 7]));
      const card = new THREE.Mesh(new THREE.PlaneGeometry(118, 40),
        new THREE.MeshStandardMaterial({ map: props.tex(cardCanvas(drawerNames[(r + (half > 0 ? 3 : 0)) % 6], 256, 88)), roughness: 0.9 }));
      card.position.set(cx, y + dh * 0.17, DESK_FRONT - 4.5);
      scene.add(card);
    }
  }

  /* ── survey sheet, taped, with scale + pencil + rolled plans ──── */
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1150, 800),
    new THREE.MeshStandardMaterial({ map: props.tex(surveyTexture()), roughness: 0.9 }));
  sheet.rotation.set(-Math.PI / 2, 0, -0.05);
  sheet.position.set(860, TOP + 0.6, 120);
  sheet.receiveShadow = true;
  scene.add(sheet);
  const tape = new THREE.MeshStandardMaterial({ color: '#e8dcb8', roughness: 0.7, transparent: true, opacity: 0.85 });
  for (const [dx, dz] of [[-540, -370], [540, -390], [-560, 380], [540, 400]]) scene.add(box(72, 0.8, 30, tape, [860 + dx, TOP + 1, 120 + dz], 0.6));
  const scale = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 600, 3), new THREE.MeshStandardMaterial({ color: '#e9e4d8', roughness: 0.35 }));
  scale.rotation.set(0, -0.3, Math.PI / 2);
  scale.position.set(820, TOP + 10, 360);
  scale.castShadow = true;
  scene.add(scale);
  const pencil = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 290, 12), new THREE.MeshStandardMaterial({ color: '#1f2a36', roughness: 0.4, metalness: 0.3 }));
  pencil.rotation.set(Math.PI / 2, 0, 0.7);
  pencil.position.set(1290, TOP + 5, 330);   // 05B.1: moved clear of the pinned project notes
  pencil.castShadow = true;
  scene.add(pencil);
  for (let i = 0; i < 3; i++) {
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(34 - i * 3, 34 - i * 3, 900, 24), paper);
    roll.rotation.set(0, 0.08 * i, Math.PI / 2);
    roll.position.set(840 + i * 20, TOP + 34 - i * 3, -480 + i * 66);
    roll.castShadow = roll.receiveShadow = true;
    scene.add(roll);
  }

  /* ── keyboard (B): detached, on a coiled lead to the machine ──── */
  const KB = new THREE.Group();
  KB.add(box(640, 30, 220, plasticDark, [0, 15, 0]));
  KB.add(box(640, 10, 40, plasticDeep, [0, 34, -95]));
  const capMat = new THREE.MeshStandardMaterial({ color: '#34312d', roughness: 0.55 });
  const keys = new THREE.InstancedMesh(new THREE.BoxGeometry(34, 14, 32), capMat, 15 * 5);
  const m4 = new THREE.Matrix4();
  let k = 0;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 15; c++) {
    m4.makeTranslation(-288 + c * 40.5 + (r % 2) * 8, 34 + r * 2.4, -78 + r * 38);
    keys.setMatrixAt(k++, m4);
  }
  keys.castShadow = keys.receiveShadow = true;
  KB.add(keys);
  KB.rotation.set(-0.04, -0.06, 0);
  KB.userData.keyboard = true;
  KB.position.set(40, TOP, 470);
  scene.add(KB);
  const coil = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(260, TOP + 20, 365), new THREE.Vector3(330, TOP + 6, 330),
    new THREE.Vector3(420, TOP + 6, 250), new THREE.Vector3(420, TOP + 10, 120), new THREE.Vector3(390, TOP + 40, 40),
  ]), 40, 6, 8), rubber || plasticDeep);
  coil.castShadow = true;
  scene.add(coil);

  /* ── floppy organizer: stepped index tray beside the drive ────── */
  const Dk = props.floppy.size;
  const org = new THREE.Group();
  const orgWood = wood('#6e4a2e', 17);
  const L = 56 + DISK_PROJECTS.length * 84, ow = Dk.w + 34;   // one 84-unit slot per registry disk
  org.add(box(ow, 14, L, orgWood, [0, 7, 0]));
  // sloped sides: low at the front so the labels read over them
  for (const sx of [-1, 1]) {
    const sideShape = new THREE.Shape([new THREE.Vector2(-L / 2, 0), new THREE.Vector2(L / 2, 0), new THREE.Vector2(L / 2, 70), new THREE.Vector2(-L / 2, 150)]);
    const side = new THREE.Mesh(new THREE.ExtrudeGeometry(sideShape, { depth: 14, bevelEnabled: false }), orgWood);
    side.rotation.y = -Math.PI / 2;
    side.position.set(sx * ow / 2 + (sx > 0 ? 7 : 7), 0, 0);
    side.castShadow = side.receiveShadow = true;
    org.add(side);
  }
  org.add(box(ow, 150, 14, orgWood, [0, 75, -L / 2]));
  org.add(box(ow, 60, 14, orgWood, [0, 30, L / 2]));
  // brass label holder on the front
  org.add(box(110, 34, 3, brass, [0, 32, L / 2 + 8]));
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(98, 24), new THREE.MeshStandardMaterial({ map: props.tex(cardCanvas('PROJECTS', 256, 64)), roughness: 0.9 }));
  plate.position.set(0, 32, L / 2 + 10);
  org.add(plate);
  const disks = [];
  const colors = ['#24262a', '#2f3e52', '#7a2e24', '#24262a', '#3d4a36', '#d8d2c4', '#2f3e52'];
  DISK_PROJECTS.forEach((p, i) => {
    const z = L / 2 - 50 - i * 84;
    const lift = 10 + i * 20; // stepped risers, like a file-folder sorter
    org.add(box(ow - 8, lift, 70, orgWood, [0, lift / 2 + 10, z - 6]));
    // divider card with project tab
    const tg = new THREE.Group();
    tg.add(new THREE.Mesh(new THREE.BoxGeometry(Dk.w + 6, Dk.h * 0.9, 1.5), new THREE.MeshStandardMaterial({ color: '#cdbf9f', roughness: 0.9 })));
    const tab = new THREE.Mesh(new THREE.BoxGeometry(124, 38, 1.5), new THREE.MeshStandardMaterial({ color: '#cdbf9f', roughness: 0.9 }));
    tab.position.set(-Dk.w / 2 + 64 + (i % 2) * 60, Dk.h * 0.45 + 18, 0);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(114, 30), new THREE.MeshStandardMaterial({ map: props.tex(cardCanvas(p.label, 256, 68)), roughness: 0.9 }));
    lab.position.set(tab.position.x, tab.position.y, 1);
    tg.add(tab, lab);
    tg.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    tg.position.set(0, lift + 10 + Dk.h * 0.45, z - 30);
    tg.rotation.x = -0.2;
    org.add(tg);
    const d = props.floppy({ project: p, color: colors[i] });
    d.position.set(0, lift + 10 + Dk.h / 2, z);
    d.rotation.x = -0.24;
    org.add(d);
    disks.push(d);
  });
  org.position.set(-560, TOP, 330);
  org.rotation.y = 0.55;
  scene.add(org);

  // one disk out, resting in front of the drive: "next to load", no motion
  // decorative only: it is a second copy of the Parcel Engine disk and is not selectable, so a project never has two live disks
  const next = props.floppy({ project: DISK_PROJECTS.find((p) => p.slug === 'parcel-engine'), color: '#2f3e52' });
  next.userData.loose = true;
  next.rotation.set(-Math.PI / 2, 0, 0.35);
  next.position.set(-930, TOP + Dk.t / 2 + 0.5, 470);
  scene.add(next);

  /* ── articulated lamp: the warm source is in frame ────────────── */
  const lamp = new THREE.Group();
  lamp.add(box(220, 30, 220, blackMetal, [0, 15, 0]));
  const seg = (a, b, r = 9) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, A.distanceTo(B), 12), blackMetal);
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    lamp.add(m);
  };
  const J0 = [0, 40, 0], J1 = [120, 620, 0], J2 = [520, 760, 0];
  seg(J0, J1); seg(J1, J2);
  for (const j of [J0, J1, J2]) { const k = new THREE.Mesh(new THREE.SphereGeometry(18, 12, 8), brass); k.position.set(...j); lamp.add(k); }
  const shade = new THREE.Mesh(new THREE.ConeGeometry(130, 200, 32, 1, true), new THREE.MeshStandardMaterial({ color: '#2b2a27', metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide }));
  shade.position.set(560, 700, 0); shade.rotation.z = 0.5;
  lamp.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(44, 20, 12), new THREE.MeshStandardMaterial({ color: '#fff3d6', emissive: '#ffcf8a', emissiveIntensity: 3 }));
  bulb.position.set(600, 630, 0);
  lamp.add(bulb);
  lamp.traverse((o) => { if (o.isMesh && o !== bulb) o.castShadow = o.receiveShadow = true; });
  lamp.position.set(780, TOP, -540);
  lamp.rotation.y = -2.2;
  scene.add(lamp);
  lamp.updateMatrixWorld(true);
  const bulbWorld = bulb.getWorldPosition(new THREE.Vector3());

  /* ── wall: shelf of binders, framed plat, plan rack ───────────── */
  const shelfY = TOP + 830;
  scene.add(box(1600, 36, 300, wood('#6a4830', 61), [-1250, shelfY, WALL_Z + 150]));
  for (const bx of [-1900, -600]) {
    scene.add(box(14, 150, 20, blackMetal, [bx, shelfY - 92, WALL_Z + 12]));
    const br = box(14, 14, 230, blackMetal, [bx, shelfY - 100, WALL_Z + 120]);
    br.rotation.x = 0.55;
    scene.add(br);
  }
  const spines = ['#2b3440', '#3d4a36', '#2b3440', '#5a2a22', '#2b3440', '#3d4a36', '#6b5a3a', '#2b3440', '#2b3440'];
  spines.forEach((col, i) => {
    const b = box(78, 340, 270, new THREE.MeshStandardMaterial({ color: col, roughness: 0.75 }), [-1950 + i * 84, shelfY + 18 + 170, WALL_Z + 160]);
    if (i === 8) { b.rotation.z = -0.28; b.position.x += 40; b.position.y -= 18; }
    scene.add(b);
    if (i < 8) {
      const lab = new THREE.Mesh(new THREE.PlaneGeometry(52, 120), paper);
      lab.position.set(-1950 + i * 84, shelfY + 250, WALL_Z + 296);
      scene.add(lab);
    }
  });
  const plat = framed(THREE, props, 1250, 900, wood('#3a281b', 71));
  plat.position.set(250, TOP + 1150, WALL_Z + 14);
  scene.add(plat);
  // plan rack: survey tubes standing in a bin at the right edge
  const bin = new THREE.Mesh(new THREE.CylinderGeometry(150, 130, 620, 28, 1, true), new THREE.MeshStandardMaterial({ color: '#4a4237', roughness: 0.7, side: THREE.DoubleSide }));
  bin.position.set(1650, FLOOR_Y + 310, -450);
  bin.castShadow = bin.receiveShadow = true;
  scene.add(bin);
  for (let i = 0; i < 6; i++) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(30, 30, 1100 + (i % 3) * 140, 18), i % 2 ? paper : new THREE.MeshStandardMaterial({ color: '#d4c7a6', roughness: 0.9 }));
    const a = i * 1.05;
    t.position.set(1650 + Math.cos(a) * 70, FLOOR_Y + 560 + (i % 3) * 70, -450 + Math.sin(a) * 70);
    t.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12);
    t.castShadow = true;
    scene.add(t);
  }

  /* ── small restrained props: pencil cup, mug ──────────────────── */
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(52, 48, 150, 24), new THREE.MeshStandardMaterial({ color: '#6b5d4a', roughness: 0.6, metalness: 0.2 }));
  cup.position.set(-560, TOP + 75, -330);
  cup.castShadow = cup.receiveShadow = true;
  scene.add(cup);
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 260, 8), new THREE.MeshStandardMaterial({ color: ['#1f2a36', '#b8863b', '#2e2e2e', '#7a2e24', '#1f2a36'][i], roughness: 0.5 }));
    p.position.set(-560 + Math.cos(i * 1.3) * 22, TOP + 190, -330 + Math.sin(i * 1.3) * 22);
    p.rotation.set(Math.sin(i * 1.3) * 0.18, 0, Math.cos(i * 1.3) * 0.18);
    p.castShadow = true;
    scene.add(p);
  }
  /* mug: matte charcoal ceramic, cream lettering, `refill();` low near the handle; coffee surface inside */
  const mugTex = (() => {
    const { c, x } = props.canvas(2048, 512);
    x.fillStyle = '#2b2926'; x.fillRect(0, 0, 2048, 512);
    for (let i = 0; i < 5000; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`; x.fillRect(Math.random() * 2048, Math.random() * 512, 2, 2); }
    x.fillStyle = '#e8dfc9'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '700 62px "JetBrains Mono", monospace';
    x.fillText('ANOTHER SHOT', 1024, 210); x.fillText('OF AI', 1024, 285);
    x.fillStyle = 'rgba(232,223,201,0.55)'; x.fillRect(880, 335, 288, 3);
    x.fillStyle = 'rgba(232,223,201,0.6)'; x.font = '500 34px "JetBrains Mono", monospace'; x.textAlign = 'left';
    x.fillText('refill();', 1190, 405);
    return props.tex(c, { aniso: 16 });
  })();
  const mugG = new THREE.Group();
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(50, 46, 120, 48, 1, true), new THREE.MeshStandardMaterial({ map: mugTex, roughness: 0.42, metalness: 0.05 }));
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(45, 40), new THREE.MeshStandardMaterial({ color: '#150d08', roughness: 0.12 }));
  coffee.rotation.x = -Math.PI / 2; coffee.position.y = 50;
  const base = new THREE.Mesh(new THREE.CircleGeometry(46, 40), new THREE.MeshStandardMaterial({ color: '#2b2926', roughness: 0.6 }));
  base.rotation.x = Math.PI / 2; base.position.y = -60;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(48, 3.2, 10, 48), new THREE.MeshStandardMaterial({ color: '#e8dfc9', roughness: 0.4 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = 60;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(30, 8, 10, 24, Math.PI), new THREE.MeshStandardMaterial({ color: '#2b2926', roughness: 0.42 }));
  handle.rotation.z = -Math.PI / 2; handle.position.set(50, 2, 0);
  mug.rotation.y = Math.PI + 0.2; // lettering toward the rest camera; the handle stays on +x
  mugG.add(mug, coffee, base, rim, handle);
  mugG.traverse((o) => { o.castShadow = o.receiveShadow = true; });
  coffee.castShadow = false;
  // beside the right end of the keyboard and a little toward the visitor, clear of the plans, the disks and the computer
  mugG.position.set(520, TOP + 60, 575);
  scene.add(mugG);
  build.mugTop = new THREE.Vector3(520, TOP + 112, 575);

  build.lampAt = bulbWorld;
  build.window = win;

  return {
    diskList: disks,
    tray: org,
    sheet,
  };
}

/* Two light grades over the same geometry. */
export function makeLighting(mood) {
  return ({ scene, renderer, key, deskLamp, fill, rim, phosphor }) => {
    const L = build.lampAt, W = build.window;
    deskLamp.position.copy(L);
    deskLamp.target.position.set(-150, TOP, 250);
    deskLamp.angle = 0.9; deskLamp.penumbra = 0.75;
    deskLamp.shadow.camera.near = 50; deskLamp.shadow.camera.far = 4000;
    const bulbGlow = new THREE.PointLight('#ffc27a', 0, 0, 2);
    bulbGlow.position.copy(L).add(new THREE.Vector3(0, 60, 0));
    scene.add(bulbGlow);
    // daylight through the left window
    key.position.set(-5200, 2600, 900);
    key.target.position.set(-300, TOP, 0);
    scene.add(key.target);
    key.shadow.camera.left = -3000; key.shadow.camera.right = 3000;
    key.shadow.camera.top = 2400; key.shadow.camera.bottom = -2400;
    key.shadow.camera.far = 9000;
    key.shadow.camera.updateProjectionMatrix();

    if (mood === 'd1') {
      // warm natural drafting studio: late-morning sun, airy, lamp as accent
      scene.background = new THREE.Color('#2f2822');
      key.color.set('#ffe6c4'); key.intensity = 2.8;
      fill.color.set('#dfe6ee'); fill.intensity = 0.55;
      rim.color.set('#ffe9cc'); rim.intensity = 0.7;
      deskLamp.color.set('#ffd29a'); deskLamp.intensity = 3.5e6;
      bulbGlow.intensity = 1.2e5;
      phosphor.intensity = 2.2e5;
      scene.environmentIntensity = 0.26;
      renderer.toneMappingExposure = 0.98;
      // bounce from the sunlit floor
      const bounce = new THREE.HemisphereLight('#fff4e2', '#6b4d33', 0.35);
      scene.add(bounce);
    } else {
      // atmospheric cinematic archive: dusk, cool window, lamp pool + screen
      scene.background = new THREE.Color('#0d0c0b');
      scene.fog = new THREE.Fog('#141210', 3200, 7800);
      // approved: D2 dusk with a restrained D1 fill (a little more window light, a warm bounce, a lifted ambient) so the cabinet keeps its form
      key.color.set('#9fb3cf'); key.intensity = 0.62;
      fill.color.set('#c9d2dc'); fill.intensity = 0.24;
      rim.color.set('#ffb36b'); rim.intensity = 0.55;
      deskLamp.color.set('#ffb768'); deskLamp.intensity = 1.25e7;
      deskLamp.angle = 0.72; deskLamp.penumbra = 0.6;
      bulbGlow.intensity = 3.2e5;
      phosphor.intensity = 6.5e5;
      scene.environmentIntensity = 0.12;
      renderer.toneMappingExposure = 0.94;
      scene.add(new THREE.HemisphereLight('#ffe6c8', '#5a4330', 0.2));
      // faint screen spill onto the desk and keyboard
      const spill = new THREE.SpotLight('#ff9c3a', 1.6e6, 0, 0.9, 1, 2);
      spill.position.set(0, -60, 340);
      spill.target.position.set(0, TOP, 600);
      scene.add(spill, spill.target);
      // dust-lit lamp cone: a soft additive volume, no post-processing
      const cone = new THREE.Mesh(new THREE.ConeGeometry(560, 1100, 40, 1, true),
        new THREE.MeshBasicMaterial({ color: '#ffb768', transparent: true, opacity: 0.035, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      const dir = deskLamp.target.position.clone().sub(L);
      cone.position.copy(L).addScaledVector(dir.normalize(), 550);
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
      scene.add(cone);
      // window glass reads as cool dusk
      const sky = new THREE.Mesh(new THREE.PlaneGeometry(W.z1 - W.z0, W.y1 - W.y0), new THREE.MeshBasicMaterial({ color: '#2b3a52' }));
      sky.rotation.y = Math.PI / 2;
      sky.position.set(LEFT_X - 30, (W.y0 + W.y1) / 2, (W.z0 + W.z1) / 2);
      scene.add(sky);
      return;
    }
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(W.z1 - W.z0, W.y1 - W.y0), new THREE.MeshBasicMaterial({ color: '#e9eef2' }));
    sky.rotation.y = Math.PI / 2;
    sky.position.set(LEFT_X - 30, (W.y0 + W.y1) / 2, (W.z0 + W.z1) / 2);
    scene.add(sky);
  };
}

export const lighting = makeLighting('i3');

/** World position above the mug rim; the steam rises from here. */
export const getMugTop = () => build.mugTop;

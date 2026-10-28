/* 09: the rest of the room, so every heading from the desk view is a finished interior.
 *
 * Adds the right-hand wall, the front wall with the office door (opposite the workstation), the ceiling with a cornice, wainscot and
 * chair rail on the walls that had none, a walnut bookcase with a contour-map print on the right wall, a brass wall sconce by the door,
 * and the workstation's task chair. The door is closed and not interactive.
 * Scale: 1 unit ≈ 0.47 mm; 1 cm ≈ 21 units. */
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { surveyTexture } from './drafting.js';

export const ROOM = { RIGHT_X: 6200, FRONT_Z: 7400, HEIGHT: 5200 };
export const DOOR = { x0: 2950, x1: 4930, h: 4420 };          // ≈ 94 × 208 cm opening, toward the right of the front wall
export const TASK_CHAIR = { x: -40, z: 1000, rot: Math.PI - 0.12 };   // pushed in to the desk's knee space, turned a little

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }

/** Gold-leaf sign-writing for the door glass, on a transparent ground. */
function doorSignCanvas() {
  const [c, x] = cv(512, 256);
  x.textAlign = 'center';
  x.fillStyle = '#c9a25a';
  x.font = '700 64px "JetBrains Mono", monospace';
  x.fillText('CRVRO', 256, 110);
  x.font = '500 26px "JetBrains Mono", monospace';
  x.fillText('GIS · CAD · SUPPORT SYSTEMS', 256, 160);
  x.fillRect(150, 182, 212, 2);
  return c;
}
/** A topographic contour print: cream paper, brown contour lines around two summits, a blue creek. */
function contourCanvas() {
  const [c, x] = cv(512, 384), r = rng(5);
  x.fillStyle = '#e8dfc9'; x.fillRect(0, 0, 512, 384);
  const peaks = [[180, 160, 1], [360, 250, 0.8]];
  for (let k = 1; k < 16; k++) {
    for (const [px, py, s] of peaks) {
      x.strokeStyle = k % 5 === 0 ? 'rgba(120,70,30,0.8)' : 'rgba(150,95,50,0.45)';
      x.lineWidth = k % 5 === 0 ? 1.6 : 0.8;
      x.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.08) {
        const rr = k * 14 * s * (1 + 0.18 * Math.sin(a * 3 + px) + 0.08 * Math.sin(a * 7 + k));
        const X = px + Math.cos(a) * rr * 1.25, Y = py + Math.sin(a) * rr;
        a === 0 ? x.moveTo(X, Y) : x.lineTo(X, Y);
      }
      x.stroke();
    }
  }
  x.strokeStyle = 'rgba(60,110,150,0.8)'; x.lineWidth = 2.4;
  x.beginPath(); x.moveTo(0, 330); for (let i = 0; i <= 512; i += 16) x.lineTo(i, 330 - i * 0.25 + Math.sin(i / 30) * 10 + r() * 2); x.stroke();
  x.strokeStyle = 'rgba(40,30,20,0.7)'; x.lineWidth = 1; x.strokeRect(14, 14, 484, 356);
  x.fillStyle = 'rgba(60,40,25,0.8)'; x.font = '500 13px "JetBrains Mono", monospace'; x.fillText('CONTOUR INTERVAL 20 FT', 26, 362);
  return c;
}

export function buildRoom({ THREE, scene, props, wood, plaster, FLOOR_Y, LEFT_X, WALL_Z, TOP, win }) {
  const { RIGHT_X, FRONT_Z, HEIGHT } = ROOM;
  const CEIL = FLOOR_Y + HEIGHT;
  const add = (m) => { scene.add(m); return m; };
  const mesh = (geo, mat, x, y, z, rotY = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = rotY; m.castShadow = m.receiveShadow = true; return add(m); };
  const box = (w, h, d, mat, x, y, z, rotY = 0) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, rotY);
  const plane = (w, h, mat, x, y, z, rotY) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.y = rotY; m.receiveShadow = true; return add(m); };
  const brass = new THREE.MeshStandardMaterial({ color: '#b08a4a', metalness: 1, roughness: 0.32 });

  /* ── walls: right (faces −x) and front (faces −z) with the door opening ── */
  plane(FRONT_Z - WALL_Z, HEIGHT, plaster, RIGHT_X, FLOOR_Y + HEIGHT / 2, (WALL_Z + FRONT_Z) / 2, -Math.PI / 2);
  const { x0: dx0, x1: dx1, h: DH } = DOOR;
  plane(dx0 - LEFT_X, HEIGHT, plaster, (LEFT_X + dx0) / 2, FLOOR_Y + HEIGHT / 2, FRONT_Z, Math.PI);
  plane(RIGHT_X - dx1, HEIGHT, plaster, (dx1 + RIGHT_X) / 2, FLOOR_Y + HEIGHT / 2, FRONT_Z, Math.PI);
  plane(dx1 - dx0, HEIGHT - DH, plaster, (dx0 + dx1) / 2, FLOOR_Y + DH + (HEIGHT - DH) / 2, FRONT_Z, Math.PI);
  // ceiling: a lighter plaster, a plain cornice all round
  const ceilM = new THREE.MeshStandardMaterial({ map: props.tex(props.plasterTexture({ base: '#d6ccba' }), { repeat: 3 }), roughness: 0.97 });
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(RIGHT_X - LEFT_X, FRONT_Z - WALL_Z), ceilM);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set((LEFT_X + RIGHT_X) / 2, CEIL, (WALL_Z + FRONT_Z) / 2);
  add(ceil);
  const trim = wood('#4a321f', 42), cornice = new THREE.MeshStandardMaterial({ color: '#cfc4b0', roughness: 0.9 });
  const W = RIGHT_X - LEFT_X, D = FRONT_Z - WALL_Z, cx = (LEFT_X + RIGHT_X) / 2, cz = (WALL_Z + FRONT_Z) / 2;
  box(W, 90, 70, cornice, cx, CEIL - 45, WALL_Z + 35);
  box(W, 90, 70, cornice, cx, CEIL - 45, FRONT_Z - 35);
  box(70, 90, D, cornice, LEFT_X + 35, CEIL - 45, cz);
  box(70, 90, D, cornice, RIGHT_X - 35, CEIL - 45, cz);

  /* ── wainscot + chair rail on the left, right and front walls (the back wall already has them) ── */
  const panel = wood('#5b3f29', 41, 2);
  const wH = TOP + 260 - FLOOR_Y;
  const wain = (len, x, z, alongZ) => {
    box(alongZ ? 18 : len, wH, alongZ ? len : 18, panel, x, FLOOR_Y + wH / 2, z);
    box(alongZ ? 40 : len, 40, alongZ ? len : 40, trim, x, FLOOR_Y + wH + 20, z);
    box(alongZ ? 30 : len, 120, alongZ ? len : 30, trim, x, FLOOR_Y + 60, z);                  // skirting
  };
  wain(D, LEFT_X + 9, cz, true);
  wain(D, RIGHT_X - 9, cz, true);
  wain(dx0 - LEFT_X, (LEFT_X + dx0) / 2, FRONT_Z - 9, false);
  wain(RIGHT_X - dx1, (dx1 + RIGHT_X) / 2, FRONT_Z - 9, false);
  // the window's inner reveal, so the wainscot and the opening meet cleanly
  box(40, win.y1 - win.y0, 60, trim, LEFT_X + 20, (win.y0 + win.y1) / 2, win.z0 - 30);

  /* ── the door: casing, a flush walnut leaf with a frosted vision panel and sign-written glass, lever, hinges, kick plate ── */
  const casing = wood('#4a321f', 43);
  const leafM = wood('#5a3a22', 44);
  box(120, DH + 70, 70, casing, dx0 - 60, FLOOR_Y + (DH + 70) / 2, FRONT_Z - 30);
  box(120, DH + 70, 70, casing, dx1 + 60, FLOOR_Y + (DH + 70) / 2, FRONT_Z - 30);
  box(dx1 - dx0 + 240, 120, 70, casing, (dx0 + dx1) / 2, FLOOR_Y + DH + 60, FRONT_Z - 30);
  for (const x of [dx0 + 20, dx1 - 20]) box(40, DH, 260, casing, x, FLOOR_Y + DH / 2, FRONT_Z + 100);   // jambs: the wall's thickness
  box(dx1 - dx0, 40, 260, casing, (dx0 + dx1) / 2, FLOOR_Y + DH - 20, FRONT_Z + 100);
  const LW = dx1 - dx0 - 80, LH = DH - 60, lx = (dx0 + dx1) / 2, lz = FRONT_Z + 60;
  // the leaf, built around the vision panel so the glass reads as an opening in it
  const GW = LW - 640, GH = 1500, gy = FLOOR_Y + LH - 520 - GH / 2;
  box(LW, LH - (gy + GH / 2 - FLOOR_Y) + 20, 90, leafM, lx, (gy + GH / 2 + FLOOR_Y + LH) / 2, lz);           // top rail
  box(LW, gy - GH / 2 - FLOOR_Y, 90, leafM, lx, (FLOOR_Y + gy - GH / 2) / 2, lz);                            // lower leaf
  for (const sd of [-1, 1]) box((LW - GW) / 2, GH, 90, leafM, lx + sd * (GW / 2 + (LW - GW) / 4), gy, lz);   // stiles
  const glass = new THREE.MeshStandardMaterial({ color: '#cdd3cc', roughness: 0.82, emissive: '#6e746a', emissiveIntensity: 0.55 });
  box(GW, GH, 12, glass, lx, gy, lz);
  for (const sd of [-1, 1]) { box(GW + 40, 22, 30, brass, lx, gy + sd * (GH / 2 + 4), lz - 40); box(22, GH + 40, 30, brass, lx + sd * (GW / 2 + 4), gy, lz - 40); }
  const signT = props.tex(doorSignCanvas());
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(GW - 120, (GW - 120) / 2), new THREE.MeshStandardMaterial({ map: signT, transparent: true, metalness: 0.6, roughness: 0.35 }));
  sign.position.set(lx, gy + 80, lz - 8); sign.rotation.y = Math.PI;
  add(sign);
  // two flush panels below, picked out with a fine bead
  for (const y of [FLOOR_Y + 900, FLOOR_Y + 2050]) box(LW - 420, 760, 10, wood('#4f331e', 45), lx, y, lz - 48);
  box(LW - 60, 300, 8, brass, lx, FLOOR_Y + 190, lz - 49);                     // kick plate
  const hx = dx1 - 230, hy = FLOOR_Y + 2150;                                    // lever at ≈ 101 cm
  mesh(new THREE.CylinderGeometry(55, 55, 24, 24), brass, hx, hy, lz - 56).rotation.x = Math.PI / 2;
  box(320, 34, 34, brass, hx - 150, hy, lz - 92);
  box(60, 60, 50, brass, hx, hy, lz - 74);
  mesh(new THREE.CylinderGeometry(22, 22, 10, 16), new THREE.MeshStandardMaterial({ color: '#1a1714', metalness: 0.6, roughness: 0.4 }), hx, hy - 260, lz - 50).rotation.x = Math.PI / 2;
  for (const y of [FLOOR_Y + 500, FLOOR_Y + 2200, FLOOR_Y + LH - 500]) box(30, 230, 30, brass, dx0 + 45, y, lz - 30);
  // a light switch beside the casing
  box(150, 240, 16, new THREE.MeshStandardMaterial({ color: '#e6dcc6', roughness: 0.6 }), dx1 + 420, FLOOR_Y + 2650, FRONT_Z - 8);
  box(26, 60, 20, new THREE.MeshStandardMaterial({ color: '#d8ccb3', roughness: 0.5 }), dx1 + 420, FLOOR_Y + 2650, FRONT_Z - 20);

  /* ── right wall: a low walnut bookcase with binders and books, a framed contour print above, a brass sconce by the door ── */
  const shelf = new THREE.Group();
  const caseM = wood('#6e4a2e', 46);
  const BW = 2800, BH = 1700, BD = 720;
  const sb = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; shelf.add(m); return m; };
  sb(BW, 40, BD, caseM, 0, BH - 20, 0);
  sb(BW, 40, BD, caseM, 0, 180, 0);
  sb(BW - 60, 30, BD - 40, caseM, 0, 180 + (BH - 200) / 2, 0);
  for (const x of [-BW / 2 + 20, 0, BW / 2 - 20]) sb(40, BH - 160, BD, caseM, x, 180 + (BH - 200) / 2, 0);
  sb(BW, BH - 180, 20, caseM, 0, 180 + (BH - 180) / 2, -BD / 2 + 10);
  sb(BW - 80, 160, BD - 80, new THREE.MeshStandardMaterial({ color: '#1c1b19', roughness: 0.6 }), 0, 80, -20);
  const rb = rng(12), spine = ['#2f3d4a', '#5b2a22', '#4b5a3a', '#7c6a4a', '#2a2a2a', '#8a3e22', '#3c4c5c', '#b39b6a', '#4a3a2c'];
  for (const [y0, h0] of [[200, 640], [200 + (BH - 200) / 2 + 15, 600]]) {
    for (const side of [-1, 1]) {
      let x = side < 0 ? -BW / 2 + 60 : 40;
      const end = side < 0 ? -40 : BW / 2 - 60;
      while (x < end - 60) {
        const t = 50 + rb() * 70, h = h0 * (0.7 + rb() * 0.3);
        if (rb() < 0.12) { x += 120; continue; }
        const b = sb(t, h, 460 + rb() * 120, new THREE.MeshStandardMaterial({ color: spine[(rb() * spine.length) | 0], roughness: 0.8 }), x + t / 2, y0 + h / 2, 30);
        if (x + t > end - 200 && rb() < 0.5) b.rotation.z = 0.18;
        x += t + 4;
      }
    }
  }
  // a small brass desk clock and a ceramic bowl on top
  sb(260, 300, 140, brass, -700, BH + 150, 0);
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(200, 24, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#b5643a', roughness: 0.4, side: THREE.DoubleSide }));
  bowl.position.set(700, BH + 200, 0); bowl.castShadow = true; shelf.add(bowl);
  shelf.position.set(RIGHT_X - BD / 2 - 20, FLOOR_Y, 3300);
  shelf.rotation.y = -Math.PI / 2;
  shelf.name = 'bookcase';
  add(shelf);
  const frameM = wood('#3b2717', 47);
  const PW = 2200, PH = 1650, py = FLOOR_Y + BH + 1600;
  box(40, PH + 120, PW + 120, frameM, RIGHT_X - 30, py, 3300);
  const print = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshStandardMaterial({ map: props.tex(contourCanvas()), roughness: 0.9 }));
  print.position.set(RIGHT_X - 52, py, 3300); print.rotation.y = -Math.PI / 2;
  add(print);
  // the sconce: a brass back plate and an opal half-globe; its light lifts the door end of the room (no shadows)
  const sx = RIGHT_X - 140, sy = FLOOR_Y + 3500, sz = 5900;
  box(30, 260, 160, brass, RIGHT_X - 15, sy, sz);
  box(120, 24, 24, brass, RIGHT_X - 80, sy, sz);
  const globe = mesh(new THREE.SphereGeometry(130, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), new THREE.MeshStandardMaterial({ color: '#fff3dc', emissive: '#ffcf8f', emissiveIntensity: 1.3, side: THREE.DoubleSide }), sx, sy - 40, sz);
  globe.rotation.x = Math.PI; globe.castShadow = false;
  const sconce = new THREE.PointLight('#ffc98a', 4.5e6, 0, 2);
  sconce.position.set(sx - 120, sy - 160, sz);
  add(sconce);

  /* ── front wall, left of the door: a framed survey plat and a walnut peg rail with a leather satchel ── */
  const plat = new THREE.Mesh(new THREE.PlaneGeometry(1500, 1050), new THREE.MeshStandardMaterial({ map: props.tex(surveyTexture()), roughness: 0.9 }));
  plat.position.set(700, FLOOR_Y + 3300, FRONT_Z - 30); plat.rotation.y = Math.PI;
  add(plat);
  box(1620, 1170, 30, frameM, 700, FLOOR_Y + 3300, FRONT_Z - 12);
  box(1100, 90, 40, caseM, 2150, FLOOR_Y + 3550, FRONT_Z - 20);
  for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(16, 20, 110, 10), brass, 1780 + i * 250, FLOOR_Y + 3530, FRONT_Z - 80).rotation.x = Math.PI / 2;
  const bag = new THREE.Mesh(new RoundedBoxGeometry(560, 420, 140, 4, 40), new THREE.MeshStandardMaterial({ color: '#6b4126', roughness: 0.6 }));
  bag.position.set(2310, FLOOR_Y + 3200, FRONT_Z - 120); bag.rotation.z = -0.05; bag.castShadow = true; add(bag);
  box(30, 320, 20, new THREE.MeshStandardMaterial({ color: '#4a2c18', roughness: 0.6 }), 2310, FLOOR_Y + 3450, FRONT_Z - 70);

  const taskChair = buildTaskChair({ THREE, FLOOR_Y });
  add(taskChair);
  return { shelf, taskChair, sconce, door: { x0: dx0, x1: dx1, z: FRONT_Z, h: DH } };
}

/** A late-70s office task chair: five-star base on twin-wheel casters, chrome column, tilt mechanism, a padded brown-leather seat and a
 *  curved back on a single bent steel spine. No arms, so it tucks under the desk. Built facing +z. */
export function buildTaskChair({ THREE, FLOOR_Y }) {
  const g = new THREE.Group();
  g.name = 'task-chair';
  const leather = new THREE.MeshStandardMaterial({ color: '#5e3a22', roughness: 0.5, metalness: 0.03 });
  const shellM = new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 0.55 });
  const chrome = new THREE.MeshStandardMaterial({ color: '#c8c6c0', metalness: 1, roughness: 0.22 });
  const base = new THREE.MeshStandardMaterial({ color: '#25231f', metalness: 0.7, roughness: 0.4 });
  const black = new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.6 });
  const part = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  const rbox = (w, h, d, r, mat, x, y, z) => part(new RoundedBoxGeometry(w, h, d, 3, r), mat, x, y, z);
  // base: five spokes from a hub, a caster at each tip
  const REACH = 620, spoke = new THREE.BoxGeometry(70, 50, REACH); spoke.translate(0, 0, REACH / 2);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const s = part(spoke, base, 0, 150, 0); s.rotation.order = 'YXZ'; s.rotation.y = a; s.rotation.x = 0.08;
    const cx = Math.sin(a) * REACH * 0.98, cz = Math.cos(a) * REACH * 0.98;
    const w = part(new THREE.CylinderGeometry(52, 52, 70, 16), black, cx, 52, cz); w.rotation.z = Math.PI / 2; w.rotation.y = a + 0.6;
    part(new THREE.CylinderGeometry(16, 16, 60, 8), chrome, cx, 115, cz);
  }
  part(new THREE.CylinderGeometry(70, 90, 90, 20), base, 0, 150, 0);
  part(new THREE.CylinderGeometry(34, 34, 520, 16), chrome, 0, 430, 0);                // gas column
  part(new THREE.CylinderGeometry(52, 52, 160, 16), base, 0, 270, 0);                   // column shroud
  rbox(360, 70, 380, 16, base, 0, 720, -20);                                             // tilt mechanism
  part(new THREE.CylinderGeometry(12, 12, 260, 8), base, 230, 720, 60).rotation.z = Math.PI / 2;   // adjustment lever
  // seat: a moulded shell and a deep leather cushion with a rolled front edge
  rbox(1000, 60, 940, 26, shellM, 0, 790, 0);
  rbox(980, 150, 920, 60, leather, 0, 890, 10).name = 'task-seat';
  rbox(980, 90, 120, 44, leather, 0, 900, 440);
  // the spine: a bent flat bar from under the seat, up the back
  const spineCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 740, -150), new THREE.Vector3(0, 760, -470), new THREE.Vector3(0, 980, -560), new THREE.Vector3(0, 1350, -560)]);
  part(new THREE.TubeGeometry(spineCurve, 24, 34, 8, false), chrome, 0, 0, 0);
  // the back: a curved shell and cushion, wider at the shoulders, tipped back a little
  const back = new THREE.Group();
  back.position.set(0, 1380, -520);
  back.rotation.x = -0.12;
  const bend = (geo, k) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, p.getZ(i) + k * (x / 480) ** 2); } geo.computeVertexNormals(); return geo; };
  const bs = new THREE.Mesh(bend(new RoundedBoxGeometry(940, 760, 50, 4, 22), 90), shellM); bs.castShadow = bs.receiveShadow = true; back.add(bs);
  const bc = new THREE.Mesh(bend(new RoundedBoxGeometry(900, 720, 120, 4, 50), 90), leather); bc.position.z = 70; bc.castShadow = bc.receiveShadow = true; back.add(bc);
  for (const y of [-120, 120]) { const pl = new THREE.Mesh(new THREE.BoxGeometry(860, 8, 10), new THREE.MeshStandardMaterial({ color: '#3d2615', roughness: 0.6 })); pl.position.set(0, y, 132 + 30); back.add(pl); }
  g.add(back);
  g.position.set(TASK_CHAIR.x, FLOOR_Y, TASK_CHAIR.z);
  g.rotation.y = TASK_CHAIR.rot;
  return g;
}

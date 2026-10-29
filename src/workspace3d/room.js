/* 09: the rest of the room, so every heading from the desk view is a finished interior.
 *
 * Adds the right-hand wall, the front wall with the office door (opposite the workstation), the ceiling with a cornice, wainscot and
 * chair rail on the walls that had none, a walnut bookcase with the Daventry One lab drawing on the right wall, a brass wall sconce by the door,
 * and the workstation's task chair. The door is closed and not interactive.
 * Scale: 1 unit ≈ 0.47 mm; 1 cm ≈ 21 units. */
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { LAND } from './worldLand.js';
import { LAB } from '../data/daventryLab.js';

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
/** The nameplate on the Polaroid camera's front. */
function polaroidLabel() {
  const [c, x] = cv(256, 64);
  x.fillStyle = '#2a2b2e'; x.fillRect(0, 0, 256, 64);
  x.fillStyle = '#d6d3cc'; x.font = '600 34px Helvetica, Arial, sans-serif'; x.textAlign = 'center'; x.fillText('Polaroid', 128, 44);
  return c;
}

/** A vintage world map print: parchment, Natural Earth land outlines in brown ink, a fine 30° graticule, a small title. Unmarked. */
function worldMapCanvas() {
  const [c, x] = cv(1024, 640), r = rng(7);
  x.fillStyle = '#e7dcc2'; x.fillRect(0, 0, 1024, 640);
  // paper: a light speckle and a warm, slightly darker edge
  for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(120,90,50,${0.03 + r() * 0.05})`; x.fillRect(r() * 1024, r() * 640, 1 + r() * 2, 1 + r() * 2); }
  const g = x.createRadialGradient(512, 320, 260, 512, 320, 640);
  g.addColorStop(0, 'rgba(150,110,60,0)'); g.addColorStop(1, 'rgba(150,110,60,0.22)');
  x.fillStyle = g; x.fillRect(0, 0, 1024, 640);
  // the map: equirectangular, 80° N to 60° S
  const X0 = 56, X1 = 968, Y0 = 128, LAT0 = 80, LAT1 = -60, k = (X1 - X0) / 360, Y1 = Y0 + (LAT0 - LAT1) * k;
  const px = (lon) => X0 + (lon + 180) * k, py = (lat) => Y0 + (LAT0 - lat) * k;
  x.save(); x.beginPath(); x.rect(X0, Y0, X1 - X0, Y1 - Y0); x.clip();
  x.fillStyle = '#ece4cf'; x.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
  x.strokeStyle = 'rgba(95,70,45,0.22)'; x.lineWidth = 0.8;
  for (let lon = -150; lon < 180; lon += 30) { x.beginPath(); x.moveTo(px(lon), Y0); x.lineTo(px(lon), Y1); x.stroke(); }
  for (let lat = 60; lat > LAT1; lat -= 30) { x.beginPath(); x.moveTo(X0, py(lat)); x.lineTo(X1, py(lat)); x.stroke(); }
  x.setLineDash([4, 4]);
  for (const lat of [23.44, -23.44, 66.56]) { x.beginPath(); x.moveTo(X0, py(lat)); x.lineTo(X1, py(lat)); x.stroke(); }
  x.setLineDash([]);
  x.strokeStyle = 'rgba(95,70,45,0.45)'; x.beginPath(); x.moveTo(X0, py(0)); x.lineTo(X1, py(0)); x.stroke();
  x.fillStyle = '#d6c6a2'; x.strokeStyle = 'rgba(78,52,32,0.85)'; x.lineWidth = 1.1; x.lineJoin = 'round';
  for (const ring of LAND) {
    x.beginPath();
    for (let i = 0; i < ring.length; i += 2) { const X = px(ring[i] / 2), Y = py(ring[i + 1] / 2); i ? x.lineTo(X, Y) : x.moveTo(X, Y); }
    x.closePath(); x.fill(); x.stroke();
  }
  x.restore();
  x.strokeStyle = 'rgba(60,40,25,0.8)'; x.lineWidth = 1.4; x.strokeRect(X0, Y0, X1 - X0, Y1 - Y0);
  x.lineWidth = 0.8; x.strokeRect(24, 24, 976, 592);
  // graticule figures along the edges
  x.fillStyle = 'rgba(60,40,25,0.75)'; x.font = '500 11px "JetBrains Mono", monospace'; x.textAlign = 'center';
  for (let lon = -150; lon < 180; lon += 30) x.fillText(`${Math.abs(lon)}°${lon < 0 ? 'W' : lon > 0 ? 'E' : ''}`, px(lon), Y1 + 18);
  x.textAlign = 'right';
  for (let lat = 60; lat > LAT1; lat -= 30) x.fillText(`${Math.abs(lat)}°${lat > 0 ? 'N' : lat < 0 ? 'S' : ''}`, X0 - 6, py(lat) + 4);
  x.textAlign = 'center'; x.fillStyle = 'rgba(55,36,22,0.9)';
  x.font = '400 34px Georgia, "Times New Roman", serif'; x.fillText('T H E   W O R L D', 512, 82);
  x.font = '500 11px "JetBrains Mono", monospace'; x.fillStyle = 'rgba(60,40,25,0.7)';
  x.fillText('EQUIRECTANGULAR PROJECTION · GRATICULE 30°', 512, 106);
  x.fillText('LAND OUTLINES: NATURAL EARTH 1:110M', 512, Y1 + 48);
  return c;
}

/** The Daventry One local model lab: a systems drawing on warm charcoal paper. `sel` outlines one node. Returns the canvas and each
 *  node's rectangle in uv space (for picking). A reference drawing only: nothing on it is live status. */
export function labCanvas(sel = null, canvas = null) {
  const [c, x] = canvas ? [canvas, canvas.getContext('2d')] : cv(1024, 768);
  const W = 1024, H = 768, mono = (w, s) => `${w} ${s}px "JetBrains Mono", monospace`;
  x.clearRect(0, 0, W, H);
  x.fillStyle = '#2a2622'; x.fillRect(0, 0, W, H);
  for (let i = 0; i <= W; i += 32) { x.fillStyle = i % 128 ? 'rgba(230,220,200,0.045)' : 'rgba(230,220,200,0.09)'; x.fillRect(i, 0, 1, H); }
  for (let j = 0; j <= H; j += 32) { x.fillStyle = j % 128 ? 'rgba(230,220,200,0.045)' : 'rgba(230,220,200,0.09)'; x.fillRect(0, j, W, 1); }
  x.strokeStyle = 'rgba(232,222,200,0.7)'; x.lineWidth = 1.5; x.strokeRect(20, 20, W - 40, H - 40);
  x.lineWidth = 0.8; x.strokeRect(28, 28, W - 56, H - 56);
  x.textAlign = 'left';
  x.fillStyle = '#ece3cf'; x.font = mono(700, 40); x.fillText(`${LAB.title}:`, 56, 88);
  x.fillStyle = '#d9a75a'; x.font = mono(600, 18); x.fillText(LAB.subtitle, 58, 118);
  x.fillStyle = '#9fb39a'; x.font = mono(400, 14); x.fillText(LAB.caption, 58, 144);
  const hub = { x: 512, y: 440, w: 236, h: 96 };
  const pos = LAB.nodes.map((n, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / LAB.nodes.length; return { n, x: 512 + Math.cos(a) * 330, y: 440 + Math.sin(a) * 222 }; });
  const NW = 214, NH = 82;
  // links: hub edge to node edge, thin, with a small terminal at each end
  x.strokeStyle = 'rgba(232,222,200,0.55)'; x.lineWidth = 1.2;
  for (const p of pos) {
    const dx = p.x - hub.x, dy = p.y - hub.y;
    const t0 = Math.min(hub.w / 2 / Math.abs(dx || 1e-6), hub.h / 2 / Math.abs(dy || 1e-6));
    const t1 = 1 - Math.min(NW / 2 / Math.abs(dx || 1e-6), NH / 2 / Math.abs(dy || 1e-6));
    const ax = hub.x + dx * t0, ay = hub.y + dy * t0, bx = hub.x + dx * t1, by = hub.y + dy * t1;
    x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke();
    for (const [qx, qy] of [[ax, ay], [bx, by]]) { x.beginPath(); x.arc(qx, qy, 3, 0, Math.PI * 2); x.fillStyle = '#2a2622'; x.fill(); x.stroke(); }
  }
  const box = (cx, cy, w, h, fill, stroke, lw) => { x.fillStyle = fill; x.fillRect(cx - w / 2, cy - h / 2, w, h); x.strokeStyle = stroke; x.lineWidth = lw; x.strokeRect(cx - w / 2, cy - h / 2, w, h); };
  box(hub.x, hub.y, hub.w, hub.h, '#3a342d', '#d9a75a', 2);
  x.textAlign = 'center';
  x.fillStyle = '#ece3cf'; x.font = mono(700, 22); x.fillText('DAVENTRY ONE', hub.x, hub.y - 4);
  x.fillStyle = '#c9b48f'; x.font = mono(400, 13); x.fillText('MAC STUDIO · LOCAL', hub.x, hub.y + 22);
  const rects = [];
  for (const p of pos) {
    const on = p.n.id === sel;
    box(p.x, p.y, NW, NH, on ? '#463d33' : '#332e28', on ? '#e3b066' : 'rgba(232,222,200,0.7)', on ? 3 : 1.2);
    x.fillStyle = on ? '#f0d9a8' : '#ece3cf'; x.font = mono(700, 20); x.fillText(p.n.name, p.x, p.y - 12);
    x.fillStyle = '#9db3c9'; x.font = mono(400, 13); x.fillText(p.n.model, p.x, p.y + 10);
    x.fillStyle = '#9fb39a'; x.font = mono(400, 12); x.fillText(p.n.role.toUpperCase(), p.x, p.y + 30);
    rects.push({ id: p.n.id, u0: (p.x - NW / 2) / W, u1: (p.x + NW / 2) / W, v0: 1 - (p.y + NH / 2) / H, v1: 1 - (p.y - NH / 2) / H });
  }
  x.textAlign = 'left'; x.fillStyle = 'rgba(232,222,200,0.55)'; x.font = mono(400, 12);
  x.fillText('REFERENCE DRAWING · NOT A LIVE STATUS DISPLAY', 56, H - 48);
  x.textAlign = 'right'; x.fillText('SHEET 1 OF 1 · C. RIVERO', W - 56, H - 48);
  return { canvas: c, rects };
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

  /* ── right wall: Christopher's own dark-wood cubby bookcase (from his photograph): three rows of cubbies on splayed black legs, his
   *  books, pencil jars, an instant camera, a mushroom figure, a Polaroid camera and a small retro radio; a pot plant and a candle on top.
   *  Books are one instanced mesh (one draw call), so the shelf stays cheap. 11: it replaces the earlier generic walnut bookcase. ── */
  const shelf = new THREE.Group();
  const caseM = wood('#4a3020', 46);
  const BW = 2100, BH = 2300, BD = 620, LEG = 250, T = 36;
  const sb = (w, h, d, mat, x, y, z, parent = shelf) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
  const legM = new THREE.MeshStandardMaterial({ color: '#141210', roughness: 0.5 });
  for (const x of [-BW / 2 + 90, BW / 2 - 90]) for (const z of [-BD / 2 + 80, BD / 2 - 80]) { const l = sb(50, LEG, 50, legM, x, LEG / 2, z); l.rotation.z = x < 0 ? -0.08 : 0.08; }
  sb(BW, T, BD, caseM, 0, LEG + T / 2, 0);
  sb(BW, T, BD, caseM, 0, BH - T / 2, 0);
  for (const x of [-BW / 2 + T / 2, BW / 2 - T / 2]) sb(T, BH - LEG, BD, caseM, x, LEG + (BH - LEG) / 2, 0);
  sb(BW, BH - LEG, 16, caseM, 0, LEG + (BH - LEG) / 2, -BD / 2 + 8);
  const rowH = (BH - LEG - T) / 3, rowY = (i) => LEG + T + i * rowH;            // row 0 at the bottom
  for (const i of [1, 2]) sb(BW - 2 * T, T, BD - 20, caseM, 0, rowY(i) - T / 2, 10);
  for (const x of [0]) for (const i of [0, 2]) sb(T, rowH - T, BD - 20, caseM, x, rowY(i) + (rowH - T) / 2, 10);        // two cubbies, bottom and top rows
  for (const x of [-BW / 6, BW / 6]) sb(T, rowH - T, BD - 20, caseM, x, rowY(1) + (rowH - T) / 2, 10);                   // three in the middle
  // books: one instanced mesh, spines in the colours of his shelves
  const rb = rng(12), spine = ['#e9e1cf', '#e6c440', '#2f6f78', '#b8362c', '#1d1d1f', '#d9a35a', '#3f5a7a', '#6e8f5e', '#c7c0b0', '#7a2a2a', '#2e8f8a', '#f0efe8'];
  const books = [];
  const fill = (x0, x1, y0, hMax, gaps = []) => {
    let x = x0;
    while (x < x1 - 40) {
      if (gaps.some(([g0, g1]) => x + 60 > g0 && x < g1)) { x = gaps.find(([g0, g1]) => x + 60 > g0 && x < g1)[1] + 10; continue; }
      const t = 34 + rb() * 50, h = hMax * (0.62 + rb() * 0.36);
      if (x + t > x1) break;
      books.push({ x: x + t / 2, y: y0 + h / 2, z: 40 + rb() * 40, t, h, d: 300 + rb() * 120, c: spine[(rb() * spine.length) | 0], tilt: 0 });
      x += t + 3;
    }
  };
  const inner = (i) => rowH - T - 30;
  fill(-BW / 2 + T + 10, -T / 2 - 10, rowY(0), inner(0)); fill(T / 2 + 10, BW / 2 - T - 10, rowY(0), inner(0));
  fill(-BW / 2 + T + 10, -BW / 6 - T / 2 - 10, rowY(1), inner(1));
  fill(-BW / 6 + T / 2 + 10, BW / 6 - T / 2 - 10, rowY(1), inner(1), [[BW / 6 - 330, BW / 6 - 20]]);   // room for the radio
  fill(BW / 6 + T / 2 + 10, BW / 2 - T - 10, rowY(1), inner(1));
  const bookIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.8 }), books.length);
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _c = new THREE.Color();
  books.forEach((k, i) => { bookIM.setMatrixAt(i, _m.compose(new THREE.Vector3(k.x, k.y, k.z), _q.setFromEuler(_e.set(0, 0, k.tilt)), new THREE.Vector3(k.t, k.h, k.d))); bookIM.setColorAt(i, _c.set(k.c)); });
  bookIM.castShadow = bookIM.receiveShadow = true; shelf.add(bookIM);
  // the small retro radio in the middle cubby: teal case, wooden speaker face, a brass dial
  const radio = new THREE.Group();
  sb(280, 200, 150, new THREE.MeshStandardMaterial({ color: '#2f5f63', roughness: 0.45 }), 0, 100, 0, radio);
  sb(150, 140, 6, wood('#8a5a33', 48), -50, 100, 76, radio);
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(34, 34, 14, 20), brass); dial.rotation.x = Math.PI / 2; dial.position.set(80, 100, 80); radio.add(dial);
  radio.position.set(BW / 6 - 175, rowY(1), 40); radio.rotation.y = -0.15; shelf.add(radio);
  // top-left cubby: two glass jars of pencils and pens, a jar of wooden craft sticks
  const jarGlass = new THREE.MeshStandardMaterial({ color: '#cfe0dc', transparent: true, opacity: 0.35, roughness: 0.1 });
  const sticks = [];
  for (const [jx, n] of [[-BW / 2 + 190, 9], [-BW / 2 + 360, 8], [-BW / 2 + 560, 0]]) {
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(80, 80, 240, 16, 1, true), jarGlass); jar.position.set(jx, rowY(2) + 120, 40); shelf.add(jar);
    for (let i = 0; i < (n || 14); i++) sticks.push({ x: jx + (rb() - 0.5) * 90, z: 40 + (rb() - 0.5) * 90, h: n ? 300 + rb() * 120 : 280, c: n ? ['#e6c440', '#2f6fd0', '#d9d9d9', '#c03a2b', '#f08a2b', '#1d1d1f'][(rb() * 6) | 0] : '#d8b98a', r: n ? 9 : 14, lean: (rb() - 0.5) * 0.35 });
  }
  const stickIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 6), new THREE.MeshStandardMaterial({ roughness: 0.6 }), sticks.length);
  sticks.forEach((k, i) => { stickIM.setMatrixAt(i, _m.compose(new THREE.Vector3(k.x, rowY(2) + k.h / 2, k.z), _q.setFromEuler(_e.set(k.lean * 0.5, 0, k.lean)), new THREE.Vector3(k.r, k.h, k.r))); stickIM.setColorAt(i, _c.set(k.c)); });
  shelf.add(stickIM);
  // top-right cubby: the instant camera (the room's camera Easter egg), a mushroom figure and a Polaroid camera
  const cam = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(260, 200, 140, 4, 26), new THREE.MeshStandardMaterial({ color: '#8c4b3e', roughness: 0.55 }));
  body.position.y = 100; cam.add(body);
  const capM = new THREE.MeshStandardMaterial({ color: '#c9c6c0', metalness: 0.7, roughness: 0.3 });
  sb(262, 44, 142, capM, 0, 178, 0, cam);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(70, 76, 70, 32), capM); barrel.rotation.x = Math.PI / 2; barrel.position.set(-10, 90, 100); cam.add(barrel);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(46, 46, 12, 32), new THREE.MeshStandardMaterial({ color: '#0d0f12', metalness: 0.4, roughness: 0.12 })); lens.rotation.x = Math.PI / 2; lens.position.set(-10, 90, 138); cam.add(lens);
  sb(56, 34, 8, new THREE.MeshStandardMaterial({ color: '#f2efe6', emissive: '#3a3a36', roughness: 0.3 }), 88, 168, 72, cam);       // flash window
  sb(30, 26, 8, new THREE.MeshStandardMaterial({ color: '#1a1c20', roughness: 0.2 }), -92, 170, 72, cam);                            // viewfinder
  cam.position.set(260, rowY(2), 60); cam.rotation.y = -0.18; cam.name = 'instant-camera'; shelf.add(cam);
  // a hit box a little larger than the camera, so it is easy to tap on a phone
  const camHit = new THREE.Mesh(new THREE.BoxGeometry(340, 280, 220), new THREE.MeshBasicMaterial({ visible: false })); camHit.position.y = 110; camHit.userData.proxy = true; cam.add(camHit);
  const mush = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: '#efece4', roughness: 0.6 });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(42, 52, 130, 16), white); stem.position.y = 65; mush.add(stem);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(110, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#5a3b2a', roughness: 0.5 })); cap.position.y = 120; mush.add(cap);
  for (const [a, e] of [[0.3, 0.7], [1.9, 0.75], [3.6, 0.6], [5.0, 0.8], [0, 0.05]]) { const d = new THREE.Mesh(new THREE.SphereGeometry(30, 10, 6), white); d.position.set(Math.cos(a) * Math.sin(e) * 104, 120 + Math.cos(e) * 104, Math.sin(a) * Math.sin(e) * 104); d.lookAt(0, 120, 0); d.scale.set(1, 1, 0.3); mush.add(d); }
  mush.position.set(560, rowY(2), 70); shelf.add(mush);
  const pola = new THREE.Group();
  sb(260, 190, 200, new THREE.MeshStandardMaterial({ color: '#2a2b2e', roughness: 0.5 }), 0, 95, 0, pola);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(200, 50), new THREE.MeshStandardMaterial({ map: props.tex(polaroidLabel()), roughness: 0.4 }));
  plate.position.set(0, 140, 101); pola.add(plate);
  pola.position.set(850, rowY(2), 60); pola.rotation.y = -0.1; shelf.add(pola);
  // on top: a blush terracotta pot with a small trailing plant, a mint candle, and a stack of papers
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(150, 120, 200, 24), new THREE.MeshStandardMaterial({ color: '#d9a08a', roughness: 0.7 }));
  pot.position.set(200, BH + 100, 0); pot.castShadow = true; shelf.add(pot);
  const potLeafM = new THREE.MeshStandardMaterial({ color: '#4f7a3e', roughness: 0.6, side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) { const lf = new THREE.Mesh(new THREE.CircleGeometry(48, 10), potLeafM); const a = i * 0.9; lf.position.set(200 + Math.cos(a) * 60, BH + 220 + rb() * 70, Math.sin(a) * 60); lf.rotation.set(-0.9 + rb() * 0.4, a, 0); shelf.add(lf); }
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(120, 120, 200, 24), new THREE.MeshStandardMaterial({ color: '#8fcdb8', roughness: 0.6 }));
  candle.position.set(-800, BH + 100, 0); shelf.add(candle);
  sb(520, 60, 380, new THREE.MeshStandardMaterial({ color: '#efe9de', roughness: 0.9 }), 700, BH + 30, 10);
  shelf.position.set(RIGHT_X - BD / 2 - 20, FLOOR_Y, 3300);
  shelf.rotation.y = -Math.PI / 2;
  shelf.name = 'bookcase';
  add(shelf);

  /* ── the front wall's right-hand corner, beside the door: his tall tree bookshelf (from his photograph): a dark-wood spine with
   *  boards branching left and right in a zigzag, books leaning in each V. Books are one instanced mesh. ── */
  const tree = new THREE.Group();
  const treeM = wood('#4b3221', 49);
  const TH = 3000, TD = 480;
  sb(1000, 36, TD, treeM, 0, 18, 0, tree);                                   // base plate
  sb(70, TH, TD, treeM, 0, TH / 2, 0, tree);                                 // the spine
  const tb = [];
  for (let i = 0; i < 9; i++) {
    const side = i % 2 ? 1 : -1, y = 420 + i * 300, L = 640;
    const br = sb(L, 32, TD, treeM, side * L * 0.34, y, 0, tree); br.rotation.z = side * 0.72;
    // books stand on the branch, leaning against the spine side of the V
    const n = 3 + ((rb() * 4) | 0);
    for (let k = 0; k < n; k++) {
      const h = 300 + rb() * 140, t = 40 + rb() * 40, along = 90 + k * 52;
      tb.push({ x: side * (along * Math.cos(0.72) + 10), y: y + along * Math.sin(0.72) + h / 2 * Math.cos(0.72) - 20, rz: side * (0.72 - Math.PI / 2), h, t, c: spine[(rb() * spine.length) | 0] });
    }
  }
  const treeIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.8 }), tb.length);
  tb.forEach((k, i) => { treeIM.setMatrixAt(i, _m.compose(new THREE.Vector3(k.x, k.y, 20), _q.setFromEuler(_e.set(0, 0, k.rz)), new THREE.Vector3(k.h, k.t, 300 + rb() * 100))); treeIM.setColorAt(i, _c.set(k.c)); });
  treeIM.castShadow = true; tree.add(treeIM);
  tree.position.set(5640, FLOOR_Y, FRONT_Z - TD / 2 - 20); tree.rotation.y = Math.PI; tree.name = 'tree-bookshelf';
  add(tree);
  const frameM = wood('#3b2717', 47);
  const PW = 2200, PH = 1650, py = FLOOR_Y + 3650;
  box(40, PH + 120, PW + 120, frameM, RIGHT_X - 30, py, 3300);
  // 11: the Daventry One lab drawing, in the frame above the bookcase (the room's Easter egg: it opens the 'lab' view)
  const lab = labCanvas();
  const labTex = props.tex(lab.canvas);
  const print = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshStandardMaterial({ map: labTex, roughness: 0.9 }));
  print.position.set(RIGHT_X - 52, py, 3300); print.rotation.y = -Math.PI / 2;
  print.name = 'lab-sheet';
  print.userData.lab = { rects: lab.rects };
  add(print);
  const labSelect = (id) => { print.userData.lab.rects = labCanvas(id, lab.canvas).rects; labTex.needsUpdate = true; };
  // the sconce: a brass back plate and an opal half-globe; its light lifts the door end of the room (no shadows)
  const sx = RIGHT_X - 140, sy = FLOOR_Y + 3500, sz = 5900;
  box(30, 260, 160, brass, RIGHT_X - 15, sy, sz);
  box(120, 24, 24, brass, RIGHT_X - 80, sy, sz);
  const globe = mesh(new THREE.SphereGeometry(130, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), new THREE.MeshStandardMaterial({ color: '#fff3dc', emissive: '#ffcf8f', emissiveIntensity: 1.3, side: THREE.DoubleSide }), sx, sy - 40, sz);
  globe.rotation.x = Math.PI; globe.castShadow = false;
  const sconce = new THREE.PointLight('#ffc98a', 4.5e6, 0, 2);
  sconce.position.set(sx - 120, sy - 160, sz);
  add(sconce);

  /* ── front wall, left of the door: a framed world map (11: it replaces a survey plat that repeated the desk's drawings) and a walnut peg rail with a leather satchel ── */
  const plat = new THREE.Mesh(new THREE.PlaneGeometry(1640, 1025), new THREE.MeshStandardMaterial({ map: props.tex(worldMapCanvas()), roughness: 0.9 }));
  plat.position.set(640, FLOOR_Y + 3300, FRONT_Z - 30); plat.rotation.y = Math.PI;
  plat.name = 'world-map';
  add(plat);
  box(1760, 1145, 30, frameM, 640, FLOOR_Y + 3300, FRONT_Z - 12);
  box(1100, 90, 40, caseM, 2150, FLOOR_Y + 3550, FRONT_Z - 20);
  for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(16, 20, 110, 10), brass, 1780 + i * 250, FLOOR_Y + 3530, FRONT_Z - 80).rotation.x = Math.PI / 2;
  const bag = new THREE.Mesh(new RoundedBoxGeometry(560, 420, 140, 4, 40), new THREE.MeshStandardMaterial({ color: '#6b4126', roughness: 0.6 }));
  bag.position.set(2310, FLOOR_Y + 3200, FRONT_Z - 120); bag.rotation.z = -0.05; bag.castShadow = true; add(bag);
  box(30, 320, 20, new THREE.MeshStandardMaterial({ color: '#4a2c18', roughness: 0.6 }), 2310, FLOOR_Y + 3450, FRONT_Z - 70);

  const taskChair = buildTaskChair({ THREE, FLOOR_Y });
  add(taskChair);
  return { shelf, taskChair, sconce, lab: { sheet: print, select: labSelect }, camera: cam, tree, worldMap: plat, door: { x0: dx0, x1: dx1, z: FRONT_Z, h: DH } };
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

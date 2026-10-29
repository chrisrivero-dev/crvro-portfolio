/* 11: what the window looks out on. A quiet Southern California street just after sunset: a blue-hour sky with a peach band at the
 * horizon, a neighbour's stucco house across the side yard with one lit upstairs window, a streetlight further down, and the edge of
 * a pepper tree. Three static planes at increasing distance behind the window wall (so they shift with the camera like real depth),
 * unlit, no fog, no shadows, no animation. Only built in the dusk grade, which replaces its flat glass colour.
 * Scale: 1 unit ≈ 0.47 mm (1 m ≈ 2100 units). */
function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const glow = (x, cx, cy, r, rgb, a) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2); };

/** The sky, with the far side of the street low along the horizon (hedges and low roofs, soft-edged) and one streetlight. */
function skyCanvas() {
  const [c, x] = cv(512, 1024), r = rng(3);
  const g = x.createLinearGradient(0, 0, 0, 1024);
  g.addColorStop(0, '#1a2233'); g.addColorStop(0.5, '#2f3d55'); g.addColorStop(0.72, '#566078'); g.addColorStop(0.8, '#94878c'); g.addColorStop(0.85, '#bd9a86'); g.addColorStop(1, '#5e5458');
  x.fillStyle = g; x.fillRect(0, 0, 512, 1024);
  // the far side of the street: rounded hedge and shrub tops over a dark band
  x.fillStyle = '#20252f';
  x.fillRect(0, 900, 512, 124);
  for (let X = -10; X < 520; X += 6 + r() * 10) { x.beginPath(); x.ellipse(X, 902, 8 + r() * 14, 5 + r() * 12, 0, Math.PI, 0); x.fill(); }
  // one streetlight further down the street: a slim pole and a small warm head
  x.fillStyle = '#1a1e26'; x.fillRect(234, 800, 2, 100); x.fillRect(232, 799, 6, 2);
  glow(x, 235, 801, 16, '255,196,128', 0.4); glow(x, 235, 801, 4, '255,224,176', 0.95);
  return c;
}

/** The neighbour's house across the side yard: pale stucco gone blue in the dusk, a low hip roof, one warm upstairs window. */
function houseCanvas() {
  const [c, x] = cv(1024, 1024);
  const roofY = 360, wallTop = 470;
  x.fillStyle = '#272c36';                         // the hip roof's end, low pitch
  x.beginPath(); x.moveTo(60, wallTop); x.lineTo(250, roofY); x.lineTo(780, roofY); x.lineTo(980, wallTop); x.closePath(); x.fill();
  x.fillStyle = '#1f242d'; x.fillRect(48, wallTop, 944, 12);                 // fascia and gutter
  const w = x.createLinearGradient(0, wallTop, 0, 1024);
  w.addColorStop(0, '#454c5b'); w.addColorStop(1, '#353b48');
  x.fillStyle = w; x.fillRect(80, wallTop + 12, 880, 1024 - wallTop - 12);
  // the lit window: warm glass, a simple frame, a soft spill on the stucco
  glow(x, 265, 560, 150, '255,190,120', 0.22);
  x.fillStyle = '#1d2129'; x.fillRect(196, 504, 138, 118);
  const lg = x.createLinearGradient(0, 510, 0, 616); lg.addColorStop(0, '#ffd59a'); lg.addColorStop(1, '#f2a862');
  x.fillStyle = lg; x.fillRect(203, 511, 124, 104);
  x.fillStyle = '#2a2a2c'; x.fillRect(263, 511, 4, 104); x.fillRect(203, 560, 124, 3);
  // a dark second window (nobody home in that room) and a vent
  x.fillStyle = '#262c37'; x.fillRect(520, 512, 130, 112); x.fillStyle = '#323947'; x.fillRect(527, 519, 116, 98);
  x.fillStyle = '#2b313c'; x.fillRect(420, 492, 36, 16);
  return c;
}

/** The edge of a pepper tree in the side yard: soft, drooping, mostly at the right of the view. */
function treeCanvas() {
  const [c, x] = cv(512, 1024), r = rng(11);
  x.strokeStyle = '#151a17'; x.lineWidth = 9;
  x.beginPath(); x.moveTo(470, 1024); x.quadraticCurveTo(430, 600, 340, 260); x.stroke();
  x.lineWidth = 4; x.beginPath(); x.moveTo(420, 560); x.quadraticCurveTo(300, 470, 200, 440); x.stroke();
  for (let i = 0; i < 420; i++) {
    const a = r(), cx = 160 + r() * 340, cy = 120 + Math.pow(r(), 0.8) * 560;
    if (cx < 200 + (cy - 120) * 0.15 && r() < 0.6) continue;
    x.fillStyle = `rgba(${20 + a * 10},${28 + a * 12},${24 + a * 8},${0.55 + a * 0.4})`;
    x.beginPath(); x.ellipse(cx, cy + r() * 30, 2 + r() * 3, 5 + r() * 6, 0.2 + r() * 0.3, 0, Math.PI * 2); x.fill();
  }
  return c;
}

export function buildExterior({ THREE, scene, tex, LEFT_X, win }) {
  const zc = (win.z0 + win.z1) / 2, yc = (win.y0 + win.y1) / 2;
  const plane = (canvas, w, h, dx, y, z, transparent) => {
    const map = tex(canvas, { aniso: 4 });
    map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;   // no bleed from the opposite edge
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map, fog: false, transparent, depthWrite: !transparent }));
    m.position.set(LEFT_X - dx, y, z); m.rotation.y = Math.PI / 2;
    m.castShadow = m.receiveShadow = false;
    scene.add(m);
    return m;
  };
  // distances behind the glass: tree ≈ 2.4 m, the neighbour's wall ≈ 4 m, the sky and the far side of the street ≈ 4.7 m (inside the far plane)
  const sky = plane(skyCanvas(), 26000, 40000, 9800, 14000, zc, false);
  const house = plane(houseCanvas(), 7000, 7000, 8400, -340, -2590, true);
  const tree = plane(treeCanvas(), 2600, 5200, 4200, yc + 700, zc + 2000, true);
  house.renderOrder = 1; tree.renderOrder = 2;
  sky.name = 'exterior-sky'; house.name = 'exterior-house'; tree.name = 'exterior-tree';
  return { sky, house, tree };
}

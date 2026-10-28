/* 07/08: the reading corner by the window: a mid-century lounge chair and ottoman, a walnut record console with the record player,
 * an arc floor lamp, a monstera and a low wool rug.
 *
 * The chair follows the classic moulded-plywood lounge type (three bent rosewood shells, loose leather cushions, padded arms, a
 * five-star swivel base, a matching ottoman). It is a generic model built from primitives, not a reproduction of a branded product,
 * and nothing in the page names one. The record player is a plain walnut plinth with a brushed plate, a platter, a straight tonearm
 * and one toggle. Record sleeves are plain colour, no artwork.
 *
 * Built once from boxes, bent slabs, a tube and five small canvas textures; added to the scene so engine.dispose() releases it.
 * The record player is silent. It spins only while playing (a rAF loop that exists only then); reduced motion shows it playing, still.
 * Scale: 1 unit ≈ 0.47 mm (see props.js); 1 cm ≈ 21 units. */
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }

/** Figured rosewood/walnut veneer (512²): long flowing grain with darker flame figure, the look of bent plywood shells. */
function veneerCanvas(seed = 7, base = '#6b3a1f') {
  const [c, x] = cv(512, 512), r = rng(seed);
  x.fillStyle = base; x.fillRect(0, 0, 512, 512);
  // broad tonal bands
  for (let i = 0; i < 14; i++) {
    const y = r() * 512, h = 20 + r() * 70;
    x.fillStyle = r() > 0.5 ? `rgba(40,16,6,${0.12 + r() * 0.16})` : `rgba(214,140,80,${0.06 + r() * 0.1})`;
    x.beginPath(); x.moveTo(0, y);
    for (let s = 0; s <= 512; s += 16) x.lineTo(s, y + Math.sin(s / 70 + i) * 14);
    for (let s = 512; s >= 0; s -= 16) x.lineTo(s, y + h + Math.sin(s / 60 + i * 1.7) * 18);
    x.fill();
  }
  // fine grain lines, with flame figure: lines that bulge into long arches
  for (let i = 0; i < 340; i++) {
    const y = r() * 560 - 24, a = 0.05 + r() * 0.16, amp = r() > 0.8 ? 18 + r() * 30 : 2 + r() * 6, f = 50 + r() * 90, ph = r() * 9;
    x.strokeStyle = r() > 0.35 ? `rgba(22,8,2,${a})` : `rgba(240,170,100,${a * 0.55})`;
    x.lineWidth = 0.5 + r() * 1.8;
    x.beginPath(); x.moveTo(0, y);
    for (let s = 0; s <= 512; s += 8) x.lineTo(s, y + Math.sin(s / f + ph) * amp + Math.sin(s / 13 + i) * 0.8);
    x.stroke();
  }
  return c;
}
/** Dark leather (256²): soft mottling, three stitched pleats with buttons across the cushion (the type's typical tufting). */
function leatherCanvas() {
  const [c, x] = cv(256, 256), r = rng(11);
  x.fillStyle = '#1e140e'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) { x.fillStyle = r() > 0.5 ? `rgba(0,0,0,${r() * 0.12})` : `rgba(150,100,70,${r() * 0.05})`; x.fillRect(r() * 256, r() * 256, 1 + r() * 4, 1 + r() * 4); }
  for (const v of [0.3, 0.5, 0.7]) {
    const y = v * 256;
    const g = x.createLinearGradient(0, y - 7, 0, y + 7);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, y - 7, 256, 14);
    x.fillStyle = 'rgba(120,80,55,0.25)'; x.fillRect(0, y - 9, 256, 1);
    for (const u of [0.32, 0.68]) { x.fillStyle = '#120a06'; x.beginPath(); x.arc(u * 256, y, 3.4, 0, Math.PI * 2); x.fill(); }
  }
  return c;
}
/** Vinyl: fine grooves, a lead-out band and a plain amber label (no text, no artwork). */
function vinylCanvas() {
  const [c, x] = cv(512, 512);
  x.fillStyle = '#0b0b0c'; x.fillRect(0, 0, 512, 512);
  for (let rr = 250; rr > 92; rr -= 1.6) {
    x.strokeStyle = `rgba(255,255,255,${0.025 + (Math.sin(rr * 0.9) + 1) * 0.012 + (rr > 160 && rr < 166 ? 0.05 : 0)})`;
    x.beginPath(); x.arc(256, 256, rr, 0, Math.PI * 2); x.stroke();
  }
  // a soft highlight wedge, so the turning reads
  const g = x.createLinearGradient(80, 80, 432, 432);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.48, 'rgba(255,255,255,0.09)'); g.addColorStop(0.52, 'rgba(255,255,255,0.09)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.beginPath(); x.arc(256, 256, 250, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#c0832f'; x.beginPath(); x.arc(256, 256, 88, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#8f5f1f'; x.fillRect(196, 236, 120, 4); x.fillRect(214, 276, 84, 3);       // two printed rules on the label, no words
  x.fillStyle = '#e9dcc0'; x.beginPath(); x.arc(256, 256, 7, 0, Math.PI * 2); x.fill();
  return c;
}
/** A split-leaf (monstera) leaf on a transparent ground (256²): heart-shaped blade, midrib, veins, the slits and a few holes. */
function leafCanvas() {
  const [c, x] = cv(256, 256), r = rng(23);
  // blade: base at the bottom centre, tip at the top
  const blade = () => { x.beginPath(); x.moveTo(128, 246); x.bezierCurveTo(10, 250, -6, 90, 70, 34); x.bezierCurveTo(104, 10, 152, 10, 186, 34); x.bezierCurveTo(262, 90, 246, 250, 128, 246); x.closePath(); };
  const g = x.createLinearGradient(0, 0, 256, 256);
  g.addColorStop(0, '#2f6b33'); g.addColorStop(0.6, '#1f4f26'); g.addColorStop(1, '#173d1d');
  blade(); x.fillStyle = g; x.fill();
  x.strokeStyle = 'rgba(170,210,140,0.45)'; x.lineWidth = 3; x.beginPath(); x.moveTo(128, 246); x.quadraticCurveTo(124, 120, 128, 22); x.stroke();
  x.lineWidth = 1.3;
  for (let i = 0; i < 7; i++) for (const sd of [-1, 1]) {
    const y0 = 220 - i * 28;
    x.strokeStyle = 'rgba(150,200,120,0.28)';
    x.beginPath(); x.moveTo(127, y0); x.quadraticCurveTo(128 + sd * 60, y0 - 26, 128 + sd * 120, y0 - 44 - i * 2); x.stroke();
  }
  // slits from the margin toward the midrib, between the veins; then a row of holes
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 6; i++) for (const sd of [-1, 1]) {
    const y0 = 206 - i * 28 + (r() - 0.5) * 6;
    x.lineWidth = 6 + r() * 4; x.lineCap = 'round';
    x.beginPath(); x.moveTo(128 + sd * (36 + r() * 12), y0 - 6); x.quadraticCurveTo(128 + sd * 80, y0 - 22, 128 + sd * 140, y0 - 30 - i * 2); x.stroke();
  }
  for (let i = 0; i < 5; i++) for (const sd of [-1, 1]) { x.beginPath(); x.ellipse(128 + sd * 24, 190 - i * 32, 4, 7, sd * 0.5, 0, Math.PI * 2); x.fill(); }
  x.globalCompositeOperation = 'source-over';
  return c;
}
/** A worn wool rug (512 × 352): rust field, a soft ochre lozenge and a cream border; low contrast so it anchors without competing. */
function rugCanvas() {
  const [c, x] = cv(512, 352), r = rng(31);
  x.fillStyle = '#d3c2a2'; x.fillRect(0, 0, 512, 352);
  x.fillStyle = '#7a3a26'; x.fillRect(22, 22, 468, 308);
  x.strokeStyle = '#5a2a1c'; x.lineWidth = 3; x.strokeRect(34, 34, 444, 284);
  x.strokeStyle = 'rgba(211,194,162,0.5)'; x.lineWidth = 2; x.strokeRect(44, 44, 424, 264);
  x.fillStyle = 'rgba(196,138,66,0.45)';
  x.beginPath(); x.moveTo(256, 92); x.lineTo(384, 176); x.lineTo(256, 260); x.lineTo(128, 176); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(232,214,180,0.35)'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(256, 118); x.lineTo(346, 176); x.lineTo(256, 234); x.lineTo(166, 176); x.closePath(); x.stroke();
  for (let i = 0; i < 6000; i++) { x.fillStyle = r() > 0.5 ? `rgba(0,0,0,${r() * 0.08})` : `rgba(255,240,210,${r() * 0.06})`; x.fillRect(r() * 512, r() * 352, 1 + r() * 2, 1); }
  return c;
}

export function buildLounge({ THREE, scene, floorY, chairAt, tableAt, lampAt, plantAt, rugAt }) {
  const tex = (c, aniso = 8, rep = 1) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); return t; };
  const veneerTex = tex(veneerCanvas());
  const veneer = new THREE.MeshStandardMaterial({ map: veneerTex, roughness: 0.32, metalness: 0.02 });          // lacquered shells
  const walnut = new THREE.MeshStandardMaterial({ map: veneerTex, color: '#d8b89a', roughness: 0.5 });          // oiled walnut casework
  const leather = new THREE.MeshStandardMaterial({ map: tex(leatherCanvas(), 4), roughness: 0.38, metalness: 0.04 });
  const piping = new THREE.MeshStandardMaterial({ color: '#1e130c', roughness: 0.5 });
  const brushed = new THREE.MeshStandardMaterial({ color: '#b9b4a8', metalness: 0.85, roughness: 0.34 });
  const black = new THREE.MeshStandardMaterial({ color: '#141312', metalness: 0.4, roughness: 0.45 });
  const castAl = new THREE.MeshStandardMaterial({ color: '#1b1b1d', metalness: 0.75, roughness: 0.38 });       // black-finished aluminium base
  const brass = new THREE.MeshStandardMaterial({ color: '#b08a4a', metalness: 1, roughness: 0.3 });
  const geos = [];
  const keep = (g) => { geos.push(g); return g; };
  const mesh = (geo, mat, x, y, z) => { const m = new THREE.Mesh(keep(geo), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };
  const rbox = (w, h, d, r, mat, x, y, z) => mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat, x, y, z);
  /** A tapered round leg from (x, top, z) down to the floor (local y = 0), splayed outward by (sx, sz) at its foot. */
  const leg = (x, top, z, sx, sz, rTop = 26, rFoot = 15, mat = walnut) => {
    const len = Math.hypot(top, sx, sz);
    const m = mesh(new THREE.CylinderGeometry(rTop, rFoot, len, 12), mat, x + sx / 2, top / 2, z + sz / 2);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-sx, top, -sz).normalize());
    return m;
  };
  /** A bent slab in the xy plane, its concave face toward +z: rounded corners in plan (radius r), edges brought forward by bendX / bendY,
   *  and an optional pillow (the front face swells by `puff` in the middle, keeping its full thickness only at the rim). */
  const slab = (w, h, t, { r = 0, bendX = 0, bendY = 0, puff = 0, back = 0, sx = 16, sy = 22 } = {}) => {
    const g = new THREE.BoxGeometry(w, h, t, sx, sy, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const dy = Math.max(0, Math.abs(y) - (h / 2 - r));
      if (r && dy > 0) x *= (w / 2 - r + Math.sqrt(Math.max(0, r * r - dy * dy))) / (w / 2);
      const u = x / (w / 2), v = y / (h / 2), dome = Math.max(0, (1 - u * u) * (1 - v * v));
      if (puff && z > 0) z += puff * Math.sqrt(dome);
      if (back && z < 0) z -= back * Math.sqrt(dome);
      z += bendX * u * u + bendY * v * v;
      p.setXYZ(i, x, y, z);
    }
    g.computeVertexNormals();
    return keep(g);
  };
  const part = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };
  /** A cast star base: spokes sloping from the hub to small glides, plus the column. */
  const starBase = (n, reach, hubY, colTop, phase = 0) => {
    const g = new THREE.Group();
    const spoke = keep(new THREE.BoxGeometry(70, 44, reach));
    spoke.translate(0, 0, reach / 2);
    for (let i = 0; i < n; i++) {
      const a = phase + (i / n) * Math.PI * 2;
      const s = part(spoke, castAl, 0, hubY, 0);
      s.rotation.order = 'YXZ'; s.rotation.y = a; s.rotation.x = Math.atan2(hubY - 40, reach) * 1.0;
      g.add(s);
      const glide = part(keep(new THREE.CylinderGeometry(30, 34, 26, 12)), black, Math.sin(a) * reach * 0.985, 13, Math.cos(a) * reach * 0.985);
      g.add(glide);
    }
    g.add(part(keep(new THREE.CylinderGeometry(70, 90, 70, 20)), castAl, 0, hubY, 0));
    g.add(part(keep(new THREE.CylinderGeometry(46, 52, colTop - hubY, 16)), castAl, 0, (hubY + colTop) / 2, 0));
    g.add(part(keep(new THREE.CylinderGeometry(49, 49, 18, 16)), brushed, 0, hubY + 70, 0));          // the bright swivel ring
    return g;
  };
  /** A seat-shell side: its wing rises from the front lip to carry the arm, then rounds down at the back. Shape x = chair z, y = up. */
  const wingGeo = (() => {
    const s = new THREE.Shape();
    s.moveTo(760, 20);
    s.bezierCurveTo(780, 120, 520, 210, 120, 300);
    s.bezierCurveTo(-200, 370, -640, 420, -760, 300);
    s.bezierCurveTo(-820, 220, -800, 60, -700, -40);
    s.bezierCurveTo(-300, -150, 300, -120, 760, 20);
    const g = new THREE.ExtrudeGeometry(s, { depth: 30, bevelEnabled: true, bevelThickness: 8, bevelSize: 8, bevelSegments: 2, curveSegments: 24 });
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 1600 + 0.5, uv.getY(i) / 900 + 0.3);
    return keep(g);
  })();

  /* ── the lounge chair: built facing +z, local y = 0 on the floor ── */
  const chair = new THREE.Group();
  chair.name = 'lounge-chair';
  const CW = 1700;                                              // ≈ 80 cm wide over the arms
  chair.add(starBase(5, 720, 150, 470, Math.PI / 5));
  // the seat: a shallow bent tray, a wing each side, the leather seat cushion and the padded arms; the whole seat tilts back a little
  const seat = new THREE.Group();
  seat.position.set(0, 540, 60);
  seat.rotation.x = -0.13;
  const tray = part(slab(CW - 120, 1480, 34, { r: 180, bendX: 110, bendY: 70 }), veneer, 0, 0, 0);
  tray.rotation.x = -Math.PI / 2;
  seat.add(tray);
  for (const sd of [-1, 1]) {
    const w = part(wingGeo, veneer, sd * (CW / 2 - 60) + (sd < 0 ? 0 : -30), 30, 0);
    w.rotation.y = -Math.PI / 2;
    w.position.x = sd * (CW / 2 - 60) + 15;
    seat.add(w);
    // the padded arm: a leather roll on the wing's top edge, over the back two-thirds
    const arm = rbox(230, 120, 860, 56, leather, sd * (CW / 2 - 95), 410, -230);
    arm.rotation.x = 0.1;
    seat.add(arm);
  }
  const seatCushion = part(slab(CW - 330, 1380, 70, { r: 240, bendX: 40, puff: 120, back: 20 }), leather, 0, 40, 30);
  seatCushion.rotation.x = -Math.PI / 2;
  seat.add(seatCushion);
  // the black spines that carry the back from the seat
  for (const sd of [-1, 1]) {
    const brk = mesh(new THREE.BoxGeometry(60, 340, 40), castAl, sd * 380, 120, -700);
    brk.rotation.x = 0.5;
    seat.add(brk);
  }
  chair.add(seat);
  // the back and the headrest: two bent shells, each with its own cushion, reclined; two black spines behind them
  const backG = new THREE.Group();
  backG.position.set(0, 600, -560);
  backG.rotation.x = -0.36;
  backG.add(part(slab(CW - 120, 1000, 34, { r: 230, bendX: 170, bendY: 40 }), veneer, 0, 520, 0));
  backG.add(part(slab(CW - 280, 930, 80, { r: 220, bendX: 160, bendY: 30, puff: 110 }), leather, 0, 520, 40));
  backG.add(part(slab(CW - 260, 560, 34, { r: 210, bendX: 160, bendY: 30 }), veneer, 0, 1330, -10));
  backG.add(part(slab(CW - 420, 500, 80, { r: 200, bendX: 150, bendY: 24, puff: 120 }), leather, 0, 1330, 30));
  for (const sd of [-1, 1]) backG.add(mesh(new THREE.BoxGeometry(70, 1500, 30), castAl, sd * 380, 830, -40));
  chair.add(backG);
  // a larger invisible block: the fingertip target
  const chairHit = new THREE.Mesh(keep(new THREE.BoxGeometry(CW, 1500, 1500)), new THREE.MeshBasicMaterial({ visible: false }));
  chairHit.position.set(0, 750, -150);
  chairHit.userData.proxy = true;
  chair.add(chairHit);

  /* ── the ottoman: the same shell and cushion, lower, on a four-star base, in front of the seat ── */
  const ottoman = new THREE.Group();
  ottoman.name = 'ottoman';
  ottoman.add(starBase(4, 520, 120, 300, Math.PI / 4));
  const oSeat = new THREE.Group();
  oSeat.position.set(0, 350, 0);
  oSeat.rotation.x = 0.05;
  const oTray = part(slab(1400, 1150, 34, { r: 300, bendX: 120, bendY: 100 }), veneer, 0, 0, 0);
  oTray.rotation.x = -Math.PI / 2;
  oSeat.add(oTray);
  const oCush = part(slab(1260, 1010, 80, { r: 280, bendX: 60, bendY: 40, puff: 120, back: 20 }), leather, 0, 90, 0);
  oCush.rotation.x = -Math.PI / 2;
  oSeat.add(oCush);
  ottoman.add(oSeat);
  ottoman.position.set(0, 0, 1380);
  ottoman.rotation.y = 0.06;
  const otHit = new THREE.Mesh(keep(new THREE.BoxGeometry(1460, 600, 1200)), new THREE.MeshBasicMaterial({ visible: false }));
  otHit.position.y = 300; otHit.userData.proxy = true;
  ottoman.add(otHit);
  chair.add(ottoman);
  chair.position.set(chairAt.x, floorY, chairAt.z);
  chair.rotation.y = chairAt.rot;
  scene.add(chair);

  /* ── the record console: a low walnut cabinet on tapered legs, LPs in the open bay, a door with a brass pull; built facing +z ── */
  const table = new THREE.Group();
  table.name = 'record-console';
  const TW = 1320, TD = 820, LEGH = 280, TH = 1080;              // ≈ 62 × 38 cm, top ≈ 51 cm off the floor
  const bodyH = TH - LEGH;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) table.add(leg(sx * (TW / 2 - 110), LEGH + 10, sz * (TD / 2 - 110), sx * 50, sz * 40, 26, 14));
  table.add(rbox(TW, 46, TD, 12, walnut, 0, TH - 23, 0));                       // top
  table.add(rbox(TW - 20, 40, TD - 20, 8, walnut, 0, LEGH + 20, 0));            // bottom
  for (const sx of [-1, 1]) table.add(rbox(40, bodyH - 40, TD - 20, 8, walnut, sx * (TW / 2 - 30), LEGH + bodyH / 2, 0));
  table.add(mesh(new THREE.BoxGeometry(TW - 60, bodyH - 60, 20), walnut, 0, LEGH + bodyH / 2, -TD / 2 + 20));   // back
  const DIV = 80;                                                // the divider: LP bay to the left (−x), door to the right
  table.add(mesh(new THREE.BoxGeometry(30, bodyH - 60, TD - 60), walnut, DIV, LEGH + bodyH / 2, 0));
  const door = rbox(TW / 2 - 120, bodyH - 80, 30, 6, walnut, (DIV + TW / 2 - 30) / 2, LEGH + bodyH / 2, TD / 2 - 20);
  table.add(door);
  for (let i = 1; i < 6; i++) table.add(mesh(new THREE.BoxGeometry(6, bodyH - 120, 8), new THREE.MeshStandardMaterial({ color: '#3a2414', roughness: 0.7 }), DIV + 20 + i * ((TW / 2 - 140) / 6), LEGH + bodyH / 2, TD / 2 - 2));
  table.add(mesh(new THREE.CylinderGeometry(12, 12, 160, 10), brass, DIV + 70, LEGH + bodyH / 2, TD / 2 + 14));
  // LPs standing in the bay, spines out (plain colours, no artwork)
  const sleeveCols = ['#7b2f24', '#2f4a5a', '#c99a3d', '#3b4a33', '#d8cdb6', '#5a3a2a', '#1f2a33', '#a8562f', '#e2d6b8', '#40362c', '#6d6a3a', '#2a2420'];
  const bay = TW / 2 - 60 + DIV - 40, r8 = rng(8);
  let sx0 = -TW / 2 + 60;
  sleeveCols.concat(sleeveCols.slice(0, 7)).forEach((col, i) => {
    const th = 14 + r8() * 10;
    if (sx0 + th > -TW / 2 + bay - 60) return;
    const s = mesh(new THREE.BoxGeometry(th, bodyH - 110, TD - 110), new THREE.MeshStandardMaterial({ color: col, roughness: 0.82 }), sx0 + th / 2, LEGH + 40 + (bodyH - 110) / 2, 10);
    if (i > 15) { s.rotation.z = -0.22; s.position.x += 30; }
    table.add(s);
    sx0 += th + 2;
  });
  table.position.set(tableAt.x, floorY, tableAt.z);
  table.rotation.y = tableAt.rot;
  scene.add(table);

  /* ── the record player, on the console's chair end ── */
  const tt = new THREE.Group();
  tt.name = 'record-player';
  const PW = 700, PD = 560, PH = 120;                           // ≈ 33 × 26 cm plinth
  tt.add(rbox(PW, PH, PD, 16, walnut, 0, PH / 2, 0));
  tt.add(mesh(new THREE.BoxGeometry(PW - 40, 6, PD - 40), brushed, 0, PH + 3, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) tt.add(mesh(new THREE.CylinderGeometry(26, 30, 18, 16), black, sx * (PW / 2 - 60), -9, sz * (PD / 2 - 60)));
  const PX = -80, PZ = 0, PR = 240;                             // platter centre and radius (a 30 cm LP ≈ 320 units across, held proud of the plate)
  const platter = new THREE.Group();
  platter.position.set(PX, PH + 6, PZ);
  platter.add(mesh(new THREE.CylinderGeometry(PR, PR, 22, 48), brushed, 0, 11, 0));
  const vinyl = new THREE.Mesh(keep(new THREE.CylinderGeometry(PR - 4, PR - 4, 4, 64)), [
    new THREE.MeshStandardMaterial({ color: '#0b0b0c', roughness: 0.4 }),
    new THREE.MeshStandardMaterial({ map: tex(vinylCanvas(), 16), roughness: 0.32, metalness: 0.1 }),
    new THREE.MeshStandardMaterial({ color: '#0b0b0c', roughness: 0.4 }),
  ]);
  vinyl.position.y = 24; vinyl.receiveShadow = true;
  platter.add(vinyl);
  platter.add(mesh(new THREE.CylinderGeometry(5, 5, 26, 8), brushed, 0, 34, 0));
  tt.add(platter);
  // tonearm: pivot on a post at the back right, arm swings in over the record
  const ARM = { x: PW / 2 - 110, z: -PD / 2 + 120 };
  tt.add(mesh(new THREE.CylinderGeometry(30, 34, 46, 20), black, ARM.x, PH + 26, ARM.z));
  const arm = new THREE.Group();
  arm.position.set(ARM.x, PH + 60, ARM.z);
  const tube = mesh(new THREE.CylinderGeometry(6, 6, 330, 10), brushed, 0, 0, 165);
  tube.rotation.x = Math.PI / 2;
  arm.add(tube);
  arm.add(mesh(new THREE.BoxGeometry(34, 14, 60), black, 0, -6, 340));                          // headshell
  const cw = mesh(new THREE.CylinderGeometry(22, 22, 50, 16), black, 0, 0, -50);               // counterweight
  cw.rotation.x = Math.PI / 2;
  arm.add(cw);
  tt.add(arm);
  tt.add(mesh(new THREE.CylinderGeometry(9, 9, 60, 8), black, ARM.x + 60, PH + 34, ARM.z + 230));   // arm rest
  // the one control: a toggle on the front right, and a pilot light beside it
  const toggle = mesh(new THREE.BoxGeometry(26, 14, 54), brass, PW / 2 - 120, PH + 12, PD / 2 - 70);
  tt.add(toggle);
  const pilotM = new THREE.MeshStandardMaterial({ color: '#3a2a18', emissive: '#ff9a3a', emissiveIntensity: 0 });
  tt.add(mesh(new THREE.CylinderGeometry(10, 10, 8, 12), pilotM, PW / 2 - 60, PH + 8, PD / 2 - 70));
  const ttHit = new THREE.Mesh(keep(new THREE.BoxGeometry(PW + 120, 260, PD + 120)), new THREE.MeshBasicMaterial({ visible: false }));
  ttHit.position.y = 110; ttHit.userData.proxy = true;
  tt.add(ttHit);
  tt.position.set(-TW / 2 + PW / 2 + 70, TH + 18, 20);
  tt.rotation.y = 0.08;
  table.add(tt);
  // the far end of the console: two books flat, and a small trailing pothos in a cream pot
  table.add(rbox(520, 50, 380, 6, new THREE.MeshStandardMaterial({ color: '#2e3b33', roughness: 0.8 }), TW / 2 - 330, TH + 25, -60));
  table.add(rbox(470, 40, 340, 6, new THREE.MeshStandardMaterial({ color: '#8a3e22', roughness: 0.8 }), TW / 2 - 320, TH + 70, -50));

  /* ── leaves: one shared split-leaf texture; the monstera and the console's small pothos ── */
  const leafM = new THREE.MeshStandardMaterial({ map: tex(leafCanvas(), 4), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.55 });
  const leafG = (() => { const g = new THREE.PlaneGeometry(1, 1, 4, 4); g.translate(0, 0.5, 0); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, 0.14 * x * x * 4 - 0.1 * y * y); } g.computeVertexNormals(); return keep(g); })();
  const stemM = new THREE.MeshStandardMaterial({ color: '#3d5a2c', roughness: 0.7 });
  /** A leaf on a stem: the stem arches from `from` to the leaf base at `to`; the blade points along azimuth `az`, raised `elev` above horizontal. */
  const leaf = (grp, from, to, az, elev, size, rad = 9) => {
    const mid = from.clone().lerp(to, 0.5); mid.y = Math.max(from.y, to.y) + Math.abs(to.y - from.y) * 0.15; mid.x = from.x + (to.x - from.x) * 0.3; mid.z = from.z + (to.z - from.z) * 0.3;
    grp.add(part(keep(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(from, mid, to), 10, rad, 5, false)), stemM));
    const l = new THREE.Mesh(leafG, leafM);
    l.castShadow = true; l.receiveShadow = true;
    l.position.copy(to); l.scale.set(size, size * 1.05, size);
    l.rotation.order = 'YXZ'; l.rotation.y = az; l.rotation.x = Math.PI / 2 - elev;
    grp.add(l);
  };
  // pothos on the console: a small cream pot with a few leaves spilling over the edge
  const pothos = new THREE.Group();
  pothos.add(mesh(new THREE.CylinderGeometry(110, 85, 190, 20), new THREE.MeshStandardMaterial({ color: '#e4d8bf', roughness: 0.35 }), 0, 95, 0));
  const rp = rng(41);
  for (let i = 0; i < 7; i++) {
    const az = -0.8 + i * 0.45 + rp() * 0.2, reach = 120 + rp() * 160;
    leaf(pothos, new THREE.Vector3(0, 180, 0), new THREE.Vector3(Math.sin(az) * reach, 200 - rp() * 160, Math.cos(az) * reach), az, -0.2 - rp() * 0.6, 130 + rp() * 60, 4);
  }
  pothos.position.set(TW / 2 - 200, TH, 220);
  table.add(pothos);

  /* ── the monstera: a glazed planter on a low walnut stand, a dozen split leaves ── */
  const plant = new THREE.Group();
  plant.name = 'monstera';
  const STAND = 300, POT = 560;
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; plant.add(leg(Math.sin(a) * 170, STAND, Math.cos(a) * 170, Math.sin(a) * 60, Math.cos(a) * 60, 18, 11)); }
  plant.add(mesh(new THREE.CylinderGeometry(250, 250, 30, 28), walnut, 0, STAND + 15, 0));
  plant.add(mesh(new THREE.CylinderGeometry(300, 220, POT, 32), new THREE.MeshStandardMaterial({ color: '#d9cbb0', roughness: 0.3 }), 0, STAND + 30 + POT / 2, 0));
  plant.add(mesh(new THREE.CylinderGeometry(280, 280, 10, 28), new THREE.MeshStandardMaterial({ color: '#2a1e15', roughness: 1 }), 0, STAND + 30 + POT - 30, 0));
  const soil = new THREE.Vector3(0, STAND + POT, 0), rm = rng(17);
  for (let i = 0; i < 14; i++) {
    const az = 0.1 + ((i * 0.618) % 1) * 1.9 + rm() * 0.15, h = 250 + rm() * 1150, reach = 120 + rm() * 300 + (h < 650 ? 220 : 0);   // leaves fan away from the wall (+x) and the chair (−z)
    const to = new THREE.Vector3(Math.sin(az) * reach, STAND + POT + h, Math.cos(az) * reach);
    leaf(plant, soil.clone().add(new THREE.Vector3(Math.sin(az) * 40, 0, Math.cos(az) * 40)), to, az, 0.1 + rm() * 0.55, 470 + rm() * 260, 10);
  }
  plant.position.set(plantAt.x, floorY, plantAt.z);
  plant.rotation.y = plantAt.rot || 0;
  scene.add(plant);

  /* ── the rug: under the chair and the ottoman ── */
  const rug = new THREE.Mesh(keep(new THREE.PlaneGeometry(rugAt.w, rugAt.d)), new THREE.MeshStandardMaterial({ map: tex(rugCanvas(), 8), roughness: 0.95 }));
  rug.name = 'rug';
  rug.rotation.order = 'YXZ'; rug.rotation.y = rugAt.rot; rug.rotation.x = -Math.PI / 2;
  rug.position.set(rugAt.x, floorY + 3, rugAt.z);
  rug.receiveShadow = true;
  scene.add(rug);

  /* ── an arc floor lamp: a weighted base behind the chair, a brass arc, an amber dome over the reader's shoulder ── */
  const lamp = new THREE.Group();
  lamp.name = 'arc-lamp';
  const base = new THREE.Vector3(lampAt.x, floorY + 60, lampAt.z), head = new THREE.Vector3(lampAt.headX, floorY + 2650, lampAt.headZ);
  lamp.add(mesh(new THREE.CylinderGeometry(190, 210, 60, 32), black, lampAt.x, floorY + 30, lampAt.z));
  const ctrl = new THREE.Vector3(lampAt.x + (lampAt.x - head.x) * 0.15, floorY + 4100, lampAt.z + (lampAt.z - head.z) * 0.1);
  const arc = new THREE.QuadraticBezierCurve3(base, ctrl, head.clone().add(new THREE.Vector3(0, 160, 0)));
  lamp.add(mesh(new THREE.TubeGeometry(arc, 64, 15, 8, false), brass, 0, 0, 0));
  const shadeM = new THREE.MeshStandardMaterial({ color: '#d77a2a', emissive: '#ff8a2a', emissiveIntensity: 0.35, roughness: 0.35, side: THREE.DoubleSide });
  const shade = mesh(new THREE.SphereGeometry(300, 36, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), shadeM, head.x, head.y, head.z);
  shade.scale.y = 0.62; shade.castShadow = false;
  lamp.add(shade);
  const diffM = new THREE.MeshStandardMaterial({ color: '#fff1d6', emissive: '#ffd59a', emissiveIntensity: 1.6 });
  const diff = mesh(new THREE.CircleGeometry(270, 32), diffM, head.x, head.y + 4, head.z);
  diff.rotation.x = Math.PI / 2; diff.castShadow = false;
  lamp.add(diff);
  lamp.add(mesh(new THREE.CylinderGeometry(22, 22, 70, 10), brass, head.x, head.y + 200, head.z));
  const bulb = new THREE.PointLight('#ffb870', 1.5e7, 0, 2);       // same physical scale as the desk lamp's bulb glow; no shadows
  bulb.position.set(head.x, head.y - 120, head.z);
  lamp.add(bulb);
  scene.add(lamp);

  /* ── record player state: arm angle (0 = on its rest, 1 = in the lead-in groove) ── */
  const REST_A = 0.1, PLAY_A = -0.36;
  const armTo = (t) => { arm.rotation.y = REST_A + (PLAY_A - REST_A) * t; arm.rotation.x = 0.04 * (1 - t); toggle.rotation.x = t ? -0.35 : 0.35; pilotM.emissiveIntensity = t > 0.5 ? 1.6 : 0; };
  armTo(0);

  const center = (o) => new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
  return {
    chair, ottoman, table, player: tt, lamp, plant, rug,
    armTo,
    /** Platter angle (radians), set by the owner's spin loop. */
    spin(a) { platter.rotation.y = a; },
    get platterAngle() { return platter.rotation.y; },
    /** World points the views and tests use. */
    get chairCenter() { return center(chair); },
    get playerCenter() { tt.updateMatrixWorld(true); return tt.localToWorld(new THREE.Vector3(PX * 0.4, PH, 0)); },
  };
}

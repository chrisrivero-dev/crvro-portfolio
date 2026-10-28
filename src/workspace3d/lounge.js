/* 07: the reading corner by the window: an original mid-century lounge chair, a walnut side table and a small record player.
 *
 * Nothing here copies a branded design: the chair is a generic Danish-modern lounge chair (four splayed tapered walnut legs, a walnut
 * frame with open arms, two loose dark-leather cushions); the record player is a plain walnut plinth with a brushed plate, a belt-drive
 * platter, a straight tonearm and one toggle. Record sleeves are plain colour, no artwork.
 *
 * Built once from boxes, cylinders and two small canvas textures; added to the scene so engine.dispose() releases it.
 * The record player is silent. It spins only while playing (a rAF loop that exists only then); reduced motion shows it playing, still.
 * Scale: 1 unit ≈ 0.47 mm (see props.js). */
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }

/** A small walnut grain (512 × 256): enough for furniture this size, a fraction of the desk's texture memory. */
function walnutCanvas(seed = 4) {
  const [c, x] = cv(512, 256), r = rng(seed);
  x.fillStyle = '#6c4529'; x.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 260; i++) {
    const y = r() * 256, a = 0.04 + r() * 0.1;
    x.strokeStyle = r() > 0.45 ? `rgba(25,12,4,${a})` : `rgba(235,180,120,${a * 0.5})`;
    x.lineWidth = 0.6 + r() * 2.2;
    x.beginPath(); x.moveTo(0, y);
    for (let s = 0; s <= 512; s += 32) x.lineTo(s, y + Math.sin(s / (40 + r() * 60) + i) * (2 + r() * 4));
    x.stroke();
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

export function buildLounge({ THREE, scene, floorY, chairAt, tableAt, lampAt }) {
  const tex = (c, aniso = 8) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  const walnut = new THREE.MeshStandardMaterial({ map: tex(walnutCanvas()), roughness: 0.48 });
  const leather = new THREE.MeshStandardMaterial({ color: '#3a2619', roughness: 0.42, metalness: 0.05 });
  const brushed = new THREE.MeshStandardMaterial({ color: '#b9b4a8', metalness: 0.85, roughness: 0.34 });
  const black = new THREE.MeshStandardMaterial({ color: '#141312', metalness: 0.4, roughness: 0.45 });
  const brass = new THREE.MeshStandardMaterial({ color: '#b08a4a', metalness: 1, roughness: 0.3 });
  const geos = [];
  const keep = (g) => { geos.push(g); return g; };
  const mesh = (geo, mat, x, y, z) => { const m = new THREE.Mesh(keep(geo), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };
  const rbox = (w, h, d, r, mat, x, y, z) => mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat, x, y, z);
  /** A tapered round leg from (x, y0, z) to the floor, splayed outward by (sx, sz) at its foot. */
  const leg = (x, top, z, sx, sz, rTop = 26, rFoot = 15) => {
    const h = top - floorY, len = Math.hypot(h, sx, sz);
    const m = mesh(new THREE.CylinderGeometry(rTop, rFoot, len, 12), walnut, x + sx / 2, floorY + h / 2, z + sz / 2);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-sx, h, -sz).normalize());
    return m;
  };

  /* ── the lounge chair: built facing +z, seat front at +z ── */
  const chair = new THREE.Group();
  chair.name = 'lounge-chair';
  const CW = 1560, CD = 1500, SEAT = floorY + 820;              // ≈ 73 cm wide, 70 cm deep, seat ≈ 38 cm
  const railY = SEAT - 120;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) chair.add(leg(sx * (CW / 2 - 110), railY, sz * (CD / 2 - 140), sx * 90, sz * 110));
  for (const sx of [-1, 1]) {
    chair.add(rbox(70, 90, CD - 80, 14, walnut, sx * (CW / 2 - 110), railY + 10, 0));           // side rails
    // open arm: a flat walnut arm on two posts, the front post rising from the rail
    chair.add(rbox(140, 46, CD - 220, 18, walnut, sx * (CW / 2 - 70), SEAT + 420, 30));
    chair.add(rbox(60, 470, 60, 12, walnut, sx * (CW / 2 - 90), SEAT + 180, CD / 2 - 230));
    chair.add(rbox(60, 380, 60, 12, walnut, sx * (CW / 2 - 90), SEAT + 220, -CD / 2 + 240));
  }
  chair.add(rbox(CW - 260, 70, 70, 14, walnut, 0, railY + 10, CD / 2 - 140));                    // front and back rails
  chair.add(rbox(CW - 260, 70, 70, 14, walnut, 0, railY + 10, -CD / 2 + 160));
  // seat cushion on webbing, a little higher at the front
  const seat = rbox(CW - 300, 190, CD - 330, 60, leather, 0, SEAT + 30, 60);
  seat.rotation.x = -0.05;
  chair.add(seat);
  // reclined back: two walnut stiles and a loose leather back cushion with a head roll
  const back = new THREE.Group();
  back.position.set(0, SEAT - 20, -CD / 2 + 180);
  back.rotation.x = -0.32;
  for (const sx of [-1, 1]) back.add(rbox(70, 1040, 70, 14, walnut, sx * (CW / 2 - 200), 520, -30));
  back.add(rbox(CW - 330, 900, 190, 70, leather, 0, 500, 60));
  back.add(rbox(CW - 380, 170, 230, 80, leather, 0, 1000, 70));
  chair.add(back);
  // a larger invisible block: the fingertip target
  const chairHit = new THREE.Mesh(keep(new THREE.BoxGeometry(CW + 80, 1500, CD + 80)), new THREE.MeshBasicMaterial({ visible: false }));
  chairHit.position.set(0, floorY + 750, 0);
  chairHit.userData.proxy = true;
  chair.add(chairHit);
  chair.position.set(chairAt.x, 0, chairAt.z);
  chair.rotation.y = chairAt.rot;
  scene.add(chair);

  /* ── side table with a lower shelf of record sleeves ── */
  const table = new THREE.Group();
  table.name = 'side-table';
  const TW = 820, TD = 700, TH = floorY + 1080;                  // ≈ 38 × 33 cm, 51 cm high
  table.add(rbox(TW, 46, TD, 14, walnut, 0, TH - 23, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) table.add(leg(sx * (TW / 2 - 70), TH - 46, sz * (TD / 2 - 70), sx * 40, sz * 40, 22, 13));
  const shelfY = floorY + 330;
  table.add(rbox(TW - 120, 30, TD - 110, 8, walnut, 0, shelfY, 0));
  const sleeves = ['#7b2f24', '#2f4a5a', '#c99a3d', '#3b4a33', '#d8cdb6'];
  sleeves.forEach((col, i) => {
    const s = mesh(new THREE.BoxGeometry(14, 640, 640), new THREE.MeshStandardMaterial({ color: col, roughness: 0.8 }), -TW / 2 + 120 + i * 22, shelfY + 15 + 320, 0);
    s.rotation.z = (i - 2) * 0.03;
    s.scale.set(1, 0.48, 0.86);                                  // a stack of LP sleeves leaning on the shelf, sized to fit under the top
    s.position.y = shelfY + 15 + 160;
    table.add(s);
  });
  table.position.set(tableAt.x, 0, tableAt.z);
  table.rotation.y = tableAt.rot;
  scene.add(table);

  /* ── the record player, on the table ── */
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
  tt.position.set(0, TH, 0);
  tt.rotation.y = 0;
  table.add(tt);

  /* ── a slim floor lamp between the table and the window wall: the corner's own warm light (no shadows, limited range) ── */
  const lamp = new THREE.Group();
  lamp.name = 'floor-lamp';
  const LH = 3150;                                               // ≈ 148 cm
  lamp.add(mesh(new THREE.CylinderGeometry(120, 130, 26, 28), black, 0, floorY + 13, 0));
  lamp.add(mesh(new THREE.CylinderGeometry(11, 11, LH - 300, 10), brass, 0, floorY + (LH - 300) / 2 + 26, 0));
  const shadeM = new THREE.MeshStandardMaterial({ color: '#e8d6b4', emissive: '#ffcf8a', emissiveIntensity: 0.55, roughness: 0.9, side: THREE.DoubleSide });
  const shade = mesh(new THREE.CylinderGeometry(150, 230, 300, 28, 1, true), shadeM, 0, floorY + LH - 150, 0);
  shade.castShadow = false;
  lamp.add(shade);
  const bulb = new THREE.PointLight('#ffc884', 5e6, 0, 2);   // same physical scale as the desk lamp's bulb glow
  bulb.position.set(0, floorY + LH - 200, 0);
  lamp.add(bulb);
  lamp.position.set(lampAt.x, 0, lampAt.z);
  scene.add(lamp);

  /* ── record player state: arm angle (0 = on its rest, 1 = in the lead-in groove) ── */
  const REST_A = 0.1, PLAY_A = -0.36;
  const armTo = (t) => { arm.rotation.y = REST_A + (PLAY_A - REST_A) * t; arm.rotation.x = 0.04 * (1 - t); toggle.rotation.x = t ? -0.35 : 0.35; pilotM.emissiveIntensity = t > 0.5 ? 1.6 : 0; };
  armTo(0);

  const center = (o) => new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
  return {
    chair, table, player: tt, lamp,
    armTo,
    /** Platter angle (radians), set by the owner's spin loop. */
    spin(a) { platter.rotation.y = a; },
    get platterAngle() { return platter.rotation.y; },
    /** World points the views and tests use. */
    get chairCenter() { return center(chair); },
    get playerCenter() { tt.updateMatrixWorld(true); return tt.localToWorld(new THREE.Vector3(PX * 0.4, PH, 0)); },
  };
}

/* 12: Christopher's instant camera, a Fujifilm Instax Mini 90 Neo Classic, as close to his own as the procedural kit allows.
 * Real size 113.4 x 91.9 x 57.2 mm (Fujifilm's published figure), at the room's 2.1 units per mm. The lens is shown retracted
 * (power off), as it sits on his shelf. Brushed silver top housing, reddish-brown leatherette body, a stepped silver lens with a
 * knurled ring and a printed black front ring, a recessed coated front element, the viewfinder, a ridged flash window, the power
 * button on the front and the shutter on top. Small text is drawn into textures, so it costs no extra geometry.
 * Origin: centre of the base. Front faces +z. */
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const MM = 2.1;
function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

/** Fine pebble grain: the colour map and, in grey, its bump map. */
function leather() {
  const [c, x] = cv(256, 256), [b, y] = cv(256, 256), r = rng(9);
  x.fillStyle = '#7b3a2b'; x.fillRect(0, 0, 256, 256); y.fillStyle = '#808080'; y.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++) {
    const px = r() * 256, py = r() * 256, s = 1 + r() * 2.2, v = r();
    x.fillStyle = `rgba(${v < 0.5 ? '40,14,8' : '160,90,70'},${0.06 + r() * 0.08})`; x.fillRect(px, py, s, s);
    y.fillStyle = `rgba(${v < 0.5 ? '0,0,0' : '255,255,255'},${0.25 + r() * 0.3})`; y.beginPath(); y.arc(px, py, s, 0, Math.PI * 2); y.fill();
  }
  return [c, b];
}
/** Brushed aluminium: horizontal streaks in the colour and roughness maps. */
function brushed() {
  const [c, x] = cv(256, 256), [g, y] = cv(256, 256), r = rng(4);
  x.fillStyle = '#c9c9c5'; x.fillRect(0, 0, 256, 256); y.fillStyle = '#5a5a5a'; y.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 700; i++) {
    const py = r() * 256, a = 0.04 + r() * 0.08, l = 40 + r() * 216, px = r() * 256;
    x.fillStyle = r() < 0.5 ? `rgba(255,255,255,${a})` : `rgba(60,60,60,${a})`; x.fillRect(px - l / 2, py, l, 1);
    y.fillStyle = r() < 0.5 ? `rgba(255,255,255,${a * 1.5})` : `rgba(0,0,0,${a * 1.5})`; y.fillRect(px - l / 2, py, l, 1);
  }
  return [c, g];
}
/** The knurled focus ring: fine vertical ridges, wrapped round the ring. */
function knurl() {
  const [c, x] = cv(512, 16);
  for (let i = 0; i < 512; i += 4) { x.fillStyle = '#d8d8d4'; x.fillRect(i, 0, 2, 16); x.fillStyle = '#6c6c68'; x.fillRect(i + 2, 0, 2, 16); }
  return c;
}
/** The black front ring and its printing (ring UVs are planar, so the canvas is drawn as the ring seen face-on). */
function lensFace() {
  const [c, x] = cv(512, 512), C = 256;
  x.fillStyle = '#121214'; x.fillRect(0, 0, 512, 512);
  x.strokeStyle = 'rgba(255,255,255,0.08)'; x.lineWidth = 2;
  for (const rr of [150, 200, 238]) { x.beginPath(); x.arc(C, C, rr, 0, Math.PI * 2); x.stroke(); }
  const arcText = (t, rr, a0, size) => {
    x.font = `500 ${size}px Helvetica, Arial, sans-serif`; x.fillStyle = '#e6e3dc'; x.textAlign = 'center';
    let a = a0 - x.measureText(t).width / rr / 2;
    for (const ch of t) { const w = x.measureText(ch).width; x.save(); x.translate(C, C); x.rotate(a + w / rr / 2 + Math.PI / 2); x.fillText(ch, 0, -rr); x.restore(); a += w / rr; }
  };
  arcText('FUJINON LENS  f=60mm  1:12.7', 214, -Math.PI / 2, 26);
  x.font = 'italic 600 30px Helvetica, Arial, sans-serif'; x.fillStyle = '#e6e3dc'; x.textAlign = 'center';
  x.save(); x.translate(C, C); x.fillText('instax', 0, 222); x.restore();
  return c;
}
/** Flash window: a ridged Fresnel diffuser over a reflector. */
function fresnel() {
  const [c, x] = cv(128, 64);
  const g = x.createLinearGradient(0, 0, 128, 0); g.addColorStop(0, '#dcdcd6'); g.addColorStop(0.5, '#fbfbf6'); g.addColorStop(1, '#dcdcd6');
  x.fillStyle = g; x.fillRect(0, 0, 128, 64);
  for (let i = 0; i < 128; i += 6) { x.fillStyle = 'rgba(120,120,115,0.28)'; x.fillRect(i, 0, 2, 64); }
  for (let j = 0; j < 64; j += 8) { x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(0, j, 128, 1); }
  return c;
}
/** Printing on the silver front: the model name, small and dark, as on the real camera. */
function frontPrint() {
  const [c, x] = cv(512, 128);
  x.clearRect(0, 0, 512, 128);
  x.fillStyle = '#2b2b2c'; x.textAlign = 'left';
  x.font = 'italic 700 46px Helvetica, Arial, sans-serif'; x.fillText('instax', 12, 62);
  x.font = '500 30px Helvetica, Arial, sans-serif'; x.fillText('mini 90', 170, 62);
  x.font = '600 20px Helvetica, Arial, sans-serif'; x.fillText('NEO CLASSIC', 14, 100);
  return c;
}
/** The back: the small LCD frame counter and its legend. */
function backPanel() {
  const [c, x] = cv(256, 128);
  x.fillStyle = '#18181a'; x.fillRect(0, 0, 256, 128);
  x.fillStyle = '#5d6656'; x.fillRect(150, 26, 70, 40);
  x.fillStyle = '#2a2f27'; x.font = '600 28px "JetBrains Mono", monospace'; x.fillText('10', 166, 58);
  x.fillStyle = '#bdbab2'; x.font = '500 13px Helvetica, Arial, sans-serif'; x.fillText('MODE', 40, 52); x.fillText('FLASH', 40, 92);
  return c;
}

export function buildInstax({ THREE, tex }) {
  const g = new THREE.Group();
  const W = 113.4 * MM, H = 91.9 * MM, D = 57.2 * MM - 18 * MM;   // depth without the lens barrel (it stands proud of the body)
  const TOPH = H * 0.33;
  const [lc, lb] = leather();
  const lmap = tex(lc, { repeat: 2 }), lbump = tex(lb, { srgb: false, repeat: 2 });
  const body = new THREE.MeshStandardMaterial({ map: lmap, bumpMap: lbump, bumpScale: 0.6, roughness: 0.78, color: '#ffffff' });
  const [bc, br] = brushed();
  const silver = new THREE.MeshStandardMaterial({ map: tex(bc), roughnessMap: tex(br, { srgb: false }), metalness: 0.85, roughness: 0.42 });
  const satinBlack = new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.45, metalness: 0.2 });
  const matteBlack = new THREE.MeshStandardMaterial({ color: '#0c0c0d', roughness: 0.85 });
  const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };

  // body: the brown lower housing, then the silver top shell sitting on it with a fine dark seam between
  add(new RoundedBoxGeometry(W, H - TOPH + 4, D, 4, 14), body, 0, (H - TOPH + 4) / 2, 0);
  add(new THREE.BoxGeometry(W - 6, 3, D - 6), matteBlack, 0, H - TOPH + 3, 0);
  add(new RoundedBoxGeometry(W + 1, TOPH, D + 1, 4, 12), silver, 0, H - TOPH / 2 + 2, 0);
  // a thin silver base plate under the leatherette
  add(new RoundedBoxGeometry(W + 1, 8, D + 1, 2, 3), silver, 0, 4, 0);

  // the lens: retracted, its centre left of middle and a little below the seam
  const LX = -9 * MM, LY = 40 * MM, Z0 = D / 2;
  const turn = Math.PI / 2;
  const lens = new THREE.Group(); lens.position.set(LX, LY, Z0); g.add(lens);
  const ladd = (geo, mat, z, rx = turn) => { const m = new THREE.Mesh(geo, mat); m.position.z = z; m.rotation.x = rx; m.castShadow = true; lens.add(m); return m; };
  ladd(new THREE.CylinderGeometry(29 * MM, 30 * MM, 4 * MM, 64), silver, 2 * MM);                               // base collar
  const kmap = tex(knurl(), { aniso: 8 }); kmap.repeat.set(3, 1);
  const kring = new THREE.MeshStandardMaterial({ map: kmap, bumpMap: kmap, bumpScale: 1.2, metalness: 0.8, roughness: 0.38 });
  ladd(new THREE.CylinderGeometry(27.5 * MM, 27.5 * MM, 6 * MM, 96, 1, true), kring, 7 * MM);                   // knurled ring
  // stepped outer barrel with a chamfered lip (a lathe profile, one draw call)
  const prof = [[27.5, 10], [26, 10.5], [25.5, 14], [24.8, 16.5], [23, 17.5], [21.5, 17.5]].map(([r, z]) => new THREE.Vector2(r * MM, z * MM));
  const barrel = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), silver); barrel.rotation.x = turn; lens.add(barrel);
  // the black printed front ring, set into the barrel
  const face = new THREE.Mesh(new THREE.RingGeometry(12 * MM, 21.6 * MM, 96, 1), new THREE.MeshStandardMaterial({ map: tex(lensFace(), { aniso: 8 }), roughness: 0.4, metalness: 0.1 }));
  face.position.z = 17.4 * MM; lens.add(face);
  // a recessed inner barrel, matte inside, stepping down to the coated front element
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(12 * MM, 10 * MM, 6 * MM, 64, 1, true), new THREE.MeshStandardMaterial({ color: '#0a0a0b', roughness: 0.9, side: THREE.BackSide }));
  inner.rotation.x = turn; inner.position.z = 14.4 * MM; lens.add(inner);
  const glass = new THREE.Mesh(new THREE.SphereGeometry(16 * MM, 48, 16, 0, Math.PI * 2, 0, 0.68), new THREE.MeshPhysicalMaterial({ color: '#0d1016', roughness: 0.06, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03, sheen: 0.6, sheenColor: new THREE.Color('#5a3a7a') }));
  glass.rotation.x = turn; glass.position.z = (11.4 - 16 * Math.cos(0.68) + 1) * MM; lens.add(glass);
  const retainer = new THREE.Mesh(new THREE.TorusGeometry(10.4 * MM, 0.6 * MM, 8, 64), satinBlack); retainer.position.z = 12 * MM; lens.add(retainer);

  // viewfinder, top left: a dark glass window in a black bezel
  add(new RoundedBoxGeometry(17 * MM, 12 * MM, 3 * MM, 2, 1.2 * MM), satinBlack, -38 * MM, H - 15 * MM, Z0 + 0.6 * MM);
  add(new THREE.PlaneGeometry(13 * MM, 8 * MM), new THREE.MeshPhysicalMaterial({ color: '#0b1218', roughness: 0.05, clearcoat: 1, metalness: 0.2 }), -38 * MM, H - 15 * MM, Z0 + 2.2 * MM);
  // flash, top right: a ridged translucent diffuser in a black frame
  add(new RoundedBoxGeometry(30 * MM, 15 * MM, 3 * MM, 2, 1.2 * MM), satinBlack, 34 * MM, H - 14 * MM, Z0 + 0.6 * MM);
  add(new THREE.PlaneGeometry(27 * MM, 12 * MM), new THREE.MeshPhysicalMaterial({ map: tex(fresnel()), roughness: 0.25, transmission: 0, transparent: true, opacity: 0.94, emissive: '#2a2a26', clearcoat: 0.6 }), 34 * MM, H - 14 * MM, Z0 + 2.2 * MM);
  // the model name printed on the silver, between viewfinder and flash
  const print = add(new THREE.PlaneGeometry(26 * MM, 6.5 * MM), new THREE.MeshStandardMaterial({ map: tex(frontPrint(), { aniso: 8 }), transparent: true, roughness: 0.5 }), -6 * MM, H - 14 * MM, Z0 + 0.62 * MM);
  print.castShadow = false;
  // power button on the front, right of the lens, in a silver bezel
  const pw = add(new THREE.CylinderGeometry(4.6 * MM, 4.6 * MM, 1.4 * MM, 32), silver, 42 * MM, 30 * MM, Z0 + 0.6 * MM, turn);
  add(new THREE.CylinderGeometry(3.4 * MM, 3.4 * MM, 1.6 * MM, 32), satinBlack, 42 * MM, 30 * MM, Z0 + 1.6 * MM, turn);
  pw.name = 'instax-power';
  // shutter on top, right: a silver button on a black collar
  add(new THREE.CylinderGeometry(6.5 * MM, 6.5 * MM, 1.6 * MM, 32), satinBlack, 36 * MM, H + 2 * MM, 6 * MM);
  add(new THREE.CylinderGeometry(5 * MM, 5.2 * MM, 2.4 * MM, 32), silver, 36 * MM, H + 3.6 * MM, 6 * MM);
  // strap lugs on the right side
  add(new THREE.TorusGeometry(2.4 * MM, 0.8 * MM, 8, 16), silver, W / 2 + 1.5 * MM, H - 10 * MM, -8 * MM, 0, turn, 0);
  // the back: film door panel with the LCD counter and two buttons
  const back = add(new THREE.PlaneGeometry(W - 30, TOPH * 0.9), new THREE.MeshStandardMaterial({ map: tex(backPanel()), roughness: 0.5 }), 0, H - TOPH / 2 + 2, -D / 2 - 0.7, 0, Math.PI, 0);
  back.castShadow = false;
  for (const y of [H - TOPH / 2 + 12, H - TOPH / 2 - 8]) add(new THREE.CylinderGeometry(2.6 * MM, 2.6 * MM, 1.2 * MM, 20), silver, 26, y, -D / 2 - 1.5, turn);

  // a pick box a little larger than the camera, so it is easy to tap on a phone
  const hit = new THREE.Mesh(new THREE.BoxGeometry(W + 80, H + 80, D + 120), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(0, H / 2, 20); hit.userData.proxy = true; g.add(hit);
  return g;
}

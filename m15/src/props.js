/* CRVRO M1.5 exploration — shared physical props and procedural surfaces.
 *
 * Scale: the M1 computer is 780 units wide ≈ 370 mm, so 1 unit ≈ 0.47 mm.
 * A 3.5" floppy (90 × 94 × 3.3 mm) is therefore ≈ 191 × 200 × 7 units.
 */
import * as THREE from '../vendor/three.module.min.js';

export const MM = 1 / 0.47;

export function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return { c, x: c.getContext('2d') };
}

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function tex(c, { srgb = true, repeat = 1, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = aniso;
  return t;
}

/* ── surfaces ────────────────────────────────────────────────────── */

export function woodTexture({ base = '#6b4a30', seed = 3 } = {}) {
  const W = 2048, H = 1024;
  const { c, x } = canvas(W, H);
  const r = rng(seed);
  x.fillStyle = base;
  x.fillRect(0, 0, W, H);
  for (let i = 0; i < 900; i++) {
    const y = r() * H, a = 0.03 + r() * 0.08;
    x.strokeStyle = r() > 0.5 ? `rgba(30,18,8,${a})` : `rgba(255,220,170,${a * 0.6})`;
    x.lineWidth = 0.6 + r() * 2.5;
    x.beginPath();
    x.moveTo(0, y);
    for (let px = 0; px <= W; px += 64) x.lineTo(px, y + Math.sin(px * 0.004 + i) * 6 * r());
    x.stroke();
  }
  return c;
}

export function linoleumTexture({ base = '#5d6457', seed = 5 } = {}) {
  const W = 1024, H = 1024;
  const { c, x } = canvas(W, H);
  const r = rng(seed);
  x.fillStyle = base;
  x.fillRect(0, 0, W, H);
  const d = x.getImageData(0, 0, W, H);
  for (let i = 0; i < d.data.length; i += 4) {
    const n = (r() - 0.5) * 14;
    d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n;
  }
  x.putImageData(d, 0, 0);
  return c;
}

export function plasterTexture({ base = '#cfc6b6', seed = 9 } = {}) {
  const W = 1024, H = 1024;
  const { c, x } = canvas(W, H);
  const r = rng(seed);
  x.fillStyle = base;
  x.fillRect(0, 0, W, H);
  for (let i = 0; i < 4000; i++) {
    x.fillStyle = `rgba(${r() > 0.5 ? '255,250,240' : '60,50,40'},${0.02 + r() * 0.03})`;
    const s = 2 + r() * 10;
    x.fillRect(r() * W, r() * H, s, s);
  }
  return c;
}

/* A drafting sheet: survey grid, parcel boundaries with bearings,
 * contour lines and a title block. Unlabelled as a "map" on purpose. */
export function draftingTexture({ W = 2400, H = 1700, paper = '#ece5d3', ink = '#2f3c4a', seed = 11, title = 'PARCEL 14-B · SHEET 2 OF 6' } = {}) {
  const { c, x } = canvas(W, H);
  const r = rng(seed);
  x.fillStyle = paper;
  x.fillRect(0, 0, W, H);
  // paper tooth
  for (let i = 0; i < 6000; i++) {
    x.fillStyle = `rgba(80,60,30,${r() * 0.035})`;
    x.fillRect(r() * W, r() * H, 2, 2);
  }
  // fine survey grid
  x.strokeStyle = 'rgba(70,110,130,0.18)';
  x.lineWidth = 1;
  for (let g = 60; g < W; g += 60) { x.beginPath(); x.moveTo(g, 0); x.lineTo(g, H); x.stroke(); }
  for (let g = 60; g < H; g += 60) { x.beginPath(); x.moveTo(0, g); x.lineTo(W, g); x.stroke(); }
  // contours
  x.strokeStyle = 'rgba(140,90,40,0.45)';
  for (let k = 1; k <= 9; k++) {
    x.lineWidth = k % 5 === 0 ? 2.6 : 1.3;
    x.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.05) {
      const rr = k * 70 * (1 + 0.12 * Math.sin(3 * a + k * 0.6) + 0.06 * Math.sin(7 * a));
      const px = W * 0.68 + Math.cos(a) * rr * 1.4, py = H * 0.42 + Math.sin(a) * rr;
      a ? x.lineTo(px, py) : x.moveTo(px, py);
    }
    x.stroke();
  }
  // parcels with bearings
  x.strokeStyle = ink;
  x.fillStyle = ink;
  x.lineWidth = 3;
  const parcels = [
    [[240, 260], [820, 210], [900, 760], [300, 820]],
    [[820, 210], [1300, 260], [1260, 700], [900, 760]],
    [[300, 820], [900, 760], [940, 1250], [260, 1300]],
  ];
  x.font = '600 26px "JetBrains Mono", monospace';
  for (const p of parcels) {
    x.beginPath();
    p.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py)));
    x.closePath();
    x.stroke();
    for (let i = 0; i < p.length; i++) {
      const [ax, ay] = p[i], [bx, by] = p[(i + 1) % p.length];
      x.save();
      x.translate((ax + bx) / 2, (ay + by) / 2);
      x.rotate(Math.atan2(by - ay, bx - ax));
      x.fillText(`N ${(10 + r() * 79).toFixed(0)}°${(r() * 59).toFixed(0)}' E  ${(120 + r() * 300).toFixed(2)}'`, -150, -10);
      x.restore();
    }
  }
  // section ties + north arrow
  x.setLineDash([18, 10]);
  x.lineWidth = 2;
  x.beginPath(); x.moveTo(100, 1500); x.lineTo(1500, 1420); x.stroke();
  x.setLineDash([]);
  x.beginPath(); x.moveTo(1700, 1300); x.lineTo(1730, 1180); x.lineTo(1760, 1300); x.closePath(); x.fill();
  x.font = '700 40px "JetBrains Mono", monospace';
  x.fillText('N', 1716, 1160);
  // title block
  x.lineWidth = 3;
  x.strokeRect(W - 720, H - 260, 680, 220);
  x.beginPath(); x.moveTo(W - 720, H - 170); x.lineTo(W - 40, H - 170); x.stroke();
  x.font = '700 34px "JetBrains Mono", monospace';
  x.fillText(title, W - 700, H - 200);
  x.font = '500 24px "JetBrains Mono", monospace';
  x.fillText('DRAWN  C.R.     SCALE 1" = 40\'', W - 700, H - 120);
  x.fillText('BASIS OF BEARINGS: RECORD PLAT', W - 700, H - 75);
  return c;
}

/* ── floppy disk ─────────────────────────────────────────────────── */

const DISK = { w: 90 * MM, h: 94 * MM, t: 3.3 * MM };

function labelCanvas({ title, sub, n, ink = '#1d2430', stripe = '#c99a4a' }) {
  const W = 512, H = 400;
  const { c, x } = canvas(W, H);
  x.fillStyle = '#f2ede1';
  x.fillRect(0, 0, W, H);
  x.fillStyle = stripe;
  x.fillRect(0, 0, W, 34);
  x.fillStyle = 'rgba(40,60,90,0.25)';
  for (let y = 120; y < H; y += 46) x.fillRect(18, y, W - 36, 2);
  x.fillStyle = ink;
  x.font = '700 22px "JetBrains Mono", monospace';
  x.fillText(`CRVRO  ·  ${n}`, 20, 25);
  let size = 64;
  x.font = `700 ${size}px "JetBrains Mono", monospace`;
  while (x.measureText(title).width > W - 40 && size > 30) x.font = `700 ${(size -= 2)}px "JetBrains Mono", monospace`;
  x.fillText(title, 20, 108);
  x.font = '500 26px "JetBrains Mono", monospace';
  x.fillStyle = 'rgba(29,36,48,0.8)';
  const words = sub.split(' ');
  let line = '', y = 160;
  for (const w of words) {
    if (x.measureText(line + w).width > W - 40) { x.fillText(line, 20, y); line = ''; y += 46; }
    line += w + ' ';
  }
  x.fillText(line, 20, y);
  return c;
}

function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

export function roundedSlab(w, h, d, r = 6, bevel = 1.5) {
  const g = new THREE.ExtrudeGeometry(roundedRect(w - 2 * bevel, h - 2 * bevel, r), {
    depth: d - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 6,
  });
  g.translate(0, 0, -(d - 2 * bevel) / 2);
  return g;
}

const shutterMat = new THREE.MeshStandardMaterial({ color: '#b9bcbf', metalness: 1, roughness: 0.32 });

/* Returns a Group lying in the XY plane (label facing +z, shutter at +y). */
export function floppy({ project, color = '#25272b', ink }) {
  const g = new THREE.Group();
  g.userData.project = project;
  const shell = new THREE.MeshPhysicalMaterial({ color, roughness: 0.45, clearcoat: 0.25, clearcoatRoughness: 0.5 });
  const body = new THREE.Mesh(roundedSlab(DISK.w, DISK.h, DISK.t, 4, 1.2), shell);
  g.add(body);
  // metal shutter on the top edge, both faces
  for (const s of [1, -1]) {
    const sh = new THREE.Mesh(new THREE.BoxGeometry(DISK.w * 0.56, DISK.h * 0.36, 0.6), shutterMat);
    sh.position.set(-DISK.w * 0.06, DISK.h * 0.32, s * (DISK.t / 2 + 0.2));
    g.add(sh);
  }
  // shutter window recess (dark)
  const win = new THREE.Mesh(new THREE.PlaneGeometry(DISK.w * 0.13, DISK.h * 0.26), new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.8 }));
  win.position.set(-DISK.w * 0.02, DISK.h * 0.32, DISK.t / 2 + 0.55);
  g.add(win);
  // paper label wrapping the lower front
  const lt = tex(labelCanvas({ title: project.label, sub: project.line, n: project.n, ink }));
  const label = new THREE.Mesh(new THREE.PlaneGeometry(DISK.w * 0.8, DISK.h * 0.52),
    new THREE.MeshStandardMaterial({ map: lt, roughness: 0.85 }));
  label.position.set(0, -DISK.h * 0.18, DISK.t / 2 + 0.15);
  g.add(label);
  // write-protect notch
  const notch = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 0.6), new THREE.MeshStandardMaterial({ color: '#0d0d0d' }));
  notch.position.set(DISK.w / 2 - 12, -DISK.h / 2 + 12, DISK.t / 2 + 0.05);
  g.add(notch);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
floppy.size = DISK;

/* Real projects from src/data/projects.js (titles, slugs, one-line claims
 * from `titleEm`). Routes are /projects/<slug> on crvro.com. */
export const PROJECTS = [
  { slug: 'zarvin-one', label: 'ZARVIN ONE', line: 'A personal AI operating system.', n: '06' },
  { slug: 'proof-first', label: 'PROOF FIRST', line: 'Software repair, proven before payment.', n: '07' },
  { slug: 'parcel-engine', label: 'PARCEL ENGINE', line: 'Metes-and-bounds parser and parcel validator.', n: 'G1' },
  { slug: 'openclaw', label: 'OPENCLAW', line: 'A local-first AI workflow system.', n: '02' },
  { slug: 'sidecar', label: 'SIDECAR', line: 'Support drafting grounded in KB content.', n: '01' },
  { slug: 'groundrules', label: 'GROUNDRULES', line: 'Cited first-pass property screening from public records.', n: '05' },
];

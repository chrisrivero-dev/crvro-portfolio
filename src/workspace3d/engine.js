/* CRVRO workspace engine: the approved iteration-03 3D room, made mountable.
 *
 * Production port of m15/src/workspace.js (kept untouched as the prototype archive). What changed:
 *  - createWorkspace({ stage }) instead of module-level side effects, so React can mount, suspend and dispose it;
 *  - the CSS3D screen element is created here and React portals the screen UI into it;
 *  - no review chrome (inspect bar, destination pins, HUD);
 *  - suspend()/resume() stop all rendering and the steam; WebGL context loss is reported, not ignored;
 *  - a LOW quality tier (smaller shadow maps and pixel ratio) for phones.
 * Rendering is on demand: nothing draws unless something changed. */
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { makeCanvas, drawGrain, drawContactShadow } from './textures.js';
import * as props from './props.js';
import * as env from './env.js';
import { buildNotes } from './plans.js';
import { setupSteam } from './steam.js';

/** Resolves once the screen/label font is usable, so canvas textures never bake in a fallback face. */
async function fontsReady() {
  if (!document.fonts?.load) return;
  await Promise.race([
    Promise.all(['500', '600', '700'].map((w) => document.fonts.load(`${w} 20px "JetBrains Mono"`))),
    new Promise((r) => setTimeout(r, 1500)),
  ]).catch(() => {});
}

export async function createWorkspace({ stage, quality = 'high' }) {
  const LOW = quality === 'low';
  await fontsReady();
/* ── dimensions ──────────────────────────────────────────────────── */
const D = {
  screenW: 600, screenH: 400, screenR: 12,
  deskY: -390,
  footH: 14,
  caseW: 780, caseH: 700,
  frontZ: 300,          // front face of the bezel
  bezelDepth: 90,       // front bezel piece, separate from the body
  bodyDepth: 250,       // straight section of the body behind the bezel
  rearDepth: 300,       // tapered CRT housing
  rearW: 560, rearH: 470,
  fillet: 26,
  openW: 650, openH: 450, openR: 30,  // bezel opening
  tunnelDepth: 42,                    // glass recess
};
D.caseBottom = D.deskY + D.footH;
D.caseCy = D.caseBottom + D.caseH / 2;
D.screenCy = D.caseBottom + D.caseH - 60 - D.openH / 2;
D.screenZ = D.frontZ - D.tunnelDepth - 4;
D.backZ = D.frontZ - D.bezelDepth - D.bodyDepth - D.rearDepth;

/* ── stage & renderers ───────────────────────────────────────────── */

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, LOW ? 1.5 : 2));
let VW = stage.clientWidth || window.innerWidth, VH = stage.clientHeight || window.innerHeight;
renderer.setSize(VW, VH);
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.domElement.id = 'gl';
renderer.domElement.setAttribute('aria-hidden', 'true');

// DOM screen layer goes first (behind); the canvas sits above it and
// lets the screen through only where the alpha hole is.
const cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(VW, VH);
cssRenderer.domElement.id = 'css3d';
stage.appendChild(cssRenderer.domElement);
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#2a2622');

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.22;

/* ── camera: three-quarter rest pose + inspection orbit ──────────── */
const camera = new THREE.PerspectiveCamera(34, VW / VH, 10, 12000);
const TARGET = new THREE.Vector3(150, -200, 40);
const VIEWS = {
  threeQuarter: { yaw: 0.40, pitch: 0.22, dist: 2900 },
  front:        { yaw: 0.0,  pitch: 0.22, dist: 3050 },
  side:         { yaw: 1.2,  pitch: 0.3,  dist: 3200 },
  top:          { yaw: 0.2,  pitch: 1.2, dist: 3600 },
};
// optional per-variant framing (iteration 02+); A/B/C define none
const BASE_TARGET = (env.target || TARGET).clone();
TARGET.copy(BASE_TARGET);
Object.assign(VIEWS, env.views || {});
VIEWS.crtFill = { yaw: 0, pitch: 0.02, dist: 700, fitW: 560, target: new THREE.Vector3(0, 40, 254) };   // the screen fills the viewport: the hand-off pose
const REST = VIEWS[env.resolveView('threeQuarter')];
const orbit = { ...REST };
delete orbit.target;

// Views may declare fitW: the world width (units) that must stay visible. On a portrait phone that pushes the camera back instead of cropping.
// `look` is the visitor's own look-around offset (drag), layered on the station's pose and kept within limits by the controller.
const look = { yaw: 0, pitch: 0 };
function applyPose(dYaw = 0, dPitch = 0) {
  const dist = Math.max(orbit.dist, orbit.fitW ? orbit.fitW / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect) : 0);
  const yaw = orbit.yaw + look.yaw + dYaw;
  const pitch = THREE.MathUtils.clamp(orbit.pitch + look.pitch + dPitch, -0.05, 1.35);
  camera.position.set(
    TARGET.x + dist * Math.sin(yaw) * Math.cos(pitch),
    TARGET.y + dist * Math.sin(pitch),
    TARGET.z + dist * Math.cos(yaw) * Math.cos(pitch),
  );
  camera.lookAt(TARGET);
}
applyPose();

/* ── lighting: softbox key (shadowed), cool fill, warm rim ───────── */
const key = new THREE.DirectionalLight('#e9eef5', 2.2); // window daylight, left
key.position.set(-2200, 1700, 900);
key.castShadow = true;
key.shadow.mapSize.set(LOW ? 2048 : 4096, LOW ? 2048 : 4096);   // phones: a quarter of the shadow memory
key.shadow.camera.left = -2200; key.shadow.camera.right = 2200;
key.shadow.camera.top = 1600; key.shadow.camera.bottom = -1600;
key.shadow.camera.near = 100; key.shadow.camera.far = 7000;
key.shadow.radius = 14;
key.shadow.blurSamples = 20;
key.shadow.bias = -0.0004;
scene.add(key);

// warm practical: an off-frame desk lamp, upper right
const deskLamp = new THREE.SpotLight('#ffc98a', 9e6, 0, 0.75, 0.6, 2);
deskLamp.position.set(1500, 900, 700);
deskLamp.target.position.set(500, -390, 100);
deskLamp.castShadow = true;
deskLamp.shadow.mapSize.set(LOW ? 1024 : 2048, LOW ? 1024 : 2048);
deskLamp.shadow.radius = 10;
deskLamp.shadow.blurSamples = 16;
deskLamp.shadow.bias = -0.0005;
scene.add(deskLamp, deskLamp.target);

const fill = new THREE.DirectionalLight('#c9d6e6', 0.25);
fill.position.set(1400, 500, 900);
scene.add(fill);

const rim = new THREE.DirectionalLight('#ffe6c4', 1.0);
rim.position.set(600, 1100, -1600);
scene.add(rim);

// phosphor spill: sits just in front of the tube face but BEHIND the glass
// plane, so it lights the tunnel walls without a hotspot on the glass
const phosphor = new THREE.PointLight('#ff9c3a', 2.6e5, 0, 2);
phosphor.position.set(0, D.screenCy, D.screenZ + 2);
scene.add(phosphor);

/* ── textures ────────────────────────────────────────────────────── */
function canvasTexture(draw, w, h, { srgb = false, repeat = 1 } = {}) {
  const { canvas, ctx } = makeCanvas(w, h);
  draw(ctx, w, h, { canvas, ctx });
  const tex = new THREE.CanvasTexture(canvas);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  return tex;
}

const grainTex = canvasTexture(drawGrain, 256, 256, { repeat: 1 });
const shadowTex = canvasTexture(drawContactShadow, 1240, 620);

/* ── materials ───────────────────────────────────────────────────── */
// Moulded graphite ABS: satin, slightly orange-peeled, faint clearcoat.
const plastic = new THREE.MeshPhysicalMaterial({
  color: '#3a3632',
  roughness: 0.52,
  roughnessMap: grainTex,
  bumpMap: grainTex,
  bumpScale: 0.6,
  clearcoat: 0.18,
  clearcoatRoughness: 0.4,
  metalness: 0,
});
const plasticDark = plastic.clone();
plasticDark.color = new THREE.Color('#2a2725');
plasticDark.roughness = 0.6;
const plasticDeep = plastic.clone();
plasticDeep.color = new THREE.Color('#141211');
plasticDeep.roughness = 0.75;
plasticDeep.clearcoat = 0;
const rubber = new THREE.MeshStandardMaterial({ color: '#121110', roughness: 0.92 });


/* ── geometry helpers ────────────────────────────────────────────── */
function roundedRectPoints(w, h, r, seg = 10, oy = 0) {
  // CCW seen from +z, starting at bottom edge; same count for any w/h/r
  const pts = [];
  const cs = [
    [w / 2 - r, -h / 2 + r, -Math.PI / 2],
    [w / 2 - r, h / 2 - r, 0],
    [-w / 2 + r, h / 2 - r, Math.PI / 2],
    [-w / 2 + r, -h / 2 + r, Math.PI],
  ];
  for (const [cx, cy, a0] of cs) {
    for (let i = 0; i <= seg; i++) {
      const a = a0 + (i / seg) * (Math.PI / 2);
      pts.push([cx + r * Math.cos(a), cy + oy + r * Math.sin(a)]);
    }
  }
  return pts;
}

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  roundedRectPoints(w, h, r).forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  return s;
}
function roundedRectPath(w, h, r, oy = 0) {
  const p = new THREE.Path();
  roundedRectPoints(w, h, r, 10, oy).forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  return p;
}

/* Loft a sequence of rounded-rect sections {w,h,r,z,cy} (front → back).
 * Normals face outward; `inward` flips them (for the screen tunnel). */
function loft(sections, { inward = false, seg = 10 } = {}) {
  const rings = sections.map((s) => roundedRectPoints(s.w, s.h, s.r, seg));
  const n = rings[0].length;
  const pos = [], uv = [], idx = [];
  sections.forEach((s, i) => {
    for (const [x, y] of rings[i]) {
      pos.push(x, y + s.cy, s.z);
      uv.push((x + s.z) / 700, (y + s.cy) / 700);
    }
  });
  for (let i = 0; i < sections.length - 1; i++) {
    for (let j = 0; j < n; j++) {
      const j2 = (j + 1) % n;
      const a = i * n + j, b = i * n + j2, c = (i + 1) * n + j2, d = (i + 1) * n + j;
      if (inward) idx.push(a, b, d, b, c, d);
      else idx.push(a, d, b, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* quarter-round fillet sections from the inset face at z0 out to full size */
function fillet(w, h, r, z0, cy, f, dir, steps = 6) {
  const out = [];
  for (let k = 0; k <= steps; k++) {
    const t = (k / steps) * (Math.PI / 2);
    const inset = f * (1 - Math.sin(t));
    out.push({ w: w - 2 * inset, h: h - 2 * inset, r: Math.max(2, r - inset), z: z0 + dir * f * (1 - Math.cos(t)), cy });
  }
  return out;
}

function cap(shape, z, cy, flip = false) {
  const g = new THREE.ShapeGeometry(shape, 12);
  if (flip) g.rotateY(Math.PI);
  g.translate(0, cy, z);
  return g;
}

const mesh = (geo, mat, { cast = true, receive = true } = {}) => {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
};

/* ── machine ─────────────────────────────────────────────────────── */
const machine = new THREE.Group();
const { caseW: W, caseH: H, fillet: F, caseCy: CY } = D;

/* 1. Front bezel: its own moulding, with a generous front fillet and a
 *    small back fillet, so a real parting gap separates it from the body. */
const zB0 = D.frontZ, zB1 = D.frontZ - D.bezelDepth;
const bezelSections = [
  ...fillet(W, H, 40, zB0, CY, F, -1),
  ...fillet(W, H, 40, zB1, CY, 5, +1).reverse(),
];
machine.add(mesh(loft(bezelSections), plastic));
const front = roundedRectShape(W - 2 * F, H - 2 * F, 40 - F + 2);
front.holes.push(roundedRectPath(D.openW, D.openH, D.openR, D.screenCy - CY));
machine.add(mesh(cap(front, zB0, CY), plastic));

/* 2. Screen tunnel: the bezel opening narrows into a deep recess. */
const tunnel = loft([
  { w: D.openW, h: D.openH, r: D.openR, z: zB0, cy: D.screenCy },
  { w: D.openW - 10, h: D.openH - 10, r: D.openR - 4, z: zB0 - 6, cy: D.screenCy },
  { w: D.screenW + 22, h: D.screenH + 22, r: D.screenR + 8, z: zB0 - D.tunnelDepth, cy: D.screenCy },
], { inward: true });
machine.add(mesh(tunnel, plasticDark));
// tube mask: dark surround between tunnel end and the live screen
const mask = roundedRectShape(D.screenW + 26, D.screenH + 26, D.screenR + 10);
mask.holes.push(roundedRectPath(D.screenW, D.screenH, D.screenR));
machine.add(mesh(cap(mask, D.screenZ, D.screenCy), plasticDeep, { cast: false }));

/* 3. Body: slightly smaller than the bezel and tucked inside it, so the
 *    bezel's back fillet reads as a shadowed seam with no see-through gap. */
const zC0 = zB1 + 12, zC1 = zB1 - D.bodyDepth;
const bodyW = W - 14, bodyH = H - 14;
const bodySections = [
  ...fillet(bodyW, bodyH, 34, zC0, CY, 6, -1),
  { w: bodyW, h: bodyH, r: 34, z: zC1, cy: CY },
];
machine.add(mesh(loft(bodySections), plastic));

/* 4. Tapered CRT housing to a small back plate; bottom stays flat. */
const rearCy = D.caseBottom + 7 + D.rearH / 2;
const backSections = [
  { w: bodyW, h: bodyH, r: 34, z: zC1, cy: CY },
  { w: bodyW - 30, h: bodyH - 40, r: 40, z: zC1 - 60, cy: CY - 17 },
  { w: D.rearW, h: D.rearH, r: 46, z: D.backZ + 20, cy: rearCy },
  ...fillet(D.rearW, D.rearH, 46, D.backZ, rearCy, 20, +1).reverse(),
];
machine.add(mesh(loft(backSections), plastic));
machine.add(mesh(cap(roundedRectShape(D.rearW - 40, D.rearH - 40, 26), D.backZ, rearCy, true), plastic));

/* 5. Lower control band: raised plate with ribs, knob, lamp, badge. */
const bandY = D.caseBottom + 70;
const bandZ = D.frontZ;
const band = new THREE.ExtrudeGeometry(roundedRectShape(D.openW, 84, 14), {
  depth: 4, bevelEnabled: true, bevelThickness: 2.5, bevelSize: 2.5, bevelSegments: 3, curveSegments: 6,
});
const bandMesh = mesh(band, plasticDark);
bandMesh.position.set(0, bandY, bandZ - 2);
machine.add(bandMesh);
const bandFront = bandZ + 4.5;

// 3.5" floppy drive: bezel, slot with dust flap, eject button, busy LED.
// Slot is 96 mm wide (a disk is 90 mm) — sized to the real disk scale.
const DRIVE = { x: -205, w: 96 * props.MM + 24, h: 52 };
const driveBezel = mesh(props.roundedSlab(DRIVE.w, DRIVE.h, 8, 5, 2), plasticDeep);
driveBezel.position.set(DRIVE.x, bandY + 4, bandFront + 2);
machine.add(driveBezel);
const slot = mesh(props.roundedSlab(96 * props.MM, 9, 4, 2, 0.8), new THREE.MeshStandardMaterial({ color: '#050505', roughness: 0.9 }), { cast: false });
slot.position.set(DRIVE.x, bandY + 12, bandFront + 4.6);
machine.add(slot);
const flap = mesh(new THREE.BoxGeometry(96 * props.MM - 10, 5, 1), plasticDark, { cast: false });
flap.position.set(DRIVE.x, bandY + 13, bandFront + 6.4);
machine.add(flap);
const eject = mesh(props.roundedSlab(26, 10, 6, 2, 1), plasticDark);
eject.position.set(DRIVE.x + 70, bandY - 10, bandFront + 6);
machine.add(eject);
const busy = new THREE.Mesh(new THREE.BoxGeometry(9, 4, 2), new THREE.MeshStandardMaterial({ color: '#3a2a10', emissive: '#000000' }));
busy.position.set(DRIVE.x - 70, bandY - 10, bandFront + 6);
machine.add(busy);

// knob: lathed profile with a chamfered face and a pointer line
const knobProfile = [[0, 0], [24, 0], [25, 2], [25, 16], [22, 20], [0, 20]].map(([x, y]) => new THREE.Vector2(x, y));
const knob = mesh(new THREE.LatheGeometry(knobProfile, 64), new THREE.MeshPhysicalMaterial({
  color: '#1d1b19', roughness: 0.35, clearcoat: 0.4, clearcoatRoughness: 0.3,
}));
knob.rotation.x = Math.PI / 2;
knob.position.set(-30, bandY, bandFront);
machine.add(knob);
const pointer = mesh(new THREE.BoxGeometry(3, 16, 2), new THREE.MeshStandardMaterial({ color: '#cfc3ad', roughness: 0.5 }), { cast: false });
pointer.position.set(-30, bandY + 9, bandFront + 20.5);
machine.add(pointer);

// amber power lamp: a domed lens in a bezel ring
const lampRing = mesh(new THREE.TorusGeometry(8, 2.2, 16, 40), plasticDeep);
lampRing.position.set(40, bandY, bandFront + 1);
machine.add(lampRing);
const lamp = new THREE.Mesh(
  new THREE.SphereGeometry(7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
  new THREE.MeshStandardMaterial({ color: '#ffae4a', emissive: '#ff9a2e', emissiveIntensity: 2.4, roughness: 0.2 }),
);
lamp.rotation.x = Math.PI / 2;
lamp.position.set(40, bandY, bandFront);
machine.add(lamp);

// moulded CRVRO badge: a raised plate with bump-mapped lettering
const badge = (() => {
  const w = 512, h = 128;
  const { canvas, ctx } = makeCanvas(w, h);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  ctx.font = '700 84px "JetBrains Mono", "SF Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText('CRVRO', w / 2, h / 2 + 4);
  const bump = new THREE.CanvasTexture(canvas);
  const colorCanvas = makeCanvas(w, h);
  colorCanvas.ctx.fillStyle = '#2a2725';
  colorCanvas.ctx.fillRect(0, 0, w, h);
  colorCanvas.ctx.globalAlpha = 0.45;
  colorCanvas.ctx.drawImage(canvas, 0, 0, w, h); // makeCanvas is supersampled
  const map = new THREE.CanvasTexture(colorCanvas.canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 3, roughness: 0.5, color: '#b3aa9c' });
})();
const badgeGeo = new THREE.BoxGeometry(180, 46, 4);
const badgeMesh = mesh(badgeGeo, [plasticDark, plasticDark, plasticDark, plasticDark, badge, plasticDark]);
badgeMesh.position.set(180, bandY, bandFront + 2);
machine.add(badgeMesh);

/* 6. Side vents: raised ribs on both flanks of the body. */
const sideRib = new THREE.BoxGeometry(5, 5, 170);
for (const sx of [-1, 1]) {
  for (let i = 0; i < 9; i++) {
    const r = mesh(sideRib, plasticDark);
    r.position.set(sx * (bodyW / 2 + 1.5), CY + 140 - i * 14, (zC0 + zC1) / 2);
    machine.add(r);
  }
}

/* 7. Rear: a recessed connector plate on the back cap. */
const port = mesh(new THREE.BoxGeometry(220, 60, 6), plasticDeep);
port.position.set(0, rearCy - 60, D.backZ - 2);
machine.add(port);

/* 8. Feet: lathed rubber pads. */
const footProfile = [[0, 0], [30, 0], [32, 3], [30, D.footH], [0, D.footH]].map(([x, y]) => new THREE.Vector2(x, y));
const footGeo = new THREE.LatheGeometry(footProfile, 40);
for (const [fx, fz] of [[-1, D.frontZ - 80], [1, D.frontZ - 80], [-0.6, D.backZ + 80], [0.6, D.backZ + 80]]) {
  const foot = mesh(footGeo, rubber);
  foot.position.set(fx * (W / 2 - 90), D.deskY, fz);
  machine.add(foot);
}

scene.add(machine);

/* ── screen: alpha hole + additive glass over the live DOM ───────── */
const hole = new THREE.Mesh(
  cap(roundedRectShape(D.screenW, D.screenH, D.screenR), D.screenZ, D.screenCy),
  // NoBlending + opacity 0 writes rgba(0,0,0,0): the canvas becomes
  // transparent here (while still writing depth), revealing the DOM.
  new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0, blending: THREE.NoBlending, toneMapped: false }),
);
machine.add(hole);

const glass = new THREE.Mesh(
  cap(roundedRectShape(D.screenW + 22, D.screenH + 22, D.screenR + 8), D.frontZ - D.tunnelDepth + 1, D.screenCy),
  new THREE.MeshPhysicalMaterial({
    color: '#000000', roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05,
    envMapIntensity: 2.2, transparent: true, depthWrite: false,
    // add reflected light to colour but leave destination alpha at 0, so the
    // compositor adds the reflection over the DOM screen behind the hole
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
  }),
);
glass.renderOrder = 10;
machine.add(glass);

/* ── desk + baked contact shadow ─────────────────────────────────── */
const built = env.build({ THREE, scene, D, props, mesh, machine, plastic, plasticDark, plasticDeep, rubber, renderer });
const notes = built.sheet ? buildNotes({ THREE, scene, sheet: built.sheet }) : [];

// optional per-variant light grade (iteration 02+); A/B/C define none
env.lighting?.({ THREE, scene, renderer, key, deskLamp, fill, rim, phosphor, D });

const contact = new THREE.Mesh(
  new THREE.PlaneGeometry(1150, 900),
  new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.9 }),
);
contact.rotation.x = -Math.PI / 2;
contact.position.set(0, D.deskY + 0.8, (D.frontZ + D.backZ) / 2);
scene.add(contact);

/* ── CSS3D screen: real DOM, crisp + accessible ──────────────────── */
const screenEl = document.createElement('div');
screenEl.id = 'screen';
screenEl.className = 'ws3d-screen';
const screenObj = new CSS3DObject(screenEl);
screenObj.position.set(0, D.screenCy, D.screenZ);
scene.add(screenObj);

  /* ── runtime: on-demand rendering, camera tweens, suspend, context loss ── */
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let suspended = false, disposed = false, lost = false, framePending = false, frames = 0;
  const cleanups = [];
  const on = (target, ev, fn, opts) => { target.addEventListener(ev, fn, opts); cleanups.push(() => target.removeEventListener(ev, fn, opts)); };
  const hub = {};
  const emit = (name, ...a) => (hub[name] || []).forEach((f) => f(...a));
  const listen = (name, fn) => { (hub[name] ||= []).push(fn); return () => { hub[name] = hub[name].filter((f) => f !== fn); }; };

  function renderOnce() {
    if (suspended || disposed || lost) return;
    renderer.render(scene, camera);
    cssRenderer.render(scene, camera);
    frames++;
  }
  function markDirty() {
    if (framePending || suspended || disposed) return;
    framePending = true;
    requestAnimationFrame(() => { framePending = false; renderOnce(); });
  }

  const EASE = { io: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), out: (t) => 1 - Math.pow(1 - t, 3) };
  /** Runs step(e) over ms. Resolves true when finished, false when alive() went false first. Reduced motion: one jump-cut step. */
  function run(ms, step, alive = () => true, easing = EASE.io) {
    return new Promise((res) => {
      if (reduceMotion.matches || ms <= 0) { step(1); markDirty(); res(alive()); return; }
      const t0 = performance.now();
      const f = (now) => {
        if (!alive() || disposed) { res(false); return; }
        const t = Math.min(1, (now - t0) / ms);
        step(easing(t));
        markDirty();
        if (t < 1) requestAnimationFrame(f); else res(true);
      };
      requestAnimationFrame(f);
    });
  }
  const viewOf = (name) => VIEWS[env.resolveView(name)] || VIEWS[name];
  /** Fly to a view. `endLook` is where the look-around offset ends up (default: centred on the view). */
  function flyTo(view, ms = 1000, alive, endLook = { yaw: 0, pitch: 0 }) {
    const { target, ...pose } = typeof view === 'string' ? viewOf(view) : view;
    const from = { yaw: orbit.yaw, pitch: orbit.pitch, dist: orbit.dist, fitW: orbit.fitW || 0, t: TARGET.clone(), ly: look.yaw, lp: look.pitch };
    const to = { fitW: 0, ...pose };
    const tt = (target || BASE_TARGET).clone();
    cur.yaw = cur.pitch = tgt.yaw = tgt.pitch = 0;
    return run(ms, (e) => {
      for (const k of ['yaw', 'pitch', 'dist', 'fitW']) orbit[k] = from[k] + (to[k] - from[k]) * e;
      TARGET.lerpVectors(from.t, tt, e);
      look.yaw = from.ly + (endLook.yaw - from.ly) * e;
      look.pitch = from.lp + (endLook.pitch - from.lp) * e;
      applyPose();
    }, alive);
  }
  function setLook(yaw, pitch) { look.yaw = yaw; look.pitch = pitch; applyPose(); markDirty(); }
  function setView(name) {
    const { target, ...pose } = viewOf(name);
    TARGET.copy(target || BASE_TARGET);
    Object.assign(orbit, pose);
    orbit.fitW = pose.fitW;
    look.yaw = look.pitch = 0;
    cur.yaw = cur.pitch = tgt.yaw = tgt.pitch = 0;
    applyPose();
    markDirty();
  }

  // gentle pointer parallax at rest; locked while the camera is working at the screen
  const PARALLAX = { yaw: 0.045, pitch: 0.028 };
  const cur = { yaw: 0, pitch: 0 }, tgt = { yaw: 0, pitch: 0 };
  let parallaxLocked = false, easing = false, settle = 0;
  function easeParallax() {
    const dY = tgt.yaw - cur.yaw, dP = tgt.pitch - cur.pitch;
    if (Math.abs(dY) < 1e-4 && Math.abs(dP) < 1e-4) { cur.yaw = tgt.yaw; cur.pitch = tgt.pitch; applyPose(cur.yaw, cur.pitch); markDirty(); easing = false; return; }
    cur.yaw += dY * 0.22; cur.pitch += dP * 0.22;
    applyPose(cur.yaw, cur.pitch);
    markDirty();
    requestAnimationFrame(easeParallax);
  }
  on(stage, 'pointermove', (e) => {
    if (parallaxLocked || suspended || reduceMotion.matches || e.pointerType === 'touch') return;
    const r = stage.getBoundingClientRect();
    tgt.yaw = -(((e.clientX - r.left) / r.width) * 2 - 1) * PARALLAX.yaw * 0.6;
    tgt.pitch = (((e.clientY - r.top) / r.height) * 2 - 1) * PARALLAX.pitch * 0.6;
    clearTimeout(settle);
    if (!easing) { easing = true; easeParallax(); }
    settle = setTimeout(() => { tgt.yaw = 0; tgt.pitch = 0; }, 150);
  }, { passive: true });

  function resize() {
    VW = stage.clientWidth || window.innerWidth; VH = stage.clientHeight || window.innerHeight;
    if (!VW || !VH) return;
    camera.aspect = VW / VH;
    camera.updateProjectionMatrix();
    renderer.setSize(VW, VH);
    cssRenderer.setSize(VW, VH);
    applyPose();
    markDirty();
  }
  const ro = new ResizeObserver(() => resize());
  ro.observe(stage);
  cleanups.push(() => ro.disconnect());

  // A lost context is not fatal to three (it re-initialises on restore), but the page must know: the owner decides when to give up.
  on(renderer.domElement, 'webglcontextlost', () => { lost = true; emit('contextlost'); });
  on(renderer.domElement, 'webglcontextrestored', () => { lost = false; markDirty(); emit('contextrestored'); });

  const steam = setupSteam({ THREE, scene, camera, markDirty, reduceMotion, origin: env.getMugTop() });

  /** Stop all work (no frames, no steam timer). The scene stays in memory so coming back is instant. */
  function suspend() { suspended = true; steam.suspend(); parallaxLocked = true; }
  function resume() { suspended = false; parallaxLocked = false; steam.resume(); resize(); markDirty(); }

  function dispose() {
    disposed = true;
    steam.stop();
    cleanups.forEach((f) => f());
    scene.traverse((o) => {
      o.geometry?.dispose?.();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const m of mats) { for (const v of Object.values(m)) if (v && v.isTexture) v.dispose(); m.dispose?.(); }
    });
    pmrem.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    cssRenderer.domElement.remove();
  }

  applyPose();
  markDirty();

  return {
    THREE, scene, camera, machine, renderer, screenEl, stage, D, EASE,
    diskList: built.diskList || [],
    tray: built.tray,
    sheet: built.sheet, mug: built.mug, notes,
    driveSlot: machine.localToWorld(new THREE.Vector3(DRIVE.x, bandY + 12, bandFront + 4.6)),
    reduceMotion, run, flyTo, setView, markDirty, suspend, resume, dispose, on: listen,
    look, setLook,
    lockParallax: (v) => { parallaxLocked = v; if (v) { tgt.yaw = tgt.pitch = 0; } },
    get frames() { return frames; },
    get suspended() { return suspended; },
    get lost() { return lost; },
  };
}

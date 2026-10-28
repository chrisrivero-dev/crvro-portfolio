/* 06 career notebook: a surveyor's field book lying on the desk.
 *
 * Closed it is a cloth-bound book with copper corners, a typed label and an amber ribbon. Opened (cover swung over the
 * spine, leaves turned) it is the physical surface the reading page is laid on. The words themselves are real DOM
 * (src/components/CareerContent.jsx), placed over the right-hand page from its projected corners, so they stay crisp,
 * selectable and readable on a phone; the 3D leaves are plain ruled paper and carry no text that matters.
 *
 * Frame: x to the right across the pages, z toward the visitor along the page height, y up; the spine is at x = -w/2.
 * Everything is built once, driven by three numbers (cover angle, three leaf angles), and added to the scene, so
 * engine.dispose() releases its geometries, materials and canvas textures with the rest of the room. */
import { tex, canvas } from './props.js';

export const BOOK = { w: 220, h: 320, block: 24, cov: 5 };
const T = BOOK.block + 2 * BOOK.cov;
const DELTA = Math.asin((BOOK.block + BOOK.cov - 5) / BOOK.w);   // an open cover slopes from the spine down to the desk, like a real one
export const LEAVES = 3;                                         // one per notebook page
const OPEN = Math.PI + DELTA;
const PIVOT_Y = BOOK.cov + BOOK.block;                           // top of the page block: the hinge line for the cover and the leaves

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

const clothCanvas = () => {
  const { c, x } = canvas(256, 256); const r = rng(5);
  x.fillStyle = '#34493d'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 256; i += 2) { x.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.05})`; x.fillRect(i, 0, 1, 256); x.fillStyle = `rgba(255,255,255,${0.02 + r() * 0.03})`; x.fillRect(0, i, 256, 1); }
  for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${r() * 0.05})`; x.fillRect(r() * 256, r() * 256, 2, 2); }
  return c;
};

const labelCanvas = () => {
  const { c, x } = canvas(448, 256);
  x.fillStyle = '#eadfc6'; x.fillRect(0, 0, 448, 256);
  for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(90,70,40,${Math.random() * 0.05})`; x.fillRect(Math.random() * 448, Math.random() * 256, 2, 2); }
  x.strokeStyle = '#8a4a26'; x.lineWidth = 4; x.strokeRect(12, 12, 424, 232);
  x.lineWidth = 1.5; x.strokeRect(22, 22, 404, 212);
  x.fillStyle = '#1b1712'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = '700 40px "JetBrains Mono", "Courier New", monospace'; x.fillText('CAREER LEDGER', 224, 78);
  x.fillStyle = '#8a4a26'; x.fillRect(84, 110, 280, 3);
  x.fillStyle = '#1b1712'; x.font = '600 34px "JetBrains Mono", "Courier New", monospace'; x.fillText('C. RIVERO', 224, 158);
  x.font = '500 22px "JetBrains Mono", "Courier New", monospace'; x.fillStyle = '#3d382f'; x.fillText('FIELD BOOK · 2007 —', 224, 204);
  return c;
};

/** Ruled and gridded paper with a little age. `inside`: the pasted-down endpaper, which lists the pages. */
const pageCanvas = ({ inside = false, seed = 7 } = {}) => {
  const W = 512, H = 740, r = rng(seed);
  const { c, x } = canvas(W, H);
  x.fillStyle = inside ? '#e4d8bd' : '#efe6cf'; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(70, 105, 140, 0.18)'; x.lineWidth = 1;
  for (let gx = 0; gx <= W; gx += 20) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, H); x.stroke(); }
  for (let gy = 0; gy <= H; gy += 20) { x.beginPath(); x.moveTo(0, gy); x.lineTo(W, gy); x.stroke(); }
  x.strokeStyle = 'rgba(160, 60, 45, 0.35)'; x.lineWidth = 2; x.beginPath(); x.moveTo(56, 0); x.lineTo(56, H); x.stroke();
  for (let i = 0; i < 2200; i++) { x.fillStyle = `rgba(110,80,40,${r() * 0.05})`; x.fillRect(r() * W, r() * H, 2 + r() * 3, 2 + r() * 3); }
  const v = x.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(90,60,25,0.22)');
  x.fillStyle = v; x.fillRect(0, 0, W, H);
  if (inside) {
    x.fillStyle = '#2a251d'; x.textAlign = 'center';
    x.font = '700 30px "JetBrains Mono", "Courier New", monospace'; x.fillText('IF FOUND, RETURN TO', W / 2, 120);
    x.font = '600 34px "JetBrains Mono", "Courier New", monospace'; x.fillText('C. RIVERO', W / 2, 170);
    x.fillStyle = '#8a4a26'; x.fillRect(120, 204, 272, 3);
    x.textAlign = 'left'; x.fillStyle = '#2a251d'; x.font = '600 28px "JetBrains Mono", "Courier New", monospace';
    ['I     WORK HISTORY', 'II    HIGHLIGHTS', 'III   RÉSUMÉ · CONTACT'].forEach((t, i) => x.fillText(t, 78, 290 + i * 54));
  }
  return c;
};

const edgeCanvas = () => {
  const { c, x } = canvas(64, 64);
  x.fillStyle = '#e8dec6'; x.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 64; i += 2) { x.fillStyle = `rgba(90,75,50,${0.08 + (i % 6) * 0.015})`; x.fillRect(0, i, 64, 1); }
  return c;
};

/** Builds the book. `places.desk` is where the closed book lies on the desk ({ x, y, z, rot } of its centre) and where it is read;
 *  `places.shelf` (optional: { x, y, z, rot, lean }) is where it stands, cover out, on the wall shelf. On a portrait phone the desk's
 *  left side is outside the frame but the shelf is inside it, so the book rests on the shelf there and is carried to the desk to be read. */
export function buildNotebook({ THREE, scene, places }) {
  const { w, h, block, cov } = BOOK;
  const g = new THREE.Group();
  g.name = 'career-notebook';
  const spot = (pl) => {
    const e = pl.lean == null ? new THREE.Euler(0, pl.rot, 0, 'YXZ') : new THREE.Euler(Math.PI / 2 - pl.lean, pl.rot, 0, 'YXZ');   // lying flat, or standing cover-out and leaning back
    return { pos: new THREE.Vector3(pl.x, pl.y, pl.z), quat: new THREE.Quaternion().setFromEuler(e), rot: pl.rot };
  };
  const DESK = spot(places.desk), SHELF = places.shelf ? spot(places.shelf) : null;
  g.rotation.order = 'YXZ';

  const cloth = new THREE.MeshStandardMaterial({ map: tex(clothCanvas(), { repeat: 3 }), color: '#c9d4cc', roughness: 0.9 });
  const copper = new THREE.MeshStandardMaterial({ color: '#b3703c', metalness: 0.85, roughness: 0.38 });
  const pageMap = tex(pageCanvas());
  const paper = new THREE.MeshStandardMaterial({ map: pageMap, roughness: 0.95 });
  const endpaper = new THREE.MeshStandardMaterial({ map: tex(pageCanvas({ inside: true, seed: 9 })), roughness: 0.95 });
  const edgeMap = tex(edgeCanvas()); edgeMap.repeat.set(1, 1);
  const edge = new THREE.MeshStandardMaterial({ map: edgeMap, roughness: 0.95 });
  const ribbonM = new THREE.MeshStandardMaterial({ color: '#c98a2e', roughness: 0.6 });
  const labelM = new THREE.MeshStandardMaterial({ map: tex(labelCanvas(), { aniso: 16 }), roughness: 0.85 });

  const slab = (sx, sy, sz, mat, px, py, pz) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    m.position.set(px, py, pz);
    m.castShadow = m.receiveShadow = true;
    return m;
  };

  // back cover, spine and the page block
  g.add(slab(w, cov, h, cloth, 0, cov / 2, 0));
  g.add(slab(8, PIVOT_Y, h, cloth, -w / 2 - 2, PIVOT_Y / 2, 0));
  const lw = w - 12, lh = h - 8;                       // a leaf is a little smaller than the cover
  g.add(slab(lw + 4, block, lh - 2, [edge, edge, paper, edge, edge, edge], 3, cov + block / 2, 0));

  // front cover: hinged at the top of the page block along the spine, inner face (the endpaper) on the hinge line
  const cover = new THREE.Group();
  cover.position.set(-w / 2, PIVOT_Y, 0);
  cover.add(slab(w + 6, cov, h, cloth, w / 2 - 3, cov / 2, 0));
  for (const sz of [-1, 1]) {
    const cap = slab(24, cov + 1.4, 24, copper, w - 10, cov / 2, sz * (h / 2 - 10));
    cap.castShadow = false;
    cover.add(cap);
  }
  const label = new THREE.Mesh(new THREE.PlaneGeometry(112, 64), labelM);
  label.rotation.x = -Math.PI / 2;
  label.position.set(w / 2 + 6, cov + 0.2, -30);
  label.receiveShadow = true;
  cover.add(label);
  const inner = new THREE.Mesh(new THREE.PlaneGeometry(w - 8, h - 8), endpaper);
  inner.rotation.set(Math.PI / 2, 0, Math.PI);          // faces down while closed, face up (and upright, as read from the front) once open
  inner.position.set(w / 2 - 3, -0.06, 0);
  inner.receiveShadow = true;
  cover.add(inner);
  g.add(cover);

  // leaves: one per page, stacked on the right, hinged at the spine; a turned leaf lies on the left over the cover
  const leaves = [];
  for (let i = 0; i < LEAVES; i++) {
    const p = new THREE.Group();
    p.position.set(-w / 2 + 5, PIVOT_Y + 0.25 + 0.4 * (LEAVES - i), 0);
    const front = new THREE.Mesh(new THREE.PlaneGeometry(lw, lh), paper);
    front.rotation.x = -Math.PI / 2; front.position.set(lw / 2, 0, 0);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(lw, lh), paper);
    back.rotation.set(Math.PI / 2, 0, Math.PI); back.position.set(lw / 2, -0.02, 0);
    front.receiveShadow = back.receiveShadow = true;
    p.add(front, back);
    g.add(p);
    leaves.push(p);
  }

  // amber ribbon marker: the one cue that this book is meant to be opened (it hangs out of the closed book's lower edge)
  const rib = new THREE.Group();                                           // hinged where it leaves the page block, so it can lie flat on the shelf when the book stands
  rib.position.set(-w / 2 + 44, PIVOT_Y, h / 2 - 2);
  const ribbon = slab(9, 0.9, 62, ribbonM, 0, 0, 31);
  ribbon.castShadow = false;
  const tail = new THREE.Mesh(new THREE.PlaneGeometry(9, 14), ribbonM);   // swallow-tail end
  tail.rotation.x = -Math.PI / 2; tail.position.set(0, 0.5, 66);
  rib.add(ribbon, tail);
  g.add(rib);

  // a larger invisible slab: the fingertip target for the closed book (raycasts ignore `visible`, so it is flagged for the picker)
  const hit = new THREE.Mesh(new THREE.BoxGeometry(w + 40, 70, h + 40), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(0, 30, 0);
  hit.userData.proxy = true;
  g.add(hit);

  scene.add(g);

  const portrait = () => !!SHELF && matchMedia('(max-aspect-ratio: 4/5)').matches;
  const restSpot = () => (portrait() ? SHELF : DESK);
  /** Put the book between its resting place (t = 0) and the desk spot where it is read (t = 1), lifting it on the way. */
  function carry(t) {
    const from = restSpot();
    g.position.lerpVectors(from.pos, DESK.pos, t);
    g.position.y += Math.sin(Math.PI * t) * 150;
    g.quaternion.slerpQuaternions(from.quat, DESK.quat, t);
    rib.rotation.x = from === SHELF ? -(Math.PI / 2) * Math.max(0, 1 - t * 4) + 0.012 : 0;   // standing: the ribbon lies along the shelf; lifted: it hangs out of the lower edge again
    g.updateMatrixWorld(true);
  }
  carry(0);

  const api = {
    group: g,
    portrait, carry,
    /** Cover swing 0..1 and the leaves already turned (an array of 0..1 each). */
    pose(open, turned) {
      cover.rotation.z = open * OPEN;
      leaves.forEach((p, i) => { p.rotation.z = (turned[i] || 0) * OPEN; });
    },
    /** World corners of the right-hand page, clockwise from its top-left (as seen from the front). */
    pageCorners() {
      const x0 = -w / 2 + 5, y0 = PIVOT_Y + 0.9;
      g.updateMatrixWorld(true);
      return [[x0, -lh / 2], [x0 + lw, -lh / 2], [x0 + lw, lh / 2], [x0, lh / 2]].map(([px, pz]) => g.localToWorld(new THREE.Vector3(px, y0, pz)));
    },
    /** The camera pose that reads the open book: straight over it, upright, framed in the space the dock and the mode switch leave free. */
    readingView({ aspect, fov, vw, vh, top, bottom }) {
      const spread = aspect > 1.05;
      const cx = spread ? (-w * Math.cos(DELTA)) / 2 : -1;      // centre of the spread (open cover to the back cover's edge), or of the right page
      const fitW = (spread ? w * (1 + Math.cos(DELTA)) : lw) + 36;
      const fitH = h + 30;
      const pitch = 1.45;                                       // nearly overhead, so the page is a rectangle on screen (and its DOM text matches it)
      const usable = Math.max(120, vh - top - bottom);
      const upp = Math.max((fitH * Math.sin(pitch)) / usable, fitW / (vw * 0.98));              // world units per CSS pixel on the book
      const dist = Math.max(360, (upp * vh) / (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2))));
      // always the desk spot, wherever the book is resting right now
      const center = new THREE.Vector3(cx, PIVOT_Y, 0).applyQuaternion(DESK.quat).add(DESK.pos);
      const shiftPx = top + usable / 2 - vh / 2;                                                // the book sits centred in the free space
      const up = new THREE.Vector3(-Math.sin(DESK.rot), 0, -Math.cos(DESK.rot));                // toward the head of the page
      const target = center.addScaledVector(up, (shiftPx * upp) / Math.sin(pitch));
      return { yaw: DESK.rot, pitch, dist, fitW: 0, target };
    },
  };
  api.pose(0, []);
  return api;
}

export const BOOK_OPEN = OPEN;

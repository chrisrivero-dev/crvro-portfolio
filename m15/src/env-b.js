/* Variant B — retro software studio.
 * Steel desk with a green linoleum top. The machine gains its keyboard and
 * an external modem; the project disks live in a flip-top case beside the
 * drive, with two disks out on the desk as if in use. An open grid
 * notebook and a pinned systems sketch complete the working surface. */
import { room, deskTop, box, DESK_FRONT } from './env-common.js';

function gridPaper(lines = true) {
  const W = 512, H = 720;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = '#efe8d6'; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(60,110,140,0.25)';
  for (let g = 16; g < W; g += 16) { x.beginPath(); x.moveTo(g, 0); x.lineTo(g, H); x.stroke(); }
  for (let g = 16; g < H; g += 16) { x.beginPath(); x.moveTo(0, g); x.lineTo(W, g); x.stroke(); }
  if (lines) {
    x.strokeStyle = 'rgba(30,40,60,0.7)'; x.lineWidth = 2;
    for (let y = 60; y < H - 60; y += 34) {
      x.beginPath(); x.moveTo(40, y); x.lineTo(40 + 120 + Math.random() * 300, y + (Math.random() - 0.5) * 3); x.stroke();
    }
  }
  return c;
}

/* An unlabelled block-and-arrow sketch: shapes only, no invented claims. */
function systemsSketch() {
  const W = 900, H = 640;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = '#f1ead8'; x.fillRect(0, 0, W, H);
  x.strokeStyle = '#26303d'; x.lineWidth = 4;
  const nodes = [[90, 90], [380, 70], [680, 110], [160, 330], [460, 300], [720, 380], [300, 520], [600, 540]];
  for (const [a, b] of [[0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4], [4, 5], [3, 6], [4, 7], [6, 7]]) {
    x.beginPath(); x.moveTo(nodes[a][0] + 60, nodes[a][1] + 30); x.lineTo(nodes[b][0] + 60, nodes[b][1] + 30); x.stroke();
  }
  for (const [nx, ny] of nodes) {
    x.fillStyle = '#f1ead8'; x.fillRect(nx, ny, 120, 60);
    x.strokeRect(nx, ny, 120, 60);
    x.fillStyle = 'rgba(38,48,61,0.5)'; x.fillRect(nx + 14, ny + 22, 70, 6); x.fillRect(nx + 14, ny + 36, 50, 6);
  }
  x.fillStyle = '#b8863b'; x.fillRect(nodes[4][0], nodes[4][1], 120, 8);
  return c;
}

export function build({ THREE, scene, props, plasticDark, plasticDeep }) {
  room(scene, { wall: '#bdb6a6' });
  const lino = new THREE.MeshStandardMaterial({ map: props.tex(props.linoleumTexture({ base: '#56604f' }), { repeat: 3 }), roughness: 0.6 });
  deskTop(scene, { mat: lino, thick: 40 });
  // aluminium edge band
  const alu = new THREE.MeshStandardMaterial({ color: '#a9aaa6', metalness: 1, roughness: 0.38 });
  scene.add(box(5600, 44, 8, alu, [0, -412, DESK_FRONT + 4]));

  /* keyboard: compact, with individual keycaps */
  const KB = new THREE.Group();
  KB.add(box(660, 34, 230, plasticDark, [0, 17, 0]));
  const cap = new THREE.BoxGeometry(36, 14, 34);
  const capMat = new THREE.MeshStandardMaterial({ color: '#3a3632', roughness: 0.55 });
  const keys = new THREE.InstancedMesh(cap, capMat, 15 * 5);
  const m = new THREE.Matrix4();
  let k = 0;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 15; c++) {
    m.makeTranslation(-292 + c * 41.5 + (r % 2) * 8, 38 + r * 2, -80 + r * 40);
    keys.setMatrixAt(k++, m);
  }
  keys.castShadow = keys.receiveShadow = true;
  KB.add(keys);
  KB.rotation.x = -0.05;
  KB.position.set(0, -390, 470);
  scene.add(KB);

  /* modem: future Contact destination */
  const modem = new THREE.Group();
  modem.add(box(360, 70, 280, plasticDark, [0, 35, 0]));
  const ledMat = new THREE.MeshStandardMaterial({ color: '#331a0a', emissive: '#ff8a2a', emissiveIntensity: 1.6 });
  for (let i = 0; i < 6; i++) modem.add(box(12, 6, 3, i % 3 ? plasticDeep : ledMat, [-120 + i * 34, 46, 141]));
  modem.position.set(820, -390, -360);
  modem.rotation.y = -0.25;
  scene.add(modem);

  /* flip-top disk case with the project disks */
  const Dk = props.floppy.size;
  const smoke = new THREE.MeshPhysicalMaterial({ color: '#2b2622', roughness: 0.12, transparent: true, opacity: 0.6 });
  const caseG = new THREE.Group();
  const cw = Dk.w + 24, cd = 4 * 24 + 26, ch = Dk.h * 0.55;
  caseG.add(box(cw, ch, cd, plasticDeep, [0, ch / 2, 0]));
  const lid = box(cw, 4, cd, smoke, [0, ch + cd / 2 - 6, -cd / 2]);
  lid.rotation.x = -1.2;
  caseG.add(lid);
  const disks = [];
  const colors = ['#24262a', '#2f3e52', '#24262a', '#d8d2c4'];
  props.PROJECTS.slice(2).forEach((p, i) => {
    const d = props.floppy({ project: p, color: colors[i] });
    d.position.set(0, ch + Dk.h * 0.2, cd / 2 - 20 - i * 24);
    d.rotation.x = -0.22;
    caseG.add(d);
    disks.push(d);
  });
  caseG.position.set(700, -390, 140);
  caseG.rotation.y = -0.4;
  scene.add(caseG);
  // two disks out on the desk, near the drive
  props.PROJECTS.slice(0, 2).forEach((p, i) => {
    const d = props.floppy({ project: p, color: ['#24262a', '#7a2e24'][i] });
    d.rotation.set(-Math.PI / 2, 0, 0.25 - i * 0.5);
    d.position.set(-560 + i * 120, -390 + Dk.t / 2 + i * Dk.t, 470 - i * 60);
    scene.add(d);
    disks.push(d);
  });

  /* open notebook: two pages in a shallow V */
  const nb = new THREE.Group();
  const page = new THREE.PlaneGeometry(300, 420);
  const pL = new THREE.Mesh(page, new THREE.MeshStandardMaterial({ map: props.tex(gridPaper()), roughness: 0.95 }));
  const pR = new THREE.Mesh(page, new THREE.MeshStandardMaterial({ map: props.tex(gridPaper(false)), roughness: 0.95 }));
  pL.rotation.set(-Math.PI / 2, -0.06, 0); pL.position.set(-150, 8, 0);
  pR.rotation.set(-Math.PI / 2, 0.06, 0); pR.position.set(150, 8, 0);
  pL.receiveShadow = pR.receiveShadow = true;
  nb.add(pL, pR, box(620, 6, 430, new THREE.MeshStandardMaterial({ color: '#7a2e24', roughness: 0.8 }), [0, 3, 0]));
  nb.position.set(-1180, -390, 260);
  nb.rotation.y = 0.18;
  scene.add(nb);

  /* pinned systems sketch on the wall (future Skills) */
  const sk = new THREE.Mesh(new THREE.PlaneGeometry(900, 640), new THREE.MeshStandardMaterial({ map: props.tex(systemsSketch()), roughness: 0.9 }));
  sk.position.set(-1000, 520, -895);
  sk.rotation.z = -0.02;
  sk.receiveShadow = true;
  scene.add(sk);

  return {
    disks,
    destinations: [
      { object: 'Computer', dest: 'Project World', pos: new THREE.Vector3(0, 380, 200), now: true },
      { object: 'Disk case + loose disks', dest: 'case studies', pos: new THREE.Vector3(700, -200, 140), now: true },
      { object: 'Notebook', dest: 'About', pos: new THREE.Vector3(-1180, -380, 260) },
      { object: 'Systems sketch', dest: 'Skills', pos: new THREE.Vector3(-1000, 520, -880) },
      { object: 'Modem', dest: 'Contact', pos: new THREE.Vector3(820, -300, -360) },
    ],
  };
}

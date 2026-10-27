/* Variant C — technical archive.
 * The machine sits on a steel flat-file (map) cabinet, so the furniture
 * itself carries the cartographic hint. The project disks are filed in a
 * long index tray with a labelled divider per project; binders of records
 * stand against the wall; a bound logbook lies open-ready at the front. */
import { room, box, DESK_FRONT, DESK_BACK, FLOOR_Y } from './env-common.js';

function cardCanvas(text, w = 256, h = 96, paper = '#efe8d6') {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = paper; x.fillRect(0, 0, w, h);
  x.fillStyle = '#1d2430';
  let size = 40;
  x.font = `700 ${size}px "JetBrains Mono", monospace`;
  while (x.measureText(text).width > w - 20 && size > 14) x.font = `700 ${(size -= 2)}px "JetBrains Mono", monospace`;
  x.textBaseline = 'middle';
  x.fillText(text, 10, h / 2 + 2);
  return c;
}

export function build({ THREE, scene, props, plasticDeep }) {
  room(scene, { wall: '#c4bcac', floor: '#2f2a25' });
  const steel = new THREE.MeshStandardMaterial({ color: '#6c7266', metalness: 0.55, roughness: 0.48 });
  const steelDark = new THREE.MeshStandardMaterial({ color: '#4c5149', metalness: 0.5, roughness: 0.55 });
  const brass = new THREE.MeshStandardMaterial({ color: '#a88a52', metalness: 1, roughness: 0.35 });

  /* flat-file cabinet: top slab + shallow drawers to the floor */
  const cabW = 3400, depth = DESK_FRONT - DESK_BACK, H = -390 - FLOOR_Y;
  scene.add(box(cabW, 30, depth, steel, [0, -405, (DESK_FRONT + DESK_BACK) / 2]));
  scene.add(box(cabW - 20, H - 30, depth - 40, steelDark, [0, FLOOR_Y + (H - 30) / 2, (DESK_FRONT + DESK_BACK) / 2 - 20]));
  const rows = 7, dh = (H - 60) / rows;
  for (let r = 0; r < rows; r++) {
    const y = -420 - dh / 2 - r * dh;
    for (const half of [-1, 1]) {
      const cx = half * cabW / 4;
      scene.add(box(cabW / 2 - 24, dh - 10, 16, steel, [cx, y, DESK_FRONT - 12]));
      scene.add(box(260, 14, 14, brass, [cx, y - dh * 0.2, DESK_FRONT + 4]));
      const card = new THREE.Mesh(new THREE.PlaneGeometry(130, 46), new THREE.MeshStandardMaterial({ map: props.tex(cardCanvas(['SHEETS', 'PLATS', 'SURVEY', 'CAD', 'INDEX', 'RECORD', 'DRAFTS'][(r + (half > 0 ? 3 : 0)) % 7])), roughness: 0.9 }));
      card.position.set(cx, y + dh * 0.15, DESK_FRONT + 0.5);
      scene.add(card);
      scene.add(box(140, 54, 4, brass, [cx, y + dh * 0.15, DESK_FRONT - 2]));
    }
  }

  /* index tray: disks filed upright, a labelled divider before each */
  const Dk = props.floppy.size;
  const tray = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ map: props.tex(props.woodTexture({ base: '#7a5638', seed: 7 })), roughness: 0.55 });
  const L = 760, tw = Dk.w + 30, th = Dk.h * 0.45;
  tray.add(box(tw, 10, L, wood, [0, 5, 0]));
  tray.add(box(12, th, L, wood, [-tw / 2, th / 2, 0]));
  tray.add(box(12, th, L, wood, [tw / 2, th / 2, 0]));
  tray.add(box(tw, th, 12, wood, [0, th / 2, -L / 2]));
  tray.add(box(tw, th * 0.6, 12, wood, [0, th * 0.3, L / 2]));
  const disks = [];
  let z = L / 2 - 30;
  props.PROJECTS.forEach((p, i) => {
    const tg = new THREE.Group();
    const t = new THREE.Mesh(new THREE.BoxGeometry(Dk.w + 8, Dk.h + 4, 1.5), new THREE.MeshStandardMaterial({ color: '#cdbf9f', roughness: 0.9 }));
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(110, 34), new THREE.MeshStandardMaterial({ map: props.tex(cardCanvas(p.label, 256, 80)), roughness: 0.9 }));
    const tabTop = new THREE.Mesh(new THREE.BoxGeometry(120, 40, 1.5), new THREE.MeshStandardMaterial({ color: '#cdbf9f', roughness: 0.9 }));
    tabTop.position.set(-Dk.w / 2 + 60 + (i % 3) * 30, Dk.h / 2 + 22, 0);
    lab.position.set(tabTop.position.x, tabTop.position.y, 1);
    tg.add(t, tabTop, lab);
    tg.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    tg.position.set(0, Dk.h / 2 + 10, z);
    tg.rotation.x = -0.12;
    tray.add(tg);
    z -= 14;
    for (let n = 0; n < 2; n++) {
      const d = props.floppy({ project: p, color: ['#24262a', '#2f3e52', '#7a2e24', '#d8d2c4'][(i + n) % 4] });
      d.position.set(0, Dk.h / 2 + 10, z);
      d.rotation.x = -0.12;
      tray.add(d);
      disks.push(d);
      z -= 12;
    }
    z -= 70;
  });
  tray.position.set(-880, -390, 120);
  tray.rotation.y = 0.5;
  scene.add(tray);

  /* binders against the wall: records / process documentation */
  const spine = ['#2b3440', '#3d4a36', '#2b3440', '#5a2a22', '#2b3440', '#3d4a36'];
  spine.forEach((col, i) => {
    const b = box(70, 560, 420, new THREE.MeshStandardMaterial({ color: col, roughness: 0.75 }), [820 + i * 74, -390 + 280, -520]);
    b.rotation.z = i === 5 ? -0.12 : 0;
    scene.add(b);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(50, 150), new THREE.MeshStandardMaterial({ color: '#e9e1cd', roughness: 0.9 }));
    lab.rotation.y = 0;
    lab.position.set(820 + i * 74, -390 + 400, -309);
    if (i !== 5) scene.add(lab);
  });

  /* bound logbook (About) */
  const logbook = new THREE.Group();
  logbook.add(box(330, 30, 440, new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 0.85 }), [0, 15, 0]));
  logbook.add(box(318, 22, 430, new THREE.MeshStandardMaterial({ color: '#ece4cf', roughness: 0.95 }), [6, 15, 0]));
  logbook.add(box(30, 32, 442, brass, [-150, 16, 0]));
  logbook.position.set(760, -390, 380);
  logbook.rotation.y = -0.3;
  scene.add(logbook);

  return {
    disks,
    destinations: [
      { object: 'Computer', dest: 'Project World', pos: new THREE.Vector3(0, 380, 200), now: true },
      { object: 'Index tray', dest: 'case studies (tab per project)', pos: new THREE.Vector3(-880, -230, 120), now: true },
      { object: 'Logbook', dest: 'About', pos: new THREE.Vector3(760, -340, 380) },
      { object: 'Flat-file drawers', dest: 'GIS / CAD work', pos: new THREE.Vector3(-850, -700, DESK_FRONT) },
      { object: 'Binders', dest: 'archive / process notes', pos: new THREE.Vector3(1000, 0, -500) },
    ],
  };
}

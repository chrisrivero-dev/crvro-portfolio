/* Variant A — GIS drafting workstation.
 * Oak drafting desk; a large survey sheet taped down to the left of the
 * machine with a triangular scale and pencil; the project disks stand in an
 * open smoked-acrylic disk box to the right, labels toward the visitor. */
import { room, deskTop, box, notebook, DESK_FRONT } from './env-common.js';

export function build({ THREE, scene, props }) {
  room(scene, { wall: '#c8bea9' });
  deskTop(scene, {
    mat: new THREE.MeshStandardMaterial({ map: props.tex(props.woodTexture({ base: '#7a5638' })), roughness: 0.55 }),
  });

  /* drafting sheet, taped at the corners */
  const sheet = new THREE.Mesh(
    new THREE.PlaneGeometry(1300, 920),
    new THREE.MeshStandardMaterial({ map: props.tex(props.draftingTexture()), roughness: 0.9 }),
  );
  sheet.rotation.set(-Math.PI / 2, 0, 0.06);
  sheet.position.set(-1060, -389.5, 80);
  sheet.receiveShadow = true;
  scene.add(sheet);
  const tape = new THREE.MeshStandardMaterial({ color: '#e8dcb8', roughness: 0.7, transparent: true, opacity: 0.85 });
  for (const [dx, dz] of [[-600, -420], [600, -460], [-620, 440], [580, 400]]) {
    const t = box(80, 0.6, 34, tape, [-1060 + dx, -389, 80 + dz], 0.6);
    scene.add(t);
  }
  // triangular engineer's scale
  const scale = new THREE.Mesh(
    new THREE.CylinderGeometry(22, 22, 640, 3),
    new THREE.MeshStandardMaterial({ color: '#e9e4d8', roughness: 0.4 }),
  );
  scale.rotation.set(0, 0.35, Math.PI / 2);
  scale.position.set(-1000, -390 + 11, 330);
  scale.castShadow = true;
  scene.add(scale);
  // mechanical pencil
  const pencil = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 300, 12), new THREE.MeshStandardMaterial({ color: '#1f2a36', roughness: 0.4, metalness: 0.3 }));
  pencil.rotation.set(Math.PI / 2, 0, -0.9);
  pencil.position.set(-700, -384, -150);
  pencil.castShadow = true;
  scene.add(pencil);

  /* open disk box with the project disks standing in it */
  const D = props.floppy.size;
  const acrylic = new THREE.MeshPhysicalMaterial({ color: '#3a3027', roughness: 0.1, transmission: 0, transparent: true, opacity: 0.55 });
  const boxG = new THREE.Group();
  const bw = D.w + 30, bd = 6 * 26 + 30, bh = D.h * 0.62;
  boxG.add(box(bw, 6, bd, acrylic, [0, 3, 0]));
  boxG.add(box(6, bh, bd, acrylic, [-bw / 2, bh / 2, 0]));
  boxG.add(box(6, bh, bd, acrylic, [bw / 2, bh / 2, 0]));
  boxG.add(box(bw, bh, 6, acrylic, [0, bh / 2, -bd / 2]));
  boxG.add(box(bw, bh * 0.55, 6, acrylic, [0, bh * 0.275, bd / 2]));
  // hinged lid tipped open behind
  const lid = box(bw, 6, bd, acrylic, [0, bh + bd / 2 - 10, -bd / 2 - 4]);
  lid.rotation.x = -Math.PI / 2 + 0.25;
  boxG.add(lid);
  const disks = [];
  const colors = ['#24262a', '#2f3e52', '#24262a', '#7a2e24', '#24262a', '#d8d2c4'];
  props.PROJECTS.forEach((p, i) => {
    const d = props.floppy({ project: p, color: colors[i] });
    d.position.set(0, D.h / 2 + 4, bd / 2 - 30 - i * 26);
    d.rotation.x = -0.18 - i * 0.02;
    boxG.add(d);
    disks.push(d);
  });
  boxG.position.set(720, -390, 160);
  boxG.rotation.y = -0.35;
  scene.add(boxG);

  /* notebook (About) */
  const nb = notebook({ cover: '#33402f' });
  nb.position.set(1000, -390, 470);
  nb.rotation.y = 0.25;
  scene.add(nb);

  return {
    disks,
    destinations: [
      { object: 'Computer', dest: 'Project World', pos: new THREE.Vector3(0, 380, 200), now: true },
      { object: 'Disk box', dest: 'case studies (6 real projects)', pos: new THREE.Vector3(720, -150, 160), now: true },
      { object: 'Notebook', dest: 'About', pos: new THREE.Vector3(1000, -340, 470) },
      { object: 'Survey sheet', dest: 'GIS / CAD work', pos: new THREE.Vector3(-1060, -380, 80) },
      { object: '(no object yet)', dest: 'Contact, Skills', pos: new THREE.Vector3(1500, -380, -500) },
    ],
  };
}

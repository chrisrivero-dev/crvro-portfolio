/* Shared room shell for all three variants: back wall, floor and a desk
 * top. Identical framing keeps the comparison fair; only the furniture
 * material and the objects on it differ per variant. */
import * as THREE from 'three';
import { tex, plasterTexture } from './props.js';

export const DESK_FRONT = 640;      // z of the desk's front edge
export const DESK_BACK = -760;
export const FLOOR_Y = -390 - 1600; // ≈ 75 cm desk height at 0.47 mm/unit

export function room(scene, { wall = '#c9bfae', floor = '#3b322a' } = {}) {
  const wallMat = new THREE.MeshStandardMaterial({ map: tex(plasterTexture({ base: wall }), { repeat: 3 }), roughness: 0.95 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(9000, 5000), wallMat);
  back.position.set(0, FLOOR_Y + 2500, DESK_BACK - 140);
  back.receiveShadow = true;
  scene.add(back);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(9000, 6000), new THREE.MeshStandardMaterial({ color: floor, roughness: 0.8 }));
  fl.rotation.x = -Math.PI / 2;
  fl.position.y = FLOOR_Y;
  fl.receiveShadow = true;
  scene.add(fl);
  return { back };
}

export function deskTop(scene, { width = 5600, x = 0, thick = 50, mat }) {
  const g = new THREE.BoxGeometry(width, thick, DESK_FRONT - DESK_BACK);
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, -390 - thick / 2, (DESK_FRONT + DESK_BACK) / 2);
  m.castShadow = m.receiveShadow = true;
  scene.add(m);
  return m;
}

export function box(w, h, d, mat, pos, rotY = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(...pos);
  m.rotation.y = rotY;
  m.castShadow = m.receiveShadow = true;
  return m;
}

/* A closed notebook: board covers, page block, elastic band. */
export function notebook({ w = 300, d = 420, t = 26, cover = '#2b3440' } = {}) {
  const g = new THREE.Group();
  const coverMat = new THREE.MeshStandardMaterial({ color: cover, roughness: 0.8 });
  const pages = new THREE.MeshStandardMaterial({ color: '#efe7d4', roughness: 0.95 });
  g.add(box(w, 3, d, coverMat, [0, 1.5, 0]));
  g.add(box(w - 8, t - 6, d - 8, pages, [-2, t / 2, 0]));
  g.add(box(w, 3, d, coverMat, [0, t - 1.5, 0]));
  g.add(box(w + 2, t + 1, 6, new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.6 }), [0, t / 2, d * 0.3]));
  return g;
}

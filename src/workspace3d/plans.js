/* 05B.1 drafting plans: project notes pinned to the survey sheet.
 *
 * The survey drawing is studio decoration. The notes taped onto it are the content: one paper slip per project with a
 * GIS/CAD basis (src/data/planNotes.js), printed only with that project's registry fields. Each slip says, in its own
 * footer, that the drawing beneath is not project documentation.
 *
 * The slips are WebGL paper (a canvas texture), not DOM: the CSS3D layer sits behind the canvas and only shows through
 * the CRT's glass. Printed "stamps" (case study, repository) are hit-tested by texture coordinate; the page offers the
 * same actions as real buttons for keyboard and screen-reader use. */
import { PLAN_NOTE_PROJECTS } from '../data/planNotes.js';
import { CASE_IDS } from '../data/caseIds.js';
import { tex } from './props.js';

export const SLIP = { w: 280, h: 390 };
const PX = { w: 1024, h: Math.round(1024 * (SLIP.h / SLIP.w)) };
// where each note sits on the sheet (offset from its centre, in world units) and its slight hand-placed turn
const PLACES = [{ dx: -160, dz: -60, rot: 0.04 }, { dx: 180, dz: -80, rot: -0.06 }];

function wrap(g, text, maxW) {
  const out = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const w of para.split(/\s+/)) {
      const t = line ? `${line} ${w}` : w;
      if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  return out;
}

/** The printed note. Returns the canvas and the stamp rectangles in UV space (0..1, v up). */
function noteCanvas(p) {
  const c = document.createElement('canvas');
  c.width = PX.w; c.height = PX.h;
  const g = c.getContext('2d');
  const M = 52, W = PX.w - 2 * M, ink = '#14120f', dim = '#3d382f';   // dark, bold ink: the lamp washes thin strokes out
  g.fillStyle = '#f3eee2'; g.fillRect(0, 0, c.width, c.height);
  // faint ruled lines: an index-card note, not a drawing
  g.strokeStyle = 'rgba(80, 110, 150, 0.16)'; g.lineWidth = 2;
  for (let y = 250; y < c.height - 40; y += 46) { g.beginPath(); g.moveTo(0, y); g.lineTo(c.width, y); g.stroke(); }
  g.strokeStyle = 'rgba(180, 70, 60, 0.28)'; g.beginPath(); g.moveTo(M - 18, 0); g.lineTo(M - 18, c.height); g.stroke();

  const mono = (px, w = 400) => `${w} ${px}px "Courier New", ui-monospace, Menlo, monospace`;
  let y = M + 30;
  const text = (s, px, color = ink, w = 400, gap = 1.3) => {
    g.font = mono(px, w); g.fillStyle = color;
    for (const l of wrap(g, s, W)) { g.fillText(l, M, y); y += px * gap; }
  };
  text(`${CASE_IDS[p.slug]} · PROJECT NOTE`, 30, dim, 700);
  y += 18;
  text(p.title.toUpperCase(), 66, ink, 700, 1.15);
  y += 8;
  text(p.titleEm, 36, '#2b2721', 700);
  y += 14;
  g.fillStyle = ink; g.fillRect(M, y - 22, W, 3);
  y += 26;
  text(p.desc, 33, ink, 700, 1.32);
  y += 14;
  text(`${p.kind} · ${p.year}`.toUpperCase(), 29, dim, 700);
  y += 6;
  text(`STATUS: ${p.status}`, 31, ink, 700);
  y += 6;
  text((p.tags || []).join(' · '), 29, dim, 700);

  // stamps: printed boxes the visitor can press
  const stamps = [{ kind: 'case', label: 'CASE STUDY  →' }];
  if (p.repo) stamps.push({ kind: 'repo', label: 'REPOSITORY  ↗' });
  // stamps are tall enough to be a 44px tap target on a phone, where the note is seen at an angle
  const sh = 140, pad = 20, sy = c.height - M - 120 - sh, sw = (W - 24 * (stamps.length - 1)) / stamps.length;
  const rects = [];
  stamps.forEach((s, i) => {
    const sx = M + i * (sw + 24);
    g.strokeStyle = '#7a2e22'; g.lineWidth = 5; g.strokeRect(sx, sy, sw, sh);
    g.font = mono(40, 700); g.fillStyle = '#7a2e22'; g.textAlign = 'center';
    g.fillText(s.label, sx + sw / 2, sy + sh / 2 + 14);
    g.textAlign = 'left';
    rects.push({ kind: s.kind, u0: sx / c.width, u1: (sx + sw) / c.width, v0: 1 - (sy + sh + pad) / c.height, v1: 1 - (sy - pad) / c.height });
  });
  y = c.height - M - 70;
  g.font = mono(25, 700); g.fillStyle = dim;
  for (const l of wrap(g, 'Pinned note. The drawing underneath is studio decoration, not project documentation.', W)) { g.fillText(l, M, y); y += 30; }
  return { canvas: c, rects };
}

/** Lay the notes on the sheet. Returns one mesh per note; mesh.userData.note = { slug, title, caseId, repo, rects }. */
export function buildNotes({ THREE, scene, sheet }) {
  const tape = new THREE.MeshStandardMaterial({ color: '#e8dcb8', roughness: 0.7, transparent: true, opacity: 0.85 });
  return PLAN_NOTE_PROJECTS.slice(0, PLACES.length).map((p, i) => {
    const at = PLACES[i];
    const { canvas, rects } = noteCanvas(p);
    const mat = new THREE.MeshStandardMaterial({ map: tex(canvas), color: '#d9d3c6', roughness: 0.92, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(SLIP.w, SLIP.h), mat);
    m.rotation.set(-Math.PI / 2, 0, at.rot);
    m.position.set(sheet.position.x + at.dx, sheet.position.y + 1.2, sheet.position.z + at.dz);
    m.receiveShadow = true;
    m.userData.note = { slug: p.slug, title: p.title, caseId: CASE_IDS[p.slug], repo: p.repo || null, rects };
    scene.add(m);
    m.updateMatrixWorld(true);
    // one strip of drafting tape holds each note at its top edge (it is what keeps the paper on the sheet)
    const t = new THREE.Mesh(new THREE.BoxGeometry(80, 0.8, 28), tape);
    t.position.copy(m.localToWorld(new THREE.Vector3(0, SLIP.h / 2 - 4, 0.6)));
    t.rotation.y = at.rot;
    scene.add(t);
    return m;
  });
}

/** The camera pose that reads a note square-on from its lower edge (text upright), sized to the note. */
export function noteView(THREE, mesh) {
  mesh.updateMatrixWorld(true);
  const down = new THREE.Vector3(0, -1, 0).transformDirection(mesh.matrixWorld);   // the note's bottom edge, in the world
  const target = mesh.position.clone().addScaledVector(down, 40);                    // a little low, so the page's controls do not cover the stamps
  return { yaw: Math.atan2(down.x, down.z), pitch: 1.2, dist: 860, fitW: SLIP.w + 50, target };
}

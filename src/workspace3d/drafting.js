/* Survey drawing for iteration 03. A prop, not data: the parcels, bearings and elevations are plausible drafting content
 * drawn so that they close (each lot's bearings/distances come from its own corner coordinates). No place names, no slogans. */
import { canvas } from './props.js';

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Quadrant bearing of a segment, as a surveyor writes it (N 47°12'30" E). y grows downward on the sheet, so north is -y.
function bearing(a, b) {
  const dx = b[0] - a[0], dn = -(b[1] - a[1]);
  const ns = dn >= 0 ? 'N' : 'S', ew = dx >= 0 ? 'E' : 'W';
  const ang = Math.atan2(Math.abs(dx), Math.abs(dn)) * 180 / Math.PI;
  const d = Math.floor(ang), m = Math.floor((ang - d) * 60), s = Math.round(((ang - d) * 60 - m) * 60);
  return `${ns} ${d}°${String(m).padStart(2, '0')}'${String(s % 60).padStart(2, '0')}" ${ew}`;
}
const FT_PER_PX = 40 / 96; // 1" = 40' at 96 px per drawn inch

export function surveyTexture({ W = 2400, H = 1700, seed = 11, title = 'PARCEL 14-B · SHEET 2 OF 6', paper = '#ece5d3', ink = '#2a3644' } = {}) {
  const { c, x } = canvas(W, H);
  const r = rng(seed);
  const mono = (w, px) => `${w} ${px}px "JetBrains Mono", monospace`;
  x.fillStyle = paper; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(80,60,30,${r() * 0.035})`; x.fillRect(r() * W, r() * H, 2, 2); }
  // faint drafting grid (every 60 px; heavier every 300)
  for (let g = 60; g < W; g += 60) { x.strokeStyle = g % 300 ? 'rgba(70,110,130,0.13)' : 'rgba(70,110,130,0.26)'; x.lineWidth = 1; x.beginPath(); x.moveTo(g, 0); x.lineTo(g, H); x.stroke(); }
  for (let g = 60; g < H; g += 60) { x.strokeStyle = g % 300 ? 'rgba(70,110,130,0.13)' : 'rgba(70,110,130,0.26)'; x.lineWidth = 1; x.beginPath(); x.moveTo(0, g); x.lineTo(W, g); x.stroke(); }

  // contours: nested rings that tilt toward a drainage, every fifth is an index contour with its elevation
  const cx = W * 0.7, cy = H * 0.38;
  x.textBaseline = 'middle';
  for (let k = 1; k <= 11; k++) {
    const index = k % 5 === 0;
    x.strokeStyle = index ? 'rgba(130,80,35,0.62)' : 'rgba(150,100,50,0.38)';
    x.lineWidth = index ? 2.6 : 1.3;
    let lx = 0, ly = 0;
    x.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.02; a += 0.04) {
      const rr = k * 62 * (1 + 0.1 * Math.sin(3 * a + k * 0.5) + 0.05 * Math.sin(7 * a + k));
      const px = cx + k * 9 + Math.cos(a) * rr * 1.45, py = cy + Math.sin(a) * rr;
      a ? x.lineTo(px, py) : x.moveTo(px, py);
      if (Math.abs(a - 2.4) < 0.021) { lx = px; ly = py; }
    }
    x.stroke();
    if (index) { x.save(); x.fillStyle = paper; x.fillRect(lx - 30, ly - 14, 60, 28); x.fillStyle = 'rgba(110,65,25,0.9)'; x.font = mono(600, 22); x.fillText(String(400 + k * 2), lx - 20, ly); x.restore(); }
  }
  // creek: a meandering dashed-blue line with flow ticks
  x.strokeStyle = 'rgba(40,110,150,0.65)'; x.lineWidth = 3; x.setLineDash([22, 7]);
  x.beginPath();
  for (let t = 0; t <= 1; t += 0.01) { const px = 1180 + t * 1100, py = 1180 - t * 760 + Math.sin(t * 9) * 40; t ? x.lineTo(px, py) : x.moveTo(px, py); }
  x.stroke(); x.setLineDash([]);

  // road right-of-way with centerline, at the bottom
  x.strokeStyle = ink; x.lineWidth = 3;
  for (const dy of [0, 120]) { x.beginPath(); x.moveTo(60, 1480 + dy - (dy ? 20 : 0)); x.lineTo(1560, 1420 + dy - (dy ? 20 : 0)); x.stroke(); }
  x.setLineDash([40, 14, 8, 14]); x.lineWidth = 2; x.beginPath(); x.moveTo(60, 1530); x.lineTo(1560, 1470); x.stroke(); x.setLineDash([]);
  x.font = mono(600, 24); x.fillStyle = ink; x.save(); x.translate(520, 1478); x.rotate(-0.04); x.fillText('60\' R/W · CENTERLINE', 0, 0); x.restore();

  // lots: shared corners so the boundaries close; each edge carries its own computed bearing and distance
  const P = { a: [230, 250], b: [800, 205], c: [1290, 270], d: [1250, 690], e: [880, 760], f: [300, 830], g: [260, 1280], h: [930, 1250] };
  const lots = [
    { name: 'LOT 1', pts: [P.a, P.b, P.e, P.f] },
    { name: 'LOT 2', pts: [P.b, P.c, P.d, P.e] },
    { name: 'LOT 3', pts: [P.f, P.e, P.h, P.g] },
  ];
  x.lineJoin = 'round';
  lots.forEach((lot, li) => {
    const pts = lot.pts;
    x.fillStyle = li === 1 ? 'rgba(90,120,100,0.07)' : 'rgba(0,0,0,0)'; x.beginPath(); pts.forEach((q, i) => (i ? x.lineTo(...q) : x.moveTo(...q))); x.closePath(); x.fill();
    x.strokeStyle = ink; x.lineWidth = 4; x.stroke();
    // 25' setback, dashed, inset toward the lot centroid
    const mx = pts.reduce((s, q) => s + q[0], 0) / pts.length, my = pts.reduce((s, q) => s + q[1], 0) / pts.length;
    x.setLineDash([14, 9]); x.lineWidth = 1.6; x.strokeStyle = 'rgba(42,54,68,0.55)'; x.beginPath();
    pts.forEach(([px, py], i) => { const k = 0.9; const qx = mx + (px - mx) * k, qy = my + (py - my) * k; i ? x.lineTo(qx, qy) : x.moveTo(qx, qy); });
    x.closePath(); x.stroke(); x.setLineDash([]);
    x.fillStyle = ink; x.font = mono(700, 34); x.fillText(lot.name, mx - 52, my - 6);
    x.font = mono(500, 20); x.fillText(`${(Math.abs(shoelace(pts)) * FT_PER_PX * FT_PER_PX / 43560).toFixed(2)} AC ±`, mx - 56, my + 30);
    // edge labels: bearing over, distance under, kept upright and set outside the line
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if (li > 0 && isShared(a, b, lots[0])) continue;
      if (li === 2 && isShared(a, b, lots[1])) continue;
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) * FT_PER_PX;
      let ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      let flip = 1;
      if (ang > Math.PI / 2 || ang < -Math.PI / 2) { ang += Math.PI; flip = -1; }
      const nx = (mx - (a[0] + b[0]) / 2), ny = (my - (a[1] + b[1]) / 2);
      const outward = Math.sign(-(Math.cos(ang) * ny - Math.sin(ang) * nx)) || 1;
      x.save(); x.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); x.rotate(ang);
      x.font = mono(600, 21); x.fillStyle = ink; x.textAlign = 'center';
      const above = outward < 0 ? -16 : 34;
      x.fillText(bearing(flip > 0 ? a : b, flip > 0 ? b : a), 0, above);
      x.font = mono(500, 19); x.fillText(`${len.toFixed(2)}'`, 0, above + (outward < 0 ? -24 : 22));
      x.restore();
    }
  });
  x.textAlign = 'left';
  // monuments at the corners: iron rods (circles) and one concrete (square)
  Object.values(P).forEach((q, i) => {
    x.lineWidth = 2.4; x.strokeStyle = ink; x.fillStyle = paper;
    x.beginPath(); i === 3 ? x.rect(q[0] - 9, q[1] - 9, 18, 18) : x.arc(q[0], q[1], 9, 0, 7); x.fill(); x.stroke();
    x.beginPath(); x.arc(q[0], q[1], 2.6, 0, 7); x.fillStyle = ink; x.fill();
  });
  x.font = mono(500, 18); x.fillStyle = ink;
  x.fillText('● 1/2" IRON ROD FND.   ■ 4" CONC. MON. FND.', 240, 1370);
  // overall dimension string across the top, with arrowheads and extension lines
  const dy = 140, x0 = P.a[0], x1 = P.c[0];
  x.lineWidth = 2; x.beginPath(); x.moveTo(x0, dy); x.lineTo(x1, dy); x.moveTo(x0, dy - 25); x.lineTo(x0, P.a[1] - 20); x.moveTo(x1, dy - 25); x.lineTo(x1, P.c[1] - 20); x.stroke();
  for (const [ax, dir] of [[x0, 1], [x1, -1]]) { x.beginPath(); x.moveTo(ax, dy); x.lineTo(ax + dir * 22, dy - 7); x.lineTo(ax + dir * 22, dy + 7); x.closePath(); x.fill(); }
  x.fillStyle = paper; x.fillRect((x0 + x1) / 2 - 130, dy - 16, 260, 32);
  x.fillStyle = ink; x.font = mono(700, 24); x.textAlign = 'center'; x.fillText(`${((x1 - x0) * FT_PER_PX).toFixed(2)}'`, (x0 + x1) / 2, dy + 1); x.textAlign = 'left';

  // north arrow: circle, split arrow, N
  const nx0 = 1790, ny0 = 1250;
  x.lineWidth = 3; x.strokeStyle = ink; x.fillStyle = ink;
  x.beginPath(); x.arc(nx0, ny0, 62, 0, 7); x.stroke();
  x.beginPath(); x.moveTo(nx0, ny0 - 98); x.lineTo(nx0 - 26, ny0 + 40); x.lineTo(nx0, ny0 + 14); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(nx0, ny0 - 98); x.lineTo(nx0 + 26, ny0 + 40); x.lineTo(nx0, ny0 + 14); x.closePath(); x.stroke();
  x.font = mono(700, 42); x.textAlign = 'center'; x.fillText('N', nx0, ny0 - 118); x.textAlign = 'left';
  // graphic scale bar, 1" = 40'
  const sx = 1620, sy = 1420; x.lineWidth = 2;
  for (let i = 0; i < 4; i++) { x.fillStyle = i % 2 ? paper : ink; x.fillRect(sx + i * 96, sy, 96, 14); x.strokeRect(sx + i * 96, sy, 96, 14); }
  x.fillStyle = ink; x.font = mono(500, 20);
  [0, 40, 80, 120, 160].forEach((v, i) => x.fillText(String(v), sx + i * 96 - 8, sy + 36));
  x.fillText("SCALE 1\" = 40'", sx, sy - 14);

  // revision table + title block
  x.lineWidth = 3; x.strokeStyle = ink;
  x.strokeRect(W - 720, H - 330, 680, 290);
  x.beginPath(); x.moveTo(W - 720, H - 230); x.lineTo(W - 40, H - 230); x.moveTo(W - 720, H - 150); x.lineTo(W - 40, H - 150); x.stroke();
  x.fillStyle = ink; x.font = mono(700, 34); x.fillText(title, W - 700, H - 270);
  x.font = mono(500, 22);
  x.fillText('REV  DESCRIPTION             BY', W - 700, H - 196);
  x.fillText('03   ADD SETBACK + ROW        C.R.', W - 700, H - 172);
  x.fillText("DRAWN  C.R.     SCALE 1\" = 40'", W - 700, H - 110);
  x.fillText('BASIS OF BEARINGS: RECORD PLAT', W - 700, H - 70);
  // REV 03 stamp: small, red-brown ink, slightly rotated and uneven
  x.save(); x.translate(W - 940, H - 190); x.rotate(-0.09);
  x.strokeStyle = 'rgba(150,45,35,0.72)'; x.fillStyle = 'rgba(150,45,35,0.78)'; x.lineWidth = 4;
  x.strokeRect(-70, -26, 140, 52); x.lineWidth = 1.6; x.strokeRect(-64, -20, 128, 40);
  x.font = mono(700, 28); x.textAlign = 'center'; x.fillText('REV 03', 0, 2);
  x.restore();
  return c;
}

function shoelace(pts) { let s = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
function isShared(a, b, lot) {
  const q = lot.pts;
  for (let i = 0; i < q.length; i++) { const u = q[i], v = q[(i + 1) % q.length]; if ((u === a && v === b) || (u === b && v === a)) return true; }
  return false;
}

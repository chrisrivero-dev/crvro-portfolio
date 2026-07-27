// ============================================================
// Project World — map geometry helpers
//
// Coastlines are generated, not hand-authored: a seeded PRNG
// perturbs points around an ellipse, then a Catmull-Rom pass
// smooths them into a closed Bézier outline. Same seed always
// produces the same island, so the map is stable across renders
// and identical to the approved prototype.
// ============================================================

const F = (n) => (+n).toFixed(1);

/** Deterministic LCG — seeded so every island redraws identically. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Closed Catmull-Rom → cubic Bézier through every point. */
function smoothClosed(p) {
  const n = p.length;
  let d = `M ${F(p[0][0])} ${F(p[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n];
    const p1 = p[i];
    const p2 = p[(i + 1) % n];
    const p3 = p[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${F(c1x)} ${F(c1y)}, ${F(c2x)} ${F(c2y)}, ${F(p2[0])} ${F(p2[1])}`;
  }
  return `${d} Z`;
}

/** Wobbly island outline around an ellipse. */
export function blobPath(cx, cy, rx, ry, seed, n = 16, wob = 0.22) {
  const r = rng(seed);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 - wob / 2 + r() * wob;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return smoothClosed(pts);
}

/** Straight-edged outline with a hand-drawn jitter — used for the GroundRules parcel. */
export function polyPath(cx, cy, rel, seed = 7) {
  const r = rng(seed);
  return (
    rel
      .map((p, i) => {
        const jx = (r() - 0.5) * 6;
        const jy = (r() - 0.5) * 6;
        return `${i === 0 ? "M" : "L"} ${F(cx + p[0] + jx)} ${F(cy + p[1] + jy)}`;
      })
      .join(" ") + " Z"
  );
}

/** GroundRules is a parcel, not an island — its outline is a survey polygon. */
export const PARCEL_REL = [
  [-98, -40],
  [-30, -70],
  [60, -62],
  [100, -16],
  [88, 46],
  [10, 66],
  [-74, 54],
];

export function coastFor(stop) {
  return stop.parcel
    ? polyPath(stop.cx, stop.cy, PARCEL_REL, stop.seed)
    : blobPath(stop.cx, stop.cy, stop.rx, stop.ry, stop.seed);
}

export function contourFor(stop) {
  return stop.parcel
    ? polyPath(
        stop.cx,
        stop.cy + 2,
        PARCEL_REL.map((p) => [p[0] * 1.14, p[1] * 1.14]),
        stop.seed + 1
      )
    : blobPath(stop.cx, stop.cy, stop.rx * 1.16, stop.ry * 1.18, stop.seed + 1);
}

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const easeInOut = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export { F };

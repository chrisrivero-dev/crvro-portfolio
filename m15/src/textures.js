/* CRVRO M1 — still-life texture kit.
 *
 * Every baked surface (desk, screen content, contact shadow, plastic grain)
 * is drawn here on an HTML canvas and shared by two consumers:
 *   1. m1/src/m1.js          — uploaded as Three.js textures
 *   2. m1/tools/gen-assets.mjs — rendered to PNG for the Blender poster +
 *                               crisp poster-quality screen capture
 *
 * Drawing one code path keeps the web prototype and the Blender poster
 * pixel-congruent on content geometry (same aspect, same layout math).
 */

const PX = 2; // texture supersample scale (DPR-aware without 5K canvases)

export const CANVAS = { px: PX };

export function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * PX);
  canvas.height = Math.round(h * PX);
  const ctx = canvas.getContext('2d');
  ctx.scale(PX, PX);
  return { canvas, ctx };
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── Paper surface with extremely subtle GIS linework ────────────── */

export function drawDesk(cx, w, h) {
  // Base paper tone — warm, slightly darker edge (vignette reads as
  // ambient falloff; no fake lighting bake needed)
  const g = cx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#ece7dc');
  g.addColorStop(0.55, '#e7e1d5');
  g.addColorStop(1, '#e2dccc');
  cx.fillStyle = g;
  cx.fillRect(0, 0, w, h);

  // Soft radial warmth in the middle (where the computer sits)
  const rg = cx.createRadialGradient(w * 0.42, h * 0.46, 0, w * 0.42, h * 0.46, Math.max(w, h) * 0.62);
  rg.addColorStop(0, 'rgba(255,252,244,0.25)');
  rg.addColorStop(1, 'rgba(180,170,150,0.10)');
  cx.fillStyle = rg;
  cx.fillRect(0, 0, w, h);

  // Paper fiber — a couple of barely-there speckle passes
  const rnd = mulberry32(20261026);
  for (let i = 0; i < 1400; i++) {
    const x = rnd() * w, y = rnd() * h;
    const dark = rnd() > 0.5;
    cx.fillStyle = dark ? `rgba(96,88,72,${0.012 + rnd() * 0.02})` : `rgba(255,255,255,${0.015 + rnd() * 0.03})`;
    cx.fillRect(x, y, 1, 1);
  }

  // GIS linework — deliberately faint (≤ ~7% alpha at full strength).
  // Layers, back to front: graticule, contours, parcel edges, crosses,
  // one index-like tick strip. All stroke, no fills.
  const INK = 'rgba(97,92,84,'; // warm graphite ink

  cx.save();
  cx.lineWidth = 0.7;

  // 1) Graticule — thin, low-contrast grid, slightly non-uniform spacing
  cx.strokeStyle = INK + '0.055)';
  cx.beginPath();
  let gx = 0;
  while (gx < w) {
    gx += 26 + rnd() * 16;
    cx.moveTo(gx, -4); cx.lineTo(gx, h + 4);
  }
  let gy = 0;
  while (gy < h) {
    gy += 26 + rnd() * 16;
    cx.moveTo(-4, gy); cx.lineTo(w + 4, gy);
  }
  cx.stroke();

  // 2) Contour groups — two families of smooth, roughly concentric
  // closed curves, like an elevation sheet.
  const clusters = [
    { cx: w * 0.16, cy: h * 0.30, r: 46, n: 5, a: 0.05 },
    { cx: w * 0.84, cy: h * 0.62, r: 58, n: 6, a: 0.045 },
    { cx: w * 0.30, cy: h * 0.88, r: 40, n: 4, a: 0.04 },
    { cx: w * 0.70, cy: h * 0.10, r: 36, n: 4, a: 0.035 },
  ];
  for (const c of clusters) {
    for (let k = 1; k <= c.n; k++) {
      const r = (c.r * k) / c.n;
      cx.strokeStyle = `${INK}${(c.a * (0.7 + k / c.n) * 0.5).toFixed(3)})`;
      cx.beginPath();
      const pts = 90;
      let first = true;
      const wob = mulberry32(k * 97 + c.cx);
      for (let i = 0; i <= pts; i++) {
        const t = (i / pts) * Math.PI * 2;
        const rr = r * (1 + 0.06 * Math.sin(t * 3 + k) + (wob() - 0.5) * 0.05);
        const x = c.cx + Math.cos(t) * rr * 1.25;
        const y = c.cy + Math.sin(t) * rr * 0.82;
        if (first) { cx.moveTo(x, y); first = false; } else cx.lineTo(x, y);
      }
      cx.closePath();
      cx.stroke();
    }
  }

  // 3) Parcel edges — a few right-angle survey lines, very faint
  cx.strokeStyle = INK + '0.05)';
  const parcels = [
    [w * 0.04, h * 0.58, w * 0.10, h * 0.16],
    [w * 0.55, h * 0.82, w * 0.14, h * 0.12],
    [w * 0.92, h * 0.24, w * 0.07, h * 0.2],
  ];
  for (const [px, py, pw, ph] of parcels) {
    cx.strokeRect(px, py, pw, ph);
    cx.beginPath();
    cx.moveTo(px, py); cx.lineTo(px + pw, py + ph);
    cx.stroke();
    // survey cross at the corner
    cx.strokeStyle = INK + '0.07)';
    cx.beginPath();
    cx.moveTo(px - 4, py); cx.lineTo(px + 4, py);
    cx.moveTo(px, py - 4); cx.lineTo(px, py + 4);
    cx.stroke();
    cx.strokeStyle = INK + '0.05)';
  }

  // 4) Map crosses — tiny + marks sprinkled on some intersections
  cx.strokeStyle = INK + '0.07)';
  const marks = 24;
  for (let i = 0; i < marks; i++) {
    const x = rnd() * w, y = rnd() * h;
    // keep the center stage (behind the machine) cleaner
    if (Math.abs(x - w * 0.42) < w * 0.2 && Math.abs(y - h * 0.46) < h * 0.28) continue;
    cx.beginPath();
    cx.moveTo(x - 2.5, y); cx.lineTo(x + 2.5, y);
    cx.moveTo(x, y - 2.5); cx.lineTo(x, y + 2.5);
    cx.stroke();
  }

  // 5) One index strip — hairline double rule + tick marks, bottom edge
  const stripY = h - 26;
  cx.strokeStyle = INK + '0.09)';
  cx.lineWidth = 0.8;
  cx.beginPath();
  cx.moveTo(w * 0.06, stripY); cx.lineTo(w * 0.52, stripY);
  cx.moveTo(w * 0.06, stripY + 3); cx.lineTo(w * 0.52, stripY + 3);
  cx.stroke();
  cx.strokeStyle = INK + '0.10)';
  cx.lineWidth = 0.7;
  cx.beginPath();
  for (let x = w * 0.06; x <= w * 0.52; x += 8) {
    const tall = (x - w * 0.06) % 40 < 8;
    cx.moveTo(x, stripY);
    cx.lineTo(x, stripY - (tall ? 5 : 3));
  }
  cx.stroke();

  // 6) A coordinate label, extremely small and faint — cartographic
  // verisimilitude without a watermark
  cx.fillStyle = INK + '0.10)';
  cx.font = '600 5.5px "JetBrains Mono", "SF Mono", ui-monospace, monospace';
  cx.textBaseline = 'alphabetic';
  cx.save();
  cx.translate(w * 0.06, stripY - 9);
  cx.letterSpacing = '1px';
  if (typeof cx.letterSpacing === 'string') cx.letterSpacing = '1px';
  cx.fillText('SHEET 01 · CRVRO DESK', 0, 0);
  cx.restore();

  cx.restore();
}

/* ── Recessed glass overlay ───────────────────────────────────────── */

export function drawGlass(cx, w, h, r) {
  // Diagonal satin sheen across the glass, brighter top-left, plus a
  // thin bright rim along the inner top edge (light catching the
  // bevel). Kept desaturated and low-alpha: a glass overlay, not a
  // sticker.
  cx.clearRect(0, 0, w, h);
  const g = cx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0.00, 'rgba(255,255,255,0.16)');
  g.addColorStop(0.22, 'rgba(255,254,250,0.05)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.012)');
  g.addColorStop(0.72, 'rgba(255,255,255,0.0)');
  g.addColorStop(1.00, 'rgba(255,255,255,0.028)');
  cx.fillStyle = g;
  roundRectPath(cx, 0, 0, w, h, r);
  cx.fill();

  // Bright inner top rim (bevel catch-light), 1px equivalent
  cx.save();
  roundRectPath(cx, 0, 0, w, h, r);
  cx.clip();
  const rim = cx.createLinearGradient(0, 0, 0, 14);
  rim.addColorStop(0, 'rgba(255,255,255,0.30)');
  rim.addColorStop(1, 'rgba(255,255,255,0)');
  cx.fillStyle = rim;
  cx.fillRect(0, 0, w, 14);

  // Faint cool reflection sweep, bottom-right, like a window
  const sweep = cx.createLinearGradient(w * 0.55, h * 0.8, w, h * 0.25);
  sweep.addColorStop(0, 'rgba(226,232,238,0.0)');
  sweep.addColorStop(0.5, 'rgba(226,232,238,0.05)');
  sweep.addColorStop(1, 'rgba(226,232,238,0.0)');
  cx.fillStyle = sweep;
  cx.fillRect(0, 0, w, h);
  cx.restore();
}

/* ── Plastic grain (roughness/bump tile) ──────────────────────────── */

export function drawGrain(cx, size) {
  const rnd = mulberry32(99173);
  cx.fillStyle = 'rgb(200,200,200)';
  cx.fillRect(0, 0, size, size);
  for (let i = 0; i < size * size * 0.9; i++) {
    const v = 192 + (rnd() * 20) | 0;
    cx.fillStyle = `rgb(${v},${v},${v})`;
    cx.fillRect(rnd() * size, rnd() * size, 1, 1);
  }
  // A few longer micro-scratches (form-line tooling)
  cx.strokeStyle = 'rgba(150,150,150,0.18)';
  cx.lineWidth = 1;
  for (let i = 0; i < 14; i++) {
    const x = rnd() * size, y = rnd() * size;
    const len = 6 + rnd() * 18;
    const a = rnd() * Math.PI;
    cx.beginPath();
    cx.moveTo(x, y);
    cx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    cx.stroke();
  }
}

/* ── Baked contact shadow (under the unit) ────────────────────────── */

export function drawContactShadow(cx, w, h) {
  cx.clearRect(0, 0, w, h);
  // Two stacked radial gradients: a tight dark core hugging the
  // footprint, then a soft skirt. Elliptical (wider than deep)
  // to keep the contact believable from a low camera.
  const g1 = cx.createRadialGradient(w / 2, h * 0.52, 0, w / 2, h * 0.52, w * 0.36);
  g1.addColorStop(0, 'rgba(30,26,20,0.34)');
  g1.addColorStop(0.55, 'rgba(30,26,20,0.16)');
  g1.addColorStop(1, 'rgba(30,26,20,0)');
  cx.save();
  cx.translate(w / 2, h * 0.52);
  cx.scale(1, 0.55);
  cx.translate(-w / 2, -h * 0.52);
  cx.fillStyle = g1;
  cx.fillRect(0, 0, w, h);
  cx.restore();

  const g2 = cx.createRadialGradient(w / 2, h * 0.5, 0, w / 2, h * 0.5, w * 0.47);
  g2.addColorStop(0, 'rgba(30,26,20,0.18)');
  g2.addColorStop(1, 'rgba(30,26,20,0)');
  cx.save();
  cx.translate(w / 2, h * 0.5);
  cx.scale(1, 0.68);
  cx.translate(-w / 2, -h * 0.5);
  cx.fillStyle = g2;
  cx.fillRect(0, 0, w, h);
  cx.restore();
}

/* ── Crisp amber CRT content (matches the live hero copy) ─────────── */

export const SCREEN_ASPECT = 656 / 1176; // 8:4.58 ≈ production dominant screen

/**
 * Layout contract (shared with m1.js for pointer hit-testing):
 * all values in "screen units" where the canvas width = 1176.
 */
export const SCREEN = {
  w: 1176,
  h: 656,
  bodyFontPx: 12.5, // reference size used for text metrics in canvas units
  // cta rect computed in m1js from the draw call; exposed after draw.
};

export function drawScreenContent(ctx2d, w, h, { focusId = null, hoverId = null } = {}) {
  const u = w / SCREEN.w; // unit scale: canvas units → px
  const S = ctx2d;
  S.clearRect(0, 0, w, h);

  // Phosphor field
  const bg = S.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, w * 0.75);
  bg.addColorStop(0, '#191510');
  bg.addColorStop(0.7, '#141109');
  bg.addColorStop(1, '#0e0c07');
  S.fillStyle = bg;
  S.fillRect(0, 0, w, h);

  // Phosphor dot mask — subtle, CRT-authentic
  S.save();
  S.fillStyle = 'rgba(0,0,0,0.16)';
  for (let y = 0; y < h; y += 3 * u * 0.5) {
    S.fillRect(0, y, w, Math.max(1, 1 * u * 0.5));
  }
  S.restore();

  const MONO = '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, monospace';
  const TXT = '#ece4d3';
  const DIM = '#8a7f6a';
  const AMBER = '#d9a54e';
  const AMBER_DIM = '#a87f3c';

  // faint phosphor glow behind headline area
  const glow = S.createRadialGradient(w * 0.38, h * 0.5, 0, w * 0.38, h * 0.5, w * 0.5);
  glow.addColorStop(0, 'rgba(217,165,78,0.055)');
  glow.addColorStop(1, 'rgba(217,165,78,0)');
  S.fillStyle = glow;
  S.fillRect(0, 0, w, h);

  const pad = 64 * u;
  let y = 0;
  const layout = { lines: [], eyebrow: null, heading: [], sub: [], cta: null };

  // Boot lines
  const boot = [
    '> power on',
    '> portfolio.system initialized',
  ];
  S.font = `500 ${16 * u}px ${MONO}`;
  layout.lines = [];
  for (const line of boot) {
    y += 30 * u;
    S.fillStyle = DIM;
    S.fillText(line, pad, y);
    layout.lines.push({ x: pad, y: y - 30 * u, w: S.measureText(line).width, h: 30 * u });
  }

  y += 8 * u; // hairline
  const divY = y + 10 * u;
  S.fillStyle = 'rgba(217,165,78,0.35)';
  S.fillRect(pad, divY, (w - pad * 2), 1 * u);
  y = divY;

  y += 40 * u;
  const eyebrow = 'SUPPORT AUTOMATION · AI OPERATIONS · GIS SYSTEMS';
  S.font = `600 ${13 * u}px ${MONO}`;
  S.fillStyle = AMBER_DIM;
  // letter-spacing for eyebrow
  const tracked = eyebrow.split('').map((c) => c).join('\u200a\u200a');
  S.fillText(tracked, pad, y);
  layout.eyebrow = { x: pad, y: y - 22 * u, text: eyebrow, w: w - pad * 2, h: 26 * u };

  y += 52 * u;
  const headline = ['I turn difficult support and mapping', 'workflows into controlled,', 'testable software.'];
  S.font = `600 ${34 * u}px ${MONO}`;
  layout.heading = [];
  for (const line of headline) {
    S.fillStyle = TXT;
    const lw = S.measureText(line).width;
    S.fillText(line, pad, y);
    layout.heading.push({ x: pad, y: y - 44 * u, w: lw, h: 46 * u });
    y += 47 * u;
  }

  y += 26 * u;
  const sub = ['I build Python automation and AI tools for', 'support and GIS/CAD work I know firsthand.'];
  S.font = `400 ${19 * u}px ${MONO}`;
  layout.sub = [];
  for (const line of sub) {
    S.fillStyle = DIM;
    S.fillText(line, pad, y);
    layout.sub.push({ x: pad, y: y - 26 * u, w: S.measureText(line).width, h: 28 * u });
    y += 28 * u;
  }

  y += 52 * u;
  const ctaText = 'BEGIN JOURNEY ↓';
  S.font = `600 ${21 * u}px ${MONO}`;
  const ctaW = S.measureText(ctaText).width + 34 * u;
  const ctaH = 54 * u;
  const ctaX = pad;
  const ctaY = y - ctaH + 6 * u;
  // box
  const active = focusId === 'cta' || hoverId === 'cta';
  S.strokeStyle = active ? 'rgba(236,228,211,0.95)' : AMBER;
  S.lineWidth = (active ? 2 : 1.4) * u;
  roundRectPath(S, ctaX, ctaY + 14 * u, ctaW, ctaH, 8 * u);
  S.stroke();
  if (active) {
    S.fillStyle = 'rgba(217,165,78,0.14)';
    roundRectPath(S, ctaX, ctaY + 14 * u, ctaW, ctaH, 8 * u);
    S.fill();
  }
  S.fillStyle = active ? '#f4eedd' : AMBER;
  S.fillText(ctaText, ctaX + 17 * u, y - 12 * u);
  S.font = `500 ${11 * u}px ${MONO}`;
  S.fillStyle = 'rgba(138,127,106,0.85)';
  S.fillText('LIVE PORTFOLIO — CRVRO.COM', ctaX + 17 * u, y + 22 * u);

  layout.cta = { x: ctaX, y: ctaY + 14 * u, w: ctaW, h: ctaH, text: ctaText, link: 'cta' };

  // Footer strip
  S.font = `500 ${11 * u}px ${MONO}`;
  S.fillStyle = 'rgba(138,127,106,0.75)';
  S.fillText('PORTFOLIO.SYS  ·  2026', pad, h - 30 * u);
  S.fillStyle = 'rgba(138,127,106,0.55)';
  const foot = 'UNIT 01';
  S.fillText(foot, w - pad - S.measureText(foot).width, h - 30 * u);

  return layout;
}

function roundRectPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

import React, { useRef, useEffect, useState } from 'react';

// ─── Card variant — 380 × 210 viewBox ───────────────────────
// Polygon is sized for the 300px-wide card column; labels are readable.
const V_C = {
  A: [90,  152], // POB — SW
  B: [112,  61], // NW
  C: [221,  46], // N
  D: [290, 101], // E
  E: [269, 164], // SE
};
const SEGS_C = [
  { x1:  90, y1: 152, x2: 112, y2:  61, len:  99 }, // A→B
  { x1: 112, y1:  61, x2: 221, y2:  46, len: 116 }, // B→C
  { x1: 221, y1:  46, x2: 290, y2: 101, len:  93 }, // C→D
  { x1: 290, y1: 101, x2: 269, y2: 164, len:  70 }, // D→E
  { x1: 269, y1: 164, x2:  90, y2: 152, len: 189 }, // E→A (closure)
];
// Labels: [bearing, dist, x, y, textAnchor]
// Placed so every label fits within the 380×210 viewport.
const LABELS_C = [
  { bear: "N 13°15' E", dist: "184.85'", x:  82, y: 103, anchor: 'end'    }, // A→B — left of seg
  { bear: "N 82°35' E", dist: "216.80'", x: 166, y:  26, anchor: 'middle' }, // B→C — above
  { bear: "S 51°15' E", dist: "172.90'", x: 296, y:  70, anchor: 'start'  }, // C→D — right
  { bear: "S 19°00' W", dist: "129.00'", x: 296, y: 131, anchor: 'start'  }, // D→E — right
  { bear: "N 83°36' W", dist: "350.70'", x: 180, y: 185, anchor: 'middle' }, // E→A — below
];
const VTXS_C = [V_C.B, V_C.C, V_C.D, V_C.E];

// ─── Full / case-study variant — 760 × 427 ──────────────────
const V_F = {
  A: [148, 328],
  B: [190, 148],
  C: [405, 120],
  D: [540, 228],
  E: [498, 350],
};
const SEGS_F = [
  { x1: 148, y1: 328, x2: 190, y2: 148, len: 190 },
  { x1: 190, y1: 148, x2: 405, y2: 120, len: 220 },
  { x1: 405, y1: 120, x2: 540, y2: 228, len: 178 },
  { x1: 540, y1: 228, x2: 498, y2: 350, len: 133 },
  { x1: 498, y1: 350, x2: 148, y2: 328, len: 356 },
];
const LABELS_F = [
  { bear: "N 13°15' E", dist: "184.85'", x: 140, y: 240, anchor: 'end'    },
  { bear: "N 82°35' E", dist: "216.80'", x: 297, y: 106, anchor: 'middle' },
  { bear: "S 51°15' E", dist: "172.90'", x: 490, y: 168, anchor: 'start'  },
  { bear: "S 19°00' W", dist: "129.00'", x: 554, y: 289, anchor: 'start'  },
  { bear: "N 83°36' W", dist: "350.70'", x: 323, y: 370, anchor: 'middle' },
];
const VTXS_F = [V_F.B, V_F.C, V_F.D, V_F.E];

export default function ParcelPreview({ compact = false }) {
  const rootRef = useRef(null);

  const SEG_MS  = compact ? 500  : 750;
  const GAP_MS  = compact ? 150  : 250;
  const LBL_MS  = compact ? 300  : 350;
  const STEP    = SEG_MS + GAP_MS;
  const INIT    = 80;
  const LAST    = INIT + 4 * STEP + SEG_MS;

  const [pobOn,     setPobOn]     = useState(false);
  const [northOn,   setNorthOn]   = useState(false);
  const [segReady,  setSegReady]  = useState(false);
  const [segOn,     setSegOn]     = useState([false, false, false, false, false]);
  const [labelOn,   setLabelOn]   = useState([false, false, false, false, false]);
  const [vtxOn,     setVtxOn]     = useState([false, false, false, false]);
  const [closureOn, setClosureOn] = useState(false);
  const [fillOn,    setFillOn]    = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPobOn(true); setNorthOn(true); setSegReady(true);
      setSegOn([true,true,true,true,true]);
      setLabelOn([true,true,true,true,true]);
      setVtxOn([true,true,true,true]);
      setClosureOn(true); setFillOn(true);
      return;
    }

    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));

    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();

      setPobOn(true); setNorthOn(true); setSegReady(true);

      for (let i = 0; i < 5; i++) {
        const t = INIT + i * STEP;
        const ii = i;
        at(t,           () => setSegOn(p  => { const n=[...p]; n[ii]=true; return n; }));
        at(t + LBL_MS,  () => setLabelOn(p => { const n=[...p]; n[ii]=true; return n; }));
        if (ii < 4) {
          at(t + SEG_MS, () => setVtxOn(p  => { const n=[...p]; n[ii]=true; return n; }));
        }
      }

      at(LAST + 300, () => setClosureOn(true));
      at(LAST + 700, () => setFillOn(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, { threshold: 0.1 });

    io.observe(el);
    return () => { io.disconnect(); timers.forEach(clearTimeout); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compact]);

  const V     = compact ? V_C    : V_F;
  const SEGS  = compact ? SEGS_C : SEGS_F;
  const VTXS  = compact ? VTXS_C : VTXS_F;
  const LBLS  = compact ? LABELS_C : LABELS_F;
  const poly  = [V.A, V.B, V.C, V.D, V.E].map(p => p.join(',')).join(' ');
  const gid   = compact ? 'pp-gc' : 'pp-gf';

  const segStyle = (i) => ({
    strokeDashoffset: segOn[i] ? 0 : SEGS[i].len,
    transition: segReady
      ? `stroke-dashoffset ${SEG_MS}ms cubic-bezier(0.4,0,0.2,1)`
      : 'none',
  });

  if (compact) {
    return (
      <div
        ref={rootRef}
        className="parcel-preview parcel-preview--compact"
        role="img"
        aria-label="Animated parcel boundary: metes-and-bounds geometry drawn from bearing and distance calls"
      >
        <svg
          viewBox="0 0 380 210"
          preserveAspectRatio="xMidYMid meet"
          width="100%"
          height="100%"
          aria-hidden="true"
        >
          <defs>
            <pattern id={gid} x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.14"/>
            </pattern>
          </defs>

          <rect width="380" height="210" fill={`url(#${gid})`}/>

          {/* Parcel fill — fades in last */}
          <polygon points={poly} className={`pp-fill${fillOn ? ' pp-fill--on' : ''}`}/>

          {/* Line segments — draw in sequence */}
          {SEGS.map((s, i) => (
            <line
              key={i}
              x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
              className="pp-seg pp-seg--card"
              strokeDasharray={s.len}
              style={segStyle(i)}
            />
          ))}

          {/* POB marker */}
          <g className={`pp-pob${pobOn ? ' pp-pob--on' : ''}`}>
            <circle cx={V.A[0]} cy={V.A[1]} r={4.5} className="pp-pob-dot"/>
            <circle cx={V.A[0]} cy={V.A[1]} r={10}  className="pp-pob-ring"/>
            <text
              x={V.A[0] - 13} y={V.A[1] + 16}
              textAnchor="end"
              className="pp-text"
              style={{ fontSize:'9px', letterSpacing:'0.12em', fill:'#4A6B3F', fontWeight:600 }}
            >POB</text>
          </g>

          {/* Corner dots */}
          {VTXS.map((pt, i) => (
            <circle key={i} cx={pt[0]} cy={pt[1]} r={3}
              className={`pp-vtx${vtxOn[i] ? ' pp-vtx--on' : ''}`}/>
          ))}

          {/* Bearing / distance labels */}
          {LBLS.map((lbl, i) => (
            <g key={i} className={`pp-label${labelOn[i] ? ' pp-label--on' : ''}`}>
              <text x={lbl.x} y={lbl.y} textAnchor={lbl.anchor}
                className="pp-text"
                style={{ fontSize:'11px', letterSpacing:'0.04em', fill:'var(--graphite)' }}>
                {lbl.bear}
              </text>
              <text x={lbl.x} y={lbl.y + 14} textAnchor={lbl.anchor}
                className="pp-text"
                style={{ fontSize:'10px', letterSpacing:'0.03em', fill:'var(--pencil)' }}>
                {lbl.dist}
              </text>
            </g>
          ))}

          {/* North arrow */}
          <g className={`pp-north${northOn ? ' pp-north--on' : ''}`}>
            <line x1="16" y1="58" x2="16" y2="26" className="pp-north-stem"/>
            <polygon points="12,37 16,26 20,37" className="pp-north-head"/>
            <circle cx="16" cy="64" r="1.5" className="pp-north-base"/>
            <text x="16" y="76" textAnchor="middle" className="pp-text pp-text--north"
              style={{ fontSize:'9px', letterSpacing:'0.1em' }}>N</text>
          </g>

          {/* Closure validation state — appears last. Qualitative only:
              no exact misclosure/precision figure is traceable to a
              reproducible artifact, so this shows the check ran, not a number. */}
          <g className={`pp-closure${closureOn ? ' pp-closure--on' : ''}`}>
            <text x="372" y="193" textAnchor="end" className="pp-text"
              style={{ fontSize:'8.5px', letterSpacing:'0.10em', fill:'var(--state-verified)' }}>
              CLOSURE CHECKED
            </text>
            <text x="372" y="205" textAnchor="end" className="pp-text"
              style={{ fontSize:'7.5px', letterSpacing:'0.08em', fill:'var(--pencil)', opacity:0.85 }}>
              WITHIN TOLERANCE
            </text>
          </g>
        </svg>
      </div>
    );
  }

  // ── Full / case-study version ────────────────────────────────
  return (
    <div
      ref={rootRef}
      className="parcel-preview"
      role="img"
      aria-label="Animated parcel geometry preview: metes-and-bounds boundary constructed segment by segment"
    >
      <svg
        viewBox="0 0 760 427"
        preserveAspectRatio="xMidYMid meet"
        width="100%"
        height="100%"
        aria-hidden="true"
      >
        <defs>
          <pattern id={gid} x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M 36 0 L 0 0 0 36" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.18"/>
          </pattern>
        </defs>

        <rect width="760" height="427" fill={`url(#${gid})`}/>

        <polygon points={poly} className={`pp-fill${fillOn ? ' pp-fill--on' : ''}`}/>

        {SEGS.map((s, i) => (
          <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            className="pp-seg"
            strokeDasharray={s.len}
            style={segStyle(i)}
          />
        ))}

        <g className={`pp-pob${pobOn ? ' pp-pob--on' : ''}`}>
          <circle cx={V.A[0]} cy={V.A[1]} r={5}  className="pp-pob-dot"/>
          <circle cx={V.A[0]} cy={V.A[1]} r={11} className="pp-pob-ring"/>
          <text x={V.A[0]-15} y={V.A[1]+18} textAnchor="end"
            className="pp-text pp-text--pob">POB</text>
        </g>

        {VTXS.map((pt, i) => (
          <circle key={i} cx={pt[0]} cy={pt[1]} r={3}
            className={`pp-vtx${vtxOn[i] ? ' pp-vtx--on' : ''}`}/>
        ))}

        {LBLS.map((lbl, i) => (
          <g key={i} className={`pp-label${labelOn[i] ? ' pp-label--on' : ''}`}>
            <text x={lbl.x} y={lbl.y} textAnchor={lbl.anchor}
              className="pp-text pp-text--bearing">{lbl.bear}</text>
            <text x={lbl.x} y={lbl.y+14} textAnchor={lbl.anchor}
              className="pp-text pp-text--dist">{lbl.dist}</text>
          </g>
        ))}

        <g className={`pp-north${northOn ? ' pp-north--on' : ''}`}>
          <line x1="66" y1="74" x2="66" y2="36" className="pp-north-stem"/>
          <polygon points="62,49 66,36 70,49" className="pp-north-head"/>
          <circle cx="66" cy="79" r="1.5" className="pp-north-base"/>
          <text x="66" y="93" textAnchor="middle" className="pp-text pp-text--north">N</text>
        </g>

        <g className={`pp-closure${closureOn ? ' pp-closure--on' : ''}`}>
          <text x="700" y="393" textAnchor="end" className="pp-text pp-text--closure">
            CLOSURE CHECKED
          </text>
          <text x="700" y="408" textAnchor="end" className="pp-text pp-text--closure-sub">
            WITHIN TOLERANCE
          </text>
        </g>

        <text x="380" y="21" textAnchor="middle" className="pp-text pp-text--title">
          PARCEL GEOMETRY PREVIEW
        </text>
      </svg>
    </div>
  );
}

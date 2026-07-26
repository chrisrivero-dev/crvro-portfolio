import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useTransform } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1];
const CYCLE_MS = 6500;

const MODES = [
  {
    key: 'support',
    tab: 'SUPPORT',
    accent: 'var(--olive)',
    caption: 'Ticket → Evidence → Draft → Human approval',
    steps: [
      { label: 'Ticket', state: 'incoming' },
      { label: 'Evidence', state: 'evidence' },
      { label: 'Draft', state: 'processing' },
      { label: 'Human approval', state: 'review' },
    ],
  },
  {
    key: 'ai-ops',
    tab: 'AI OPERATIONS',
    accent: 'var(--plum)',
    caption: 'Request → Proposed action → Permission gate → Execution → Verification',
    steps: [
      { label: 'Request', state: 'incoming' },
      { label: 'Proposed action', state: 'processing' },
      { label: 'Permission gate', state: 'permission' },
      { label: 'Execution', state: 'processing' },
      { label: 'Verification', state: 'verified' },
    ],
  },
  {
    key: 'gis',
    tab: 'GIS SYSTEMS',
    accent: '#4A6B3F',
    caption: 'Legal description → COGO calls → Geometry → Closure check',
    steps: [
      { label: 'Legal description', state: 'incoming' },
      { label: 'COGO calls', state: 'processing' },
      { label: 'Geometry', state: 'processing' },
      { label: 'Closure check', state: 'verified' },
    ],
  },
];

/* ── Shared step rail — nodes drawn along an SVG route, one moving
   indicator travels it once per mode activation. Reused by all three
   modes so "directional movement" reads as one consistent language. ── */
function StepRail({ mode, reduced }) {
  const n = mode.steps.length;
  const margin = 34;
  const w = 600;
  const xs = mode.steps.map((_, i) => margin + (i * (w - margin * 2)) / (n - 1));
  const d = `M ${xs.map((x) => `${x} 26`).join(' L ')}`;
  const drawDur = 0.5 + n * 0.28;

  return (
    <svg viewBox={`0 0 ${w} 64`} className="hcc-rail-svg" role="img" aria-label={`Step sequence: ${mode.steps.map((s) => s.label).join(' → ')}`}>
      <path d={d} className="hcc-rail-base" fill="none" />
      <motion.path
        d={d}
        className="hcc-rail-active"
        fill="none"
        style={{ stroke: mode.accent }}
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: reduced ? 0 : drawDur, ease: EASE }}
      />
      {!reduced && (
        <circle r="3.4" className="hcc-rail-signal" style={{ fill: mode.accent }}>
          <animateMotion dur={`${drawDur}s`} repeatCount="1" path={d} />
        </circle>
      )}
      {xs.map((x, i) => (
        <motion.circle
          key={mode.steps[i].label}
          cx={x}
          cy={26}
          r={5.5}
          style={{ fill: `var(--state-${mode.steps[i].state})` }}
          initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0.3, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: reduced ? 0 : (i / Math.max(n - 1, 1)) * drawDur, ease: EASE }}
        />
      ))}
      {xs.map((x, i) => (
        <motion.text
          key={mode.steps[i].label + '-lab'}
          x={x}
          y={52}
          textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
          className="hcc-rail-label"
          initial={reduced ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: reduced ? 0 : (i / Math.max(n - 1, 1)) * drawDur + 0.1 }}
        >
          {mode.steps[i].label}
        </motion.text>
      ))}
    </svg>
  );
}

/* ── Signature visual: SUPPORT — evidence chips + closing approval gate ── */
function SupportVisual({ reduced }) {
  return (
    <svg viewBox="0 0 360 130" className="hcc-visual" role="img" aria-label="Evidence chips assembling, then an approval gate closing">
      {[0, 1, 2].map((i) => (
        <motion.rect
          key={i}
          x={40 + i * 46} y={40} width={36} height={24} rx={4}
          className="hcc-chip"
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: reduced ? 0 : 0.5 + i * 0.14, ease: EASE }}
        />
      ))}
      <motion.g
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: reduced ? 0 : 1.3 }}
      >
        <line x1="220" y1="30" x2="220" y2="90" className="hcc-gate-post" />
        <motion.rect
          x="222" y="35" width="70" height="50" rx="4"
          className="hcc-gate-bar"
          style={{ transformOrigin: '222px 60px' }}
          initial={reduced ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.45, delay: reduced ? 0 : 1.55, ease: EASE }}
        />
        <motion.text
          x="257" y="63" textAnchor="middle" className="hcc-gate-label"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: reduced ? 0 : 1.9 }}
        >LOCKED</motion.text>
      </motion.g>
    </svg>
  );
}

/* ── Signature visual: AI OPERATIONS — routing branch + verification stamp ── */
function AiOpsVisual({ reduced }) {
  const activeD = 'M90,65 C130,65 130,32 170,32';
  return (
    <svg viewBox="0 0 360 130" className="hcc-visual" role="img" aria-label="Request routing to a local or cloud branch, then a verification stamp">
      <line x1="20" y1="65" x2="90" y2="65" className="hcc-route-line" />
      <motion.path
        d={activeD}
        className="hcc-route-line hcc-route-line--active"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.55, delay: reduced ? 0 : 0.5, ease: EASE }}
      />
      <path d="M90,65 C130,65 130,98 170,98" className="hcc-route-line" />
      {!reduced && (
        <circle r="3" className="hcc-route-signal">
          <animateMotion dur="1s" begin="0.5s" repeatCount="1" path={activeD} />
        </circle>
      )}
      <motion.text x="182" y="36" className="hcc-route-label"
        initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: reduced ? 0 : 0.9 }}>LOCAL</motion.text>
      <text x="182" y="102" className="hcc-route-label hcc-route-label--dim">CLOUD</text>

      <motion.g
        initial={reduced ? false : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: reduced ? 0 : 1.3, ease: 'backOut' }}
        style={{ transformOrigin: '300px 32px' }}
      >
        <circle cx="300" cy="32" r="16" className="hcc-stamp-ring" />
        <path d="M293,32 l5,5 l10,-11" className="hcc-stamp-check" />
      </motion.g>
    </svg>
  );
}

/* ── Signature visual: GIS — survey grid + parcel geometry drawing ── */
function GisVisual({ reduced }) {
  const poly = '40,95 58,42 128,30 168,62 150,105';
  const lineD = 'M 40 95 L 58 42 L 128 30 L 168 62 L 150 105 L 40 95';
  return (
    <svg viewBox="0 0 360 130" className="hcc-visual" role="img" aria-label="Survey grid with parcel boundary drawing and closing">
      <motion.g
        className="hcc-grid"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={'v' + i} x1={i * 24} y1="0" x2={i * 24} y2="130" />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <line key={'h' + i} x1="0" y1={i * 28} x2="360" y2={i * 28} />
        ))}
      </motion.g>
      <motion.polygon
        points={poly}
        className="hcc-parcel-fill"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: reduced ? 0 : 1.3 }}
      />
      <motion.polyline
        points={poly + ' 40,95'}
        className="hcc-parcel-line"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, delay: reduced ? 0 : 0.45, ease: EASE }}
      />
      {!reduced && (
        <circle r="3" className="hcc-parcel-signal">
          <animateMotion dur="0.9s" begin="0.45s" repeatCount="1" path={lineD} />
        </circle>
      )}
      <motion.g
        initial={reduced ? false : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: reduced ? 0 : 1.5, ease: 'backOut' }}
        style={{ transformOrigin: '300px 40px' }}
      >
        <circle cx="300" cy="40" r="15" className="hcc-stamp-ring" />
        <path d="M293,40 l5,5 l10,-11" className="hcc-stamp-check" />
      </motion.g>
    </svg>
  );
}

const VISUALS = { support: SupportVisual, 'ai-ops': AiOpsVisual, gis: GisVisual };

/* Small pointer-responsive depth on the panel — desktop, fine-pointer only,
   skipped entirely under reduced motion. Capped rotation keeps it subtle. */
function useTiltHandlers(reduced) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useTransform(rx, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(ry, [-0.5, 0.5], [-4, 4]);
  const enabled = !reduced && typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const onMouseMove = useCallback((e) => {
    if (!enabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    rx.set((e.clientY - rect.top) / rect.height - 0.5);
    ry.set((e.clientX - rect.left) / rect.width - 0.5);
  }, [enabled, rx, ry]);

  const onMouseLeave = useCallback(() => {
    rx.set(0);
    ry.set(0);
  }, [rx, ry]);

  return { rotateX, rotateY, onMouseMove, onMouseLeave, enabled };
}

export default function HeroCommandCenter() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [userDriven, setUserDriven] = useState(false);
  const timerRef = useRef(null);
  const tabRefs = useRef([]);
  const tilt = useTiltHandlers(reduced);

  useEffect(() => {
    if (reduced || userDriven) return;
    timerRef.current = setInterval(() => {
      setActive((a) => (a + 1) % MODES.length);
    }, CYCLE_MS);
    return () => clearInterval(timerRef.current);
  }, [reduced, userDriven]);

  const select = useCallback((i) => {
    setUserDriven(true);
    setActive(i);
  }, []);

  const onKeyDown = useCallback((e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const next = (active + dir + MODES.length) % MODES.length;
    setUserDriven(true);
    setActive(next);
    tabRefs.current[next]?.focus();
  }, [active]);

  const mode = MODES[active];
  const Visual = VISUALS[mode.key];

  return (
    <div
      className="hcc"
      onMouseEnter={() => setUserDriven(true)}
      style={{ '--hcc-accent': mode.accent }}
    >
      <div className="hcc-tabs" role="tablist" aria-label="Professional discipline demonstrations" onKeyDown={onKeyDown}>
        {MODES.map((m, i) => (
          <button
            key={m.key}
            ref={(el) => { tabRefs.current[i] = el; }}
            role="tab"
            id={`hcc-tab-${m.key}`}
            aria-selected={i === active}
            aria-controls={`hcc-panel-${m.key}`}
            tabIndex={i === active ? 0 : -1}
            className={'hcc-tab' + (i === active ? ' hcc-tab--active' : '')}
            onClick={() => select(i)}
          >
            {m.tab}
          </button>
        ))}
      </div>

      <div
        id={`hcc-panel-${mode.key}`}
        role="tabpanel"
        aria-labelledby={`hcc-tab-${mode.key}`}
        className="hcc-panel-wrap"
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={tilt.onMouseLeave}
      >
        <motion.div
          className="hcc-panel"
          style={tilt.enabled ? { rotateX: tilt.rotateX, rotateY: tilt.rotateY } : undefined}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={mode.key}
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduced ? {} : { opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="hcc-caption">{mode.caption}</p>
              <StepRail mode={mode} reduced={reduced} />
              <Visual reduced={reduced} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

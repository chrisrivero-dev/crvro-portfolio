import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// Perpendicular control-point offset per port side — keeps the curve
// travelling straight out of the card edge before bending toward the
// next port, so it stays inside the gutter instead of cutting a corner
// through card content.
const OFFSET = 46;
function controlPoint(pt, side, sign = 1) {
  switch (side) {
    case 'right':  return { x: pt.x + OFFSET * sign, y: pt.y };
    case 'left':   return { x: pt.x - OFFSET * sign, y: pt.y };
    case 'top':    return { x: pt.x, y: pt.y - OFFSET * sign };
    case 'bottom': return { x: pt.x, y: pt.y + OFFSET * sign };
    default:       return pt;
  }
}

function segmentPath(out, outSide, inp, inSide) {
  const c1 = controlPoint(out, outSide, 1);
  const c2 = controlPoint(inp, inSide, 1);
  return `M ${out.x.toFixed(1)} ${out.y.toFixed(1)} C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)}, ${c2.x.toFixed(1)} ${c2.y.toFixed(1)}, ${inp.x.toFixed(1)} ${inp.y.toFixed(1)}`;
}

/**
 * One curved connector between two card-edge ports. Renders a dim base
 * (always visible, so the system's wiring reads immediately) plus a
 * bright active overlay + entry-node pulse that fire once when the
 * destination card scrolls into view — not a continuous scroll-scrubbed
 * line, so nothing appears "already drawn" across the page.
 */
function Segment({ d, accent, reduced }) {
  return (
    <g>
      <path d={d} className="route-seg-base" fill="none" />
      <motion.path
        d={d}
        className="route-seg-active"
        fill="none"
        style={{ stroke: accent }}
        initial={reduced ? false : { pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.5, root: null }}
        transition={{ duration: reduced ? 0 : 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
      {!reduced && (
        <motion.circle
          r="3"
          className="route-seg-signal"
          style={{ fill: accent }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: [0, 1, 0] }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1, delay: 0.1, ease: 'easeInOut' }}
        >
          <animateMotion dur="0.9s" begin="0.05s" repeatCount="1" path={d} />
        </motion.circle>
      )}
    </g>
  );
}

function PortPulse({ x, y, accent, reduced }) {
  return (
    <>
      <motion.circle
        cx={x} cy={y} r={9}
        className="route-port-pulse"
        style={{ stroke: accent }}
        initial={reduced ? { opacity: 0 } : { opacity: 0.7, scale: 1 }}
        whileInView={reduced ? {} : { opacity: 0, scale: 2.2 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      <motion.circle
        cx={x} cy={y} r={5}
        className="route-port-node"
        style={{ fill: accent }}
        initial={reduced ? { opacity: 1 } : { opacity: 0.5, scale: 0.7 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      />
    </>
  );
}

/**
 * Connects card-edge ports (measured via refs) with curved paths routed
 * through the gutters between cards — never through card interiors.
 * `cards` = [{ ref, accent, ports: { in?: {ref, side}, out?: {ref, side} } }]
 */
export default function RouteRail({ containerRef, cards, layoutVersion = 0 }) {
  const reduced = useReducedMotion();
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [segs, setSegs] = useState([]);
  const [ports, setPorts] = useState([]);

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cr = container.getBoundingClientRect();
    const mobile = window.matchMedia('(max-width: 900px)').matches;
    const rel = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left - cr.left + r.width / 2, y: r.top - cr.top + r.height / 2 };
    };

    const nextSegs = [];
    for (let i = 0; i < cards.length - 1; i++) {
      const a = cards[i], b = cards[i + 1];
      const outAnchor = a.ports.out;
      const inAnchor = b.ports.in;
      const outPt = rel(outAnchor?.ref.current);
      const inPt = rel(inAnchor?.ref.current);
      if (!outPt || !inPt) continue;
      nextSegs.push({
        d: segmentPath(
          outPt,
          mobile ? 'bottom' : outAnchor.side,
          inPt,
          mobile ? 'top' : inAnchor.side
        ),
        accent: b.accent,
        key: i,
      });
    }

    const nextPorts = [];
    cards.forEach((c) => {
      if (mobile) {
        const anchor = c.ports.in || c.ports.out;
        const pt = rel(anchor?.ref.current);
        if (pt) nextPorts.push({ ...pt, accent: c.accent, key: c.id + '-mobile' });
        return;
      }
      ['in', 'out'].forEach((k) => {
        const anchor = c.ports[k];
        if (!anchor) return;
        const pt = rel(anchor.ref.current);
        if (pt) nextPorts.push({ ...pt, accent: c.accent, key: c.id + '-' + k });
      });
    });

    setDims({ w: cr.width, h: cr.height });
    setSegs(nextSegs);
    setPorts(nextPorts);
  }, [containerRef, cards]);

  useEffect(() => {
    measure();
    let settleTimer;
    const onResize = () => {
      measure();
      clearTimeout(settleTimer);
      settleTimer = setTimeout(measure, 80);
    };
    const ro = new ResizeObserver(onResize);
    if (containerRef.current) ro.observe(containerRef.current);
    cards.forEach((card) => {
      if (card.ref.current) ro.observe(card.ref.current);
    });
    window.addEventListener('resize', measure);
    const t = setTimeout(measure, 300);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      clearTimeout(t);
      clearTimeout(settleTimer);
    };
  }, [measure]);

  useEffect(() => {
    let secondFrame;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(measure);
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      if (secondFrame) cancelAnimationFrame(secondFrame);
    };
  }, [layoutVersion, measure]);

  if (dims.w === 0 || segs.length === 0) return null;

  return (
    <svg
      className="route-map-svg"
      aria-hidden="true"
      viewBox={`0 0 ${dims.w} ${dims.h}`}
      style={{ width: dims.w, height: dims.h }}
    >
      {segs.map((s) => (
        <Segment key={s.key} d={s.d} accent={s.accent} reduced={reduced} />
      ))}
      {ports.map((p) => (
        <PortPulse key={p.key} x={p.x} y={p.y} accent={p.accent} reduced={reduced} />
      ))}
    </svg>
  );
}

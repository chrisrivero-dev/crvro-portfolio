import React, { useRef, useEffect, useState, useCallback } from "react";
import ProjectMark from "./ProjectMark.jsx";
import { PROJECTS } from "../data/projects.js";

// Returns cubic-bezier path strings — one per route hop.
// Splitting into segments lets each piece draw independently.
function buildSegments(pts) {
  if (pts.length < 2) return [];
  const segs = [];
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1];
    const c = pts[i];
    const mx = ((p.x + c.x) / 2).toFixed(1);
    segs.push(
      `M ${p.x.toFixed(1)},${p.y.toFixed(1)} ` +
      `C ${mx},${p.y.toFixed(1)} ${mx},${c.y.toFixed(1)} ${c.x.toFixed(1)},${c.y.toFixed(1)}`
    );
  }
  return segs;
}

// Timing: card appears → halo fires → segment draws → next card.
const SEG_DRAW_MS = 650;
const HALO_DELAY  = 250; // ms after card before halo ring fires
const SEG_DELAY   = 100; // ms after halo before segment starts drawing
const CARD_GAP    = 150; // ms after segment finishes before next card

// Each hop = HALO_DELAY + SEG_DELAY + SEG_DRAW_MS + CARD_GAP = 1150ms
const HOP = HALO_DELAY + SEG_DELAY + SEG_DRAW_MS + CARD_GAP;

const T = {
  card0:   0,
  halo0:   HALO_DELAY,
  seg0:    HALO_DELAY + SEG_DELAY,
  card1:   HOP,
  halo1:   HOP + HALO_DELAY,
  seg1:    HOP + HALO_DELAY + SEG_DELAY,
  card2:   HOP * 2,
  halo2:   HOP * 2 + HALO_DELAY,
  seg2:    HOP * 2 + HALO_DELAY + SEG_DELAY,
  card3:   HOP * 3,
  halo3:   HOP * 3 + HALO_DELAY,
  seg3:    HOP * 3 + HALO_DELAY + SEG_DELAY,
  card4:   HOP * 4,
  halo4:   HOP * 4 + HALO_DELAY,
  closing: HOP * 4 + HALO_DELAY + 700,
};
// card0=0, halo0=250, seg0=350, card1=1150, halo1=1400, seg1=1500,
// card2=2300, halo2=2550, seg2=2650, card3=3450, halo3=3700, seg3=3800,
// card4=4600, halo4=4850, closing=5550

export default function Projects() {
  const mapRef      = useRef(null);
  const cardRefs    = useRef(Array(5).fill(null));
  const segPathRefs = useRef([null, null, null, null]);

  const [segPaths,    setSegPaths]    = useState([]);
  const [routeNodes,  setRouteNodes]  = useState([]);
  const [svgDims,     setSvgDims]     = useState({ w: 0, h: 0 });
  // Sentinel (99999) keeps segments invisible before real lengths are measured.
  const [segLengths,  setSegLengths]  = useState([99999, 99999, 99999, 99999]);
  const [segReady,    setSegReady]    = useState(false);
  const [segOn,       setSegOn]       = useState([false, false, false, false]);
  const [cardOn,      setCardOn]      = useState([false, false, false, false, false]);
  const [nodeHaloOn,  setNodeHaloOn]  = useState([false, false, false, false, false]);
  const [closingOn,   setClosingOn]   = useState(false);

  // Recompute segment paths + node positions from actual rendered card rects.
  const recompute = useCallback(() => {
    const container = mapRef.current;
    if (!container) return;
    const cr = container.getBoundingClientRect();

    const pts = [];
    for (let i = 0; i < 5; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const isRight = i % 2 === 1;
      pts.push({
        x: isRight ? r.left - cr.left : r.right - cr.left,
        y: r.top - cr.top + r.height / 2,
        color: PROJECTS[i].accent,
      });
    }

    setSvgDims({ w: cr.width, h: cr.height });
    setSegPaths(buildSegments(pts));
    setRouteNodes(pts);
  }, []);

  // Recompute on mount; recompute on container resize.
  useEffect(() => {
    recompute();
    const ro = new ResizeObserver(recompute);
    if (mapRef.current) ro.observe(mapRef.current);
    return () => ro.disconnect();
  }, [recompute]);

  // Measure each segment's true length once its <path> element exists.
  useEffect(() => {
    if (segPaths.length === 0) return;
    const lengths = segPathRefs.current.map(el =>
      el ? Math.round(el.getTotalLength()) : 99999
    );
    setSegLengths(lengths);
  }, [segPaths]);

  // Sequential animation chain triggered once when the route-map grid enters view.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Instant-reveal for prefers-reduced-motion.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSegReady(true);
      setCardOn([true, true, true, true, true]);
      setSegOn([true, true, true, true]);
      setClosingOn(true);
      return;
    }

    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();

        // Enable CSS transition on route segments now so the dashoffset→0
        // transition fires correctly. Must happen before the seg* timeouts.
        setSegReady(true);

        at(T.card0,   () => setCardOn(p => [true,  p[1], p[2], p[3], p[4]]));
        at(T.halo0,   () => setNodeHaloOn(p => [true,  p[1], p[2], p[3], p[4]]));
        at(T.seg0,    () => setSegOn(p  => [true,  p[1], p[2], p[3]]));
        at(T.card1,   () => setCardOn(p => [p[0], true,  p[2], p[3], p[4]]));
        at(T.halo1,   () => setNodeHaloOn(p => [p[0], true,  p[2], p[3], p[4]]));
        at(T.seg1,    () => setSegOn(p  => [p[0], true,  p[2], p[3]]));
        at(T.card2,   () => setCardOn(p => [p[0], p[1], true,  p[3], p[4]]));
        at(T.halo2,   () => setNodeHaloOn(p => [p[0], p[1], true,  p[3], p[4]]));
        at(T.seg2,    () => setSegOn(p  => [p[0], p[1], true,  p[3]]));
        at(T.card3,   () => setCardOn(p => [p[0], p[1], p[2], true,  p[4]]));
        at(T.halo3,   () => setNodeHaloOn(p => [p[0], p[1], p[2], true,  p[4]]));
        at(T.seg3,    () => setSegOn(p  => [p[0], p[1], p[2], true]));
        at(T.card4,   () => setCardOn(p => [p[0], p[1], p[2], p[3], true]));
        at(T.halo4,   () => setNodeHaloOn(p => [p[0], p[1], p[2], p[3], true]));
        at(T.closing, () => setClosingOn(true));
      },
      { threshold: 0.15 }
    );

    io.observe(map);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  const renderCard = (pi) => {
    const p    = PROJECTS[pi];
    const side = pi % 2 === 0 ? "left" : "right";
    return (
      <a
        key={p.id}
        ref={(el) => { cardRefs.current[pi] = el; }}
        className={`prm-card prm-card--${side}${cardOn[pi] ? " prm-card--on" : ""}`}
        href={"/projects/" + p.slug}
        data-screen-label={"Project " + p.slug}
      >
        <div className="prm-card-top">
          <span className="prm-idx">{p.n}</span>
          <div className="prm-mark-wrap">
            <ProjectMark shape={p.shape} color={p.accent} size={60} />
          </div>
          <div className="prm-meta">
            {p.statusBadge && <span className="proj-status">{p.statusBadge}</span>}
            <span className="prm-kind">{p.kind}</span>
            <span className="prm-yr">{p.year}</span>
          </div>
        </div>
        <h3 className="prm-title">{p.title} <em>{p.titleEm}</em></h3>
        <p className="prm-desc">{p.desc}</p>
        <div className="prm-foot">
          <span className="prm-tags">{p.tags[0]}</span>
          <span className="prm-arrow">→</span>
        </div>
      </a>
    );
  };

  return (
    <section className="work" id="work" data-screen-label="02 Work">
      <div className="container-wide">
        <div className="section-head reveal">
          <div className="index">§ 01 — Selected Work</div>
          <div className="h">
            A few systems I built around{" "}
            <em>support, automation, and decision workflows.</em>
          </div>
        </div>

        {/* Cards are direct grid children — preserves DOM order for mobile */}
        <div className="project-route-map" ref={mapRef}>
          {/* Four individually animated SVG route segments — position:absolute, non-interactive */}
          {segPaths.length > 0 && (
            <svg
              className="prm-svg"
              aria-hidden="true"
              viewBox={`0 0 ${svgDims.w} ${svgDims.h}`}
              style={{ width: svgDims.w, height: svgDims.h }}
            >
              {segPaths.map((d, i) => (
                <path
                  key={i}
                  ref={(el) => { segPathRefs.current[i] = el; }}
                  className={`prm-route${segReady ? " prm-route--ready" : ""}${segOn[i] ? " prm-route--on" : ""}`}
                  d={d}
                  fill="none"
                  strokeDasharray={segLengths[i]}
                  strokeDashoffset={segOn[i] ? 0 : segLengths[i]}
                />
              ))}
              {routeNodes.map((node, i) => (
                <g key={i} className={`prm-node${cardOn[i] ? " prm-node--on" : ""}${nodeHaloOn[i] ? " prm-node--halo" : ""}`}>
                  <circle
                    className="prm-node-halo"
                    cx={node.x} cy={node.y} r={7}
                    style={{ stroke: node.color }}
                  />
                  <circle
                    className="prm-node-ring"
                    cx={node.x} cy={node.y} r={7}
                    style={{ stroke: node.color }}
                  />
                  <circle
                    className="prm-node-dot"
                    cx={node.x} cy={node.y} r={3.5}
                    style={{ fill: node.color }}
                  />
                </g>
              ))}
            </svg>
          )}

          {renderCard(0)}{/* Sidecar      — left  col, row 1 */}
          {renderCard(1)}{/* OpenClaw     — right col, row 1, offset */}
          {renderCard(2)}{/* Help Nearby  — left  col, row 2 */}
          {renderCard(3)}{/* Predmkt Bot  — right col, row 2, offset */}
          {renderCard(4)}{/* GroundRules  — left  col, row 3 */}
        </div>

        <p className={`prm-closing${closingOn ? " prm-closing--on" : ""}`}>
          Each project solves a different problem, but the pattern is the same:
          reduce friction, show the work, and keep the user in control.
        </p>
      </div>
    </section>
  );
}

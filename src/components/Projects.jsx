import React, { useRef, useEffect, useState, useCallback } from "react";
import ProjectMark from "./ProjectMark.jsx";
import { PROJECTS } from "../data/projects.js";

// Returns 3 separate cubic-bezier path strings — one per route hop.
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

// Animation timing offsets from IntersectionObserver fire (ms).
// Card reveal → segment draw → next card → … → closing line.
// Segment draw duration is 700ms (matches CSS transition below).
const SEG_DRAW_MS = 700;
const CARD_PAUSE  = 350; // gap between card appearing and next segment starting

const T = {
  card0:   0,
  seg0:    CARD_PAUSE,
  card1:   CARD_PAUSE + SEG_DRAW_MS,
  seg1:    CARD_PAUSE + SEG_DRAW_MS + CARD_PAUSE,
  card2:   CARD_PAUSE + SEG_DRAW_MS + CARD_PAUSE + SEG_DRAW_MS,
  seg2:    CARD_PAUSE + SEG_DRAW_MS + CARD_PAUSE + SEG_DRAW_MS + CARD_PAUSE,
  card3:   CARD_PAUSE + SEG_DRAW_MS + CARD_PAUSE + SEG_DRAW_MS + CARD_PAUSE + SEG_DRAW_MS,
  closing: CARD_PAUSE + SEG_DRAW_MS + CARD_PAUSE + SEG_DRAW_MS + CARD_PAUSE + SEG_DRAW_MS + CARD_PAUSE + 500,
};
// T.card0=0, T.seg0=350, T.card1=1050, T.seg1=1400, T.card2=2100,
// T.seg2=2450, T.card3=3150, T.closing=4000

export default function Projects() {
  const sectionRef  = useRef(null);
  const mapRef      = useRef(null);
  // cardRefs[i] → PROJECTS[i] in order (0=Sidecar,1=OpenClaw,2=HelpNearby,3=Predmkt)
  const cardRefs    = useRef(Array(4).fill(null));
  // segPathRefs[i] → the <path> element for route segment i (0=Sidecar→OC, 1=OC→HN, 2=HN→PM)
  const segPathRefs = useRef([null, null, null]);

  const [segPaths,   setSegPaths]   = useState([]);
  const [routeNodes, setRouteNodes] = useState([]);
  const [svgDims,    setSvgDims]    = useState({ w: 0, h: 0 });
  // Sentinel (99999) keeps segments invisible before real lengths are measured.
  const [segLengths, setSegLengths] = useState([99999, 99999, 99999]);
  const [segOn,      setSegOn]      = useState([false, false, false]);
  const [cardOn,     setCardOn]     = useState([false, false, false, false]);
  const [closingOn,  setClosingOn]  = useState(false);

  // Recompute segment paths + node positions from actual rendered card rects.
  const recompute = useCallback(() => {
    const container = mapRef.current;
    if (!container) return;
    const cr = container.getBoundingClientRect();

    const pts = [];
    for (let i = 0; i < 4; i++) {
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

  // Sequential animation chain triggered once when the section enters view.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Instant-reveal for prefers-reduced-motion.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCardOn([true, true, true, true]);
      setSegOn([true, true, true]);
      setClosingOn(true);
      return;
    }

    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();

        // Sidecar card → seg 0 draws → OpenClaw card → seg 1 draws →
        // Help Nearby card → seg 2 draws → Predmkt card → closing line.
        at(T.card0,   () => setCardOn(p => [true,  p[1], p[2], p[3]]));
        at(T.seg0,    () => setSegOn(p  => [true,  p[1], p[2]]));
        at(T.card1,   () => setCardOn(p => [p[0], true,  p[2], p[3]]));
        at(T.seg1,    () => setSegOn(p  => [p[0], true,  p[2]]));
        at(T.card2,   () => setCardOn(p => [p[0], p[1], true,  p[3]]));
        at(T.seg2,    () => setSegOn(p  => [p[0], p[1], true]));
        at(T.card3,   () => setCardOn(p => [p[0], p[1], p[2], true]));
        at(T.closing, () => setClosingOn(true));
      },
      { threshold: 0.07 }
    );

    io.observe(section);
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
    <section className="work" id="work" data-screen-label="02 Work" ref={sectionRef}>
      <div className="container-wide">
        <div className="section-head reveal">
          <div className="index">§ 01 — Selected Work</div>
          <div className="h">
            A few systems I built around{" "}
            <em>support, automation, and decision workflows.</em>
          </div>
        </div>

        {/* Cards are direct grid children — preserves 01,02,03,04 DOM order for mobile */}
        <div className="project-route-map" ref={mapRef}>
          {/* Three individually animated SVG route segments — position:absolute, non-interactive */}
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
                  className={`prm-route${segOn[i] ? " prm-route--on" : ""}`}
                  d={d}
                  fill="none"
                  strokeDasharray={segLengths[i]}
                  strokeDashoffset={segOn[i] ? 0 : segLengths[i]}
                />
              ))}
              {/* Node dots appear alongside their matching card */}
              {routeNodes.map((node, i) => (
                <g key={i} className={`prm-node${cardOn[i] ? " prm-node--on" : ""}`}>
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

          {renderCard(0)}{/* Sidecar     — left  col, row 1 */}
          {renderCard(1)}{/* OpenClaw    — right col, row 1, offset */}
          {renderCard(2)}{/* Help Nearby — left  col, row 2 */}
          {renderCard(3)}{/* Predmkt Bot — right col, row 2, offset */}
        </div>

        <p className={`prm-closing${closingOn ? " prm-closing--on" : ""}`}>
          Each project solves a different problem, but the pattern is the same:
          reduce friction, show the work, and keep the user in control.
        </p>
      </div>
    </section>
  );
}

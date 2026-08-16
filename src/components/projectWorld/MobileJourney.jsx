// ============================================================
// Project World — mobile journey
//
// One island per screen, stacked vertically. A single curved rail
// runs the length of the section and the ship scrubs down it with
// scroll progress, so the voyage stays continuous without ever
// needing a shrunken full chart or sideways scrolling.
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from "react";
import DestinationCard from "./DestinationCard.jsx";
import IslandVignette from "./IslandVignette.jsx";
import WorldMap from "./WorldMap.jsx";
import { clamp, F } from "./geometry.js";
import { STOPS } from "./worldData.jsx";

/** Lateral rail positions — the route weaves rather than running dead straight. */
const RAIL_X = [28, 12, 44, 12, 44];

export default function MobileJourney({ onOpenOverview, reduced }) {
  const rootRef = useRef(null);
  const stopRefs = useRef([]);
  const railSvgRef = useRef(null);
  const railPathRef = useRef(null);
  const railGoneRef = useRef(null);
  const railLenRef = useRef(0);
  const [railHeight, setRailHeight] = useState(0);
  const [railD, setRailD] = useState("");
  const [activeSet, setActiveSet] = useState(() => new Set());

  /** Build a rail that threads through each island's vignette. */
  const buildRail = useCallback(() => {
    const root = rootRef.current;
    if (!root || root.offsetParent === null) return;
    const contTop = root.getBoundingClientRect().top + window.scrollY;
    const pts = stopRefs.current.filter(Boolean).map((li) => {
      const r = li.getBoundingClientRect();
      return r.top + window.scrollY - contTop + r.height * 0.32;
    });
    if (!pts.length) return;

    let d = "M 28 0";
    pts.forEach((py, i) => {
      const x = RAIL_X[i % RAIL_X.length];
      d += ` C 28 ${F(py - 120)}, ${x} ${F(py - 80)}, ${x} ${F(py)}`;
      d += ` C ${x} ${F(py + 60)}, 28 ${F(py + 110)}, 28 ${F(py + 150)}`;
    });
    d += ` L 28 ${F(root.offsetHeight - 60)}`;

    setRailD(d);
    setRailHeight(root.offsetHeight);
  }, []);

  /** Reveal the traveled portion of the rail to match scroll position. */
  const scrub = useCallback(() => {
    const root = rootRef.current;
    const path = railPathRef.current;
    const gone = railGoneRef.current;
    if (!root || !path || !gone || root.offsetParent === null) return;

    const r = root.getBoundingClientRect();
    const vh = window.innerHeight;
    const span = r.height - vh * 0.1;
    if (span <= 0) return;
    const prog = clamp((vh * 0.55 - r.top) / span, 0, 1);
    const len = railLenRef.current;
    const at = prog * len;
    gone.style.strokeDashoffset = len - at;
  }, []);

  // Measure the rail once the path is in the DOM.
  useEffect(() => {
    const path = railPathRef.current;
    const gone = railGoneRef.current;
    if (!path || !gone || !railD) return;
    railLenRef.current = path.getTotalLength();
    gone.style.strokeDasharray = railLenRef.current;
    gone.style.strokeDashoffset = railLenRef.current;
    scrub();
  }, [railD, scrub]);

  useEffect(() => {
    buildRail();
    const t1 = window.setTimeout(buildRail, 120);
    const t2 = window.setTimeout(buildRail, 600);
    let resizeTimer;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(buildRail, 120);
    };
    const onScroll = () => scrub();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [buildRail, scrub]);

  // Activate each island as it reaches the middle of the screen.
  useEffect(() => {
    const els = stopRefs.current.filter(Boolean);
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const i = Number(en.target.dataset.stop);
          setActiveSet((prev) => {
            if (prev.has(i)) return prev;
            const next = new Set(prev);
            next.add(i);
            return next;
          });
        });
      },
      { rootMargin: "-25% 0px -25% 0px", threshold: 0.05 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="pw-mobile" ref={rootRef}>
      <svg
        className="pwm-rail-svg"
        aria-hidden="true"
        viewBox={`0 0 64 ${Math.max(railHeight, 1)}`}
        height={railHeight}
        ref={railSvgRef}
      >
        {railD && (
          <>
            <path className="pwm-rail-path" d={railD} ref={railPathRef} />
            <path className="pwm-rail-gone" d={railD} ref={railGoneRef} />
          </>
        )}
      </svg>

      <ol className="pwm-stops">
        {STOPS.map((stop, i) => {
          const active = reduced || activeSet.has(i);
          return (
            <li
              className={"pwm-stop" + (active ? " active" : "")}
              key={stop.id}
              id={`pw-stop-${stop.id}`}
              data-stop={i}
              ref={(el) => {
                stopRefs.current[i] = el;
              }}
            >
              <div className="pwm-stopnum">
                {i === 0 ? "HOME PORT" : `STOP 0${i + 1}`} · 0{i + 1} / 0{STOPS.length}
              </div>
              <div className="pwm-vig">
                <IslandVignette stop={stop} index={i} active={active} />
              </div>
              <article className="pr-card">
                <DestinationCard
                  card={stop.card}
                  onSail={(target) => {
                    const el = document.getElementById(`pw-stop-${STOPS[target].id}`);
                    if (el) {
                      el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
                    }
                  }}
                />
              </article>
            </li>
          );
        })}
      </ol>

      <div className="pwm-closing" id="pw-voyage-log">
        <div className="pwm-stopnum">§ VOYAGE LOG · JOURNEY COMPLETE</div>
        <div className="pwm-worldmini">
          <WorldMap
            allRoutesGone
            title="Project World: the complete chart with every destination and the full traveled route."
          />
        </div>
        <article className="pr-card">
          <h3 className="pr-title">
            Every route, <em>logged.</em>
          </h3>
          <p className="pr-desc">
            Pulled back, the whole chart reads as one system: local models where possible, approval
            gates on everything consequential, verification before anything ships.
          </p>
          <div className="pw-close-actions">
            <button type="button" className="pr-cta-link" onClick={onOpenOverview}>
              Open the world map <span className="ar">→</span>
            </button>
            <a className="pr-cta-link" href="/projects/openclaw">
              Explore case studies <span className="ar">→</span>
            </a>
            <a className="pr-cta-link" href="/#contact">
              Contact Christopher <span className="ar">→</span>
            </a>
          </div>
        </article>
      </div>
    </div>
  );
}

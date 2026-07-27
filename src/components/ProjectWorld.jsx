// ============================================================
// Project World — Selected Work
//
// Desktop: a tall scroll track drives a sticky stage. Scroll
// position, the island buttons, the dots, and Previous/Next all
// resolve to the same "band" — so however a visitor navigates,
// the ship, the map, and the card stay in agreement. The final
// band pulls back to show the whole traveled route.
//
// Mobile gets a dedicated vertical journey (MobileJourney).
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import DestinationCard from "./projectWorld/DestinationCard.jsx";
import MobileJourney from "./projectWorld/MobileJourney.jsx";
import WorldMap from "./projectWorld/WorldMap.jsx";
import WorldOverlay from "./projectWorld/WorldOverlay.jsx";
import useShipEngine from "./projectWorld/useShipEngine.js";
import { clamp } from "./projectWorld/geometry.js";
import { BANDS, LEGS, OVERVIEW, SIDE_ISLAND, STOPS } from "./projectWorld/worldData.jsx";

export default function ProjectWorld() {
  const reduced = useReducedMotion();
  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const desktopRef = useRef(null);
  const svgRef = useRef(null);
  const navLockRef = useRef(-1);

  const [band, setBand] = useState(0);
  const [announced, setAnnounced] = useState("");
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);

  const { travelTo } = useShipEngine(svgRef, { reduced });

  const isDesktop = useCallback(
    () => !!desktopRef.current && desktopRef.current.offsetParent !== null,
    []
  );

  /** Move the whole stage — ship, map, and card — to a band. */
  const goTo = useCallback(
    (next, announce) => {
      const target = clamp(next, 0, OVERVIEW);
      setBand(target);
      travelTo(target === OVERVIEW ? LEGS.length : target, () => {
        if (!announce) return;
        setAnnounced(
          target === OVERVIEW
            ? "World overview: the full traveled route with all five destinations."
            : `Arrived at ${STOPS[target].name}, stop ${target + 1} of ${STOPS.length}.`
        );
      });
    },
    [travelTo]
  );

  /** Controls scroll the track; the scroll handler then confirms the band. */
  const scrollToBand = useCallback(
    (next) => {
      const target = clamp(next, 0, OVERVIEW);
      const track = trackRef.current;
      const stage = stageRef.current;
      if (!track || !stage || !isDesktop()) {
        goTo(target, true);
        return;
      }
      const span = track.offsetHeight - stage.offsetHeight;
      const top = window.scrollY + track.getBoundingClientRect().top;
      navLockRef.current = target;
      goTo(target, true);
      window.scrollTo({
        top: top + (target / BANDS) * span + (span / BANDS) * 0.5,
        behavior: reduced ? "auto" : "smooth",
      });
      window.setTimeout(() => {
        navLockRef.current = -1;
      }, 900);
    },
    [goTo, isDesktop, reduced]
  );

  // Scroll → band. Ignored while a control-driven scroll is settling.
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const track = trackRef.current;
        const stage = stageRef.current;
        if (!track || !stage || !isDesktop()) return;
        const span = track.offsetHeight - stage.offsetHeight;
        if (span <= 0) return;
        const y = clamp(-track.getBoundingClientRect().top + 0.001, 0, span);
        const next = clamp(Math.floor((y / span) * BANDS), 0, BANDS - 1);
        if (navLockRef.current !== -1) {
          if (navLockRef.current !== next) return;
          navLockRef.current = -1;
        }
        setBand((current) => {
          if (current === next) return current;
          goTo(next, true);
          return next;
        });
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [goTo, isDesktop]);

  const onStageKeyDown = useCallback(
    (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollToBand(band + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollToBand(band - 1);
      }
    },
    [band, scrollToBand]
  );

  const overview = band === OVERVIEW;
  const activeStop = overview ? null : band;

  return (
    <section className="work" id="work" data-screen-label="02 Work">
      <div className="container-wide">
        <div className="section-head reveal">
          <div className="index">§ 01 — Selected Work · Project World</div>
          <div className="h">
            Come take a journey through <em>the systems I build.</em>
          </div>
        </div>

        <div className="pw-intro">
          <p>Each one started with a problem I cared enough to solve.</p>
          <p className="cap">Depart Daventry One · four ports of call · ship at anchor</p>
          <div className="pw-topctl">
            <a className="pwbtn" href="#about">
              Skip journey ↓
            </a>
            <button type="button" className="pwbtn" onClick={() => setOverlayOpen(true)}>
              World map overview
            </button>
          </div>
        </div>

        {/* ── Desktop: sticky stage over a tall scroll track ── */}
        <div className="pw-desktop" ref={desktopRef}>
          <div className="pw-track" ref={trackRef}>
            <div
              className={"pw-stage" + (overview ? " pw-ov" : "")}
              ref={stageRef}
              onKeyDown={onStageKeyDown}
            >
              <div className="pw-map-wrap">
                <WorldMap
                  svgRef={svgRef}
                  interactive
                  showShip
                  activeStop={activeStop}
                  flagsThrough={band}
                  allRoutesGone={overview}
                  onSelectStop={scrollToBand}
                  onSelectSide={() => setSideOpen((v) => !v)}
                />

                {sideOpen && (
                  <div className="pw-parcel-pop pr-card">
                    <button
                      type="button"
                      className="pw-pop-close"
                      onClick={() => setSideOpen(false)}
                      aria-label="Close Parcel Engine note"
                    >
                      ✕ close
                    </button>
                    <div className="pr-card-top">
                      <span className="pr-idx">SIDE ISLAND</span>
                      <span
                        className="mark arc"
                        style={{ color: SIDE_ISLAND.accent, width: 28, height: 28 }}
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="pr-title">
                      {SIDE_ISLAND.title} <em>{SIDE_ISLAND.em}</em>
                    </h3>
                    <p className="pr-desc">{SIDE_ISLAND.desc}</p>
                    <a className="pr-cta-link" href={`/projects/${SIDE_ISLAND.slug}`}>
                      View case study <span className="ar">→</span>
                    </a>
                  </div>
                )}
              </div>

              <aside className="pw-side" aria-label="Journey log">
                <div className="pw-progress">
                  <span>
                    {overview
                      ? "WORLD OVERVIEW — JOURNEY COMPLETE"
                      : `STOP 0${band + 1} / 0${STOPS.length} — ${STOPS[band].name}`}
                  </span>
                  <div className="pw-dots" role="group" aria-label="Jump to stop">
                    {STOPS.map((s, i) => (
                      <button
                        type="button"
                        key={s.id}
                        className={"pw-dot" + (i < band ? " done" : "")}
                        aria-current={i === band}
                        aria-label={`Go to stop ${i + 1}: ${s.name}`}
                        onClick={() => scrollToBand(i)}
                      />
                    ))}
                    <button
                      type="button"
                      className={"pw-dot pw-dot--ov" + (overview ? " done" : "")}
                      aria-current={overview}
                      aria-label="Go to world overview"
                      onClick={() => scrollToBand(OVERVIEW)}
                    />
                  </div>
                </div>

                <div className="pw-cards">
                  {STOPS.map((s, i) => (
                    <article
                      className={"pr-card pw-card" + (i === band ? " active" : "")}
                      key={s.id}
                      hidden={i !== band}
                    >
                      <DestinationCard card={s.card} onSail={scrollToBand} />
                    </article>
                  ))}

                  <article className={"pr-card pw-card" + (overview ? " active" : "")} hidden={!overview}>
                    <div className="pr-card-top">
                      <span className="pr-idx">§ VOYAGE LOG</span>
                      <span
                        className="mark circle"
                        style={{ color: "var(--accent-gold)", width: 38, height: 38 }}
                        aria-hidden="true"
                      />
                      <div className="pr-meta">
                        <span className="proj-status">Journey complete</span>
                      </div>
                    </div>
                    <h3 className="pr-title">
                      Every route, <em>logged.</em>
                    </h3>
                    <p className="pr-desc">
                      Pulled back, the whole chart reads as one system: local models where possible,
                      approval gates on everything consequential, verification before anything ships.
                    </p>
                    <span className="pr-tags">5 harbors · 4 case studies · 1 side island</span>
                    <div className="pw-close-actions">
                      <a className="pr-cta-link" href="/projects/openclaw">
                        Explore case studies <span className="ar">→</span>
                      </a>
                      <a className="pr-cta-link" href="/#contact">
                        Contact Christopher <span className="ar">→</span>
                      </a>
                    </div>
                  </article>
                </div>

                <div className="pw-nav">
                  <button
                    type="button"
                    className="pwbtn"
                    onClick={() => scrollToBand(band - 1)}
                    disabled={band === 0}
                  >
                    ← Previous
                  </button>
                  <button
                    type="button"
                    className="pwbtn pwbtn--gold"
                    onClick={() => scrollToBand(band + 1)}
                    disabled={overview}
                  >
                    {band === OVERVIEW - 1 ? "Pull back — overview →" : "Next port →"}
                  </button>
                </div>

                <div className="pw-aux">
                  <a className="pw-skip" href="#about">
                    Skip journey ↓
                  </a>
                </div>
              </aside>
            </div>
          </div>
        </div>

        {/* ── Mobile: one island per screen ── */}
        <MobileJourney onOpenOverview={() => setOverlayOpen(true)} reduced={reduced} />
      </div>

      <div className="pw-landfall" aria-hidden="true">
        <span className="lab">MAKE LANDFALL — § 02 ABOUT</span>
        <div className="line" />
      </div>

      <button type="button" className="pwm-mapbtn" onClick={() => setOverlayOpen(true)}>
        World map
      </button>

      <WorldOverlay
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        onSelect={(stop) => {
          setOverlayOpen(false);
          if (stop === null) {
            setSideOpen(true);
            return;
          }
          if (isDesktop()) {
            scrollToBand(stop);
          } else {
            const id = stop >= STOPS.length ? "pw-voyage-log" : `pw-stop-${STOPS[stop].id}`;
            document
              .getElementById(id)
              ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
          }
        }}
      />

      <div className="visually-hidden" aria-live="polite">
        {announced}
      </div>
    </section>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/* ── Workflow demonstration ────────────────────────────────────────────
   A single work item is followed through four stations: it arrives, it
   stalls on a repeated manual step, the repeatable part is processed,
   and the workflow then STOPS at a human gate until a person approves.

   The whole thing is one linear timeline of discrete phases. Every visual
   state is derived from the phase index rather than from CSS keyframes,
   so the reduced-motion build is the same markup with the timeline
   frozen at its resolved state — no separate static diagram to maintain.
   ──────────────────────────────────────────────────────────────────── */

const P = {
  INTAKE: 0,
  FRICTION: 1,
  INSPECT: 2,
  CLASSIFY: 3,
  DRAFT: 4,
  HOLD: 5,
  APPROVE: 6,
  RELEASE: 7,
  RESET: 8,
};

// ms per phase — total loop ≈ 14s
const PHASES = [
  { ms: 2600, tone: "incoming", state: "Work arriving" },
  { ms: 2800, tone: "friction", state: "Manual step, repeating" },
  { ms: 950, tone: "auto", state: "Inspecting" },
  { ms: 950, tone: "auto", state: "Classifying" },
  { ms: 1200, tone: "auto", state: "Draft prepared" },
  { ms: 2400, tone: "human", state: "Stopped — awaiting human" },
  { ms: 900, tone: "human", state: "Approved by a person" },
  { ms: 1600, tone: "human", state: "Released" },
  { ms: 800, tone: "incoming", state: "Reset" },
];

// Which station holds the travelling item during each phase (-1 = none).
const CHIP_STATION = [0, 1, 2, 2, 2, 3, 3, 3, -1];

// Badge carried by the item — changes only at meaningful handoffs.
const CHIP_BADGE = ["New", "Held", "Proc", "Proc", "Draft", "Draft", "Draft", "Sent", null];

const STATIONS = [
  { n: "01", label: "Your work", tone: "incoming" },
  { n: "02", label: "Friction", tone: "friction" },
  { n: "03", label: "AI / automation", tone: "auto" },
  { n: "04", label: "Human decision", tone: "human" },
];

const AUTO_STEPS = ["Inspect", "Classify", "Draft"];

const TRAVEL = { type: "tween", duration: 0.68, ease: [0.16, 1, 0.3, 1] };

/* The travelling work item. Under motion it carries a layoutId, so moving
   it between station lanes animates as continuous travel in whichever
   direction the layout runs — horizontal on desktop, vertical on mobile —
   with no coordinate maths of our own. */
function WorkItem({ badge, stalled, reduced }) {
  const inner = (
    <>
      <span className="aic-item-dot" />
      <span className="aic-item-name">Support req</span>
      {badge && <span className="aic-item-badge">{badge}</span>}
    </>
  );
  if (reduced) {
    return <div className="aic-item">{inner}</div>;
  }
  return (
    <motion.div
      layoutId="aic-item"
      layout
      transition={TRAVEL}
      className={"aic-item" + (stalled ? " is-stalled" : "")}
    >
      {inner}
    </motion.div>
  );
}

function useWorkflowClock(reduced) {
  const hostRef = useRef(null);
  const [phase, setPhase] = useState(0);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === "undefined" || !document.hidden
  );

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onVis = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // The clock only ticks while the section is on screen and the tab is
  // foregrounded; otherwise it simply holds its current frame.
  useEffect(() => {
    if (reduced || !inView || !pageVisible) return;
    const t = setTimeout(
      () => setPhase((p) => (p + 1) % PHASES.length),
      PHASES[phase].ms
    );
    return () => clearTimeout(t);
  }, [phase, inView, pageVisible, reduced]);

  return { hostRef, phase, running: !reduced && inView && pageVisible };
}

export default function AIConsultation() {
  const reduced = useReducedMotion();
  const { hostRef, phase } = useWorkflowClock(reduced);

  // Reduced motion: hold the timeline at the moment the item has been
  // released, so every station reads in its resolved state at once.
  const p = reduced ? P.RELEASE : phase;

  const chipAt = reduced ? -1 : CHIP_STATION[p];
  const badge = CHIP_BADGE[p];
  const settled = p >= P.RESET; // reset beat — stations relax back to idle

  // Static build gives every station equal weight — nothing is "current".
  const stationState = (i) => {
    if (reduced || settled) return "";
    const at = CHIP_STATION[p];
    if (at === i) return " is-active";
    return at > i ? " is-done" : "";
  };

  // Inside the gate station the item drops its badge: the lane has to hold
  // the item twice over — once on each side of the gate — so it runs compact.
  const chip = (i) =>
    (reduced || chipAt === i) && (
      <WorkItem
        badge={i === 3 ? null : reduced ? ["New", "Held", "Draft"][i] : badge}
        stalled={p === P.FRICTION}
        reduced={reduced}
      />
    );

  const gateOpen = reduced || (p >= P.APPROVE && p <= P.RELEASE);
  const approved = reduced || (p >= P.APPROVE && p <= P.RELEASE);
  const released = reduced || p === P.RELEASE;

  return (
    <section className="ai-consultation" id="ai-consultation" ref={hostRef}>
      <div className="container-wide">
        <div className="aic-inner">
          <h3 className="reveal">
            Trying to figure out where AI could actually help in your workflow?
          </h3>

          <figure className="aic-figure reveal">
            {/* Semantic equivalent of the animation, for assistive tech. */}
            <ol className="aic-sr">
              <li>Your work: support, mapping and research items arrive.</li>
              <li>Friction: one item stalls on a manual step that keeps repeating.</li>
              <li>AI / automation: the item is inspected, classified, and a draft is prepared.</li>
              <li>Human decision: the workflow stops at a review gate, and the item is only released once a person approves it.</li>
            </ol>

            <div
              className={
                "aic-demo" +
                (settled ? " is-resetting" : "") +
                (reduced ? " is-static" : "")
              }
              aria-hidden="true"
            >
              <div className="aic-bar">
                <span className="aic-bar-title">Workflow</span>
                <span className="aic-state" data-tone={PHASES[p].tone}>
                  <i className="aic-state-dot" />
                  {reduced ? "Four-stage workflow" : PHASES[p].state}
                </span>
              </div>

              <div className="aic-track">
                {STATIONS.map((s, i) => (
                  <React.Fragment key={s.n}>
                    {i > 0 && (
                      <div
                        className={
                          "aic-link" +
                          (reduced || (!settled && CHIP_STATION[p] >= i)
                            ? " is-live"
                            : "")
                        }
                      >
                        <span className="aic-link-line">
                          <span className="aic-link-fill" />
                        </span>
                      </div>
                    )}

                    <div
                      className={
                        `aic-station aic-station--${s.tone}` + stationState(i)
                      }
                    >
                      <div className="aic-st-head">
                        <span className="aic-st-n">{s.n}</span>
                        <span className="aic-st-label">{s.label}</span>
                      </div>

                      {/* 01 — work arriving */}
                      {i === 0 && (
                        <div className="aic-st-body">
                          <div className="aic-lane">{chip(0)}</div>
                          <ul className="aic-queue">
                            <li>
                              <i /> Parcel / GIS task
                            </li>
                            <li>
                              <i /> Research note
                            </li>
                          </ul>
                        </div>
                      )}

                      {/* 02 — the item hits a repeated manual step */}
                      {i === 1 && (
                        <div className="aic-st-body">
                          <div className="aic-lane">
                            {chip(1)}
                            <span className="aic-barrier" aria-hidden="true" />
                          </div>
                          <div
                            className={
                              "aic-tally" +
                              (!reduced && p === P.FRICTION ? " is-counting" : "") +
                              (reduced || (p > P.FRICTION && !settled) ? " is-full" : "")
                            }
                          >
                            <span className="aic-tally-lab">Repeat</span>
                            <i />
                            <i />
                            <i />
                          </div>
                          <div className="aic-readout">Queue +3 · 18 min</div>
                        </div>
                      )}

                      {/* 03 — the repeatable part gets processed */}
                      {i === 2 && (
                        <div className="aic-st-body">
                          <div className="aic-lane">{chip(2)}</div>
                          <ol className="aic-steps">
                            {AUTO_STEPS.map((label, k) => {
                              const at = P.INSPECT + k;
                              const cls = reduced
                                ? " is-done"
                                : settled
                                ? ""
                                : p === at
                                ? " is-active"
                                : p > at
                                ? " is-done"
                                : "";
                              return (
                                <li key={label} className={"aic-step" + cls}>
                                  <span className="aic-step-mark" />
                                  {label}
                                </li>
                              );
                            })}
                          </ol>
                        </div>
                      )}

                      {/* 04 — the gate a person has to open */}
                      {i === 3 && (
                        <div className="aic-st-body">
                          {/* Fixed slots either side of the gate, so the gate
                              itself never moves — only the item crosses it. */}
                          <div className="aic-lane aic-lane--gate">
                            <span className="aic-slot">{!released && chip(3)}</span>
                            <span
                              className={"aic-gate" + (gateOpen ? " is-open" : "")}
                            >
                              <i />
                              <i />
                            </span>
                            <span className="aic-slot aic-slot--out">
                              {released && chip(3)}
                            </span>
                          </div>
                          <div className="aic-review">
                            <div className="aic-review-head">
                              {!approved
                                ? "Draft · pending review"
                                : released
                                ? "Approved · released"
                                : "Approved · releasing"}
                            </div>
                            <div className="aic-review-actions">
                              <span
                                className={
                                  "aic-btn" + (approved ? " is-pressed" : "")
                                }
                              >
                                Approve
                              </span>
                              <span className="aic-btn aic-btn--ghost">Revise</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </figure>

          {/* mailto target is the working inbox (christopherarivero@gmail.com),
              not the public display address -- see Contact.jsx/Footer.jsx for
              the same pattern. contact@crvro.com has no configured forwarding
              (see README.md "Contact configuration"), so a direct mailto: to
              it bounces. */}
          <a href="mailto:christopherarivero@gmail.com" className="cta-btn reveal">
            Talk about your workflow <span className="ar">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}

import React, { useCallback, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import ProjectMark from "./ProjectMark.jsx";
import RouteRail from "./RouteRail.jsx";
import { PROJECTS } from "../data/projects.js";

const EASE = [0.16, 1, 0.3, 1];

// Explicit allowlist — Selected Work on the homepage shows exactly these
// four projects, in this order, regardless of what else exists in PROJECTS.
// Predmkt Bot and any future addition to projects.js stay off the homepage
// unless added here deliberately; their case-study routes are unaffected.
const HOMEPAGE_SLUGS = ["sidecar", "openclaw", "help-nearby", "groundrules"];

const HOMEPAGE_DESCRIPTIONS = {
  sidecar: "Drafts support replies from approved KB articles and leaves the final response to the agent.",
  openclaw: "The AI workflow system I use every day to route work between local and cloud models under my approval.",
  "help-nearby": "Enter a ZIP code and choose a need to find nearby resources without creating an account.",
  groundrules: "Turns an address into an early property screen showing findings and what still needs verification.",
};

const COMPACT_PROCESSES = {
  sidecar: ["Request", "KB source", "Draft", "Review"],
  openclaw: ["Request", "Permission", "Action", "Verify"],
  "help-nearby": ["ZIP", "Need", "Resource", "Confirm"],
  groundrules: ["Address", "Records", "Findings", "Verify"],
};

const homepageProjects = HOMEPAGE_SLUGS.map((slug) =>
  PROJECTS.find((p) => p.slug === slug)
).filter(Boolean);

// Fixed zigzag layout + port sides for a 4-card map. Each card exposes only
// the ports it actually uses; RouteRail connects out→in between neighbors
// through the gutter, never through card interiors.
const LAYOUT = [
  { corner: "tl", out: "right" },
  { corner: "tr", in: "left", out: "bottom" },
  { corner: "bl", in: "top", out: "right" },
  { corner: "br", in: "left" },
];

function CompactProcessRail({ labels, title }) {
  return (
    <ol className="pr-process-rail" aria-label={`${title} process preview`}>
      {labels.map((label) => (
        <li key={label}>
          <span className="pr-process-node" aria-hidden="true" />
          <span>{label}</span>
        </li>
      ))}
    </ol>
  );
}

function ProjectCard({ project: p, index, cardRef, inRef, outRef, onLayoutSettled }) {
  const reduced = useReducedMotion();
  const layout = LAYOUT[index];

  return (
    <motion.div
      className={`pr-card pr-card--${layout.corner}`}
      ref={cardRef}
      initial={reduced ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      whileHover={reduced ? undefined : { y: -6 }}
      transition={{ duration: 0.55, ease: EASE }}
      onViewportEnter={() => window.setTimeout(onLayoutSettled, 600)}
      onAnimationComplete={onLayoutSettled}
    >
      {layout.in && <span className={`pr-port pr-port--${layout.in}`} ref={inRef} aria-hidden="true" />}
      {layout.out && <span className={`pr-port pr-port--${layout.out}`} ref={outRef} aria-hidden="true" />}

      <div className="pr-card-top">
        <span className="pr-idx">{String(index + 1).padStart(2, "0")}</span>
        <ProjectMark shape={p.shape} color={p.accent} size={40} />
        <div className="pr-meta">
          {p.statusBadge && <span className="proj-status">{p.statusBadge}</span>}
          <span className="prm-kind">{p.kind}</span>
        </div>
      </div>

      <h3 className="pr-title">
        {p.title} <em>{p.titleEm}</em>
      </h3>
      <p className="pr-desc">{HOMEPAGE_DESCRIPTIONS[p.slug]}</p>
      <span className="pr-tags">{p.tags[0]}</span>

      <CompactProcessRail labels={COMPACT_PROCESSES[p.slug]} title={p.title} />

      <a href={"/projects/" + p.slug} className="pr-cta-link" data-screen-label={"Project " + p.slug}>
        View case study <span className="ar">→</span>
      </a>
    </motion.div>
  );
}

export default function Projects() {
  const mapRef = useRef(null);
  const cardRefs = useRef(homepageProjects.map(() => React.createRef()));
  const inRefs = useRef(homepageProjects.map(() => React.createRef()));
  const outRefs = useRef(homepageProjects.map(() => React.createRef()));
  const [layoutVersion, setLayoutVersion] = useState(0);

  const cards = useMemo(() => homepageProjects.map((p, i) => ({
      id: p.id,
      ref: cardRefs.current[i],
      accent: p.accent,
      ports: {
        in: LAYOUT[i].in ? { ref: inRefs.current[i], side: LAYOUT[i].in } : null,
        out: LAYOUT[i].out ? { ref: outRefs.current[i], side: LAYOUT[i].out } : null,
      },
    })), []);

  const settleLayout = useCallback(() => {
    setLayoutVersion((version) => version + 1);
  }, []);


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

        <div className="project-map" ref={mapRef}>
          <RouteRail containerRef={mapRef} cards={cards} layoutVersion={layoutVersion} />
          {homepageProjects.map((p, i) => (
            <ProjectCard
              key={p.id}
              project={p}
              index={i}
              cardRef={cardRefs.current[i]}
              inRef={inRefs.current[i]}
              outRef={outRefs.current[i]}
              onLayoutSettled={settleLayout}
            />
          ))}
        </div>

      </div>
    </section>
  );
}

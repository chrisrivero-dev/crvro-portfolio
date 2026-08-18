// ============================================================
// Project World — destinations
//
// Card copy, tags, accents, marks, and case-study URLs come from
// data/projects.js so the homepage never drifts from the case
// studies. Only what's map-specific lives here: island geometry,
// landmarks, harbor points, and the sailing route.
//
// GroundRules and Parcel Engine render with dark-mode-aware green
// tokens on the chart; their case studies keep the hex in
// projects.js unchanged.
// ============================================================

import React from "react";
import { PROJECTS, GIS_PROJECTS } from "../../data/projects.js";
import {
  Beacon,
  Boat,
  CloudPuff,
  Gate,
  Hut,
  Label,
  Lighthouse,
  Mast,
  Peak,
  Pin,
  Pine,
  ScrollDoc,
  Signpost,
  Tower,
} from "./landmarks.jsx";

const bySlug = (slug) =>
  PROJECTS.find((p) => p.slug === slug) || GIS_PROJECTS.find((p) => p.slug === slug);

/** Homepage one-liners — the approved short form of each case study. */
const DESCRIPTIONS = {
  openclaw:
    "The system I use every day to route work between local and cloud models, under my approval.",
  sidecar:
    "Drafts support replies from approved KB articles and leaves the final response to the agent.",
  "help-nearby":
    "Enter a ZIP code and choose a need to find nearby resources without creating an account.",
  groundrules:
    "Turns an address into an early property screen showing findings and what still needs verification.",
};

const PROCESSES = {
  openclaw: ["Request", "Permission", "Action", "Verify"],
  sidecar: ["Request", "KB source", "Draft", "Review"],
  "help-nearby": ["ZIP", "Need", "Resource", "Confirm"],
  groundrules: ["Address", "Records", "Findings", "Verify"],
};

/** Builds a destination card from approved project data. */
function cardFor(slug, idx, accentOverride) {
  const p = bySlug(slug);
  return {
    idx,
    kind: p.kind,
    badge: p.statusBadge,
    shape: p.shape,
    accent: accentOverride || p.accent,
    title: p.title,
    em: p.titleEm,
    desc: DESCRIPTIONS[slug],
    tags: p.tags[0],
    process: PROCESSES[slug],
    slug: p.slug,
  };
}

export const STOPS = [
  // ── 00 · Daventry One — home port, not a project card ──
  {
    id: "daventry",
    name: "DAVENTRY ONE",
    sub: "HOME PORT · WORKSTATION",
    cx: 185,
    cy: 640,
    rx: 102,
    ry: 74,
    seed: 11,
    accent: "var(--accent-gold)",
    harbor: [248, 560],
    card: {
      idx: "§ 00",
      kind: "AI workstation",
      badge: "Home port",
      shape: "circle",
      accent: "var(--accent-gold)",
      title: "Daventry One",
      em: "My local AI workstation and the home of Hermes.",
      desc: "It helps me research, build, test, troubleshoot, and coordinate projects.",
      tags: "local models · hermes · telegram",
      process: ["Request", "Model", "Tools", "Approval", "Verification"],
      slug: null,
      ctaText: "Set sail and begin the journey",
      ctaStop: 1,
      foot: "Origin: not a standard project card",
    },
    landmarks: () => [
      <>
        <Tower x={140} y={630} h={42} />
        <Label x={140} y={646}>command tower</Label>
      </>,
      <>
        <Hut x={196} y={668} w={26} h={15} />
        <circle className="lm-line" cx={196} cy={659} r="3" fill="none" />
        <Label x={196} y={684}>engine room</Label>
      </>,
      <>
        <Mast x={246} y={610} h={34} />
        <Label x={246} y={624}>signal</Label>
      </>,
      <>
        <Gate x={198} y={606} />
        <Label x={198} y={589}>approval gate</Label>
      </>,
      <>
        <path className="lm-line" d="M 146 624 C 165 634 176 650 186 658" />
        <Label x={166} y={653} anchor="end">local</Label>
      </>,
      <>
        <path className="lm-dash" d="M 206 601 C 218 584 232 572 245 563" />
        <path className="lm-dash" d="M 202 598 C 204 572 214 549 230 532" />
        <CloudPuff x={236} y={524} />
        <Label x={236} y={512}>cloud</Label>
      </>,
      <>
        <path className="lm-line" d="M 108 690 l 26 8 M 112 697 l 22 7 M 118 705 l 18 5" />
        <Boat x={140} y={706} />
        <Label x={122} y={722}>shipyard</Label>
      </>,
      <>
        <circle className="lm-dot" cx={165} cy={640} r="2" />
        <circle className="lm-dot" cx={212} cy={592} r="2" />
        <circle className="lm-dot" cx={232} cy={576} r="2" />
        <Label x={150} y={596} anchor="end">routes logged</Label>
      </>,
      <Peak x={95} y={610} w={16} h={22} />,
    ],
  },

  // ── 01 · OpenClaw / Hermes ──
  {
    id: "openclaw",
    name: "OPENCLAW / HERMES",
    sub: "PORT 01 · AI WORKFLOW",
    cx: 345,
    cy: 222,
    rx: 92,
    ry: 70,
    seed: 23,
    labelDY: 26,
    accent: "var(--pw-hermes)",
    harbor: [318, 314],
    card: cardFor("openclaw", "№ 01", "var(--pw-hermes)"),
    landmarks: () => [
      <>
        <Tower x={340} y={214} h={38} />
        <Label x={340} y={230}>routing tower</Label>
      </>,
      <>
        <path className="lm-line" d="M 334 208 C 315 218 303 228 296 234" />
        <Hut x={290} y={244} w={22} h={13} />
        <Label x={290} y={260}>local models</Label>
      </>,
      <>
        <path className="lm-dash" d="M 346 194 C 368 182 384 174 398 168" />
        <CloudPuff x={408} y={162} />
        <Label x={408} y={148}>cloud</Label>
      </>,
      <>
        <Hut x={394} y={240} w={24} h={15} />
        <path className="lm-line" d="M 388 231 l 5 -5 m -2 0 l 4 4" opacity="0.9" />
        <Label x={394} y={256}>tool workshop</Label>
      </>,
      <>
        <Gate x={322} y={272} />
        <Label x={322} y={290}>approval gate</Label>
      </>,
      <>
        <Beacon x={320} y={302} />
        <Label x={352} y={306} anchor="start">verify beacon</Label>
      </>,
      <>
        <Peak x={398} y={196} w={14} h={20} />
        <Peak x={414} y={200} w={11} h={14} />
      </>,
    ],
  },

  // ── 02 · Sidecar ──
  {
    id: "sidecar",
    name: "SIDECAR",
    sub: "PORT 02 · AI SUPPORT TOOL",
    cx: 668,
    cy: 118,
    rx: 82,
    ry: 58,
    seed: 37,
    accent: "var(--pw-sidecar)",
    harbor: [612, 186],
    card: cardFor("sidecar", "№ 02", "var(--pw-sidecar)"),
    landmarks: () => [
      <>
        <Lighthouse x={668} y={112} />
        <Label x={668} y={130}>support light</Label>
      </>,
      <>
        <Hut x={606} y={128} w={30} h={17} />
        <line className="lm-line" x1={598} y1={128} x2={598} y2={115} />
        <line className="lm-line" x1={606} y1={128} x2={606} y2={115} />
        <line className="lm-line" x1={614} y1={128} x2={614} y2={115} />
        <Label x={606} y={106}>approved KB</Label>
      </>,
      <>
        <Boat x={576} y={62} />
        <rect className="lm-fill" x={580} y={46} width="9" height="6" />
        <path className="lm-line" d="M 580 46 l 4.5 3 l 4.5 -3" />
        <Label x={576} y={40}>incoming request</Label>
      </>,
      <>
        <path className="lm-dash" d="M 616 138 C 622 148 626 156 630 162" />
        <Label x={648} y={152} anchor="start">draft</Label>
      </>,
      <>
        <Gate x={632} y={170} />
        <Label x={664} y={182} anchor="start">review gate</Label>
      </>,
      <>
        <Pine x={706} y={146} />
        <Pine x={722} y={138} />
      </>,
    ],
  },

  // ── 03 · Help Nearby ──
  {
    id: "help-nearby",
    name: "HELP NEARBY",
    sub: "PORT 03 · COMMUNITY FINDER",
    cx: 868,
    cy: 418,
    rx: 88,
    ry: 72,
    seed: 53,
    accent: "var(--pw-help-nearby)",
    harbor: [795, 362],
    card: cardFor("help-nearby", "№ 03", "var(--pw-help-nearby)"),
    landmarks: () => [
      <>
        <Hut x={852} y={400} w={16} h={11} />
        <Hut x={868} y={404} w={14} h={10} />
        <Hut x={884} y={400} w={16} h={11} />
        <Label x={868} y={418}>town</Label>
      </>,
      <Pin x={890} y={372} text="ZIP 90712" />,
      <path
        className="lm-line"
        opacity="0.55"
        d="M 858 406 C 840 414 826 420 816 424 M 866 408 C 862 424 858 436 854 444 M 878 406 C 890 418 896 428 900 436 M 884 398 C 896 392 904 388 910 384"
      />,
      <>
        <Hut x={812} y={432} w={18} h={12} />
        <Label x={812} y={448}>housing</Label>
      </>,
      <>
        <Hut x={852} y={458} w={18} h={12} />
        <Label x={852} y={474}>food</Label>
      </>,
      <>
        <Hut x={902} y={446} w={18} h={12} />
        <Label x={902} y={462}>safety</Label>
      </>,
      <>
        <Hut x={914} y={380} w={18} h={12} />
        <Label x={914} y={366}>transit</Label>
      </>,
      <>
        <Signpost x={806} y={388} />
        <Label x={800} y={374}>verify before arrival</Label>
      </>,
    ],
  },

  // ── 04 · GroundRules ──
  {
    id: "groundrules",
    name: "GROUNDRULES",
    sub: "PORT 04 · PROPERTY INTEL",
    cx: 612,
    cy: 692,
    rx: 100,
    ry: 66,
    seed: 71,
    parcel: true,
    accent: "var(--pw-groundrules)",
    harbor: [640, 616],
    card: cardFor("groundrules", "№ 04", "var(--pw-groundrules)"),
    landmarks: (clipId, hatchId) => [
      <>
        <g clipPath={`url(#${clipId})`}>
          <path
            className="lm-line"
            opacity="0.35"
            d="M 520 660 H 712 M 520 692 H 712 M 520 724 H 712 M 552 620 V 760 M 594 620 V 760 M 636 620 V 760 M 678 620 V 760"
          />
        </g>
        <Label x={560} y={664}>zoning grid</Label>
      </>,
      <>
        <path
          className="lm-dash"
          opacity="0.8"
          d="M 500 668 C 512 626 560 606 616 610 C 676 614 726 646 722 694 C 718 740 660 772 600 768 C 544 764 492 722 500 668"
        />
        <Label x={710} y={726} anchor="end">jurisdiction line</Label>
      </>,
      <>
        <path
          className="lm-fill"
          d="M 648 656 L 690 668 L 682 700 L 642 690 Z"
          fill={`url(#${hatchId})`}
          style={{ stroke: "currentColor" }}
        />
        <Label x={668} y={648}>hazard overlay</Label>
      </>,
      <>
        <ScrollDoc x={556} y={712} />
        <Label x={556} y={726}>screening report</Label>
      </>,
      <>
        <circle className="lm-dot" cx={524} cy={668} r="2.4" />
        <circle className="lm-dot" cx={700} cy={650} r="2.4" />
        <circle className="lm-dot" cx={688} cy={742} r="2.4" />
        <circle className="lm-dot" cx={536} cy={740} r="2.4" />
      </>,
    ],
  },
];

/** Index of the pull-back overview band, one past the last island. */
export const OVERVIEW = STOPS.length;
export const BANDS = STOPS.length + 1;

/** Curved sea routes, Daventry One outward. */
export const LEGS = [
  "M 248 560 C 300 500, 230 386, 318 314",
  "M 318 314 C 400 262, 520 236, 612 186",
  "M 612 186 C 712 196, 786 268, 795 362",
  "M 795 362 C 788 486, 724 588, 640 616",
];

/** Parcel Engine — optional side island, off the main route. */
export const SIDE_ISLAND = {
  id: "parcel-engine",
  path: "M 918 646 L 962 634 L 992 654 L 984 680 L 934 686 Z",
  accent: "var(--pw-parcel)",
  name: "PARCEL ENGINE",
  sub: "SIDE ISLAND · OPTIONAL",
  labelX: 954,
  labelY: 706,
  slug: "parcel-engine",
  title: "Parcel Engine",
  em: "Optional side quest.",
  desc: "A local metes-and-bounds parser and parcel geometry validator. Off the main route, but on the same map.",
};

export const MAP_W = 1040;
export const MAP_H = 820;

// ============================================================
// Career data: the single source for the in-world career notebook (/#career), its reading surface, and the plain LO-FI
// career page. Both render from this file, so they cannot disagree.
//
// Sources, in order of authority:
//   1. The case-study registry (src/data/projects.js): public, already approved, linked by `proof`.
//   2. Christopher's own résumé: roles, dates and responsibilities that are worded the same in every variant of it.
// Résumé variants are role-targeted drafts, not a master document. Only facts that agree across variants are used.
// Anything that appears in a single variant, carries a number nothing else documents, or conflicts with another source
// is NOT shown: it is listed in CAREER_REVIEW for Christopher to approve. See docs/career-source.md.
// ============================================================
import { PROJECTS, GIS_PROJECTS } from './projects.js';

export const CAREER_PAGES = [
  { id: 'work', slug: 'work', tab: 'Work history', label: 'Work history', short: 'I' },
  { id: 'highlights', slug: 'highlights', tab: 'Highlights', label: 'Selected highlights', short: 'II' },
  { id: 'resume', slug: 'resume', tab: 'Contact', label: 'Résumé and contact', short: 'III' },
];
export const CAREER_PAGE_IDS = CAREER_PAGES.map((p) => p.id);

export const ROLES = [
  {
    id: 'futurebit',
    employer: 'FutureBit LLC',
    title: 'Senior Customer Support & Automation Specialist',
    type: 'Part-time',
    place: 'Remote',
    dates: 'July 2025 – Present',
    summary: 'Frontline technical support for consumer Bitcoin mining hardware, and the support systems built around it.',
    does: [
      'Diagnose firmware, networking, power and hardware problems from customer-provided logs and diagnostics, and own each case through to a fix or a documented escalation.',
      'Build triage automation, escalation logic and routing in Freshdesk.',
      'Write troubleshooting guides, setup guides and RMA runbooks, structured so that automation can route tickets to the right fix.',
      'Build Python dashboards on support data to surface escalation patterns, recurring defects and automation gaps.',
    ],
    strengths: ['Technical troubleshooting', 'Freshdesk administration', 'Knowledge-base writing', 'Support automation', 'Python'],
  },
  {
    id: 'oc-gis',
    employer: 'County of Orange · Assessor',
    title: 'Senior GIS/Cadastral Technician',
    place: 'Santa Ana, CA',
    dates: 'January 2014 – Present',
    summary: 'Cadastral mapping and parcel data in a public-records system where errors have legal consequences.',
    does: [
      'Resolve parcel, ownership and legal-description questions for staff and the public.',
      'Develop Python/ArcPy and SQL tooling for batch geoprocessing, and for detecting and correcting attribute inconsistencies across large parcel datasets.',
      'Built the SOP Search Hub, an internal Python/Flask web app with full-text search across division procedures and working files.',
      'Built a Python/Tkinter app that automates map submissions, with ArcGIS Pro export integration and Excel logging.',
    ],
    strengths: ['GIS/CAD mapping', 'Python / ArcPy', 'SQL', 'Data quality', 'Internal tools', 'Documentation'],
  },
  {
    id: 'oc-early',
    employer: 'County of Orange · Assessor / Tax Collector',
    title: 'Assessment Technician II · Property Tax Technician',
    place: 'Santa Ana, CA',
    dates: '2007 – 2014',
    summary: 'Earlier County roles in property assessment and tax records. The résumé gives one date range for both titles.',
    does: [
      'Processed property transfer and ownership documents.',
      'Resolved escalated ownership and legal-description discrepancies with taxpayers and title companies.',
      'Built Excel automation for reconciliation and validated data entry.',
    ],
    strengths: ['Property records', 'Data validation', 'Excel automation'],
  },
];

/** Selected highlights. `proof` is a case-study slug in the registry; `result` appears only where a source documents one. */
export const HIGHLIGHTS = [
  {
    id: 'sidecar',
    topic: 'AI-assisted support, with a person in charge',
    problem: 'Agents lose time searching documentation and rewriting the same explanations, and generic AI replies guess.',
    did: 'Built Sidecar on my own: a Flask backend that drafts replies only from approved knowledge-base articles, says so when nothing matches, and leaves the agent to review, edit or discard. Changes to KB wording go through a Telegram approval step.',
    result: 'A working prototype, shown with synthetic or sanitized content. In the case study, approved wording reaches Freshdesk in under a minute.',
    proof: 'sidecar',
  },
  {
    id: 'support-ops',
    topic: 'Support operations and knowledge systems',
    problem: 'Hardware support needs consistent triage, clean escalations and documentation that automation can use.',
    did: 'Built triage and escalation rules in Freshdesk, wrote troubleshooting trees, setup guides and RMA runbooks with metadata for routing, and built Python dashboards on support data.',
    result: null,
    proof: null,
  },
  {
    id: 'county-tools',
    topic: 'GIS/CAD data quality and internal tools',
    problem: 'Parcel records are accuracy-critical, and inconsistent attributes are hard to find by hand.',
    did: 'Python/ArcPy and SQL tooling to detect and correct attribute inconsistencies in batch, the SOP Search Hub for division procedures, and a Tkinter app that automates map submissions.',
    result: null,
    proof: null,
  },
  {
    id: 'parcel-engine',
    topic: 'Legal descriptions to parcel geometry',
    problem: 'Metes-and-bounds descriptions are dense and easy to misread.',
    did: 'Built Parcel Engine, a local Python tool that parses descriptions into COGO calls, checks closure and misclosure, previews the geometry and exports DXF or GeoJSON.',
    result: 'A research tool with an evaluation harness in progress. It uses no County data and is not survey software.',
    proof: 'parcel-engine',
  },
];

export const CONTACT = {
  email: { text: 'contact@crvro.com', href: 'mailto:christopherarivero@gmail.com' },   // same pair the site's Contact page and footer use
  linkedin: { text: 'linkedin.com/in/christopherarivero', href: 'https://www.linkedin.com/in/christopherarivero' },
  github: { text: 'github.com/chrisrivero-dev', href: 'https://github.com/chrisrivero-dev' },
  // No approved public résumé PDF exists (the drafts carry a home city and phone number), so there is no download action.
  // To add one: place the approved file in /public, set href here, and the notebook and the LO-FI page will both show it.
  resumePdf: null,
};

/** Things that need Christopher's decision. Never rendered; asserted by scripts/verify-career.cjs and written up in docs/career-source.md. */
export const CAREER_REVIEW = [
  { id: 'linkedin-url', note: 'LinkedIn URL conflict. The site publishes linkedin.com/in/christopherarivero; the résumé drafts say linkedin.com/in/christopher-rivero-47b03b97. The site\'s published URL is used.' },
  { id: 'resume-pdf', note: 'No approved public résumé PDF exists. Every draft contains a home city and phone number. The download action is left out.' },
  { id: 'map-app-metric', note: 'The résumé says the Tkinter map-submission app cut processing time by about 60%. Nothing else documents it, so it is not shown.' },
  { id: 'resume-only-numbers', note: 'Withheld résumé-only figures: 250–350 documents a week, 10+ staff in a knowledge-platform adoption, "12 years", "18+ years", Apollo III launch readiness.' },
  { id: 'part-time', note: 'The résumé lists the FutureBit role as part-time. The brief for this feature did not. It is shown as part-time.' },
  { id: 'county-tenure', note: 'The identity profile says "over twenty years" with the County; the résumé starts in 2007 (19 years). No duration is stated anywhere.' },
  { id: 'early-roles', note: 'Assessment Technician II and Property Tax Technician share one date range (2007–2014) in every résumé draft. They are shown as one entry.' },
  { id: 'county-tools', note: 'The SOP Search Hub and the map-submission app come from the résumé, not from a case study. The portfolio elsewhere avoids County production claims; confirm these descriptions may be public.' },
  { id: 'end-to-end', note: 'The résumé says FutureBit support was built "end to end" (one draft: "from scratch"). That wording is not used; the page lists what was built.' },
];

/** Every case-study slug a highlight links to must exist in the registry. */
const KNOWN = new Set([...PROJECTS, ...GIS_PROJECTS].map((p) => p.slug));
export const careerProofOk = () => HIGHLIGHTS.every((h) => !h.proof || KNOWN.has(h.proof));

export const pageFromSlug = (s) => CAREER_PAGES.find((p) => p.id === s) || null;

// ============================================================
// Portfolio Navigator — deterministic routing registry.
//
// No AI model, no eval, no dynamic navigation. A visitor's text is
// only ever matched against fixed keyword rules below and resolved
// to entries in DESTINATIONS. Anything unmatched returns an
// "unresolved" result — never a guess.
// ============================================================

import { PROJECTS, GIS_PROJECTS } from './projects.js';

const ALL_CASE_STUDIES = [...PROJECTS, ...GIS_PROJECTS];

function findProject(slug) {
  return ALL_CASE_STUDIES.find((p) => p.slug === slug) || null;
}

// Publicly exposed navigator destinations only — intentionally a subset
// of ALL_CASE_STUDIES. Older/unlisted case studies (e.g. predmkt-bot)
// stay reachable by direct link but are not surfaced by the navigator.
export const DESTINATIONS = {
  work: { key: 'work', label: 'Project World', href: '/#work' },
  about: { key: 'about', label: 'About', href: '/#about' },
  skills: { key: 'skills', label: 'Skills', href: '/#skills' },
  contact: { key: 'contact', label: 'Contact', href: '/#contact' },
  openclaw: {
    key: 'openclaw',
    label: findProject('openclaw')?.title || 'OpenClaw / Hermes',
    href: '/projects/openclaw',
  },
  sidecar: {
    key: 'sidecar',
    label: findProject('sidecar')?.title || 'Sidecar',
    href: '/projects/sidecar',
  },
  'help-nearby': {
    key: 'help-nearby',
    label: findProject('help-nearby')?.title || 'Help Nearby',
    href: '/projects/help-nearby',
  },
  groundrules: {
    key: 'groundrules',
    label: findProject('groundrules')?.title || 'GroundRules',
    href: '/projects/groundrules',
  },
  'parcel-engine': {
    key: 'parcel-engine',
    label: findProject('parcel-engine')?.title || 'Parcel Engine',
    href: '/projects/parcel-engine',
  },
};

// Derived, not hard-coded — this is the count of case studies the
// navigator is actually allowed to surface, which can differ from the
// total number of case-study pages that exist.
export const SYSTEM_COUNT = Object.keys(DESTINATIONS).filter(
  (k) => !['work', 'about', 'skills', 'contact'].includes(k)
).length;

const norm = (s) => (s || '').toLowerCase().trim();
const has = (q, ...terms) => terms.some((t) => q.includes(t));

// Ordered rules — most specific match wins. Each rule returns a result
// object or null. The first non-null result is used.
const RULES = [
  // ── Hermes / OpenClaw — local AI orchestration ──────────────
  // Proper nouns and short direct-navigation phrases only. The bare
  // bigram "local ai" used to match here, which swallowed genuinely
  // open-ended questions that merely use the phrase in passing (e.g.
  // "...demonstrates Christopher building a real local AI system
  // rather than simply using an AI product") before they ever reached
  // the LLM path. A short, direct request ("local models", "your
  // local ai setup") still resolves instantly here.
  (q) => {
    if (
      has(
        q,
        'hermes',
        'openclaw',
        'local ai setup',
        'local ai workflow',
        'local model',
        'local models',
        'ollama',
        'orchestration',
        'model routing',
        'ai workflow'
      )
    ) {
      return {
        kind: 'single',
        lines: ['local AI / orchestration match found', 'closest system: OPENCLAW / HERMES'],
        results: [{ ...DESTINATIONS.openclaw, cta: 'OPEN SYSTEM →' }],
      };
    }
    return null;
  },

  // ── Support knowledge-consistency problem — Sidecar ─────────
  // Specific proper nouns/direct terms only. The bare combination of
  // "support" + "different answer"/"conflicting" used to match here,
  // which swallowed genuinely open-ended questions that describe a
  // support-consistency problem in their own words (e.g. "our support
  // staff keep giving customers different answers, how would
  // Christopher approach that") before they ever reached the LLM path.
  (q) => {
    const consistencyProblem = has(q, 'sidecar', 'knowledge base', 'kb article', 'canned response');
    if (consistencyProblem) {
      return {
        kind: 'single',
        lines: ['knowledge consistency problem detected', 'closest system: SIDECAR'],
        results: [{ ...DESTINATIONS.sidecar, cta: 'OPEN SIDECAR →' }],
      };
    }
    return null;
  },

  // ── Repetitive mapping / GIS automation — Parcel Engine ─────
  (q) => {
    const repetitiveMapping =
      (has(q, 'repetitive') && has(q, 'gis', 'mapping', 'parcel')) ||
      has(q, 'parcel engine', 'parcel-engine', 'metes and bounds', 'metes-and-bounds', 'cogo');
    if (repetitiveMapping) {
      return {
        kind: 'single',
        lines: ['mapping automation match found', 'closest system: PARCEL ENGINE'],
        results: [{ ...DESTINATIONS['parcel-engine'], cta: 'OPEN PARCEL ENGINE →' }],
      };
    }
    return null;
  },

  // ── Property / zoning screening — GroundRules ───────────────
  (q) => {
    if (
      has(
        q,
        'zoning',
        'property screening',
        'feasibility',
        'adu',
        'permit risk',
        'parcel report',
        'due diligence',
        'groundrules'
      )
    ) {
      return {
        kind: 'single',
        lines: ['property screening match found', 'closest system: GROUNDRULES'],
        results: [{ ...DESTINATIONS.groundrules, cta: 'OPEN GROUNDRULES →' }],
      };
    }
    return null;
  },

  // ── Community / help / resource lookup — Help Nearby ────────
  (q) => {
    if (
      has(
        q,
        'help nearby',
        'community resource',
        'zip code',
        'nonprofit',
        'social services',
        'find help',
        'resource finder',
        'shelter',
        'food bank'
      )
    ) {
      return {
        kind: 'single',
        lines: ['community resource match found', 'closest system: HELP NEARBY'],
        results: [{ ...DESTINATIONS['help-nearby'], cta: 'OPEN HELP NEARBY →' }],
      };
    }
    return null;
  },

  // ── GIS / mapping generally — Parcel Engine + GroundRules ───
  (q) => {
    if (
      has(
        q,
        'gis',
        'mapping',
        'cad',
        'parcel',
        'legal description',
        'geospatial',
        'assessor'
      )
    ) {
      return {
        kind: 'multi',
        lines: ['2 relevant systems found'],
        results: [
          { ...DESTINATIONS['parcel-engine'], n: '01' },
          { ...DESTINATIONS.groundrules, n: '02' },
        ],
      };
    }
    return null;
  },

  // ── General AI work — OpenClaw/Hermes + Sidecar ─────────────
  (q) => {
    if (has(q, 'ai work', 'your ai', 'artificial intelligence', 'machine learning', ' ai systems', 'ai systems')) {
      return {
        kind: 'multi',
        lines: ['2 relevant systems found'],
        results: [
          { ...DESTINATIONS.openclaw, n: '01' },
          { ...DESTINATIONS.sidecar, n: '02' },
        ],
      };
    }
    return null;
  },

  // ── Contact ──────────────────────────────────────────────────
  (q) => {
    if (has(q, 'contact', 'reach you', 'get in touch', 'hire you', 'email you', 'talk to you')) {
      return {
        kind: 'single',
        lines: ['destination resolved: CONTACT'],
        results: [{ ...DESTINATIONS.contact, cta: 'OPEN CONTACT →' }],
      };
    }
    return null;
  },

  // ── About / background ───────────────────────────────────────
  (q) => {
    if (has(q, 'about', 'background', 'who are you', 'who is christopher', 'your story')) {
      return {
        kind: 'single',
        lines: ['destination resolved: ABOUT'],
        results: [{ ...DESTINATIONS.about, cta: 'OPEN ABOUT →' }],
      };
    }
    return null;
  },

  // ── Skills / stack ───────────────────────────────────────────
  (q) => {
    if (has(q, 'skills', 'stack', 'tech stack', 'technologies', 'what do you know', 'tools', 'python')) {
      return {
        kind: 'single',
        lines: ['destination resolved: SKILLS'],
        results: [{ ...DESTINATIONS.skills, cta: 'OPEN SKILLS →' }],
      };
    }
    return null;
  },

  // ── Work / project world generally ──────────────────────────
  // Deliberately specific phrases, not the bare word "work" -- that
  // was broad enough to swallow genuinely open-ended questions that
  // merely mention "Christopher's work" in passing (e.g. "which of
  // Christopher's work should I look at and why"), short-circuiting
  // them away from the LLM path before they ever got a chance to be
  // reasoned about. A direct, short navigational request ("see your
  // work", "show me your projects") still resolves instantly here.
  (q) => {
    if (has(q, 'see the work', 'see your work', 'show me your work', 'your projects', 'portfolio', 'case stud', 'ship', 'journey')) {
      return {
        kind: 'single',
        lines: ['destination resolved: PROJECT WORLD'],
        results: [{ ...DESTINATIONS.work, cta: 'SEE THE WORK →' }],
      };
    }
    return null;
  },
];

const UNKNOWN_RESULT = {
  kind: 'unknown',
  lines: ['request not mapped cleanly'],
  results: [],
  suggestions: ['AI', 'GIS', 'support', 'background', 'skills', 'contact'],
};

export function matchQuery(raw) {
  const q = norm(raw);
  if (!q) return UNKNOWN_RESULT;
  for (const rule of RULES) {
    const result = rule(q);
    if (result) return result;
  }
  return UNKNOWN_RESULT;
}

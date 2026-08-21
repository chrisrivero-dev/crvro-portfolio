// ============================================================
// Builds server/corpus.json — a static, read-only, sanitized
// public-knowledge snapshot for the Public Captain worker.
//
// Source is exclusively already-public site copy (src/data/projects.js
// plus the About/Skills/Contact section text, hand-transcribed below).
// This script never touches the live repo at request time — the
// worker only ever reads the generated JSON file. Re-run this script
// and restart the worker to pick up copy changes.
//
// Run: node scripts/build-corpus.mjs
// ============================================================

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PROJECTS, GIS_PROJECTS } from '../src/data/projects.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, '..', 'server', 'corpus.json');

const entries = [];
let n = 0;
function add(section, slug, kind, text, tags = []) {
  if (!text) return;
  n += 1;
  entries.push({
    id: `${slug}-${kind}-${n}`,
    section,
    slug,
    text: String(text).trim(),
    tags,
  });
}

for (const p of [...PROJECTS, ...GIS_PROJECTS]) {
  add('project', p.slug, 'summary', `${p.title}: ${p.titleEm} ${p.desc}`, [p.kind, p.slug]);
  if (Array.isArray(p.problem)) {
    add('project', p.slug, 'problem', p.problem.join(' '), [p.slug, 'problem']);
  }
  if (Array.isArray(p.built) && p.built.length) {
    add('project', p.slug, 'built', p.built.slice(0, 4).join(' '), [p.slug, 'built']);
  }
  if (p.outcome) add('project', p.slug, 'outcome', p.outcome, [p.slug, 'outcome']);
  if (p.relationshipToHermes) {
    add('project', p.slug, 'relationship', p.relationshipToHermes, [p.slug, 'hermes', 'openclaw', 'relationship']);
  }
  if (Array.isArray(p.publicStatus) && p.publicStatus.length) {
    add('project', p.slug, 'status', p.publicStatus.join(' '), [p.slug, 'status', 'prototype']);
  }
  if (p.demo) add('project', p.slug, 'demo', `Interactive demo: ${p.demo}`, [p.slug, 'demo', 'try']);
  if (p.guidedTourUrl) add('project', p.slug, 'guided-tour', `Guided tour: ${p.guidedTourUrl}`, [p.slug, 'guided tour']);
  if (Array.isArray(p.learned) && p.learned.length) {
    add('project', p.slug, 'learned', p.learned.slice(0, 3).join(' '), [p.slug, 'learned']);
  }
  if (Array.isArray(p.stack) && p.stack.length) {
    const stackText = p.stack.map((g) => `${g.group}: ${g.items.join(', ')}`).join(' · ');
    add('project', p.slug, 'stack', stackText, [p.slug, 'stack']);
  }
}

// About — hand-transcribed from src/components/About.jsx (already-public copy)
add('about', 'about', 'bio', [
  "I'm Christopher. I build practical AI systems and internal tools for support, automation, and GIS/CAD. Most of them start with problems I've dealt with myself.",
  'I started in GIS/CAD support and gradually moved deeper into automation and human-supervised AI. I built my own local AI workstation and use Hermes every day to organize projects, investigate problems, and troubleshoot bugs. I still make the final calls.',
  'I usually have more ideas than time. I keep improving the systems I already use and start new projects when I see a problem worth solving.',
].join(' '), ['about', 'bio', 'background']);
add('about', 'about', 'facts', 'Based in Lakewood, CA (Pacific time). Currently building automation and AI tooling. Open to automation, AI support, and GIS/CAD ops work. Background in CAD/GIS, Python, and on-device AI.', ['about', 'location', 'availability']);

// Skills — hand-transcribed from src/components/Skills.jsx
const SKILLS = [
  { head: 'languages', items: ['Python', 'JavaScript', 'SQL', 'Bash', 'HTML / CSS'] },
  { head: 'data & infra', items: ['SQLite', 'Postgres', 'JSON / JSONL', 'Git / GitHub', 'Railway', 'REST APIs'] },
  { head: 'AI & support systems', items: ['OpenAI API', 'OpenClaw', 'KB-grounded drafting', 'RAG-style retrieval', 'Prompt guardrails', 'Canned response workflows'] },
  { head: 'GIS & CAD', items: ['ArcGIS Pro', 'QGIS', 'PostGIS', 'AutoCAD', 'MicroStation', 'Civil 3D', 'Shapefile / GeoPackage'] },
  { head: 'automation', items: ['Telegram Bot API', 'GitHub Actions', 'cron / scheduled jobs', 'Python scripts', 'Excel automation', 'pandas / openpyxl'] },
  { head: 'ops & testing', items: ['Structured logging', 'CLI tools', 'curl / API testing', 'Railway deploy logs', 'Local test scripts', 'Lightweight dashboards'] },
];
for (const s of SKILLS) {
  add('skills', 'skills', s.head.replace(/[^a-z0-9]+/gi, '-'), `${s.head}: ${s.items.join(', ')}`, ['skills', s.head]);
}

// Contact — hand-transcribed from src/components/Contact.jsx. Public display
// address only (contact@crvro.com) — never the raw mailto inbox target.
add('contact', 'contact', 'email', 'Email is the fastest way to reach Christopher: contact@crvro.com. He usually replies within a day.', ['contact', 'email']);
add('contact', 'contact', 'github', 'GitHub: github.com/chrisrivero-dev', ['contact', 'github']);
add('contact', 'contact', 'linkedin', 'LinkedIn: https://www.linkedin.com/in/christopherarivero', ['contact', 'linkedin']);

// Destination allowlist — mirrors src/data/portfolioNavigator.js DESTINATIONS.
// Duplicated intentionally: the worker process must not import site source at
// request time, so this is the worker's own frozen copy, kept in sync by
// this build script.
const DESTINATIONS = {
  work: { label: 'Project World', href: '/#work' },
  about: { label: 'About', href: '/#about' },
  skills: { label: 'Skills', href: '/#skills' },
  contact: { label: 'Contact', href: '/#contact' },
  openclaw: { label: 'OpenClaw / Hermes', href: '/projects/openclaw' },
  'zarvin-one': { label: 'Zarvin One', href: '/projects/zarvin-one' },
  'zarvin-demo': { label: 'Try Zarvin One', href: 'https://zarvin-one-mobile.expo.app/' },
  'zarvin-guided-tour': { label: 'Zarvin One guided tour', href: 'https://zarvin-one-mobile.expo.app/guided-demo' },
  sidecar: { label: 'Sidecar', href: '/projects/sidecar' },
  'help-nearby': { label: 'Help Nearby', href: '/projects/help-nearby' },
  groundrules: { label: 'GroundRules', href: '/projects/groundrules' },
  'parcel-engine': { label: 'Parcel Engine', href: '/projects/parcel-engine' },
};

const corpus = {
  generatedAt: new Date().toISOString(),
  destinations: DESTINATIONS,
  entries,
};

writeFileSync(OUT_PATH, JSON.stringify(corpus, null, 2));
console.log(`Wrote ${entries.length} corpus entries to ${OUT_PATH}`);

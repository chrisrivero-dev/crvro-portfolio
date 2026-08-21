// ============================================================
// Generates docs/CORPUS_MANIFEST.md from the actual server/corpus.json
// plus the source files scripts/build-corpus.mjs reads from. This is
// the audit trail proving every fact Public Captain can cite already
// exists on the public site -- nothing in the corpus is invented or
// pulled from anywhere private.
//
// Run: node scripts/build-corpus-manifest.mjs
// ============================================================

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const corpus = JSON.parse(readFileSync(path.join(ROOT, 'server', 'corpus.json'), 'utf8'));

const SOURCE_MAP = {
  project: {
    file: 'src/data/projects.js',
    note: 'PROJECTS + GIS_PROJECTS arrays -- the same data the live case-study pages (/projects/<slug>) render. Public Captain only receives explicitly enumerated public fields (desc/problem/built/outcome/relationshipToHermes/publicStatus/demo/guidedTourUrl/learned/stack); the generator never spreads whole project objects.',
  },
  about: {
    file: 'src/components/About.jsx',
    note: 'Hand-transcribed from the rendered bio paragraphs and the stat-list (Based/Currently/Open to/Background) that already appear in the public About section.',
  },
  skills: {
    file: 'src/components/Skills.jsx',
    note: 'Hand-transcribed from the SKILLS array rendered in the public Skills section -- identical category headings and tool lists.',
  },
  contact: {
    file: 'src/components/Contact.jsx',
    note: 'Public display address only (contact@crvro.com), GitHub, and LinkedIn -- the same three destinations shown on the live Contact section. The private mailto: forwarding target (the actual inbox) is deliberately excluded from the corpus and is not retrievable through Public Captain in any form.',
  },
};

const bySection = {};
for (const e of corpus.entries) {
  (bySection[e.section] ||= []).push(e);
}

let md = `# Public corpus manifest\n\n`;
md += `Generated ${new Date().toISOString()} from \`server/corpus.json\` (${corpus.entries.length} entries). Regenerate with \`node scripts/build-corpus-manifest.mjs\` any time the corpus changes.\n\n`;
md += `**Claim:** every fact Public Captain can cite traces to a source file that is already part of the live, public crvro.com site. Nothing here is drawn from a private repo, a private knowledge store, or invented by a model -- the corpus is generated once, ahead of time, by \`scripts/build-corpus.mjs\`, from the exact source files listed below, and the worker only ever reads the resulting static JSON.\n\n`;
md += `## Sources\n\n`;
md += `| Section | Entries | Source file | Public-approval basis |\n`;
md += `|---|---|---|---|\n`;
for (const [section, meta] of Object.entries(SOURCE_MAP)) {
  const count = (bySection[section] || []).length;
  md += `| ${section} | ${count} | \`${meta.file}\` | ${meta.note} |\n`;
}

md += `\n## Full entry index\n\n`;
md += `Every evidence ID Public Captain is allowed to cite, with its source section and a preview of its text (evidence text itself is already public copy, so the preview is the actual content, not a summary):\n\n`;
for (const [section, entries] of Object.entries(bySection)) {
  md += `\n### ${section} (${entries.length})\n\n`;
  for (const e of entries) {
    const preview = e.text.length > 140 ? e.text.slice(0, 140) + '...' : e.text;
    md += `- \`${e.id}\` -- ${preview}\n`;
  }
}

md += `\n## What is deliberately excluded\n\n`;
md += `- The real mailto: inbox address (only the public display address \`contact@crvro.com\` is in the corpus)\n`;
md += `- Any project field not explicitly enumerated by \`scripts/build-corpus.mjs\`; whole project objects are never copied into the corpus\n`;
md += `- The \`predmkt-bot\` case study is present on the live site but was already excluded from the navigator's destination allowlist before this feature existed; it is also absent from this corpus for the same reason -- it is a real case study, just not one the navigator surfaces\n`;
md += `- Anything not present in \`src/data/projects.js\`, \`About.jsx\`, \`Skills.jsx\`, or \`Contact.jsx\` -- there is no other input to \`scripts/build-corpus.mjs\`\n`;

const outPath = path.join(ROOT, 'docs', 'CORPUS_MANIFEST.md');
writeFileSync(outPath, md);
console.log(`Wrote manifest to ${outPath} (${corpus.entries.length} entries across ${Object.keys(bySection).length} sections)`);

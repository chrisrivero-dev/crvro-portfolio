// ============================================================
// Case IDs: the stable identifier printed on each floppy disk label.
//
// Source of truth is the project registry (src/data/projects.js), never a
// hand-typed list. A case ID is `<collection letter>-<registry n>`:
//   PROJECTS      -> "C-<n>"   (C-01 Sidecar ... C-07 Proof First)
//   GIS_PROJECTS  -> "G-<n>"   (G-01 Parcel Engine)
// The registry `n` repeats across the two collections (Sidecar and Parcel
// Engine are both "01"), so the collection letter is part of the ID.
//
// A case ID is NOT a Project World stop number. World stops ("№ 01 ... № 06")
// are the order of the voyage and live in components/projectWorld/worldData.jsx;
// they can be reordered without touching a case ID. See docs/case-ids.md.
// ============================================================
import { PROJECTS, GIS_PROJECTS } from './projects.js';

const PREFIX = { projects: 'C', gis: 'G' };

const pad = (n) => String(n).padStart(2, '0');

function entries() {
  return [
    ...PROJECTS.map((p) => ({ p, prefix: PREFIX.projects })),
    ...GIS_PROJECTS.map((p) => ({ p, prefix: PREFIX.gis })),
  ];
}

/** slug -> "C-06" etc. */
export const CASE_IDS = Object.fromEntries(entries().map(({ p, prefix }) => [p.slug, `${prefix}-${pad(p.n)}`]));

export const caseIdFor = (slug) => CASE_IDS[slug] || null;

// Projects that get a physical disk, front of the tray first. Every entry is a real
// registry project with a real /projects/<slug> route. Predmkt Bot is deliberately
// absent: the navigator and Project World already treat it as unlisted (reachable by
// direct link only), and a disk would surface it.
export const DISK_ORDER = ['zarvin-one', 'proof-first', 'parcel-engine', 'openclaw', 'sidecar', 'groundrules', 'help-nearby'];

const bySlug = Object.fromEntries(entries().map(({ p }) => [p.slug, p]));

/** What the 3D disk labels are drawn from. */
export const DISK_PROJECTS = DISK_ORDER.map((slug) => {
  const p = bySlug[slug];
  if (!p) throw new Error(`caseIds: no registry project "${slug}"`);
  return { slug, label: p.title.toUpperCase(), line: p.titleEm, caseId: CASE_IDS[slug] };
});

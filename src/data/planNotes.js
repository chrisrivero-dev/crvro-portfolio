// ============================================================
// Which projects have a note pinned to the drafting plans (05B.1).
// Derived from the registry, never a hand-typed list: every GIS project, plus any project tagged GIS.
// Today that is Parcel Engine (G-01) and GroundRules (C-05). The notes print registry fields only.
// ============================================================
import { PROJECTS, GIS_PROJECTS } from './projects.js';

export const PLAN_NOTE_PROJECTS = [
  ...GIS_PROJECTS,
  ...PROJECTS.filter((p) => (p.tags || []).some((t) => /\bGIS\b/.test(t))),
];
export const PLAN_NOTE_SLUGS = PLAN_NOTE_PROJECTS.map((p) => p.slug);

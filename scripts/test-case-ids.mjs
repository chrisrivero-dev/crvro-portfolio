import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PROJECTS, GIS_PROJECTS } from '../src/data/projects.js';
import { CASE_IDS, DISK_ORDER, DISK_PROJECTS } from '../src/data/caseIds.js';

const all = [...PROJECTS, ...GIS_PROJECTS];
assert.equal(Object.keys(CASE_IDS).length, all.length, 'every registry project has a case ID');
assert.equal(new Set(Object.values(CASE_IDS)).size, all.length, 'case IDs are unique');
for (const id of Object.values(CASE_IDS)) assert.match(id, /^[CG]-\d{2}$/);
assert.equal(CASE_IDS['parcel-engine'], 'G-01');
assert.equal(CASE_IDS['sidecar'], 'C-01');
assert.equal(CASE_IDS['zarvin-one'], 'C-06');
assert.equal(new Set(DISK_ORDER).size, DISK_ORDER.length, 'no disk listed twice');
assert.equal(DISK_PROJECTS.length, DISK_ORDER.length);
for (const d of DISK_PROJECTS) {
  assert.ok(all.some((p) => p.slug === d.slug), `${d.slug} is in the registry`);
  assert.equal(d.caseId, CASE_IDS[d.slug]);
}
assert.ok(!DISK_ORDER.includes('predmkt-bot'), 'unlisted project has no disk');
// Every published disk must be on Project World: a port (STOPS) or the side island. worldData.jsx is JSX, so it is read as text.
// To leave a disk off the map on purpose, list its slug here with the reason.
const WORLD_EXCEPTIONS = {};
const world = readFileSync(new URL('../src/components/projectWorld/worldData.jsx', import.meta.url), 'utf8');
const places = new Set([...world.matchAll(/^\s+(?:id|slug): "([a-z0-9-]+)",$/gm)].map((m) => m[1]));
for (const d of DISK_PROJECTS) {
  assert.ok(places.has(d.slug) || WORLD_EXCEPTIONS[d.slug], `disk ${d.caseId} (${d.slug}) has no island on Project World: add a stop in worldData.jsx, or an entry in WORLD_EXCEPTIONS`);
}
const stops = world.slice(world.indexOf('export const STOPS'), world.indexOf('export const OVERVIEW')).match(/^\s+id: "/gm).length;
const legs = world.slice(world.indexOf('export const LEGS'), world.indexOf('export const SIDE_ISLAND')).match(/^\s+"M /gm).length;
assert.equal(legs, stops - 1, 'every Project World port after the first has one sea route');
console.log(`case-ids: ${all.length} IDs unique, ${DISK_PROJECTS.length} disks mapped`);

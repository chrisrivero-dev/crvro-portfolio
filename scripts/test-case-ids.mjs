import assert from 'node:assert/strict';
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
console.log(`case-ids: ${all.length} IDs unique, ${DISK_PROJECTS.length} disks mapped`);

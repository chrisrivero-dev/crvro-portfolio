import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

process.env.GROQ_API_KEY = 'test';
process.env.PUBLIC_CAPTAIN_INFERENCE_ENABLED = 'true';
process.env.PUBLIC_CAPTAIN_GROQ_ENABLED = 'true';
const { answerFast, FALLBACK } = await import('./fast-answer.mjs');
const corpus = JSON.parse(readFileSync(new URL('./corpus.json', import.meta.url), 'utf8'));
const ctx = { corpus, destinationAllowlist: new Set(Object.keys(corpus.destinations)), evidenceIdSet: new Set(corpus.entries.map((e) => e.id)) };
const realId = corpus.entries[0].id;
const reply = (o) => async () => JSON.stringify(o);

test('grounded answer is returned and cacheable', async () => {
  const r = await answerFast('how does the support tool avoid guessing in the unmatched wording', { ...ctx, call: reply({ status: 'answered', answer: 'It says so.', destinations: ['sidecar', 'evil'], evidence_ids: [realId, 'fake'], confidence: 'high' }) });
  assert.equal(r.result.status, 'answered');
  assert.deepEqual(r.result.destinations, ['sidecar']);
  assert.ok(!r.result.evidence_ids.includes('fake'));
  assert.equal(r.cacheable, true);
});
test('answer citing no real evidence becomes the honest fallback', async () => {
  const r = await answerFast('zzqx plorf wibble quantum cooking', { ...ctx, call: reply({ status: 'answered', answer: 'Invented.', evidence_ids: ['fake'], confidence: 'high' }) });
  assert.equal(r.result, FALLBACK);
  assert.equal(r.cacheable, false);
});
test('model failure and garbage output fall back, never throw, never cached', async () => {
  for (const call of [async () => { throw new Error('groq http 401'); }, async () => 'not json']) {
    const r = await answerFast('zzqx plorf wibble quantum cooking', { ...ctx, call });
    assert.equal(r.result, FALLBACK);
    assert.equal(r.cacheable, false);
  }
});
test('honest unresolved from the model is kept and cacheable', async () => {
  const r = await answerFast('what is his favorite color zzz', { ...ctx, call: reply({ status: 'unresolved', answer: 'The portfolio does not say.', evidence_ids: [], confidence: 'high' }) });
  assert.equal(r.result.status, 'unresolved');
  assert.equal(r.cacheable, true);
});
test('projects named in the question are always in the evidence', async () => {
  const { gatherEvidence } = await import('./fast-answer.mjs');
  const ids = gatherEvidence('What is the difference between OpenClaw and Parcel Engine?', corpus.entries).map((e) => e.slug);
  assert.ok(ids.includes('openclaw') && ids.includes('parcel-engine'));
});

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AdaptivePollBackoff,
  EMPTY_QUEUE_BACKOFF_MS,
  runPollingLoop,
} from './polling.mjs';

function finiteClaimSource(claims) {
  let index = 0;
  let running = true;
  return {
    claimJob: async () => {
      const claim = claims[index++];
      if (index >= claims.length) running = false;
      if (claim instanceof Error) throw claim;
      return claim;
    },
    isRunning: () => running,
  };
}

async function exercise(claims) {
  const source = finiteClaimSource(claims);
  const waits = [];
  const processed = [];
  const errors = [];
  await runPollingLoop({
    ...source,
    processJob: async (job) => processed.push(job.id),
    sleep: async (delay) => waits.push(delay),
    onError: (error) => errors.push(error.message),
  });
  return { waits, processed, errors };
}

test('first empty claim waits 2 seconds instead of the former 1.5 seconds', async () => {
  const { waits } = await exercise([{ ok: false, reason: 'empty' }]);
  assert.deepEqual(waits, [2_000]);
});

test('repeated empty claims reach and remain at the 60-second cap', async () => {
  const empty = { ok: false, reason: 'empty' };
  const { waits } = await exercise([empty, empty, empty, empty, empty, empty, empty]);
  assert.deepEqual(waits, [2_000, 5_000, 15_000, 30_000, 60_000, 60_000, 60_000]);
  assert.ok(waits.every((delay) => delay <= 60_000));
});

test('AdaptivePollBackoff never exceeds its intended cap', () => {
  const backoff = new AdaptivePollBackoff();
  const delays = Array.from({ length: 100 }, () => backoff.nextDelay());
  assert.equal(Math.max(...delays), 60_000);
  assert.equal(delays.at(-1), 60_000);
  assert.deepEqual(delays.slice(0, EMPTY_QUEUE_BACKOFF_MS.length), EMPTY_QUEUE_BACKOFF_MS);
});

test('finding a real job resets the next empty delay', async () => {
  const empty = { ok: false, reason: 'empty' };
  const { waits, processed } = await exercise([
    empty,
    empty,
    { ok: true, job: { id: 'job-1' } },
    empty,
  ]);
  assert.deepEqual(processed, ['job-1']);
  assert.deepEqual(waits, [2_000, 5_000, 2_000]);
});

test('multiple queued jobs process consecutively without sleeps between them', async () => {
  const { waits, processed } = await exercise([
    { ok: true, job: { id: 'job-1' } },
    { ok: true, job: { id: 'job-2' } },
    { ok: true, job: { id: 'job-3' } },
    { ok: false, reason: 'empty' },
  ]);
  assert.deepEqual(processed, ['job-1', 'job-2', 'job-3']);
  assert.deepEqual(waits, [2_000]);
});

test('claim errors back off and cannot create a tight retry loop', async () => {
  const { waits, processed, errors } = await exercise([
    new Error('broker unavailable'),
    new Error('broker still unavailable'),
    { ok: true, job: { id: 'job-after-recovery' } },
    new Error('temporary post-job failure'),
  ]);
  assert.deepEqual(processed, ['job-after-recovery']);
  assert.deepEqual(errors, ['broker unavailable', 'broker still unavailable', 'temporary post-job failure']);
  assert.deepEqual(waits, [2_000, 5_000, 2_000]);
});

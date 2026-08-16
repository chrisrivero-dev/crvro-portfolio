// ============================================================
// Shared request handlers for the Public Captain broker's public HTTP
// contract. This is the ONLY place that contract is implemented --
// server/broker.mjs (local dev, plain Node http server) and the
// Vercel Functions under api/ (production/preview) both call these
// same functions instead of each re-implementing the logic.
//
// Handlers take plain, already-parsed input (never a raw req/res) and
// return { status, body }, so they have no dependency on which HTTP
// runtime is calling them.
// ============================================================

import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { WORKER_SECRET, LIMITS } from './config.mjs';
import { isValidQuestion, validateResult } from './validate.mjs';
import { createJob, getJob, updateJob, usingRedis, approximateInFlight } from './store.mjs';
import { sendJob, JOBS_TOPIC, WORKER_CONSUMER_GROUP, QUEUE_REGION } from './queue.mjs';
import { claimMessage, ackMessage, extendMessage } from './queue-lease.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const corpus = JSON.parse(readFileSync(path.join(__dirname, 'corpus.json'), 'utf8'));
export const DESTINATION_ALLOWLIST = new Set(Object.keys(corpus.destinations));
export const EVIDENCE_ID_SET = new Set(corpus.entries.map((e) => e.id));

console.log(`[handlers] loaded corpus: ${corpus.entries.length} entries, ${DESTINATION_ALLOWLIST.size} destinations`);
console.log(`[handlers] result store: ${usingRedis ? 'Upstash Redis (durable)' : 'in-memory Map (local only, not yet durable -- provision Upstash to change this)'}`);
if (process.env.PUBLIC_CAPTAIN_WORKER_SECRET) {
  console.log(`[handlers] worker secret: loaded from PUBLIC_CAPTAIN_WORKER_SECRET (${WORKER_SECRET.slice(0, 4)}...)`);
} else {
  console.warn(`[handlers] worker secret: auto-generated, printing once for local setup -- ${WORKER_SECRET}`);
  console.warn('[handlers] set PUBLIC_CAPTAIN_WORKER_SECRET yourself for anything beyond a local demo.');
}

// ---- per-instance, best-effort state (rate limits / dup-collapse are
// inherently per-instance; documented limitation for a multi-instance
// serverless deployment, not a security gap -- see docs/PUBLIC_CAPTAIN.md.
// Every security-relevant guarantee (question validation, destination
// allowlist, evidence-id allowlist, worker auth) is stateless and holds
// per-request regardless of instance count.) ----
const askRateLimits = new Map(); // ip -> timestamps[]
const pollRateLimits = new Map(); // ip -> timestamps[]
const recentQuestions = new Map(); // `${ip}:${normalizedQuestion}` -> { jobId, ts }

function now() {
  return Date.now();
}

function checkRateLimit(map, ip, max, windowMs) {
  const ts = now();
  const list = (map.get(ip) || []).filter((t) => ts - t < windowMs);
  if (list.length >= max) {
    map.set(ip, list);
    return false;
  }
  list.push(ts);
  map.set(ip, list);
  return true;
}

// Only runs while an instance stays warm -- a fresh cold start simply
// starts these Maps empty again, which is fine (see per-instance note
// above).
const gcTimer = setInterval(() => {
  const ts = now();
  for (const [key, entry] of recentQuestions) {
    if (ts - entry.ts > LIMITS.DUPLICATE_WINDOW_MS) recentQuestions.delete(key);
  }
}, LIMITS.GC_INTERVAL_MS);
gcTimer.unref?.();

export function checkWorkerAuth(authHeader) {
  const auth = authHeader || '';
  const expected = `Bearer ${WORKER_SECRET}`;
  if (auth.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(auth), Buffer.from(expected));
}

export function publicResultView(job) {
  const ts = now();
  if (job.status === 'queued' && ts - job.createdAt > LIMITS.QUEUE_TTL_MS) return { status: 'expired' };
  if (job.status === 'processing' && ts - (job.claimedAt || job.createdAt) > LIMITS.PROCESSING_TTL_MS) {
    return { status: 'expired' };
  }
  if (job.status === 'answered') return { status: 'answered', ...job.result };
  if (job.status === 'error') return { status: 'error' };
  if (job.status === 'expired') return { status: 'expired' };
  return { status: job.status }; // queued | processing
}

// ---- POST /api/ask (public) ----
export async function handleAsk({ question: rawQuestion, ip }) {
  if (!checkRateLimit(askRateLimits, ip, LIMITS.RATE_LIMIT_MAX_ASK, LIMITS.RATE_LIMIT_WINDOW_MS)) {
    return { status: 429, body: { error: 'rate_limited' } };
  }
  if (!isValidQuestion(rawQuestion)) {
    return { status: 400, body: { error: 'invalid_question' } };
  }
  const question = rawQuestion.trim();

  const dupKey = `${ip}:${question.toLowerCase()}`;
  const dup = recentQuestions.get(dupKey);
  if (dup && now() - dup.ts < LIMITS.DUPLICATE_WINDOW_MS) {
    return { status: 202, body: { request_id: dup.jobId, status: 'queued' } };
  }

  const inFlight = approximateInFlight();
  if (inFlight !== null && inFlight >= LIMITS.MAX_IN_FLIGHT) {
    return { status: 503, body: { error: 'busy' } };
  }

  const id = crypto.randomUUID();
  await createJob(id, question, { ip });
  recentQuestions.set(dupKey, { jobId: id, ts: now() });

  try {
    await sendJob(id, question);
  } catch (err) {
    console.error('[handlers] queue send failed:', err.message);
    await updateJob(id, { status: 'error' });
    return { status: 503, body: { error: 'queue_unavailable' } };
  }

  return { status: 202, body: { request_id: id, status: 'queued' } };
}

// ---- GET /api/result/:id (public) ----
export async function handleResult({ id, ip }) {
  if (!checkRateLimit(pollRateLimits, ip, LIMITS.RATE_LIMIT_MAX_POLL, LIMITS.RATE_LIMIT_WINDOW_MS)) {
    return { status: 429, body: { error: 'rate_limited' } };
  }
  const job = await getJob(id);
  if (!job) return { status: 404, body: { status: 'expired' } };
  return { status: 200, body: publicResultView(job) };
}

// Acks the Vercel Queue lease for a job, if it still has one. Never
// throws -- a failed ack just means the lease expires naturally and
// Vercel redelivers the message, which the idempotency check in
// handleWorkerClaim below treats as a no-op for an already-finished
// job. Logs only the job id and error message, nothing credential-
// shaped (the receipt handle itself is never logged).
async function tryAck(job) {
  if (!job?.receiptHandle) return;
  try {
    await ackMessage({
      topic: JOBS_TOPIC,
      consumerGroup: WORKER_CONSUMER_GROUP,
      region: QUEUE_REGION,
      receiptHandle: job.receiptHandle,
    });
  } catch (err) {
    console.warn(`[handlers] ack failed for ${job.id}:`, err.message);
  }
}

// ---- POST /api/worker/claim (worker only, bearer-authenticated) ----
// Leases at most one queued job. Does NOT acknowledge it -- the lease
// is only released (see tryAck above) once handleWorkerSubmit has
// durably persisted a real result, or immediately here if the claimed
// message turns out to be unusable (malformed, or a duplicate
// redelivery of a job already answered). If the worker never submits
// -- crash, kill, network loss -- the lease simply expires and Vercel
// redelivers the message to the next claim call.
export async function handleWorkerClaim({ authHeader }) {
  if (!checkWorkerAuth(authHeader)) return { status: 401, body: { error: 'unauthorized' } };

  let claimed;
  try {
    claimed = await claimMessage({
      topic: JOBS_TOPIC,
      consumerGroup: WORKER_CONSUMER_GROUP,
      region: QUEUE_REGION,
      visibilityTimeoutSeconds: LIMITS.CLAIM_VISIBILITY_TIMEOUT_SECONDS,
    });
  } catch (err) {
    console.error('[handlers] claim failed:', err.message);
    return { status: 502, body: { ok: false, reason: 'claim_failed' } };
  }
  if (!claimed) return { status: 200, body: { ok: false, reason: 'empty' } };

  const { payload, receiptHandle, deliveryCount } = claimed;
  const id = payload?.id;
  const question = payload?.question;
  if (typeof id !== 'string' || typeof question !== 'string') {
    console.warn('[handlers] claimed message had an unusable payload shape -- acking and discarding');
    await ackMessage({ topic: JOBS_TOPIC, consumerGroup: WORKER_CONSUMER_GROUP, region: QUEUE_REGION, receiptHandle }).catch(() => {});
    return { status: 200, body: { ok: false, reason: 'empty' } };
  }

  const job = await getJob(id);
  // 'error' is deliberately NOT treated as finished here -- that status
  // means a previous attempt's own pipeline failed (see the ack policy
  // in handleWorkerSubmit below), and the whole point of not acking it
  // then was to let exactly this redelivery retry it for real. Only a
  // genuine terminal outcome (answered/unresolved) or a job record
  // that's gone entirely short-circuits reprocessing.
  const terminalStatuses = new Set(['answered', 'unresolved']);
  if (!job || terminalStatuses.has(job.status)) {
    console.log(`[handlers] claim ${id}: already finished or unknown -- acking without reprocessing`);
    await ackMessage({ topic: JOBS_TOPIC, consumerGroup: WORKER_CONSUMER_GROUP, region: QUEUE_REGION, receiptHandle }).catch(() => {});
    return { status: 200, body: { ok: false, reason: 'empty' } };
  }

  await updateJob(id, { status: 'processing', claimedAt: Date.now(), receiptHandle, deliveryCount });
  console.log(`[handlers] claimed ${id} (delivery count ${deliveryCount})`);
  return { status: 200, body: { ok: true, job: { id, question } } };
}

// ---- POST /api/worker/extend (worker only, bearer-authenticated) ----
// Pushes the lease's visibility timeout further out while the worker
// is still genuinely processing a job -- headroom for a legitimately
// slow multi-model pipeline under real GPU contention, on top of the
// already-generous initial CLAIM_VISIBILITY_TIMEOUT_SECONDS.
export async function handleWorkerExtend({ authHeader, body }) {
  if (!checkWorkerAuth(authHeader)) return { status: 401, body: { error: 'unauthorized' } };
  const job = await getJob(body?.id);
  if (!job || !job.receiptHandle) {
    return { status: 404, body: { error: 'unknown_or_unclaimed_job' } };
  }
  try {
    await extendMessage({
      topic: JOBS_TOPIC,
      consumerGroup: WORKER_CONSUMER_GROUP,
      region: QUEUE_REGION,
      receiptHandle: job.receiptHandle,
      visibilityTimeoutSeconds: LIMITS.CLAIM_VISIBILITY_TIMEOUT_SECONDS,
    });
  } catch (err) {
    console.warn(`[handlers] extend failed for ${job.id}:`, err.message);
    return { status: 502, body: { error: 'extend_failed' } };
  }
  return { status: 200, body: { ok: true } };
}

// ---- POST /api/worker/submit (worker only, bearer-authenticated) ----
export async function handleWorkerSubmit({ authHeader, body }) {
  if (!checkWorkerAuth(authHeader)) return { status: 401, body: { error: 'unauthorized' } };
  const job = await getJob(body?.id);
  if (!job) {
    return { status: 404, body: { error: 'unknown_or_stale_job' } };
  }
  // Reject a submission that arrives after the browser would already
  // have been shown "expired" -- without this, a very-late submit could
  // silently flip an already-expired job back to "answered" out of sync
  // with what the visitor already saw. The lease is acked regardless --
  // it's genuinely too late for a retry to help anyone.
  if (Date.now() - job.createdAt > LIMITS.QUEUE_TTL_MS + LIMITS.PROCESSING_TTL_MS) {
    console.warn(`[handlers] rejected stale-late submission for ${job.id}`);
    await tryAck(job);
    return { status: 409, body: { error: 'job_already_expired' } };
  }
  const { ok, result, reason } = validateResult(body.result, DESTINATION_ALLOWLIST, EVIDENCE_ID_SET);
  if (!ok) {
    await updateJob(job.id, { status: 'error' });
    console.warn(`[handlers] rejected worker submission for ${job.id}: ${reason}`);
    // Malformed worker output, not a confirmed dead end -- leave the
    // lease to expire so Vercel redelivers for a genuine retry instead
    // of permanently giving up after one bad attempt.
    return { status: 400, body: { error: 'invalid_result', reason } };
  }
  const updated = await updateJob(job.id, { status: result.status === 'error' ? 'error' : 'answered', result });
  if (result.status === 'error') {
    // The worker genuinely tried and is honestly reporting failure
    // (e.g. every model call timed out) -- persist that so the browser
    // doesn't hang, but let the lease expire so Vercel Queues retries
    // the job rather than treating one failed attempt as final.
    console.warn(`[handlers] worker reported processing failure for ${job.id}`);
    return { status: 200, body: { ok: true } };
  }
  await tryAck(updated);
  return { status: 200, body: { ok: true } };
}

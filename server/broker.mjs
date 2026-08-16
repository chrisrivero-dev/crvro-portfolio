// ============================================================
// Public Captain broker.
//
// The ONLY network-facing surface for the portfolio-intelligence
// feature besides the static site itself. Runs locally tonight as a
// plain Node http server; every handler below is written so it maps
// 1:1 onto a Vercel serverless function later.
//
// Durable transport:
//   Job dispatch  -> Vercel Queues, poll mode (server/queue.mjs).
//                    The off-Vercel worker RECEIVES jobs directly
//                    from Vercel's queue infrastructure -- the broker
//                    never talks to the worker to hand off work.
//   Result/status -> Upstash Redis via KV_REST_API_URL/TOKEN when
//                    provisioned (server/store.mjs), falling back to
//                    an in-memory Map before that's set up.
//
// Public endpoints (browser-facing):
//   POST /api/ask            enqueue a question (writes status to the
//                             store, sends the job onto the queue)
//   GET  /api/result/:id     poll job status/result (reads the store)
//
// Worker-only endpoint (requires Authorization: Bearer <secret>):
//   POST /api/worker/submit  worker posts back a validated result
//                             (the worker pulls jobs from Vercel
//                             Queues directly -- there's no
//                             /api/worker/poll to hand jobs out)
//
// The broker never opens a connection to the worker/Mac. It only
// ever receives connections -- from the browser, and from the worker
// posting results back. No inbound port exists on the Mac.
// ============================================================

import http from 'node:http';
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { BROKER_PORT, ALLOWED_ORIGINS, WORKER_SECRET, LIMITS } from './config.mjs';
import { isValidQuestion, validateResult } from './validate.mjs';
import { createJob, getJob, updateJob, usingRedis, approximateInFlight } from './store.mjs';
import { sendJob } from './queue.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const corpus = JSON.parse(readFileSync(path.join(__dirname, 'corpus.json'), 'utf8'));
const DESTINATION_ALLOWLIST = new Set(Object.keys(corpus.destinations));
const EVIDENCE_ID_SET = new Set(corpus.entries.map((e) => e.id));

console.log(`[broker] loaded corpus: ${corpus.entries.length} entries, ${DESTINATION_ALLOWLIST.size} destinations`);
console.log(`[broker] result store: ${usingRedis ? 'Upstash Redis (durable)' : 'in-memory Map (local only, not yet durable -- provision Upstash to change this)'}`);
// Never log the full secret -- logs get captured/persisted in ways a
// developer doesn't always control. If it was auto-generated (no
// PUBLIC_CAPTAIN_WORKER_SECRET in the environment), the operator still
// needs to see it once to configure the worker; print it in that case
// only, with an explicit warning, so a real deployment that sets its
// own secret never has it appear in logs at all.
if (process.env.PUBLIC_CAPTAIN_WORKER_SECRET) {
  console.log(`[broker] worker secret: loaded from PUBLIC_CAPTAIN_WORKER_SECRET (${WORKER_SECRET.slice(0, 4)}...)`);
} else {
  console.warn(`[broker] worker secret: auto-generated, printing once for local setup -- ${WORKER_SECRET}`);
  console.warn('[broker] set PUBLIC_CAPTAIN_WORKER_SECRET yourself for anything beyond a local demo.');
}

// ---- broker-local, best-effort state (rate limits / dup-collapse are
// inherently per-instance; documented limitation for multi-instance
// production, not a security gap -- see docs/PUBLIC_CAPTAIN.md) ----
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

setInterval(() => {
  const ts = now();
  for (const [key, entry] of recentQuestions) {
    if (ts - entry.ts > LIMITS.DUPLICATE_WINDOW_MS) recentQuestions.delete(key);
  }
}, LIMITS.GC_INTERVAL_MS).unref();

function getClientIp(req) {
  // Local demo only trusts the raw socket address -- in a real
  // deployment behind a platform load balancer this would read a
  // platform-verified header, never an arbitrary client-supplied one.
  return req.socket.remoteAddress || 'unknown';
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > LIMITS.MAX_BODY_BYTES) {
        reject(new Error('payload_too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text ? JSON.parse(text) : {});
      } catch {
        reject(new Error('malformed_json'));
      }
    });
    req.on('error', reject);
  });
}

function sendJsonRes(res, status, body, origin) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    ...(origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}),
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
  });
  res.end(payload);
}

function checkWorkerAuth(req) {
  const auth = req.headers['authorization'] || '';
  const expected = `Bearer ${WORKER_SECRET}`;
  if (auth.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(auth), Buffer.from(expected));
}

function publicResultView(job) {
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

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : undefined;
  const url = new URL(req.url, `http://localhost:${BROKER_PORT}`);
  const ip = getClientIp(req);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      ...(allowOrigin ? { 'Access-Control-Allow-Origin': allowOrigin, Vary: 'Origin' } : {}),
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '600',
    });
    res.end();
    return;
  }

  try {
    // ---- POST /api/ask (public) ----
    if (req.method === 'POST' && url.pathname === '/api/ask') {
      if (!checkRateLimit(askRateLimits, ip, LIMITS.RATE_LIMIT_MAX_ASK, LIMITS.RATE_LIMIT_WINDOW_MS)) {
        return sendJsonRes(res, 429, { error: 'rate_limited' }, allowOrigin);
      }
      let body;
      try {
        body = await readJsonBody(req);
      } catch (e) {
        const status = e.message === 'payload_too_large' ? 413 : 400;
        return sendJsonRes(res, status, { error: e.message }, allowOrigin);
      }
      if (!isValidQuestion(body.question)) {
        return sendJsonRes(res, 400, { error: 'invalid_question' }, allowOrigin);
      }
      const question = body.question.trim();

      const dupKey = `${ip}:${question.toLowerCase()}`;
      const dup = recentQuestions.get(dupKey);
      if (dup && now() - dup.ts < LIMITS.DUPLICATE_WINDOW_MS) {
        return sendJsonRes(res, 202, { request_id: dup.jobId, status: 'queued' }, allowOrigin);
      }

      const inFlight = approximateInFlight();
      if (inFlight !== null && inFlight >= LIMITS.MAX_IN_FLIGHT) {
        return sendJsonRes(res, 503, { error: 'busy' }, allowOrigin);
      }

      const id = crypto.randomUUID();
      await createJob(id, question, { ip });
      recentQuestions.set(dupKey, { jobId: id, ts: now() });

      try {
        await sendJob(id, question);
      } catch (err) {
        console.error('[broker] queue send failed:', err.message);
        await updateJob(id, { status: 'error' });
        return sendJsonRes(res, 503, { error: 'queue_unavailable' }, allowOrigin);
      }

      return sendJsonRes(res, 202, { request_id: id, status: 'queued' }, allowOrigin);
    }

    // ---- GET /api/result/:id (public) ----
    if (req.method === 'GET' && url.pathname.startsWith('/api/result/')) {
      if (!checkRateLimit(pollRateLimits, ip, LIMITS.RATE_LIMIT_MAX_POLL, LIMITS.RATE_LIMIT_WINDOW_MS)) {
        return sendJsonRes(res, 429, { error: 'rate_limited' }, allowOrigin);
      }
      const id = url.pathname.slice('/api/result/'.length);
      const job = await getJob(id);
      if (!job) return sendJsonRes(res, 404, { status: 'expired' }, allowOrigin);
      return sendJsonRes(res, 200, publicResultView(job), allowOrigin);
    }

    // ---- POST /api/worker/submit (worker only) ----
    // The worker pulls jobs directly from Vercel Queues (see
    // worker/public-captain.mjs); this is the only broker endpoint it
    // still needs, to post the validated result back for the browser
    // to poll.
    if (req.method === 'POST' && url.pathname === '/api/worker/submit') {
      if (!checkWorkerAuth(req)) return sendJsonRes(res, 401, { error: 'unauthorized' });
      let body;
      try {
        body = await readJsonBody(req);
      } catch (e) {
        return sendJsonRes(res, 400, { error: e.message });
      }
      const job = await getJob(body.id);
      if (!job) {
        return sendJsonRes(res, 404, { error: 'unknown_or_stale_job' });
      }
      // Reject a submission that arrives after the browser would already
      // have been shown "expired" -- e.g. a message Vercel Queues
      // delivered unusually late under contention. Without this, a
      // very-late submit could silently flip an already-expired job
      // back to "answered" out of sync with what the visitor already saw.
      if (Date.now() - job.createdAt > LIMITS.QUEUE_TTL_MS + LIMITS.PROCESSING_TTL_MS) {
        console.warn(`[broker] rejected stale-late submission for ${job.id}`);
        return sendJsonRes(res, 409, { error: 'job_already_expired' });
      }
      const { ok, result, reason } = validateResult(body.result, DESTINATION_ALLOWLIST, EVIDENCE_ID_SET);
      if (!ok) {
        await updateJob(job.id, { status: 'error' });
        console.warn(`[broker] rejected worker submission for ${job.id}: ${reason}`);
        return sendJsonRes(res, 400, { error: 'invalid_result', reason });
      }
      await updateJob(job.id, { status: 'answered', result });
      return sendJsonRes(res, 200, { ok: true });
    }

    return sendJsonRes(res, 404, { error: 'not_found' }, allowOrigin);
  } catch (err) {
    console.error('[broker] unhandled error', err);
    return sendJsonRes(res, 500, { error: 'internal_error' }, allowOrigin);
  }
});

server.listen(BROKER_PORT, () => {
  console.log(`[broker] listening on http://localhost:${BROKER_PORT}`);
});

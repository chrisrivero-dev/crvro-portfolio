#!/usr/bin/env node
// ============================================================
// Public Captain worker.
//
// Runs on this Mac, started manually or supervised by launchd
// (see worker/run-worker.sh and com.crvro.publiccaptain.plist).
// Makes only OUTBOUND connections, all to the broker (deployed as
// Vercel Functions -- see api/worker/):
//   - POST /api/worker/claim   -- lease one queued job
//   - POST /api/worker/extend  -- keep a lease alive while processing
//   - POST /api/worker/submit  -- post the validated result back
//   - Groq (api.groq.com), when enabled -- openai/gpt-oss-20b, the
//     preferred fast cloud provider (see worker/groq.mjs). No tools,
//     no browser/search/code-execution capability. GROQ_API_KEY is
//     read from this process's own environment, never logged, never
//     sent anywhere but Groq's fixed API host.
//   - localhost Ollama -- to run the dedicated local public model
//     (qwen3:4b), the fallback when Groq is disabled, unconfigured,
//     errored, or rate-limited -- never the private fleet. This
//     process is single-flight (the loop below awaits one job at a
//     time before claiming the next), which is the entire MAX=1
//     public-concurrency guarantee -- there is no code path that could
//     start a second generation while one is in flight. Before ever
//     calling the local model, orchestrate.mjs's capacity gate checks
//     that nothing else is loaded on the local GPU (see
//     checkPublicCapacity in ollama.mjs) so a visitor never competes
//     with Christopher's own private Captain/Hermes/Nemo/Coder work.
//     Groq calls are not capacity-gated (cloud, not local GPU) but are
//     gated by the same containment kill-switch as the local path.
// The worker never talks to Vercel Queues directly (see
// server/queue.mjs and docs/PUBLIC_CAPTAIN.md for why: Vercel Queues
// authenticates via OIDC scoped to the caller's environment, and a
// token obtained off-platform is always development-scoped, so it can
// never see messages a real Preview/Production deployment sent). The
// three endpoints above run AS Vercel Functions and so always get a
// correctly-scoped token automatically; this process only ever makes
// plain outbound HTTPS calls to them. It never listens on a port and
// is never reachable from the Internet.
//
// This process has no shell-exec, no arbitrary fetch, no filesystem
// write, no GitHub/Gmail/Discord/Telegram/cron access, and no import
// of any private Captain/Hermes tool. When run via run-worker.sh it
// also runs under Node's --permission flag set, scoped to read-only
// access to this repo and nothing else, as defense-in-depth.
// ============================================================

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { WORKER_SECRET, BROKER_PORT, LIMITS } from '../server/config.mjs';
import { validateResult } from '../server/validate.mjs';
import { answerQuestion } from './orchestrate.mjs';
import { callPublicModel, checkPublicCapacity, isPublicInferenceEnabled } from './ollama.mjs';
import { callGroqPublic, isGroqConfigured, isGroqPrimaryEnabled } from './groq.mjs';

// Environment isolation safety net (addresses independent review finding:
// nothing prevents this process from silently inheriting a private
// Captain/Hermes/Discord/Telegram/GitHub credential if the launchd
// environment or an operator's shell profile were ever misconfigured to
// export one). This does not rely on the environment already being
// clean -- it actively checks and refuses to start rather than silently
// running with unexpected access. Loud crash, not a quiet risk.
const DENYLISTED_ENV_PATTERNS = [/DISCORD/i, /TELEGRAM/i, /GITHUB/i, /^GH_/i, /HERMES/i, /GMAIL/i, /GOOGLE/i, /CAPTAIN_LOCAL/i, /DAVENTRY/i];
function assertCleanEnvironment() {
  const offending = Object.keys(process.env).filter((k) => DENYLISTED_ENV_PATTERNS.some((re) => re.test(k)));
  if (offending.length) {
    console.error('[worker] FATAL: unexpected private-service-shaped environment variable(s) present:', offending.join(', '));
    console.error('[worker] refusing to start -- this worker must never have access to private Captain/Hermes/Discord/Telegram/GitHub credentials.');
    process.exit(1);
  }
}
assertCleanEnvironment();

// Crash handlers log a fixed string only -- never the error object's
// full contents or process.env -- so an unexpected crash can't become
// a secret-exposure path via a launchd-captured log file.
process.on('uncaughtException', (err) => {
  console.error('[worker] uncaught exception -- crashing intentionally so the process supervisor restarts cleanly:', err?.message || 'unknown error');
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error('[worker] unhandled rejection:', err?.message || 'unknown error');
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BROKER_URL = process.env.BROKER_URL || `http://localhost:${BROKER_PORT}`;
const EMPTY_QUEUE_WAIT_MS = 1500;
// Derived from the Queue lease's own visibility timeout (the real
// ceiling now that claim/extend/submit are lease-based -- see
// server/handlers.mjs), with headroom under it so a genuinely stuck
// pipeline still surfaces an error and releases the lease cleanly
// instead of losing a race against it. Sized generously from the old
// three-model (NEMO -> CAPTAIN -> REVIEWER) escalation path; the
// current single-shot qwen3:4b public path (bounded output, no
// escalation) finishes far under this in practice -- see the isolation
// pass's latency measurements in docs/PUBLIC_CAPTAIN.md for real
// numbers. Left unchanged rather than tightened blind: a wide budget
// costs nothing when the pipeline is actually fast, and still protects
// against a genuinely slow run (e.g. the model queued behind other
// requests) instead of killing it prematurely.
const PIPELINE_BUDGET_MS = Math.floor(LIMITS.CLAIM_VISIBILITY_TIMEOUT_SECONDS * 1000 * 0.85);

// Runs `factory(signal)` under a real deadline: when the budget expires,
// `signal` is aborted so the in-flight Ollama call actually stops (see
// ollama.mjs's external-signal handling), instead of merely being
// abandoned by this promise while it keeps consuming the GPU in the
// background and starving whatever job the worker picks up next.
function withOverallBudget(factory, ms) {
  const controller = new AbortController();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`pipeline exceeded ${ms}ms budget`));
    }, ms);
    factory(controller.signal).then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

const corpus = JSON.parse(readFileSync(path.join(__dirname, '..', 'server', 'corpus.json'), 'utf8'));
const DESTINATION_ALLOWLIST = new Set(Object.keys(corpus.destinations));
const EVIDENCE_ID_SET = new Set(corpus.entries.map((e) => e.id));

// Push the lease's visibility timeout out again well before the
// broker's own CLAIM_VISIBILITY_TIMEOUT_SECONDS would expire it --
// belt-and-suspenders on top of that already-generous window, for a
// legitimately slow pipeline under real GPU contention.
const LEASE_EXTEND_INTERVAL_MS = 60_000;

console.log(`[worker] Public Captain starting`);
console.log(`[worker] broker: ${BROKER_URL}`);
console.log(`[worker] jobs source: /api/worker/claim (Vercel Queues lease, bridged)`);
console.log(`[worker] corpus: ${corpus.entries.length} entries`);
console.log(
  isPublicInferenceEnabled()
    ? '[worker] public inference: ENABLED -- deterministic fast path + real model calls, gated by the live capacity check'
    : '[worker] public inference: DISABLED (containment mode) -- deterministic fast path only; everything else returns "busy". Set PUBLIC_CAPTAIN_INFERENCE_ENABLED=true to enable once the public model path is approved.'
);
console.log(
  isGroqPrimaryEnabled() && isGroqConfigured()
    ? '[worker] groq (openai/gpt-oss-20b): ENABLED as primary provider -- local qwen3:4b is the capacity-gated fallback'
    : `[worker] groq: DISABLED as primary provider (configured=${isGroqConfigured()}) -- local qwen3:4b remains the sole public provider. Set PUBLIC_CAPTAIN_GROQ_ENABLED=true to enable once the benchmark is approved.`
);

function authHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${WORKER_SECRET}`,
    // Only set during Preview end-to-end testing, when Vercel's own
    // Deployment Protection SSO wall would otherwise block this
    // outbound call before it ever reaches our own worker-secret
    // check. Never set in the real launchd config -- a real production
    // deployment has no Deployment Protection in front of it, so this
    // header is simply absent there.
    ...(process.env.VERCEL_PREVIEW_BYPASS_SECRET
      ? { 'x-vercel-protection-bypass': process.env.VERCEL_PREVIEW_BYPASS_SECRET }
      : {}),
    ...extra,
  };
}

async function claimJob() {
  const res = await fetch(`${BROKER_URL}/api/worker/claim`, { method: 'POST', headers: authHeaders() });
  if (!res.ok) throw new Error(`claim failed with ${res.status}`);
  return res.json(); // { ok: true, job: {id, question} } | { ok: false, reason: 'empty' }
}

async function extendJob(id) {
  try {
    const res = await fetch(`${BROKER_URL}/api/worker/extend`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ id }),
    });
    if (!res.ok) console.warn(`[worker] lease extend failed for ${id}: ${res.status}`);
  } catch (err) {
    console.warn(`[worker] lease extend error for ${id}:`, err.message);
  }
}

async function submitResult(id, result) {
  const res = await fetch(`${BROKER_URL}/api/worker/submit`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ id, result }),
  });
  return res;
}

// Processes exactly one already-claimed job: runs the pipeline (with a
// keepalive that extends the Queue lease periodically), validates the
// result, and submits it. The broker (server/handlers.mjs) is the one
// that actually acknowledges the Vercel Queue message -- only after it
// has durably persisted the result -- so a crash or kill anywhere in
// this function before submit succeeds just leaves the lease to expire
// and the job gets redelivered, not lost.
async function processJob({ id, question }) {
  console.log(`[worker] claimed job ${id}: "${String(question).slice(0, 80)}"`);

  const keepalive = setInterval(() => extendJob(id), LEASE_EXTEND_INTERVAL_MS);
  let outcome;
  try {
    const { draft, routing } = await withOverallBudget(
      (signal) =>
        answerQuestion(question, {
          corpus,
          callModel: callPublicModel,
          checkCapacity: checkPublicCapacity,
          inferenceEnabled: isPublicInferenceEnabled(),
          callGroq: callGroqPublic,
          groqEnabled: isGroqPrimaryEnabled() && isGroqConfigured(),
          signal,
        }),
      PIPELINE_BUDGET_MS
    );
    outcome = { ...draft, routing };
  } catch (err) {
    console.error(`[worker] pipeline error for ${id}:`, err.message);
    outcome = { status: 'error', answer: '', destinations: [], evidence_ids: [], routing: [], confidence: 'low' };
  } finally {
    clearInterval(keepalive);
  }

  const { ok, result, reason } = validateResult(outcome, DESTINATION_ALLOWLIST, EVIDENCE_ID_SET);
  const finalResult = ok
    ? { ...result, routing: outcome.routing || [] }
    : { status: 'error', answer: '', destinations: [], evidence_ids: [], routing: [], confidence: 'low' };
  if (!ok) console.warn(`[worker] own output failed validation (${reason}) -- submitting error instead`);

  const submitRes = await submitResult(id, finalResult);
  if (!submitRes.ok) {
    console.warn(`[worker] submit failed for ${id}: ${submitRes.status}`);
    return;
  }
  console.log(`[worker] answered ${id} (status=${finalResult.status}, confidence=${finalResult.confidence}, routing=${JSON.stringify(finalResult.routing)})`);
}

let running = true;
process.on('SIGINT', () => {
  console.log('\n[worker] shutting down');
  running = false;
  process.exit(0);
});

async function loop() {
  while (running) {
    try {
      const claim = await claimJob();
      if (!claim.ok) {
        await new Promise((r) => setTimeout(r, EMPTY_QUEUE_WAIT_MS));
        continue;
      }
      await processJob(claim.job);
      // loop immediately to check for more
    } catch (err) {
      console.error('[worker] loop error:', err.message);
      await new Promise((r) => setTimeout(r, EMPTY_QUEUE_WAIT_MS));
    }
  }
}

loop();

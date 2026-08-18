// ============================================================
// Shared broker/worker configuration and security limits.
// Every bound in this file is enforced server-side — the browser
// is never trusted to respect any of these on its own.
// ============================================================

import crypto from 'node:crypto';

export const BROKER_PORT = Number(process.env.BROKER_PORT || 8787);

// Local dev origins the broker will answer CORS preflights for.
// In production this would be exactly the site's own origin(s).
export const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS || 'http://localhost:5183,http://127.0.0.1:5183'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Shared secret the worker presents to the worker-only endpoints.
// Generated at process start if not provided — printed once so the
// worker process (started separately) can be given the same value.
export const WORKER_SECRET = process.env.PUBLIC_CAPTAIN_WORKER_SECRET || crypto.randomUUID();

export const LIMITS = {
  MAX_QUESTION_LEN: 500,
  MAX_ANSWER_LEN: 1200,
  MAX_BODY_BYTES: 8 * 1024, // reject oversized payloads before parsing
  QUEUE_TTL_MS: 90_000, // job must be claimed by the worker within this window
  // Sized generously from the old three-model escalation path (CAPTAIN ->
  // NEMO -> REVIEWER), observed to take 60-100s under contention. The
  // current single-shot public path (qwen3:4b, bounded output, no
  // escalation, and refused outright via the capacity gate rather than
  // queued behind private GPU work -- see checkPublicCapacity in
  // worker/ollama.mjs) finishes far under this in practice. Left wide
  // rather than tightened blind -- see docs/PUBLIC_CAPTAIN.md for real
  // measured numbers from the isolation pass.
  PROCESSING_TTL_MS: 110_000,
  RATE_LIMIT_WINDOW_MS: 60_000,
  RATE_LIMIT_MAX_ASK: 6, // /api/ask submissions per IP per window
  RATE_LIMIT_MAX_POLL: 60, // /api/result polls per IP per window (frequent polling is expected)
  DUPLICATE_WINDOW_MS: 10_000, // identical question from same IP within this window reuses the job
  MAX_IN_FLIGHT: 12, // total queued+processing jobs across all clients
  MAX_CONCURRENT_PROCESSING: 1, // worker is single-flight; broker won't hand out more than this at once
  GC_INTERVAL_MS: 15_000,
  // Vercel Queues lease (claim) visibility timeout: comfortably above
  // the worker's own pipeline budget so a legitimate in-progress job
  // doesn't get redelivered to a second claim while still genuinely
  // being worked on. The worker also actively extends this lease
  // periodically while processing (see worker/public-captain.mjs) as
  // additional headroom under real GPU contention. Must be within
  // Vercel Queues' documented bounds (30-3600 seconds).
  CLAIM_VISIBILITY_TIMEOUT_SECONDS: 180,
};

// Fixed enums — any value outside these is rejected, never passed through.
export const CONFIDENCE_LEVELS = ['high', 'medium', 'low'];
// GROQ_PUBLIC is the preferred cloud provider for the public path
// (openai/gpt-oss-20b via Groq), tried before the local PUBLIC
// (qwen3:4b) fallback when enabled. PUBLIC is the local model. Neither
// ever falls back to CAPTAIN/NEMO/REVIEWER, which only ever appear in
// routing telemetry from the dormant heavy pipeline (see
// worker/orchestrate.mjs's answerQuestionHeavy), which normal public
// traffic never reaches.
export const ROUTING_ROLES = ['GROQ_PUBLIC', 'PUBLIC', 'CAPTAIN', 'NEMO', 'REVIEWER'];
export const ROUTING_STATUSES = ['used', 'skipped'];
// 'busy' is a capacity-gate refusal (private/heavy inference active,
// or the gate couldn't confirm the runtime is safely idle) -- an
// honest, terminal, never-cached outcome, distinct from 'error' (the
// pipeline genuinely tried and failed) and 'unresolved' (the pipeline
// ran and honestly found no evidence).
export const RESULT_STATUSES = ['answered', 'unresolved', 'busy', 'error'];

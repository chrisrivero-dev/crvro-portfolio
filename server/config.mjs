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
  // Generous: a complex question can involve three sequential model calls
  // (CAPTAIN -> NEMO -> REVIEWER) on a local GPU that may also be busy
  // with the operator's other work. Observed real runs under contention
  // took 60-100s; this leaves headroom before the frontend gives up.
  PROCESSING_TTL_MS: 110_000,
  RATE_LIMIT_WINDOW_MS: 60_000,
  RATE_LIMIT_MAX_ASK: 6, // /api/ask submissions per IP per window
  RATE_LIMIT_MAX_POLL: 60, // /api/result polls per IP per window (frequent polling is expected)
  DUPLICATE_WINDOW_MS: 10_000, // identical question from same IP within this window reuses the job
  MAX_IN_FLIGHT: 12, // total queued+processing jobs across all clients
  MAX_CONCURRENT_PROCESSING: 1, // worker is single-flight; broker won't hand out more than this at once
  GC_INTERVAL_MS: 15_000,
};

// Fixed enums — any value outside these is rejected, never passed through.
export const CONFIDENCE_LEVELS = ['high', 'medium', 'low'];
export const ROUTING_ROLES = ['CAPTAIN', 'NEMO', 'REVIEWER'];
export const ROUTING_STATUSES = ['used', 'skipped'];
export const RESULT_STATUSES = ['answered', 'unresolved', 'error'];

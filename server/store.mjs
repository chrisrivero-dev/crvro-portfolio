// ============================================================
// Durable-ish job/result store.
//
// Backed by Upstash Redis (via the standard KV_REST_API_URL /
// KV_REST_API_TOKEN env vars the Vercel Marketplace integration
// injects) when those are present. Falls back to an in-memory Map
// when they are not -- so this keeps working exactly as it did
// before Upstash was provisioned, and switching over is a pure env
// var change with no code change.
//
// This is intentionally the ONLY place that knows which backend is
// active; broker.mjs just calls createJob/getJob/updateJob.
// ============================================================

import { Redis } from '@upstash/redis';
import { LIMITS } from './config.mjs';

const hasRedis = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
export const usingRedis = hasRedis;

const redis = hasRedis
  ? new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN })
  : null;

const KEY_PREFIX = 'publiccaptain:job:';
// Generous TTL covering queue wait + processing + a little slack for
// the browser's final poll to see the terminal state.
const TTL_SECONDS = Math.ceil((LIMITS.QUEUE_TTL_MS + LIMITS.PROCESSING_TTL_MS) / 1000) + 60;

// ---- in-memory fallback (local-only, pre-Upstash) ----
const memStore = new Map();
function memGc() {
  const cutoff = Date.now() - TTL_SECONDS * 1000;
  for (const [id, job] of memStore) {
    if (job.createdAt < cutoff) memStore.delete(id);
  }
}
setInterval(memGc, 15_000).unref();

export async function createJob(id, question, extra = {}) {
  const job = { id, question, status: 'queued', createdAt: Date.now(), ...extra };
  if (redis) {
    await redis.set(KEY_PREFIX + id, JSON.stringify(job), { ex: TTL_SECONDS });
  } else {
    memStore.set(id, job);
  }
  return job;
}

export async function getJob(id) {
  if (redis) {
    const raw = await redis.get(KEY_PREFIX + id);
    if (raw == null) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  }
  return memStore.get(id) || null;
}

export async function updateJob(id, patch) {
  const existing = await getJob(id);
  if (!existing) return null;
  const next = { ...existing, ...patch };
  if (redis) {
    await redis.set(KEY_PREFIX + id, JSON.stringify(next), { ex: TTL_SECONDS });
  } else {
    memStore.set(id, next);
  }
  return next;
}

// Best-effort in-flight count -- exact under the in-memory fallback,
// approximate (skipped) under Redis, where a distributed count would
// need a separate counter structure. Documented limitation, not a
// security gap: the per-IP rate limit and Vercel Queues' own limits
// still bound abuse either way.
export function approximateInFlight() {
  if (redis) return null; // unknown -- caller should not gate on this
  let n = 0;
  for (const job of memStore.values()) {
    if (job.status === 'queued' || job.status === 'processing') n += 1;
  }
  return n;
}

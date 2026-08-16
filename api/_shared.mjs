// ============================================================
// Shared plumbing for the Vercel Functions under api/. Not itself a
// route -- api/*.mjs handler files import from here. The actual route
// decisions all live in server/handlers.mjs, shared with local dev
// (server/broker.mjs); this file only adapts Vercel's request/response
// shape to what those handlers expect.
// ============================================================

import { ALLOWED_ORIGINS, LIMITS } from '../server/config.mjs';

export function resolveOrigin(req) {
  const origin = req.headers.origin;
  return ALLOWED_ORIGINS.includes(origin) ? origin : undefined;
}

export function applyCors(req, res) {
  const origin = resolveOrigin(req);
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  return origin;
}

// Vercel sits in front of every Function as a reverse proxy -- unlike a
// self-hosted server, req.socket.remoteAddress here is Vercel's own
// edge, not the visitor. x-forwarded-for is set by that same edge
// layer and reflects the real client, which is exactly the "platform-
// verified header" the local-dev broker's own comments call out as the
// correct approach for a real deployment.
export function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) return xff.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

// Vercel's Node runtime auto-parses a JSON request body into req.body
// when Content-Type is application/json. Handle both that (already an
// object) and the rare case it arrives as a raw string.
export function readJsonBody(req) {
  const raw = req.body;
  if (raw == null || raw === '') return {};
  if (typeof raw === 'object') return raw;
  if (typeof raw === 'string') {
    if (JSON.stringify(raw).length > LIMITS.MAX_BODY_BYTES) {
      throw new Error('payload_too_large');
    }
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error('malformed_json');
    }
  }
  throw new Error('malformed_json');
}

export function sendJson(res, status, body) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  res.send(JSON.stringify(body));
}

export function handleOptions(req, res) {
  const origin = applyCors(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '600');
  res.status(204);
  res.send('');
  return origin;
}

// ============================================================
// Public Captain broker -- local dev entry point.
//
// This file is ONLY the HTTP transport (Node's raw http server, CORS,
// body-size-limited JSON parsing, socket-based IP extraction). Every
// actual route decision lives in server/handlers.mjs, which this file
// shares with the production/preview deployment (api/ask.mjs,
// api/result/[id].mjs, api/worker/submit.mjs) -- there is exactly one
// implementation of the broker's contract, not two.
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
//   POST /api/ask            enqueue a question
//   GET  /api/result/:id     poll job status/result
//
// Worker-only endpoint (requires Authorization: Bearer <secret>):
//   POST /api/worker/submit  worker posts back a validated result
//                             (the worker pulls jobs from Vercel
//                             Queues directly -- there's no
//                             /api/worker/poll to hand jobs out)
//
// The broker never opens a connection to the worker/Mac. It only ever
// receives connections -- from the browser, and from the worker
// posting results back. No inbound port exists on the Mac.
// ============================================================

import http from 'node:http';
import { BROKER_PORT, ALLOWED_ORIGINS, LIMITS } from './config.mjs';
import { handleAsk, handleResult, handleWorkerClaim, handleWorkerExtend, handleWorkerSubmit } from './handlers.mjs';

// Crash handlers log a fixed string only -- never the error object's
// full contents, never req/headers -- so an unexpected crash can't
// become a secret-exposure path via a captured log file.
process.on('uncaughtException', (err) => {
  console.error('[broker] uncaught exception:', err?.message || 'unknown error');
});
process.on('unhandledRejection', (err) => {
  console.error('[broker] unhandled rejection:', err?.message || 'unknown error');
});

function getClientIp(req) {
  // Local dev only trusts the raw socket address -- there is no
  // platform proxy in front of this process to set a verified header.
  // The Vercel Functions in api/ trust x-forwarded-for instead, since
  // that header is set by Vercel's own edge network, not the client.
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

// SECURITY: never log `req.headers` (or the full `req` object) anywhere
// below -- the worker-only endpoint carries the bearer secret in the
// Authorization header. Every log line in this file is deliberately a
// hand-built string of specific fields, never an object dump, so a
// future edit can't accidentally start logging it.
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
    if (req.method === 'POST' && url.pathname === '/api/ask') {
      let body;
      try {
        body = await readJsonBody(req);
      } catch (e) {
        const status = e.message === 'payload_too_large' ? 413 : 400;
        return sendJsonRes(res, status, { error: e.message }, allowOrigin);
      }
      const { status, body: resBody } = await handleAsk({ question: body.question, ip });
      return sendJsonRes(res, status, resBody, allowOrigin);
    }

    if (req.method === 'GET' && url.pathname.startsWith('/api/result/')) {
      const id = url.pathname.slice('/api/result/'.length);
      const { status, body: resBody } = await handleResult({ id, ip });
      return sendJsonRes(res, status, resBody, allowOrigin);
    }

    if (req.method === 'POST' && url.pathname === '/api/worker/claim') {
      const { status, body: resBody } = await handleWorkerClaim({ authHeader: req.headers['authorization'] });
      return sendJsonRes(res, status, resBody);
    }

    if (req.method === 'POST' && url.pathname === '/api/worker/extend') {
      let body;
      try {
        body = await readJsonBody(req);
      } catch (e) {
        return sendJsonRes(res, 400, { error: e.message });
      }
      const { status, body: resBody } = await handleWorkerExtend({ authHeader: req.headers['authorization'], body });
      return sendJsonRes(res, status, resBody);
    }

    if (req.method === 'POST' && url.pathname === '/api/worker/submit') {
      let body;
      try {
        body = await readJsonBody(req);
      } catch (e) {
        return sendJsonRes(res, 400, { error: e.message });
      }
      const { status, body: resBody } = await handleWorkerSubmit({ authHeader: req.headers['authorization'], body });
      return sendJsonRes(res, status, resBody);
    }

    return sendJsonRes(res, 404, { error: 'not_found' }, allowOrigin);
  } catch (err) {
    console.error('[broker] unhandled error:', err?.message || 'unknown error');
    return sendJsonRes(res, 500, { error: 'internal_error' }, allowOrigin);
  }
});

server.listen(BROKER_PORT, () => {
  console.log(`[broker] listening on http://localhost:${BROKER_PORT}`);
});

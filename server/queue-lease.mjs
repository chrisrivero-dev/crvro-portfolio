// ============================================================
// Explicit Vercel Queues lease lifecycle (claim / extend / ack) via
// the documented REST API directly.
//
// Why not the @vercel/queue SDK's high-level `receive()`: it acquires
// a message, calls your handler, and acknowledges automatically when
// the handler returns -- but our handler only VALIDATES and starts a
// job; the actual work (an outbound-only Mac polling this same
// endpoint, running local models, then posting a result back) happens
// completely out of band, on its own schedule, possibly minutes later
// and from a process that crashes and restarts. Auto-ack-on-return
// would acknowledge the message the instant this function returns to
// the worker -- before the answer exists -- which means a crashed
// worker would silently lose the job instead of it being redelivered.
//
// This module claims a message and returns a receipt handle, which
// the caller (server/handlers.mjs) is responsible for holding
// (attached to the job record in server/store.mjs, NEVER handed to
// the worker or the browser) and using to acknowledge only after the
// result is durably persisted to Upstash. If nothing ever acks it,
// the lease naturally expires and Vercel Queues redelivers the
// message -- that's the retry mechanism, not a bug.
//
// getVercelOidcToken() only resolves to a correctly-scoped token when
// this code is actually running inside a Vercel Function invocation
// (it reads the per-request token Vercel injects) -- this module must
// never be imported by worker/ code, which runs off-platform.
// ============================================================

import { getVercelOidcToken } from '@vercel/oidc';

const BASE_PATH = '/api/v3/topic';

function baseUrl(region) {
  return `https://${region}.vercel-queue.com`;
}

function leaseUrl(region, topic, consumerGroup, receiptHandle) {
  return `${baseUrl(region)}${BASE_PATH}/${encodeURIComponent(topic)}/consumer/${encodeURIComponent(consumerGroup)}/lease/${encodeURIComponent(receiptHandle)}`;
}

// Parses the single-message multipart/mixed response body from a claim
// call (we always request Vqs-Max-Messages: 1, so there is at most one
// part). Not a general-purpose MIME parser -- narrow and defensive,
// matching exactly what a claim response looks like.
function parseSingleMultipartMessage(raw, boundary) {
  const delim = `--${boundary}`;
  const parts = raw.split(delim).map((p) => p.trim()).filter((p) => p && p !== '--');
  if (parts.length === 0) return null;
  const part = parts[0];
  const sepIndex = part.search(/\r?\n\r?\n/);
  if (sepIndex === -1) throw new Error('malformed multipart message: no header/body separator');
  const headerBlock = part.slice(0, sepIndex);
  const bodyBlock = part.slice(sepIndex).replace(/^\r?\n\r?\n/, '').trim();

  const headers = {};
  for (const line of headerBlock.split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    headers[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
  }

  const messageId = headers['vqs-message-id'];
  const receiptHandle = headers['vqs-receipt-handle'];
  if (!messageId || !receiptHandle) {
    throw new Error('claim response missing Vqs-Message-Id or Vqs-Receipt-Handle header');
  }
  let payload;
  try {
    payload = JSON.parse(bodyBlock);
  } catch {
    throw new Error('claim response payload was not valid JSON');
  }
  return {
    messageId,
    receiptHandle,
    deliveryCount: Number(headers['vqs-delivery-count'] || '1'),
    payload,
  };
}

// Claims (leases) at most one message. Returns null when the queue is
// empty. Deliberately never sends Vqs-Deployment-Id -- this project
// runs deploymentless (see server/queue.mjs), matching the send side.
export async function claimMessage({ topic, consumerGroup, region, visibilityTimeoutSeconds }) {
  const token = await getVercelOidcToken();
  const url = `${baseUrl(region)}${BASE_PATH}/${encodeURIComponent(topic)}/consumer/${encodeURIComponent(consumerGroup)}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'multipart/mixed',
    'Vqs-Max-Messages': '1',
  };
  if (visibilityTimeoutSeconds) headers['Vqs-Visibility-Timeout-Seconds'] = String(visibilityTimeoutSeconds);

  const res = await fetch(url, { method: 'POST', headers });
  if (res.status === 204) {
    await res.text();
    return null;
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`claim failed: ${res.status} ${text}`);
  }
  const contentType = res.headers.get('content-type') || '';
  const boundaryMatch = contentType.match(/boundary=([^;]+)/);
  if (!boundaryMatch) throw new Error(`claim response missing multipart boundary (content-type: ${contentType})`);
  const raw = await res.text();
  return parseSingleMultipartMessage(raw, boundaryMatch[1].trim());
}

// Acknowledges (permanently removes) a leased message. Call this only
// after the result it represents has been durably persisted.
export async function ackMessage({ topic, consumerGroup, region, receiptHandle }) {
  const token = await getVercelOidcToken();
  const res = await fetch(leaseUrl(region, topic, consumerGroup, receiptHandle), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ack failed: ${res.status} ${text}`);
  }
  await res.text();
}

// Extends the visibility timeout on a message still being processed,
// so a legitimately slow multi-model pipeline doesn't have its lease
// expire (and get redelivered to a second worker) while still
// genuinely in progress.
export async function extendMessage({ topic, consumerGroup, region, receiptHandle, visibilityTimeoutSeconds }) {
  const token = await getVercelOidcToken();
  const res = await fetch(leaseUrl(region, topic, consumerGroup, receiptHandle), {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ visibilityTimeoutSeconds }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`extend failed: ${res.status} ${text}`);
  }
  await res.text();
}

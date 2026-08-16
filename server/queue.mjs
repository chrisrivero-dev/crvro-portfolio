// ============================================================
// Job dispatch via Vercel Queues (poll mode).
//
// SEND: the broker (a Vercel Function -- see api/ask.mjs) puts jobs
// onto a topic via the @vercel/queue SDK, deploymentless
// (`deploymentId: null`) so the off-Vercel worker can read them
// regardless of which specific deployment sent them.
//
// RECEIVE: NOT done here, and deliberately not via the SDK's
// PollingQueueClient either. Vercel Queues authenticates via OIDC
// scoped to the caller's environment (development/preview/production);
// a token obtained locally via `vercel env pull` is always
// development-scoped, so an off-Vercel process can never see messages
// a real Preview/Production deployment sent -- confirmed by direct
// testing (see docs/PUBLIC_CAPTAIN.md). Consuming instead happens
// through api/worker/claim.mjs, api/worker/extend.mjs, and the ack
// step inside handleWorkerSubmit (server/handlers.mjs), all of which
// run AS Vercel Functions and so get a correctly-scoped OIDC token
// automatically, via the explicit lease API in server/queue-lease.mjs.
// The worker (worker/public-captain.mjs) calls those endpoints over
// plain outbound HTTPS -- it never touches Vercel Queues' API or an
// OIDC token directly.
// ============================================================

import { QueueClient } from '@vercel/queue';

export const JOBS_TOPIC = 'public-captain-jobs';
export const WORKER_CONSUMER_GROUP = 'public-captain-worker';
export const QUEUE_REGION = process.env.VERCEL_REGION || process.env.QUEUE_REGION || 'iad1';

let sender = null;
export function getSender() {
  if (!sender) sender = new QueueClient({ region: QUEUE_REGION, deploymentId: null });
  return sender;
}

export async function sendJob(id, question) {
  const client = getSender();
  const { messageId } = await client.send(JOBS_TOPIC, { id, question });
  return messageId;
}

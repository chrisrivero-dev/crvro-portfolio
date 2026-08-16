// ============================================================
// Job dispatch via Vercel Queues (poll mode).
//
// The broker (running as a Vercel function once deployed, a local
// Node process tonight) SENDS jobs onto a topic. The off-Vercel
// Public Captain worker RECEIVES them via PollingQueueClient --
// this is the "outbound-polling architecture" from the brief: the
// worker always initiates the connection to fetch a job, Vercel
// Queues never opens a connection to the worker.
//
// deploymentId is explicitly set to null on every client here: the
// broker will be deployment-pinned automatically once running on
// Vercel, but the worker (which never runs on Vercel) needs to read
// jobs regardless of which deployment sent them, and this local
// testing setup isn't a real deployment either.
// ============================================================

import { QueueClient, PollingQueueClient } from '@vercel/queue';

export const JOBS_TOPIC = 'public-captain-jobs';
export const WORKER_CONSUMER_GROUP = 'public-captain-worker';

const region = process.env.VERCEL_REGION || process.env.QUEUE_REGION || 'iad1';

let sender = null;
export function getSender() {
  if (!sender) sender = new QueueClient({ region, deploymentId: null });
  return sender;
}

let poller = null;
export function getPoller() {
  if (!poller) poller = new PollingQueueClient({ region, deploymentId: null });
  return poller;
}

export async function sendJob(id, question) {
  const client = getSender();
  const { messageId } = await client.send(JOBS_TOPIC, { id, question });
  return messageId;
}

// Receives at most one job, waiting for the handler to complete before
// acknowledging (default @vercel/queue behavior) so a worker crash
// mid-processing redelivers the message rather than losing it.
export async function receiveJob(handler) {
  const client = getPoller();
  return client.receive(JOBS_TOPIC, WORKER_CONSUMER_GROUP, handler, { limit: 1 });
}

#!/usr/bin/env node
// ============================================================
// Public Captain worker.
//
// Runs on this Mac, started manually or supervised by launchd
// (see worker/run-worker.sh and com.crvro.publiccaptain.plist).
// Makes only OUTBOUND connections:
//   - Vercel Queues, poll mode (server/queue.mjs) -- to RECEIVE jobs.
//     The worker initiates every poll; Vercel Queues never opens a
//     connection to this machine.
//   - the broker's /api/worker/submit -- to post results back.
//   - localhost Ollama -- to run the three allowlisted models.
// It never listens on a port and is never reachable from the
// Internet.
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
import { receiveJob } from '../server/queue.mjs';
import { answerQuestion } from './orchestrate.mjs';
import { callOllamaChat } from './ollama.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BROKER_URL = process.env.BROKER_URL || `http://localhost:${BROKER_PORT}`;
const EMPTY_QUEUE_WAIT_MS = 1500;
// Comfortably under the broker's PROCESSING_TTL so a job the worker
// is actively (if slowly) working on doesn't get marked expired out
// from under it -- and short enough that a genuinely stuck pipeline
// still surfaces an error rather than hanging the worker loop.
const PIPELINE_BUDGET_MS = Math.floor(LIMITS.PROCESSING_TTL_MS * 0.8);

function withOverallBudget(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`pipeline exceeded ${ms}ms budget`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

const corpus = JSON.parse(readFileSync(path.join(__dirname, '..', 'server', 'corpus.json'), 'utf8'));
const DESTINATION_ALLOWLIST = new Set(Object.keys(corpus.destinations));
const EVIDENCE_ID_SET = new Set(corpus.entries.map((e) => e.id));

console.log(`[worker] Public Captain starting`);
console.log(`[worker] broker (results only): ${BROKER_URL}`);
console.log(`[worker] jobs source: Vercel Queues (poll mode)`);
console.log(`[worker] corpus: ${corpus.entries.length} entries`);

// Handler for a single received job. Return value becomes the ack'd
// result; throwing causes Vercel Queues to redeliver the message
// (used only for "we couldn't even tell the broker" failures --
// pipeline failures are caught and reported as a graceful error
// result instead, so a slow/contended model doesn't cause the same
// question to be reprocessed and pile on more GPU load).
async function handleJob(job) {
  const { id, question } = job;
  console.log(`[worker] received job ${id}: "${String(question).slice(0, 80)}"`);

  let outcome;
  try {
    const { draft, routing } = await withOverallBudget(
      answerQuestion(question, { corpus, callModel: callOllamaChat }),
      PIPELINE_BUDGET_MS
    );
    outcome = { ...draft, routing };
  } catch (err) {
    console.error(`[worker] pipeline error for ${id}:`, err.message);
    outcome = { status: 'error', answer: '', destinations: [], evidence_ids: [], routing: [], confidence: 'low' };
  }

  const { ok, result, reason } = validateResult(outcome, DESTINATION_ALLOWLIST, EVIDENCE_ID_SET);
  const finalResult = ok
    ? { ...result, routing: outcome.routing || [] }
    : { status: 'error', answer: '', destinations: [], evidence_ids: [], routing: [], confidence: 'low' };
  if (!ok) console.warn(`[worker] own output failed validation (${reason}) -- submitting error instead`);

  const submitRes = await fetch(`${BROKER_URL}/api/worker/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WORKER_SECRET}` },
    body: JSON.stringify({ id, result: finalResult }),
  });
  if (!submitRes.ok) {
    console.warn(`[worker] submit failed for ${id}: ${submitRes.status}`);
    throw new Error(`submit failed with ${submitRes.status}`); // let Queues retry delivery
  }
  console.log(`[worker] answered ${id} (status=${finalResult.status}, confidence=${finalResult.confidence}, routing=${JSON.stringify(finalResult.routing)})`);
  return finalResult;
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
      const result = await receiveJob(handleJob);
      if (!result.ok && result.reason === 'empty') {
        await new Promise((r) => setTimeout(r, EMPTY_QUEUE_WAIT_MS));
      }
      // otherwise a message was processed -- loop immediately to check for more
    } catch (err) {
      console.error('[worker] loop error:', err.message);
      await new Promise((r) => setTimeout(r, EMPTY_QUEUE_WAIT_MS));
    }
  }
}

loop();

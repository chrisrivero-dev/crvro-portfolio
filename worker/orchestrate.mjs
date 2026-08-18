// ============================================================
// The actual decision pipeline. Orchestration is controlled entirely
// by this application code -- models never decide which model runs
// next, never call each other, and never see anything but the fixed
// prompts built here. Every routing entry reflects a call that
// genuinely happened; nothing here is allowed to claim a role ran
// when it did not.
// ============================================================

import { matchQuery } from '../src/data/portfolioNavigator.js';
import { PUBLIC_SYSTEM, CAPTAIN_SYSTEM, NEMO_SYSTEM, REVIEWER_SYSTEM, formatEvidence, formatDestinations } from './prompts.mjs';
import { extractJson } from './ollama.mjs';

// Explicit comparison language is a direct signal a question needs
// real synthesis across projects, regardless of how confident NEMO's
// own single-project answer sounds.
const COMPARISON_RE = /\b(compare|comparison|versus|\bvs\.?\b|difference between|which is better|both .* and)\b/i;

// A draft is "sufficient" to return directly from NEMO alone when it's
// a genuine terminal outcome NEMO itself is confident in. 'unresolved'
// with high confidence is just as sufficient as 'answered' -- an
// honest "no evidence for this" doesn't need a second opinion.
function isSufficient(draft) {
  if (!draft || typeof draft !== 'object') return false;
  if (draft.confidence !== 'high') return false;
  if (draft.status === 'unresolved') return true;
  if (draft.status === 'answered') return Array.isArray(draft.evidence_ids) && draft.evidence_ids.length > 0;
  return false;
}

// Signals that a question needs Captain's deeper synthesis even if
// NEMO happened to answer with high confidence: explicit comparison
// language, or evidence drawn from several distinct projects (NEMO
// tends to ground itself in just one and miss the fuller picture).
function needsDeeperSynthesis(question, evidence) {
  if (COMPARISON_RE.test(question)) return true;
  const distinctProjects = new Set(evidence.slice(0, 5).map((e) => e.slug).filter(Boolean));
  return distinctProjects.size >= 3;
}

// Lightweight lexical retrieval over the (small, ~50-entry) corpus --
// no embeddings needed at this scale. Scores by shared-token overlap
// with a small bonus for tag/slug matches.
export function retrieveEvidence(question, entries, topN = 8) {
  const qTokens = new Set(
    question
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2)
  );
  if (qTokens.size === 0) return entries.slice(0, topN);

  const scored = entries.map((e) => {
    const textTokens = e.text.toLowerCase().split(/\s+/);
    let score = 0;
    for (const t of textTokens) if (qTokens.has(t)) score += 1;
    for (const tag of e.tags || []) if (qTokens.has(String(tag).toLowerCase())) score += 2;
    return { e, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score > 0).slice(0, topN);
  // If nothing scored (very short/odd question), fall back to a broad
  // sample rather than nothing -- Captain can still say "unresolved."
  return (top.length ? top : scored.slice(0, topN)).map((s) => s.e);
}

function tryDeterministic(question, destinationsMeta) {
  const m = matchQuery(question);
  if (m.kind === 'unknown') return null;
  if (m.kind === 'single') {
    const r = m.results[0];
    return {
      status: 'answered',
      answer: `${m.lines.join(' ')} ${r.cta || ''}`.trim(),
      destinations: [r.key],
      evidence_ids: [],
      confidence: 'high',
    };
  }
  // multi
  const names = m.results.map((r) => r.label).join(' and ');
  return {
    status: 'answered',
    answer: `${m.lines.join(' ')} Relevant work: ${names}.`,
    destinations: m.results.map((r) => r.key),
    evidence_ids: [],
    confidence: 'high',
  };
}

function buildPrimaryPrompt(question, evidence, destinationsMeta) {
  return [
    `VISITOR QUESTION:\n${question}`,
    `EVIDENCE:\n${formatEvidence(evidence)}`,
    `DESTINATIONS:\n${formatDestinations(destinationsMeta)}`,
  ].join('\n\n');
}

function buildEscalationPrompt(question, nemoDraft, evidence, destinationsMeta) {
  return [
    `VISITOR QUESTION:\n${question}`,
    nemoDraft ? `NEMO'S EARLIER ATTEMPT (for context only -- verify against evidence, do not defer to it if wrong):\n${JSON.stringify(nemoDraft)}` : 'NEMO did not produce a usable draft.',
    `EVIDENCE:\n${formatEvidence(evidence)}`,
    `DESTINATIONS:\n${formatDestinations(destinationsMeta)}`,
  ].join('\n\n');
}

function buildReviewPrompt(question, draft, evidence) {
  return [
    `VISITOR QUESTION:\n${question}`,
    `DRAFT ANSWER:\n${draft.answer}`,
    `DRAFT claims evidence_ids: ${JSON.stringify(draft.evidence_ids || [])}`,
    `ACTUAL EVIDENCE AVAILABLE:\n${formatEvidence(evidence)}`,
  ].join('\n\n');
}

// Normal public path: deterministic fast path first (free, no model
// call), then Groq (openai/gpt-oss-20b, cloud, fast) if enabled, and
// only on Groq failure/unavailability/rate-limit does this fall back
// to the local qwen3:4b model -- never to CAPTAIN/NEMO/REVIEWER, and
// the local fallback is itself still capacity-gated exactly as before.
// Gates, checked in order:
//   1. `inferenceEnabled` -- a containment kill-switch, off by default
//      (see isPublicInferenceEnabled in ollama.mjs). While off, this
//      never calls Groq, checkCapacity, or Ollama at all -- it's the
//      lever for "the public model path(s) exist in code but aren't
//      approved to run live yet," independent of provider or GPU
//      state. Gates BOTH providers, not just the local one.
//   2. `groqEnabled` -- whether Groq is tried at all (see
//      isGroqPrimaryEnabled in groq.mjs). Off by default until the
//      side-by-side benchmark is reviewed and approved; with it off,
//      behavior is identical to the local-only path this replaced.
//   3. `checkCapacity` -- the local GPU contention gate, only reached
//      if Groq was skipped, disabled, or failed: even with inference
//      enabled, a visitor never competes with Christopher's own
//      private Captain/Hermes workload on the same GPU.
// Any gate/failure that lands on 'busy' looks identical to the
// frontend -- "local intelligence busy, cached answers still
// available." `callModel`, `callGroq`, and `checkCapacity` are all
// injected so this pipeline is testable without the network, and so
// production code (worker/public-captain.mjs) is the only place any
// real call happens.
export async function answerQuestion(question, { corpus, callModel, callGroq, checkCapacity, inferenceEnabled = true, groqEnabled = false, signal }) {
  const routing = [];

  const deterministic = tryDeterministic(question, corpus.destinations);
  if (deterministic) {
    return { draft: deterministic, routing, evidenceUsed: [] };
  }

  if (!inferenceEnabled) {
    routing.push({ role: groqEnabled && callGroq ? 'GROQ_PUBLIC' : 'PUBLIC', status: 'skipped' });
    const draft = { status: 'busy', answer: '', destinations: [], evidence_ids: [], confidence: 'low' };
    return { draft: { ...draft, routing }, routing, evidenceUsed: [] };
  }

  const evidence = retrieveEvidence(question, corpus.entries, 8);
  const promptUser = buildPrimaryPrompt(question, evidence, corpus.destinations);
  let draft = null;

  // ---- Groq first, if enabled ----
  if (groqEnabled && callGroq) {
    routing.push({ role: 'GROQ_PUBLIC', status: 'used' });
    try {
      const raw = await callGroq({ system: PUBLIC_SYSTEM, user: promptUser, signal });
      const parsed = extractJson(raw.text);
      if (!parsed || typeof parsed !== 'object') throw new Error('groq returned unparseable output');
      draft = parsed;
    } catch {
      routing[routing.length - 1].status = 'skipped';
      draft = null;
    }
  }

  // ---- Local qwen3:4b fallback, only if Groq didn't produce a usable
  // draft (disabled, unconfigured, errored, rate-limited, or returned
  // something that didn't parse) -- and only if the local GPU is
  // actually safe to use. ----
  if (!draft) {
    const capacity = checkCapacity ? await checkCapacity() : { safe: true };
    if (!capacity.safe) {
      routing.push({ role: 'PUBLIC', status: 'skipped' });
      const busyDraft = { status: 'busy', answer: '', destinations: [], evidence_ids: [], confidence: 'low' };
      return { draft: { ...busyDraft, routing }, routing, evidenceUsed: [] };
    }
    routing.push({ role: 'PUBLIC', status: 'used' });
    try {
      const raw = await callModel({ system: PUBLIC_SYSTEM, user: promptUser, signal });
      draft = extractJson(raw.text);
    } catch {
      routing[routing.length - 1].status = 'skipped';
      draft = null;
    }
  }

  // No usable output from either provider -- a genuine failure, not a
  // legitimate "no evidence for this" answer. Must be 'error', never
  // 'unresolved': 'unresolved' is a safe, cacheable terminal outcome
  // (see server/handlers.mjs), and a blank answer cached under that
  // status would be served to every future visitor asking the same
  // question until the corpus changes.
  if (!draft || typeof draft !== 'object') {
    draft = { status: 'error', answer: '', destinations: [], evidence_ids: [], confidence: 'low' };
  }

  return { draft: { ...draft, routing }, routing, evidenceUsed: evidence.map((e) => e.id) };
}

// ============================================================
// Dormant heavy pipeline -- NEMO/CAPTAIN/REVIEWER, the private/heavy
// model fleet. NOT called by the normal public path above (see
// worker/public-captain.mjs, which only ever calls answerQuestion).
// Kept as a separate, clearly-isolated function rather than deleted so
// it still works if Christopher ever wants to re-enable it as an
// explicitly separate, separately-rate-limited demo path -- see item 7
// of the isolation pass in docs/PUBLIC_CAPTAIN.md. Nothing in the
// current routing (frontend, broker, worker loop) ever invokes this.
// ============================================================

// Tiered routing: NEMO answers ordinary questions directly (Tier 1).
// Captain is only invoked when NEMO's own result isn't good enough on
// its own, or the question structurally needs cross-project synthesis
// (Tier 2). Reviewer only double-checks Captain's harder-case answers,
// never NEMO's ordinary ones (Tier 3) -- see docs/PUBLIC_CAPTAIN.md
// for the full rationale. `callModel` is injected so this pipeline is
// testable without the network, and so production code is the only
// place a real Ollama call happens.
export async function answerQuestionHeavy(question, { corpus, callModel, signal }) {
  const routing = [];

  const deterministic = tryDeterministic(question, corpus.destinations);
  if (deterministic) {
    return { draft: deterministic, routing, evidenceUsed: [] };
  }

  const evidence = retrieveEvidence(question, corpus.entries, 8);

  // ---- Tier 1: NEMO, the default first responder ----
  routing.push({ role: 'NEMO', status: 'used' });
  let draft = null;
  try {
    const raw = await callModel({
      model: 'nemotron-lightning:30b-a3b-q4',
      system: NEMO_SYSTEM,
      user: buildPrimaryPrompt(question, evidence, corpus.destinations),
      signal,
    });
    draft = extractJson(raw.text);
  } catch {
    routing[routing.length - 1].status = 'skipped';
    draft = null;
  }

  const escalate = !isSufficient(draft) || needsDeeperSynthesis(question, evidence);

  // ---- Tier 2: Captain, only for the harder cases ----
  if (escalate) {
    routing.push({ role: 'CAPTAIN', status: 'used' });
    try {
      const raw = await callModel({
        model: 'qwen3.8:27b',
        system: CAPTAIN_SYSTEM,
        user: buildEscalationPrompt(question, draft, evidence, corpus.destinations),
        signal,
      });
      const captainDraft = extractJson(raw.text);
      if (captainDraft && typeof captainDraft === 'object') draft = captainDraft;
    } catch {
      // Keep NEMO's draft (even if it wasn't "sufficient") rather than
      // nothing -- but the routing telemetry must not claim Captain
      // ran when it never produced anything.
      routing[routing.length - 1].status = 'skipped';
    }
  } else {
    routing.push({ role: 'CAPTAIN', status: 'skipped' });
  }

  // No model ever produced usable output (NEMO failed and either
  // escalation wasn't warranted or Captain also failed) -- this is a
  // genuine failure, not a legitimate "no evidence for this" answer.
  // Must be 'error', never 'unresolved': 'unresolved' is treated as a
  // safe, cacheable terminal outcome (see server/handlers.mjs), and a
  // blank answer cached under that status would be served to every
  // future visitor asking the same question until the corpus changes.
  if (!draft || typeof draft !== 'object') {
    draft = { status: 'error', answer: '', destinations: [], evidence_ids: [], confidence: 'low' };
  }

  // ---- Tier 3: Reviewer, only for Captain's escalated answers ----
  // Ordinary NEMO-only answers are never automatically reviewed --
  // that's the entire point of tiering this way.
  const warrantsReview = escalate && draft.status === 'answered' && Array.isArray(draft.evidence_ids) && draft.evidence_ids.length > 0;
  if (warrantsReview) {
    routing.push({ role: 'REVIEWER', status: 'used' });
    try {
      const raw = await callModel({
        model: 'qwen3-coder:30b',
        system: REVIEWER_SYSTEM,
        user: buildReviewPrompt(question, draft, evidence),
        signal,
      });
      const review = extractJson(raw.text);
      if (review && typeof review === 'object') {
        if (review.grounded === false) {
          draft.confidence = 'low';
        }
        if (Array.isArray(review.supported_evidence_ids)) {
          draft.evidence_ids = (draft.evidence_ids || []).filter((id) => review.supported_evidence_ids.includes(id));
        }
      }
    } catch {
      // Reviewer being unavailable does not block returning the draft;
      // it simply means the review role is reported as skipped-by-failure
      // rather than falsely claimed as used.
      routing[routing.length - 1].status = 'skipped';
    }
  } else {
    routing.push({ role: 'REVIEWER', status: 'skipped' });
  }

  return { draft: { ...draft, routing }, routing, evidenceUsed: evidence.map((e) => e.id) };
}

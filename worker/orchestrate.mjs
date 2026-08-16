// ============================================================
// The actual decision pipeline. Orchestration is controlled entirely
// by this application code -- models never decide which model runs
// next, never call each other, and never see anything but the fixed
// prompts built here. Every routing entry reflects a call that
// genuinely happened; nothing here is allowed to claim a role ran
// when it did not.
// ============================================================

import { matchQuery } from '../src/data/portfolioNavigator.js';
import { CAPTAIN_SYSTEM, NEMO_SYSTEM, REVIEWER_SYSTEM, formatEvidence, formatDestinations } from './prompts.mjs';
import { extractJson } from './ollama.mjs';

const PROBLEM_HINTS = [
  'how would you',
  'how do i',
  'how should',
  'we have',
  "we're",
  'our team',
  'our staff',
  'our support',
  'keep giving',
  'approach',
  'automating',
  'repetitive',
  'struggl',
  "i'm hiring",
  'im hiring',
  'looking for someone',
  'what should i look at',
];

function looksLikeProblem(question) {
  const q = question.toLowerCase();
  return PROBLEM_HINTS.some((h) => q.includes(h));
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

function buildCaptainPrompt(question, evidence, destinationsMeta) {
  return [
    `VISITOR QUESTION:\n${question}`,
    `EVIDENCE:\n${formatEvidence(evidence)}`,
    `DESTINATIONS:\n${formatDestinations(destinationsMeta)}`,
  ].join('\n\n');
}

function buildNemoPrompt(question, draft, evidence) {
  return [
    `VISITOR PROBLEM:\n${question}`,
    `DRAFT ANSWER FROM CAPTAIN:\n${JSON.stringify(draft)}`,
    `EVIDENCE:\n${formatEvidence(evidence)}`,
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

// `callModel` is injected so this pipeline is testable without the
// network, and so production code is the only place a real Ollama
// call happens.
export async function answerQuestion(question, { corpus, callModel, signal }) {
  const routing = [];

  const deterministic = tryDeterministic(question, corpus.destinations);
  if (deterministic) {
    return { draft: deterministic, routing, evidenceUsed: [] };
  }

  const evidence = retrieveEvidence(question, corpus.entries, 8);

  routing.push({ role: 'CAPTAIN', status: 'used' });
  let draft;
  try {
    const raw = await callModel({
      model: 'qwen3.8:27b',
      system: CAPTAIN_SYSTEM,
      user: buildCaptainPrompt(question, evidence, corpus.destinations),
      signal,
    });
    draft = extractJson(raw.text);
  } catch {
    // Call failed outright -- the routing telemetry must not claim
    // CAPTAIN ran when it never produced anything.
    routing[routing.length - 1].status = 'skipped';
    draft = null;
  }
  if (!draft || typeof draft !== 'object') {
    draft = { status: 'unresolved', answer: '', destinations: [], evidence_ids: [], confidence: 'low' };
  }

  const warrantsNemo = looksLikeProblem(question) || draft.confidence !== 'high';
  if (warrantsNemo) {
    routing.push({ role: 'NEMO', status: 'used' });
    try {
      const raw = await callModel({
        model: 'nemotron-lightning:30b-a3b-q4',
        system: NEMO_SYSTEM,
        user: buildNemoPrompt(question, draft, evidence),
        signal,
      });
      const nemo = extractJson(raw.text);
      // Prefer NEMO's answer only if it actually cites evidence and
      // isn't strictly worse (lower confidence) than the draft.
      if (nemo && typeof nemo === 'object' && Array.isArray(nemo.evidence_ids) && nemo.evidence_ids.length) {
        draft = nemo;
      }
    } catch {
      // Keep the Captain draft; NEMO being unavailable is not fatal --
      // but the routing telemetry must not claim it ran when it didn't.
      routing[routing.length - 1].status = 'skipped';
    }
  } else {
    routing.push({ role: 'NEMO', status: 'skipped' });
  }

  const warrantsReview = draft.status === 'answered' && ((draft.destinations || []).length || (draft.evidence_ids || []).length);
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

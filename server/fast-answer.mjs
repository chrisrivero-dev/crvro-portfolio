// ============================================================
// Fast public answer path: one hosted-model call (Groq), run inside
// the /api/ask request itself, bounded by a hard deadline. This is
// the normal path for open-ended public questions; the local multi-
// model worker and the queue are not involved.
//
// Same trust model as the worker path: the model gets no tools, only
// the retrieved corpus evidence, and its JSON is rebuilt by
// validateResult (destination + evidence-id allowlists) before
// anything is returned. An answer that cites no real evidence is
// never presented as an answer.
// ============================================================

import { retrieveEvidence } from '../worker/orchestrate.mjs';
import { NEMO_SYSTEM, formatEvidence, formatDestinations } from '../worker/prompts.mjs';
import { extractJson } from '../worker/ollama.mjs';
import { matchQuery } from '../src/data/portfolioNavigator.js';
import { validateResult } from './validate.mjs';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Tried in order; a model the account cannot use (404/400) moves on to the next within the same deadline.
const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'openai/gpt-oss-20b'];
export const GROQ_TIMEOUT_MS = 5_500; // leaves headroom under the 7s end-to-end deadline for retrieval, validation and cache I/O

const on = (v) => /^(1|true|yes|on)$/i.test(String(v || '').trim());

export function fastPathEnabled(env = process.env) {
  return Boolean(env.GROQ_API_KEY) && on(env.PUBLIC_CAPTAIN_INFERENCE_ENABLED) && on(env.PUBLIC_CAPTAIN_GROQ_ENABLED);
}

// Honest, useful, never cached: shown when no reliable answer could be produced in time.
export const FALLBACK = {
  status: 'unresolved',
  answer:
    'I could not produce a reliable answer to that in time, and I would rather not guess. Try one of the suggested questions, or open the work page to see the projects directly.',
  destinations: ['work', 'about', 'contact'],
  evidence_ids: [],
  confidence: 'low',
};

// A comparison needs synthesis across projects; a single-project keyword match would answer the wrong question.
export const COMPARISON_RE = /\b(compare|comparison|versus|vs\.?|difference between|which is better|both .* and)\b/i;

function deterministic(question) {
  if (COMPARISON_RE.test(question)) return null;
  const m = matchQuery(question);
  if (m.kind === 'unknown') return null;
  if (m.kind === 'single') {
    const r = m.results[0];
    return { status: 'answered', answer: `${m.lines.join(' ')} ${r.cta || ''}`.trim(), destinations: [r.key], evidence_ids: [], confidence: 'high' };
  }
  const names = m.results.map((r) => r.label).join(' and ');
  return { status: 'answered', answer: `${m.lines.join(' ')} Relevant work: ${names}.`, destinations: m.results.map((r) => r.key), evidence_ids: [], confidence: 'high' };
}

// Keyword retrieval alone misses projects the visitor names outright ("Zarvin One" vs slug zarvin-one),
// which breaks comparisons. Entries of any project named in the question go in first.
export function gatherEvidence(question, entries) {
  const q = question.toLowerCase().replace(/[^a-z0-9]+/g, ' ');
  const slugs = [...new Set(entries.map((e) => e.slug).filter(Boolean))].filter((slug) => q.includes(slug.replace(/-/g, ' ')));
  const named = slugs.slice(0, 4).flatMap((slug) => entries.filter((e) => e.slug === slug).slice(0, 3));
  const byId = new Map();
  for (const e of [...named, ...retrieveEvidence(question, entries, 10)]) byId.set(e.id, e);
  return [...byId.values()].slice(0, 14);
}

async function callGroqModel(model, { system, user, signal }) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      // gpt-oss models reason before answering; give them room and keep the reasoning short so the JSON is not cut off.
      ...(model.includes('gpt-oss') ? { max_tokens: 1200, reasoning_effort: 'low' } : { max_tokens: 420 }),
      response_format: { type: 'json_object' },
      // No `tools` field, on purpose: the model can only return text.
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
    signal,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(`groq http ${res.status} ${model} ${body?.error?.code || ''}`.trim());
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

async function callGroq(args) {
  const failures = [];
  for (const model of GROQ_MODELS) {
    try {
      return await callGroqModel(model, args);
    } catch (err) {
      failures.push(err.message);
      if (args.signal.aborted || ![400, 404].includes(err.status)) throw err;
    }
  }
  throw new Error(failures.join('; '));
}

/**
 * Returns { result, cacheable, reason, ms }. `result` is always a validated, safe result object
 * (a real answer, an honest "unresolved", or the fallback). Never throws.
 */
export async function answerFast(question, { corpus, destinationAllowlist, evidenceIdSet, call = callGroq }) {
  const started = Date.now();
  const done = (result, cacheable, reason) => ({ result, cacheable, reason, ms: Date.now() - started });

  const det = deterministic(question);
  if (det) {
    const v = validateResult(det, destinationAllowlist, evidenceIdSet);
    if (v.ok) return done(v.result, false, 'deterministic');
  }
  if (!fastPathEnabled()) return done(FALLBACK, false, 'fast_path_disabled');

  const evidence = gatherEvidence(question, corpus.entries);
  const user = [
    `VISITOR QUESTION:\n${question}`,
    `EVIDENCE:\n${formatEvidence(evidence)}`,
    `DESTINATIONS:\n${formatDestinations(corpus.destinations)}`,
  ].join('\n\n');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);
  try {
    const text = await call({ system: NEMO_SYSTEM, user, signal: controller.signal });
    const draft = extractJson(text);
    if (!draft || typeof draft !== 'object') return done(FALLBACK, false, 'unparseable');
    const v = validateResult(draft, destinationAllowlist, evidenceIdSet);
    if (!v.ok || v.result.status === 'error') return done(FALLBACK, false, `invalid_${v.reason || 'status'}`);
    // Must cite evidence that really exists, and only evidence we retrieved for this question.
    const shown = new Set(evidence.map((e) => e.id));
    v.result.evidence_ids = v.result.evidence_ids.filter((id) => shown.has(id));
    if (v.result.status === 'answered' && v.result.evidence_ids.length === 0) return done(FALLBACK, false, 'ungrounded');
    // Only grounded answers are cached; an "unresolved" may just mean retrieval missed, so it is re-asked each time.
    return done(v.result, v.result.status === 'answered', 'groq');
  } catch (err) {
    return done(FALLBACK, false, controller.signal.aborted ? 'timeout' : String(err.message).slice(0, 60));
  } finally {
    clearTimeout(timer);
  }
}

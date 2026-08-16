// ============================================================
// Shared, dependency-free validation/sanitization helpers.
// Used by both the broker (defense in depth on worker submissions)
// and the worker (primary validation of model output). Nothing here
// trusts its caller -- every function re-checks its own invariants.
// ============================================================

import { LIMITS, CONFIDENCE_LEVELS, ROUTING_ROLES, ROUTING_STATUSES, RESULT_STATUSES } from './config.mjs';

// ASCII control chars, plus Unicode bidi/formatting characters
// (U+200E/F, U+202A-E, U+2066-9) that could otherwise be used to
// visually spoof the rendered answer text without tripping any
// HTML-based filter.
const CONTROL_CHARS_RE = new RegExp(
  '[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F\\u200E\\u200F\\u202A-\\u202E\\u2066-\\u2069]',
  'g'
);

// Strips HTML tags, angle brackets, and dangerous URL schemes from
// plain text. The answer field is always rendered as text content in
// the browser (never innerHTML), so this is defense in depth, not
// the only line of defense.
export function sanitizePlainText(input, maxLen) {
  if (typeof input !== 'string') return '';
  let s = input
    .replace(/<[^>]*>/g, ' ') // strip tags
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(CONTROL_CHARS_RE, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (maxLen && s.length > maxLen) s = s.slice(0, maxLen).trim() + '...';
  return s;
}

export function isValidQuestion(q) {
  return (
    typeof q === 'string' &&
    q.trim().length > 0 &&
    q.length <= LIMITS.MAX_QUESTION_LEN &&
    // Reject anything that isn't ordinary text -- no embedded control
    // characters, no null bytes.
    !CONTROL_CHARS_RE.test(q)
  );
}

// Validates and rebuilds a worker result into a known-safe shape.
// `destinationAllowlist` is a Set of valid destination keys loaded
// from the corpus, `evidenceIdSet` is a Set of real evidence IDs.
// Returns { ok: true, result } or { ok: false, reason }.
export function validateResult(raw, destinationAllowlist, evidenceIdSet) {
  if (!raw || typeof raw !== 'object') return { ok: false, reason: 'not_an_object' };

  const status = RESULT_STATUSES.includes(raw.status) ? raw.status : null;
  if (!status) return { ok: false, reason: 'bad_status' };

  const answer = sanitizePlainText(raw.answer, LIMITS.MAX_ANSWER_LEN);
  if (status === 'answered' && !answer) return { ok: false, reason: 'empty_answer' };

  const destinations = Array.isArray(raw.destinations)
    ? [...new Set(raw.destinations.filter((d) => typeof d === 'string' && destinationAllowlist.has(d)))].slice(0, 3)
    : [];

  const evidence_ids = Array.isArray(raw.evidence_ids)
    ? [...new Set(raw.evidence_ids.filter((e) => typeof e === 'string' && evidenceIdSet.has(e)))].slice(0, 8)
    : [];

  const routingIn = Array.isArray(raw.routing) ? raw.routing : [];
  const routing = routingIn
    .filter(
      (r) =>
        r &&
        typeof r === 'object' &&
        ROUTING_ROLES.includes(r.role) &&
        ROUTING_STATUSES.includes(r.status)
    )
    .map((r) => ({ role: r.role, status: r.status }))
    .slice(0, ROUTING_ROLES.length);

  const confidence = CONFIDENCE_LEVELS.includes(raw.confidence) ? raw.confidence : 'low';

  // If the model claimed evidence IDs that don't exist in the real
  // corpus, that's a grounding failure -- downgrade rather than trust it.
  const claimedEvidence = Array.isArray(raw.evidence_ids) ? raw.evidence_ids.length : 0;
  const confidenceFinal = claimedEvidence > 0 && evidence_ids.length === 0 ? 'low' : confidence;

  return {
    ok: true,
    result: { status, answer, destinations, evidence_ids, routing, confidence: confidenceFinal },
  };
}

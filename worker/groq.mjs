// ============================================================
// Groq client -- the preferred fast cloud provider for the public
// portfolio Q&A path. Server-side only: this file runs in the worker
// process on this Mac, never in the browser bundle. GROQ_API_KEY is
// read once from process.env and only ever placed in an outbound
// Authorization header to Groq's own fixed API host -- it is never
// logged, never returned in any response body, and this file exports
// no function that could leak it.
//
// Deliberately narrow, same shape as worker/ollama.mjs's
// callPublicModel: no `tools`/`tool_choice` field is ever sent, no
// caller can pass one in, and the model has no browser/search/
// code-execution/URL-fetching capability -- not disabled, nonexistent.
// ============================================================

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = 'openai/gpt-oss-20b';

// Latency-sensitive portfolio Q&A surface -- start low, escalate only
// if a benchmark proves low effort hurts answer quality (see
// docs/PUBLIC_CAPTAIN.md for the actual benchmark results).
const GROQ_REASONING_EFFORT = process.env.GROQ_REASONING_EFFORT || 'low';
const GROQ_TIMEOUT_MS = Number(process.env.GROQ_TIMEOUT_MS || 15_000);

export function isGroqConfigured() {
  return Boolean(process.env.GROQ_API_KEY);
}

// Separate from isGroqConfigured(): the key being present is not the
// same as Groq being *approved* as the default public provider. Off
// by default -- not set in worker/.env.worker or the launchd plist as
// of this change -- so the live production worker keeps using its
// existing (already-approved) routing until this is explicitly
// flipped on, the same containment pattern as
// isPublicInferenceEnabled() in ollama.mjs. Flip it on (env var, not a
// code change) only once the side-by-side benchmark in
// docs/PUBLIC_CAPTAIN.md has been reviewed and approved.
export function isGroqPrimaryEnabled() {
  return process.env.PUBLIC_CAPTAIN_GROQ_ENABLED === 'true';
}

// The application, not the model, owns validation and destination-to-
// URL mapping (see server/validate.mjs) -- this schema only shapes the
// model's raw JSON output so it parses reliably; it is not trusted as
// the security boundary on its own.
const RESULT_JSON_SCHEMA = {
  name: 'public_captain_result',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['answered', 'unresolved'] },
      answer: { type: 'string' },
      destinations: { type: 'array', items: { type: 'string' } },
      evidence_ids: { type: 'array', items: { type: 'string' } },
      confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    },
    required: ['status', 'answer', 'destinations', 'evidence_ids', 'confidence'],
    additionalProperties: false,
  },
};

// Public-only entry point, matching callPublicModel's shape in
// ollama.mjs so orchestrate.mjs can treat both providers
// interchangeably. Throws on any failure (bad key, network error,
// rate limit, non-200, timeout) -- callers fall back to the local
// qwen3:4b path on any thrown error, never to the private fleet.
export async function callGroqPublic({ system, user, timeoutMs = GROQ_TIMEOUT_MS, signal }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('groq not configured (GROQ_API_KEY unset)');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onExternalAbort, { once: true });
  }

  const started = Date.now();
  try {
    const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        reasoning_effort: GROQ_REASONING_EFFORT,
        temperature: 0.2,
        response_format: { type: 'json_schema', json_schema: RESULT_JSON_SCHEMA },
        // NOTE: no `tools` / `tool_choice` field. This is intentional
        // and load-bearing -- do not add one. No browser search, no
        // code execution, no function calling, no URL access.
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      // Never include response headers/body verbatim in the thrown
      // error beyond a short prefix -- avoids ever accidentally
      // logging something key-shaped from an error payload.
      const bodyText = await res.text().catch(() => '');
      throw new Error(`groq http ${res.status}: ${bodyText.slice(0, 200)}`);
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? '';
    const usage = data?.usage
      ? {
          prompt_tokens: data.usage.prompt_tokens,
          completion_tokens: data.usage.completion_tokens,
          total_tokens: data.usage.total_tokens,
          reasoning_tokens: data.usage.completion_tokens_details?.reasoning_tokens ?? null,
        }
      : null;
    return { text, ms: Date.now() - started, usage };
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onExternalAbort);
  }
}

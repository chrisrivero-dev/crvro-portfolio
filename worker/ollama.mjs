// ============================================================
// Minimal local Ollama client. The ONLY thing this module can do is
// send a chat request to http://localhost:11434 and return text.
//
// Deliberately narrow: no `tools`/`functions` field is ever sent, no
// caller can pass one in, and there is no other function exported
// from this file. The model literally has no tool-calling surface --
// not a disabled one, a nonexistent one.
// ============================================================

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

// The one model normal public traffic is ever allowed to call. Kept as
// its own constant (not just an allowlist entry) so callPublicModel()
// below can hardcode it -- there is no parameter that lets a caller
// select a different model for the public path.
export const PUBLIC_MODEL = 'qwen3:4b';

// The heavy/private fleet -- reserved for Christopher's own interactive
// Captain/Hermes work. Still allowlisted here so the dormant heavy
// pipeline (worker/orchestrate.mjs's answerQuestionHeavy, not wired
// into normal public traffic -- see docs/PUBLIC_CAPTAIN.md) continues
// to work if it's ever deliberately re-enabled, but callPublicModel()
// never reaches these.
const PRIVATE_MODELS = new Set(['qwen3.8:27b', 'nemotron-lightning:30b-a3b-q4', 'qwen3-coder:30b']);

// Fixed allowlist -- only these models can ever be called via
// callOllamaChat, no matter what a caller passes in.
const ALLOWED_MODELS = new Set([PUBLIC_MODEL, ...PRIVATE_MODELS]);

// Containment kill-switch for the public inference path -- separate
// from, and checked before, the capacity gate. Defaults to DISABLED:
// unless PUBLIC_CAPTAIN_INFERENCE_ENABLED=true is explicitly set in
// the worker's environment, answerQuestion() never calls Ollama at
// all for the public path (see worker/orchestrate.mjs), regardless of
// GPU state. The deterministic fast path is entirely unaffected --
// this only gates the fall-through-to-a-model case.
//
// This is deliberately NOT set in worker/.env.worker or the launchd
// plist as of this change, so the live production worker fails closed
// (deterministic fast path + "busy" for everything else) the moment
// it's restarted onto this code, with zero risk of it quietly running
// live, not-yet-quality-tested qwen3:4b inference for real visitors.
// Flip it on explicitly (env var, not a code change) only once the
// public qwen3:4b path has been separately approved for production.
export function isPublicInferenceEnabled() {
  return process.env.PUBLIC_CAPTAIN_INFERENCE_ENABLED === 'true';
}

export async function callOllamaChat({ model, system, user, timeoutMs = 45_000, temperature = 0.2, signal, think, numCtx, numPredict }) {
  if (!ALLOWED_MODELS.has(model)) {
    throw new Error(`model not allowlisted: ${model}`);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  // An external signal (the worker's overall pipeline budget) aborts this
  // call immediately too -- without this, a call already in flight when
  // the pipeline gives up keeps running on the GPU regardless, starving
  // whatever job the worker picks up next.
  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onExternalAbort, { once: true });
  }
  const started = Date.now();
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        stream: false,
        options: {
          temperature,
          ...(numCtx ? { num_ctx: numCtx } : {}),
          ...(numPredict ? { num_predict: numPredict } : {}),
        },
        // Hybrid-reasoning models (the Qwen3 family) support an explicit
        // think toggle; omitted entirely for models that ignore it.
        ...(typeof think === 'boolean' ? { think } : {}),
        // NOTE: no `tools` field. This is intentional and load-bearing --
        // do not add one.
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`ollama http ${res.status}`);
    const data = await res.json();
    const text = data?.message?.content ?? '';
    return { text, ms: Date.now() - started };
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onExternalAbort);
  }
}

// Public-only entry point. Unlike callOllamaChat (which accepts any
// allowlisted model and is the injection point the dormant heavy
// pipeline uses), this function takes no `model` parameter at all --
// there is no argument a caller could pass to reach a private/heavy
// model through this path. This is what worker/orchestrate.mjs's
// normal public answerQuestion() calls.
//
// think:false, tested for real against this exact Ollama build
// (0.32.13) and this exact qwen3:4b tag, turned out to be broken --
// not "disabled," but silently the WORST option: the model still
// generates its full chain-of-thought either way, but with
// think:false that reasoning gets dumped directly into `content` with
// no closing tag, corrupting the JSON contract entirely (0 usable
// output across 3 of 5 real test questions). think:true and simply
// omitting the field both behave identically -- clean separation into
// a discardable `message.thinking` field with pure JSON left in
// `content` -- so `think` is left unset here rather than forced false,
// contradicting the original "think: false" instruction on the
// strength of this direct evidence, not a guess. Recorded in
// docs/PUBLIC_CAPTAIN.md.
const PUBLIC_NUM_CTX = Number(process.env.PUBLIC_MODEL_NUM_CTX || 8192);
// Reasoning length scales with question ambiguity and can't be
// suppressed (see above) -- observed up to ~3200 total tokens for a
// genuinely broad/vague real test question ("what kinds of problems is
// he best at solving", no narrow evidence match). 2500 was NOT enough
// for that case (hit done_reason:'length' with zero content, a real
// measured failure, not a hypothetical). 3500 leaves headroom above
// the worst case actually observed; see docs/PUBLIC_CAPTAIN.md for the
// full measurement table. This is a real, evidence-driven cost of the
// unsuppressible-thinking finding above, not an arbitrary bump.
const PUBLIC_NUM_PREDICT = Number(process.env.PUBLIC_MODEL_NUM_PREDICT || 3500);
// Widened from an original 30s guess once real runs (see above) showed
// completion times up to ~12.5s even at num_predict=2000 with
// unsuppressible reasoning -- 45s leaves real headroom rather than
// clipping a legitimately-finishing call.
const PUBLIC_TIMEOUT_MS = Number(process.env.PUBLIC_MODEL_TIMEOUT_MS || 45_000);

export async function callPublicModel({ system, user, timeoutMs = PUBLIC_TIMEOUT_MS, signal }) {
  return callOllamaChat({
    model: PUBLIC_MODEL,
    system,
    user,
    timeoutMs,
    signal,
    // think intentionally left unset -- see the note above PUBLIC_NUM_CTX.
    numCtx: PUBLIC_NUM_CTX,
    numPredict: PUBLIC_NUM_PREDICT,
  });
}

// Capacity gate: reports whether the local runtime is currently safe
// for public inference, i.e. nothing but (optionally) the public model
// itself is loaded in Ollama right now. Never inspects *which* private
// model is running beyond that -- "anything that isn't the public
// model" is deliberately the whole rule, so it isolates the public
// path from the private fleet as a class rather than a hardcoded list
// that could drift out of date as new private models get pulled.
//
// Fails CLOSED: if the check itself can't complete (Ollama unreachable,
// /api/ps errors, timeout), this reports unsafe rather than safe. An
// honest "busy" a visitor sees a little too often is the correct
// failure mode here -- silently guessing "safe" is the one that could
// actually compete with Christopher's own private workload.
export async function checkPublicCapacity() {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/ps`, { signal: AbortSignal.timeout(3_000) });
    if (!res.ok) return { safe: false, reason: `ollama http ${res.status}` };
    const data = await res.json();
    const loaded = Array.isArray(data?.models) ? data.models.map((m) => m.model || m.name).filter(Boolean) : [];
    const busyWith = loaded.filter((name) => name !== PUBLIC_MODEL);
    return { safe: busyWith.length === 0, busyWith };
  } catch (err) {
    return { safe: false, reason: err.message };
  }
}

// Extracts the first {...} JSON object from a model response, tolerating
// stray text or ```json fences around it. Returns null if nothing parses.
export function extractJson(text) {
  if (typeof text !== 'string') return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

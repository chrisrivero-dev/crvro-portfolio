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

// Fixed allowlist -- only these three models can ever be called, no
// matter what a caller passes in.
const ALLOWED_MODELS = new Set(['qwen3.8:27b', 'nemotron-lightning:30b-a3b-q4', 'qwen3-coder:30b']);

export async function callOllamaChat({ model, system, user, timeoutMs = 45_000, temperature = 0.2, signal }) {
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
        options: { temperature },
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

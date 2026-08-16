import React, { useCallback, useId, useRef, useState } from 'react';
import RetroComputer, { useTypewriter } from './RetroComputer.jsx';
import { matchQuery, DESTINATIONS } from '../data/portfolioNavigator.js';

const INTRO_LINES = ['journey complete', 'selected systems indexed', 'visitor path unresolved'];

const EXAMPLES = [
  "I'm hiring for support operations. What should I look at?",
  'Our staff keep giving customers conflicting answers.',
  "What's Christopher's strongest example of local AI?",
];

// Client-side fallback categories -- pure keyword matching, no
// network involved, so these always work even if the broker/worker
// is completely unreachable.
const OFFLINE_CATEGORIES = [
  { label: 'AI', query: 'show me your AI work' },
  { label: 'GIS', query: 'what have you built for GIS?' },
  { label: 'Support', query: 'our support team needs consistent answers' },
  { label: 'About', query: 'tell me about your background' },
  { label: 'Contact', query: 'how do I contact you?' },
];

const MAX_LEN = 300;
// In dev (`vite`), the broker runs standalone on :8787 (`npm run broker`).
// In a real build, the broker is deployed as Vercel Functions alongside
// this same site (see api/), so same-origin relative paths are correct
// -- localhost:8787 would be meaningless in a visitor's own browser.
// VITE_BROKER_URL overrides either default when the broker is hosted
// somewhere else entirely.
const BROKER_URL = import.meta.env.VITE_BROKER_URL || (import.meta.env.DEV ? 'http://localhost:8787' : '');
const POLL_INTERVAL_MS = 1500;
// A complex question can take a real local model three sequential calls
// (CAPTAIN -> NEMO -> REVIEWER); this stays a little above the broker's
// own PROCESSING_TTL so the broker's "expired" status is what resolves
// the wait, not an arbitrary client-side cutoff.
const MAX_POLLS = 78; // ~117s before giving up and showing the offline fallback

function IntroLines({ reduced }) {
  const { output } = useTypewriter(INTRO_LINES, !reduced);
  return (
    <>
      {INTRO_LINES.map((_, i) => (
        <span key={i} className="retro-term-line retro-term-dim">{`> ${output[i] || ''}`}</span>
      ))}
    </>
  );
}

function RoutingLine({ routing }) {
  const used = (routing || []).filter((r) => r.status === 'used').map((r) => r.role);
  if (!used.length) return null;
  return <span className="retro-term-line retro-term-dim retro-term-routing">{`resolved via ${used.join(' + ')}`}</span>;
}

function DestinationLinks({ destinations }) {
  const items = (destinations || []).map((key) => DESTINATIONS[key]).filter(Boolean);
  if (!items.length) return null;
  return (
    <ul className="retro-term-result-list">
      {items.map((d) => (
        <li key={d.key} className="retro-term-line">
          <a className="retro-term-link" href={d.href}>
            {d.label} →
          </a>
        </li>
      ))}
    </ul>
  );
}

function OfflineBlock({ onCategory }) {
  return (
    <div className="retro-term-result">
      <span className="retro-term-line retro-term-dim">&gt; portfolio intelligence temporarily offline</span>
      <span className="retro-term-line retro-term-gap" aria-hidden="true" />
      <span className="retro-term-line retro-term-dim">You can still explore the projects manually:</span>
      <div className="retro-term-offline-categories">
        {OFFLINE_CATEGORIES.map((c) => (
          <button key={c.label} type="button" className="retro-term-suggestion" onClick={() => onCategory(c.query)}>
            {`[${c.label}]`}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultBlock({ state, result, onCategory }) {
  if (state === 'thinking') {
    return (
      <div className="retro-term-result">
        <span className="retro-term-line retro-term-dim">&gt; consulting portfolio intelligence…</span>
      </div>
    );
  }
  if (state === 'offline') {
    return <OfflineBlock onCategory={onCategory} />;
  }
  if (!result) return null;

  // Deterministic (client-side, no network) result shape.
  if (result.source === 'deterministic') {
    const m = result.match;
    if (m.kind === 'unknown') {
      return (
        <div className="retro-term-result">
          {m.lines.map((l, i) => (
            <span key={i} className="retro-term-line retro-term-dim">{`> ${l}`}</span>
          ))}
          <span className="retro-term-line retro-term-gap" aria-hidden="true" />
          <span className="retro-term-line retro-term-dim">try:</span>
          <ul className="retro-term-result-list">
            {m.suggestions.map((s) => (
              <li key={s} className="retro-term-line retro-term-amber">{`  ${s}`}</li>
            ))}
          </ul>
        </div>
      );
    }
    return (
      <div className="retro-term-result">
        {m.lines.map((l, i) => (
          <span key={i} className="retro-term-line retro-term-dim">{`> ${l}`}</span>
        ))}
        {m.kind === 'single' ? (
          <a className="retro-term-link" href={m.results[0].href}>
            {m.results[0].cta}
          </a>
        ) : (
          <ul className="retro-term-result-list">
            {m.results.map((r) => (
              <li key={r.key} className="retro-term-line">
                <span className="retro-term-dim">{r.n}  </span>
                <a className="retro-term-link" href={r.href}>{r.label}</a>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // Public Captain (broker/worker) result shape.
  return (
    <div className="retro-term-result">
      <span className="retro-term-line">{result.answer}</span>
      <RoutingLine routing={result.routing} />
      <DestinationLinks destinations={result.destinations} />
    </div>
  );
}

function NavigatorScreen({ awake, reduced, value, setValue, onSubmit, onExample, state, result }) {
  const inputId = useId();
  if (!awake) return null;

  return (
    <>
      <IntroLines reduced={reduced} />
      <span className="retro-term-line retro-term-gap" aria-hidden="true" />
      <hr className="retro-term-divider" />
      <p className="retro-term-line retro-term-heading">ASK ABOUT MY WORK</p>
      <p className="retro-term-line retro-term-dim">
        Describe what you&rsquo;re looking for, ask about a project, or tell the system about a problem you&rsquo;re trying to solve.
      </p>
      <hr className="retro-term-divider" />

      <form className="retro-term-form" onSubmit={onSubmit}>
        <label className="retro-term-input-label" htmlFor={inputId}>
          Ask about Christopher&rsquo;s work
        </label>
        <div className="retro-term-input-row">
          <span className="retro-term-prompt" aria-hidden="true">&gt;</span>
          <input
            id={inputId}
            type="text"
            className="retro-term-input"
            placeholder="our staff keep giving customers conflicting answers_"
            value={value}
            maxLength={MAX_LEN}
            autoComplete="off"
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
      </form>

      <div className="retro-term-suggestions">
        {EXAMPLES.map((s) => (
          <button key={s} type="button" className="retro-term-suggestion" onClick={() => onExample(s)}>
            {`> ${s}`}
          </button>
        ))}
      </div>

      <div aria-live="polite" className="retro-term-result-region">
        <ResultBlock state={state} result={result} onCategory={onExample} />
      </div>
    </>
  );
}

export default function PortfolioNavigator() {
  const [value, setValue] = useState('');
  const [state, setState] = useState('idle'); // idle | thinking | done | offline
  const [result, setResult] = useState(null);
  const pollTimer = useRef(null);
  const pollCount = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    pollTimer.current = null;
    pollCount.current = 0;
  }, []);

  const poll = useCallback(
    (requestId) => {
      pollTimer.current = setTimeout(async () => {
        pollCount.current += 1;
        try {
          const res = await fetch(`${BROKER_URL}/api/result/${requestId}`);
          if (!res.ok && res.status !== 404) throw new Error('bad_status');
          const data = await res.json();
          // 'answered' and 'unresolved' are both legitimate terminal
          // outcomes from the pipeline -- 'unresolved' is what Captain
          // returns when the portfolio genuinely has no evidence for the
          // question, and it must be shown, not treated as still-loading.
          if (data.status === 'answered' || data.status === 'unresolved') {
            setResult({ source: 'captain', ...data });
            setState('done');
            return;
          }
          if (data.status === 'error' || data.status === 'expired' || res.status === 404) {
            setState('offline');
            return;
          }
          // queued | processing -- keep polling, bounded.
          if (pollCount.current >= MAX_POLLS) {
            setState('offline');
            return;
          }
          poll(requestId);
        } catch {
          setState('offline');
        }
      }, POLL_INTERVAL_MS);
    },
    []
  );

  const runQuery = useCallback(
    async (raw) => {
      const q = raw.trim();
      if (!q) return;
      stopPolling();

      // Fast, free, offline-safe path first -- only fall through to
      // the network for genuinely open-ended questions.
      const det = matchQuery(q);
      if (det.kind !== 'unknown') {
        setResult({ source: 'deterministic', match: det });
        setState('done');
        return;
      }

      setState('thinking');
      setResult(null);
      try {
        const res = await fetch(`${BROKER_URL}/api/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: q }),
        });
        if (!res.ok) throw new Error('ask_failed');
        const data = await res.json();
        if (!data.request_id) throw new Error('no_request_id');
        poll(data.request_id);
      } catch {
        setState('offline');
      }
    },
    [poll, stopPolling]
  );

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      runQuery(value);
    },
    [value, runQuery]
  );

  const handleExample = useCallback(
    (s) => {
      setValue(s);
      runQuery(s);
    },
    [runQuery]
  );

  return (
    <section className="portfolio-navigator" id="navigator" data-screen-label="02b Navigator">
      <div className="container-wide">
        <div className="eyebrow portfolio-navigator-eyebrow">SYSTEM RETURN · DESTINATION LOOKUP</div>
        <RetroComputer mode="navigator" chrome="light">
          {({ awake, reduced }) => (
            <NavigatorScreen
              awake={awake}
              reduced={reduced}
              value={value}
              setValue={setValue}
              onSubmit={handleSubmit}
              onExample={handleExample}
              state={state}
              result={result}
            />
          )}
        </RetroComputer>
      </div>
    </section>
  );
}

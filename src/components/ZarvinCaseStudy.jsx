// ============================================================
// Zarvin One — case study body
//
// Rebuilt from a current-state audit (docs/zarvin-one-current-state-audit.md,
// 2026-09-06) that verified the running Zarvin Bridge API, live connected
// accounts, the Job Ledger, and git/test history directly — not the old
// approved-copy document and not roadmap intent. The old approved copy
// (docs/zarvin-one-approved-copy.md) described Zarvin as a controlled
// August prototype with an aspirational backend; that framing is now
// stale. This component tells the current story instead: the August
// interactive build was the first product prototype, and it has since
// grown into a persistent, tool-connected, approval-gated operator, with
// some newer capabilities still being hardened. The original prototype
// is preserved, not deleted — it's demoted to §10 and labeled honestly.
//
// Reuses existing CRVRO primitives throughout (Section, capability-grid,
// bullet-list, learned-list, stack-grid, the flow-diagram mockup classes,
// the case-figure placeholder idiom) rather than inventing new chrome.
// New CSS lives in src/styles/case-study.css under the zarvin-matrix,
// zarvin-specialist-table, zarvin-walkthrough, zarvin-prototype,
// zarvin-reliability, zarvin-gate-story, and zarvin-dev-list rules.
// ============================================================

import React from 'react';

/**
 * The production Zarvin One web build (deployed via EAS Hosting), pinned
 * to demo mode at build time (see zarvin-one-mobile/.env.production) --
 * always shows the original controlled-scenario prototype to a visitor,
 * regardless of what mode any local dev server happens to be running in.
 *
 * For local development, override with VITE_ZARVIN_DEMO_URL in a
 * gitignored .env.local (e.g. a local demo-mode server on another port --
 * never localhost:8081, which Christopher runs separately in `real` mode
 * for his own device testing and has no backend configured for). This
 * committed default is the only thing that ships to production.
 */
const ZARVIN_DEMO_URL = import.meta.env.VITE_ZARVIN_DEMO_URL || 'https://zarvin-one-mobile.expo.app';

/**
 * The Guided Tour is a permanent, replayable walkthrough at a fixed path on
 * the same deployment -- unlike the embedded demo, it isn't gated by the
 * app's one-time first-entry intro, so it doesn't need the same local-dev
 * override as ZARVIN_DEMO_URL above.
 */
const ZARVIN_GUIDED_TOUR_URL = 'https://zarvin-one-mobile.expo.app/guided-demo';

function Section({ index, label, title, children }) {
  return (
    <section className="case-section">
      <div className="case-section-head">
        <div className="idx">
          {index}: {label}
        </div>
        <h2 className="title">{title}</h2>
      </div>
      <div className="case-section-body">{children}</div>
    </section>
  );
}

/* ── §04 — the real request path ──────────────────────────── */
const REQUEST_FLOW_STAGES = [
  'YOU',
  'ZARVIN',
  'CAPABILITY',
  'SPECIALIST',
  'MODEL',
  'TOOL',
  'PERMISSION / EARNED AUTONOMY',
  'EXECUTION',
  'VERIFICATION',
  'JOB LEDGER',
  'RESULT',
];

/* ── §06 — the reliability gate ───────────────────────────── */
const RELIABILITY_STAGES = [
  'BUILD',
  'TEST',
  'REAL EXECUTION',
  'VERIFY SIDE EFFECT',
  'RECORD EVIDENCE',
  'FAILURE TEST',
  'CLEAN RETEST',
  'LIVE',
];

function FlowMockup({ label, stages, className }) {
  return (
    <div className={`mockup ${className}`}>
      <div className="mockup-bar">
        <span className="mockup-fname">{label}</span>
      </div>
      <div className="flow-row">
        {stages.map((stage, i) => (
          <React.Fragment key={stage}>
            <div className="flow-node">
              <span className="flow-k">{stage}</span>
            </div>
            {i < stages.length - 1 && (
              <span className="flow-arrow" aria-hidden="true">→</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ── §05 — current build status matrix ────────────────────── */
const MATRIX = [
  {
    key: 'verified',
    label: 'Verified live',
    items: [
      'Bridge API runtime — dozens of live endpoints, self-reports its own build and staleness',
      'Connected accounts — Google Calendar, two Gmail accounts, Granola meeting notes',
      'Approval-gated execution — propose → approve → execute → verify, with an expiry window',
      'Job Ledger — real evidence, and COMPLETED is tracked separately from VERIFIED',
      'Specialist routing — deterministic capability-to-model mapping, local-only fails closed',
      'Independent reviewer — a separate pinned role from whichever specialist did the work',
      'Durable Ask pipeline — resumable, cancellable, streams progress, survives a restart',
      'Attention Engine — scored, deduplicated, suppresses noise by default',
      'Scheduled automations — Morning Brief and Evening Recap running on real timestamps',
      'Telegram as the live notification transport',
      'Concurrency hardening — atomic cross-process store, no duplicate execution',
      'Command Center — an operations inbox backed by real evidence cards',
    ],
  },
  {
    key: 'validating',
    label: 'Connected · validating',
    items: [
      'Automation Engine V2 — a deterministic NL interpreter now running; one live automation is currently failing, and the system reports that honestly',
      'Cross-device state — phone and web reading backend-authoritative state, physical acceptance in progress',
    ],
  },
  {
    key: 'implemented',
    label: 'Implemented',
    items: [
      'Scoped local execution — files, Git, and an allowlisted command policy, wired in but without a live-verified job yet',
      'Code fixes gated on the project\'s own tests, with automatic rollback on failure',
      'Earned-autonomy tiers — eligibility can accrue, but no grant has been issued',
      'Web research and real-browser reading, contained against SSRF',
      'Cloud escape hatch — benchmarked under a budget cap, limited role, not an automatic fallback',
    ],
  },
  {
    key: 'next',
    label: 'Next',
    items: [
      'Switchyard adaptive second-layer routing — built, off by default',
      'STRONG_LOCAL / Flash-Next escalation — evaluated, currently a no-go on live evidence',
      'Native iOS push notifications — Telegram is the transport today',
      'Watchers as first-class entities — condition watches exist; standalone watchers are still empty',
      'Device registry / pairing discovery — devices are added by manual address and token today',
    ],
  },
];

function CapabilityMatrix() {
  return (
    <div className="zarvin-matrix">
      {MATRIX.map((col) => (
        <div key={col.key} className={`zarvin-matrix-col zarvin-matrix-col--${col.key}`}>
          <div className="zarvin-matrix-col-head">
            <span className="dot" aria-hidden="true" />
            <span>{col.label}</span>
          </div>
          <ul className="zarvin-matrix-list">
            {col.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ── §07 — specialists and models ─────────────────────────── */
const SPECIALISTS = [
  { role: 'CAPTAIN', job: 'Chief of staff — project awareness, daily context, daily operating brief', model: 'qwen3.8:27b' },
  { role: 'NEMO', job: 'Fast chat and evidence triage', model: 'nemotron-lightning:30b-a3b-q4' },
  { role: 'VOLT', job: 'Deep coding', model: 'qwen3-coder-next:q4_K_M' },
  { role: 'BYTE', job: 'Systems work', model: 'qwen3-coder-next:q4_K_M' },
  { role: 'FINLEY', job: 'UX and communication', model: 'muse-glimmer:30b-mlx' },
  { role: 'REVIEWER', job: 'Independent review — a separate pinned model from whoever did the work', model: 'qwen3-coder:30b' },
  { role: 'VISION', job: 'Image and screen understanding', model: 'qwen3-vl:32b' },
];

function SpecialistTable() {
  return (
    <table className="zarvin-specialist-table">
      <thead>
        <tr>
          <th>Role</th>
          <th>What it does</th>
          <th>Model</th>
        </tr>
      </thead>
      <tbody>
        {SPECIALISTS.map((s) => (
          <tr key={s.role}>
            <td>{s.role}</td>
            <td>{s.job}</td>
            <td className="model">{s.model}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── §09 — current development ────────────────────────────── */
const CURRENT_DEV = [
  { name: 'Automation Engine V2 validation — one live automation ("tell me if a job gets stuck or fails") is currently failing, and reports it', tag: 'FAILING (reported)', cls: 'failing' },
  { name: 'Cross-device physical acceptance across phone and web', tag: 'VALIDATING', cls: 'validating' },
  { name: 'Live-verified job for the M18 local-execution runtime', tag: 'VALIDATING', cls: 'validating' },
  { name: 'Switchyard adaptive routing and STRONG_LOCAL evidence gates', tag: 'NEXT', cls: 'next' },
  { name: 'Native iOS push notifications', tag: 'NEXT', cls: 'next' },
];

function CurrentDevelopment() {
  return (
    <ul className="zarvin-dev-list">
      {CURRENT_DEV.map((d) => (
        <li key={d.name}>
          <span className="name">{d.name}</span>
          <span className={`tag tag--${d.cls}`}>{d.tag}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── top-of-page — current build walkthrough slot ─────────── */
function CurrentBuildWalkthrough() {
  return (
    <div className="container-wide zarvin-walkthrough">
      <div className="zarvin-walkthrough-head">
        <div className="eyebrow">Current build walkthrough</div>
        <h2>See the current build, not just the demo.</h2>
        <p>
          The strongest evidence for what Zarvin actually does today is a walkthrough of the real
          system — not the scripted prototype further down this page.
        </p>
      </div>
      <figure className="case-figure zarvin-walkthrough-slot">
        <div className="frame">
          <span className="placeholder-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <p className="placeholder-note">
            Walkthrough not recorded yet. This slot is reserved for a real, redacted screen
            recording of the live system — once captured, it replaces this placeholder without
            changing anything else on the page.
          </p>
        </div>
      </figure>
      <p className="zarvin-walkthrough-asset-names">
        reserved: zarvin-current-build-walkthrough · zarvin-command-center · zarvin-approval ·
        zarvin-job-ledger · zarvin-connections · zarvin-automations
      </p>
    </div>
  );
}

/* ── §10 — original interactive prototype (demoted) ───────── */
function OriginalPrototype() {
  return (
    <div className="container-wide zarvin-prototype">
      <div className="zarvin-try-head">
        <span className="zarvin-prototype-badge">
          <span className="dot" aria-hidden="true" />
          Original interactive product prototype · August 2026
        </span>
        <div className="eyebrow">10 — Where Zarvin One started</div>
        <h2>Controlled scenarios. No live backend.</h2>
        <p>
          This is Zarvin's first product prototype — five scripted scenarios, built to test what
          the product experience should feel like before any of the backend above existed. Kept
          here as evidence of how the product evolved, not as a demonstration of the current system.
        </p>
      </div>

      <div className="zarvin-try-embed">
        <div className="zarvin-try-frame">
          <div className="zarvin-try-bar">
            <span className="zarvin-try-live" aria-hidden="true" />
            <span>ZARVIN ONE · SCRIPTED PROTOTYPE, AUGUST 2026</span>
          </div>
          <iframe
            className="zarvin-try-iframe"
            src={ZARVIN_DEMO_URL}
            title="Zarvin One original interactive prototype (August 2026, scripted)"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <div className="zarvin-try-actions">
          <a className="zarvin-btn zarvin-btn-primary" href={ZARVIN_DEMO_URL} target="_blank" rel="noreferrer">
            Open original prototype ↗
          </a>
          <a className="zarvin-btn" href={ZARVIN_GUIDED_TOUR_URL} target="_blank" rel="noreferrer">
            Take the scripted guided tour →
          </a>
        </div>
      </div>

      <div className="zarvin-try-launch">
        <div className="case-figure zarvin-try-preview">
          <div className="frame">
            <span className="placeholder-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="placeholder-label">Zarvin One · prototype</span>
          </div>
        </div>
        <div className="zarvin-try-actions">
          <a className="zarvin-btn zarvin-btn-primary zarvin-btn-lg" href={ZARVIN_DEMO_URL} target="_blank" rel="noreferrer">
            Open original prototype ↗
          </a>
          <a className="zarvin-btn zarvin-btn-lg" href={ZARVIN_GUIDED_TOUR_URL} target="_blank" rel="noreferrer">
            Take the scripted guided tour →
          </a>
        </div>
      </div>

      <p className="zarvin-prototype-scripted-note">
        Every scenario, including any "something went wrong" moment, is scripted for the tour. None
        of it is a record of a real incident — the real incidents and their fixes are in §06 and §09.
      </p>
    </div>
  );
}

export default function ZarvinCaseStudy() {
  return (
    <>
      <CurrentBuildWalkthrough />

      <Section index="01" label="What it is now" title="One place to ask for an outcome.">
        <p>
          Zarvin One is a personal AI operator. You ask for an outcome — not which model, which
          tool, or which specialist should handle it — and Zarvin coordinates all of that
          underneath: capability routing, specialist and model selection, tool execution,
          permission and earned autonomy, verification, evidence, and follow-up.
        </p>
        <p>Do less. Get more. That's the whole idea.</p>
      </Section>

      <Section index="02" label="Why I built it" title="I already had the machinery. Using it was the problem.">
        <p>
          I already had local models, agents, tools, automations, and integrations working. They
          were useful, but using them meant managing all of that machinery myself — which model
          for which job, which tool was allowed to do what, what still needed my approval.
        </p>
        <p>Zarvin One is the product layer that hides that complexity so the person asking doesn't have to think about it.</p>
      </Section>

      <Section index="03" label="From prototype to operating layer" title="What replaced the scripted demo.">
        <p>
          Zarvin's first product prototype, built in August 2026, was a controlled interactive
          build: five scripted scenarios, no live backend. It answered a design question — what
          should this feel like as a product — before there was a real system underneath it to
          answer to.
        </p>
        <p>Since then, a real backend has grown underneath it. Verified and currently running:</p>
        <ul className="bullet-list">
          <li>Persistent jobs — a durable, resumable Job Ledger instead of a session that forgets</li>
          <li>Specialist routing — requests reach a named specialist by capability, not by guesswork</li>
          <li>Real connected services — Google Calendar, two Gmail accounts, Granola meeting notes</li>
          <li>Approval boundaries — consequential actions wait for explicit approval, with an expiry</li>
          <li>Verification and evidence — outcomes are checked against the provider, not assumed</li>
          <li>Recovery — a crash-orphaned action gets an honest terminal state, not a silent retry</li>
          <li>Proactive attention — a scoring engine that surfaces what matters and suppresses the rest</li>
        </ul>
      </Section>

      <Section index="04" label="How a request moves through Zarvin" title="The current path, end to end.">
        <FlowMockup label="zarvin one · the current request path" stages={REQUEST_FLOW_STAGES} className="zarvin-flow-mockup" />
        <p>
          A real example, redacted: a calendar hold gets requested. It maps to{' '}
          <code>CALENDAR_WRITE</code>, a Tier-3 consequential capability, which routes to a pinned
          specialist and waits for my approval instead of running on its own. Once approved, it
          executes against Google Calendar and Zarvin checks the result against Calendar itself —
          not just the tool's own response — before marking it verified. The whole approve-to-verify
          window was about two seconds; the record of it lives in the Job Ledger, evidence attached.
        </p>
      </Section>

      <Section index="05" label="Current build status" title="What's live, what's validating, what's next.">
        <p>
          Four honest states, not a percentage. <strong>Verified live</strong> means it ran for real
          and was checked. <strong>Connected · validating</strong> means it's wired up and running,
          but still earning trust. <strong>Implemented</strong> means it's built and tested but
          hasn't had a live-verified run yet, or is deliberately limited. <strong>Next</strong> means
          it exists in code but is off, or hasn't shipped.
        </p>
        <CapabilityMatrix />
      </Section>

      <Section index="06" label="Reliability and trust" title="COMPLETED is not the same as VERIFIED.">
        <FlowMockup label="zarvin one · reliability gate" stages={RELIABILITY_STAGES} className="zarvin-reliability-mockup" />
        <ul className="zarvin-principle-list">
          <li><strong>COMPLETED is not VERIFIED.</strong> Most finished jobs are completed, not independently checked — the system says so instead of blurring the two.</li>
          <li><strong>Approvals expire.</strong> A Tier-3 approval is a 15-minute window, not a standing grant.</li>
          <li><strong>Tiers are enforced.</strong> Consequential actions need the matching approval tier — there's no shortcut around it.</li>
          <li><strong>Unknown isn't retried.</strong> A crash-orphaned action becomes an explicit <code>EXECUTION_UNKNOWN</code> state, never a blind retry.</li>
          <li><strong>Tests decide, not the model.</strong> A proposed code fix only counts if the project's own test command passes after the edit.</li>
          <li><strong>Failure means rollback.</strong> If those tests fail, the edit is rolled back — a model saying "fixed" doesn't make it so.</li>
          <li><strong>Commands are allowlisted.</strong> Recognized-and-safe runs; anything else needs approval, and nothing runs through a raw shell string.</li>
          <li><strong>Autonomy can't self-grant.</strong> Track record makes a capability eligible; only I can grant it. Destructive actions can never become autonomous.</li>
        </ul>
        <div className="zarvin-gate-story">
          <span className="lab">From the runtime's history: the reliability gate</span>
          <ol>
            <li>Reproduced a real concurrent-write race under load — two processes racing the same on-disk store.</li>
            <li>Replaced the ad hoc temp-file convention with an atomic, cross-process store shared across every JSON-backed store.</li>
            <li>Closed a duplicate-execution race where two concurrent approvals could both reach the broker.</li>
            <li>Added an explicit <code>EXECUTION_UNKNOWN</code> state for a crash-orphaned action, instead of it looking active forever.</li>
            <li>Fixed a blind spot where a durably-recorded job wasn't showing up in the activity feed at all.</li>
          </ol>
        </div>
      </Section>

      <Section index="07" label="Specialists and models" title="You don't pick a model. Zarvin does.">
        <p>
          Underneath a request, Zarvin maps the capability it needs to a named specialist and a
          pinned model — deterministically, not adaptively, today.
        </p>
        <SpecialistTable />
        <ul className="bullet-list">
          <li>Capability-to-model routing is deterministic and running now; nothing picks "the best model" adaptively yet</li>
          <li>Local-only policy fails closed — a non-local model provider is rejected outright, not silently allowed</li>
          <li>Independent review is a separate, differently-pinned model from whichever specialist did the original work</li>
          <li>An adaptive second routing layer exists in code but is off by default</li>
          <li>A cloud model is integrated as a deliberately limited escalation path, not an automatic fallback</li>
        </ul>
      </Section>

      <Section index="08" label="What I learned" title="Reliable agents need more than good prompts.">
        <ol className="learned-list">
          <li><span className="num">01</span><span>Reliable agents need more than good prompts — they need boundaries, verification, and a way to recover when something goes wrong.</span></li>
          <li><span className="num">02</span><span>A successful API response is not proof of a successful side effect. The provider has to confirm it, not just accept the call.</span></li>
          <li><span className="num">03</span><span>UI state has to agree with persisted runtime state, or the interface starts lying to the person using it.</span></li>
          <li><span className="num">04</span><span>Consequential actions need explicit, tiered boundaries — a blanket "ask before doing anything" doesn't scale and a blanket "just do it" isn't safe.</span></li>
          <li><span className="num">05</span><span>Evidence beats an agent's own assertion, every time. "It worked" is a claim; a verified record is proof.</span></li>
          <li><span className="num">06</span><span>Retries can themselves become dangerous — a naive retry after a crash can turn one action into two.</span></li>
          <li><span className="num">07</span><span>Useful automation should reduce what needs my attention, not add another feed I now have to check.</span></li>
        </ol>
      </Section>

      <Section index="09" label="Current development" title="What's still being hardened.">
        <p>
          Being honest about what's still in progress is part of the standard, not an exception to
          it. Right now:
        </p>
        <CurrentDevelopment />
      </Section>

      <OriginalPrototype />

      <div className="container-wide">
        <div className="zarvin-try-head" style={{ marginBottom: 28 }}>
          <div className="eyebrow">What I built, what I didn't</div>
          <h2>Own the layer, not the foundation.</h2>
        </div>
        <div className="stack-grid" style={{ maxWidth: 900, margin: '0 auto 80px' }}>
          <div className="stack-col">
            <h4>What I built</h4>
            <ul>
              <li>The Zarvin product experience</li>
              <li>The Bridge API</li>
              <li>The capability/specialist routing layer</li>
              <li>The approval and verification workflow</li>
              <li>The Job Ledger and its evidence behavior</li>
              <li>The Attention Engine and Command Center</li>
              <li>Automation and runtime integration</li>
              <li>The mobile client and the cross-device orchestration around it</li>
            </ul>
          </div>
          <div className="stack-col">
            <h4>What I used, didn't build</h4>
            <ul>
              <li>Hermes</li>
              <li>OpenClaw</li>
              <li>Ollama</li>
              <li>The underlying local and cloud models</li>
              <li>Composio</li>
              <li>Granola</li>
              <li>Expo</li>
              <li>FastAPI</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

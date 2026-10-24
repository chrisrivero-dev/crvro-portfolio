// ============================================================
// Zarvin One: case study body
//
// Reconciled 2026-10-24 against the current Zarvin backend
// (daventry-customer-hub main @ 528647f, 2026-10-08), its unmerged
// M4B / Devin validation branches (through 2026-10-19), and
// zarvin-one-mobile main @ af868f2 (2026-10-03). The previous version
// (2026-09-06 audit, docs/zarvin-one-current-state-audit.md) described a
// request pipeline; the current system is built around durable
// responsibilities (WorkSpine), so this body leads with that.
//
// Naming, verified in code: "Aven" is the user-facing persistent worker
// (the `zarvin` character template, named by Christopher). "Ava" is the
// internal attention layer the ResponsibilityCoordinator consults to
// decide which owned work to pick up; by design it has no human-facing
// identity and never executes or approves anything itself.
//
// Anything that exists only on unmerged branches, or behind a default-off
// flag on main, is labeled as validating in development, never as live.
//
// Reuses existing CRVRO primitives throughout (Section, capability-grid,
// bullet-list, learned-list, stack-grid, the flow-diagram mockup classes,
// zarvin-matrix, zarvin-principle-list, zarvin-specialist-table,
// zarvin-gate-story, zarvin-dev-list). No new CSS.
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

/* ── §03: how a responsibility moves ──────────────────────── */
const RESPONSIBILITY_FLOW = [
  'REQUEST',
  'RESPONSIBILITY',
  'OWNERSHIP',
  'ONE BOUNDED STEP',
  'APPROVAL WHEN REQUIRED',
  'VERIFICATION',
  'EVIDENCE',
  'COMPLETE',
];

/* ── §07: the reliability gate ────────────────────────────── */
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

/* ── §03: responsibility states (WorkSpine WorkItemState) ─── */
const STATES = [
  { k: 'ACTIVE', d: 'Zarvin owns it and can take the next step.' },
  { k: 'WAITING', d: 'Nothing to do until a time, an event, or a scheduled retry. The wait reason is stored.' },
  { k: 'BLOCKED', d: 'It cannot proceed, and the blocker is recorded instead of hidden.' },
  { k: 'NEEDS_APPROVAL', d: 'The next step is consequential. It stops until I approve or deny that exact action.' },
  { k: 'NEEDS_HUMAN', d: 'It needs a judgment or an answer only I can give. Once I resolve it, the same responsibility resumes.' },
  { k: 'COMPLETE', d: 'Rejected unless at least one evidence record is VERIFIED. One successful action is not completion.' },
  { k: 'CANCELLED', d: 'I stopped it. Nothing further runs, and anything already done is reported, not silently undone.' },
];

/* ── §06: automated vs human-controlled vs next ───────────── */
const MATRIX = [
  {
    key: 'verified',
    label: 'Automated today',
    items: [
      'Continuing an owned responsibility one bounded step at a time, woken by a timer, a watched project change, or an approval outcome',
      'Restart catch-up: incomplete responsibilities are re-woken under the same ID, with claim leases so two workers never run the same step',
      'Bounded retry with backoff for failures classified as safe and transient',
      'Ava prioritizing due work and suppressing noise, then reconsidering it later',
      'Notices on meaningful state changes, deduplicated, over Telegram and Web Push',
      'A daily executive brief built from the responsibility ledger',
      'Background progress written back into the conversation that started it',
      'Reading and drafting in two Gmail accounts, reading Google Calendar, reading Granola meeting notes',
      'Creating an explicit personal calendar event, and ordinary grocery list upkeep, with no approval tap',
    ],
  },
  {
    key: 'validating',
    label: 'Human-controlled by design',
    items: [
      'Consequential actions (sending email, changing calendar events, deleting) wait for an approval bound to that exact action, with an expiry and revalidation',
      'NEEDS_HUMAN questions are answered by me; the system does not guess',
      'Failures that might have had a side effect are never retried automatically',
      'Destructive actions have no autonomous tier at all',
      'Earned autonomy: a track record makes a capability eligible, only I can grant it',
      'New devices pair through a short-lived code from the Mac, then get a scoped credential',
    ],
  },
  {
    key: 'implemented',
    label: 'Validating in development',
    items: [
      'A supervised local coding worker (local Qwen in an isolated tmux session, no network, no credentials), on main behind a flag that is off by default',
      'Independent verification of worker output: a worker saying "done" stays UNVERIFIED until Zarvin checks it',
      'An end-to-end engineering loop: repo, plan, isolated worktree, browser reproduction, fix, visual check, PR, CI, merge, deploy, production verification. Passed on a disposable project; not merged to main',
      'Cloud escalation to Codex or Claude when local repair is exhausted, tested in acceptance runs only',
    ],
  },
  {
    key: 'next',
    label: 'Next',
    items: [
      'Production enablement of the engineering loop: two release gates are still open (a real-Codex visual acceptance run, and a hosted deployment target to verify against)',
      'Escalation rules for approvals that sit too long, and multi-step approval chains',
      'Native iOS push: the phone path today is Web Push to the Home Screen web app, plus Telegram',
      'Switchyard adaptive routing: built, off by default',
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

/* ── §08: specialists and models ──────────────────────────── */
const SPECIALISTS = [
  { role: 'CAPTAIN', job: 'Chief of staff: project awareness, daily context, daily operating brief', model: 'qwen3.8:27b' },
  { role: 'NEMO', job: 'Fast chat and evidence triage', model: 'nemotron-lightning:30b-a3b-q4' },
  { role: 'VOLT', job: 'Deep coding', model: 'qwen3-coder-next:q4_K_M' },
  { role: 'BYTE', job: 'Systems work', model: 'qwen3-coder-next:q4_K_M' },
  { role: 'FINLEY', job: 'UX and communication', model: 'muse-glimmer:30b-mlx' },
  { role: 'REVIEWER', job: 'Independent review: a separate pinned model from whoever did the work', model: 'qwen3-coder:30b' },
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

/* ── §10: what remains next ───────────────────────────────── */
const CURRENT_DEV = [
  { name: 'Supervised coding worker and the full engineering loop: proven in development, not yet enabled on the live system', tag: 'VALIDATING', cls: 'validating' },
  { name: 'Real-Codex visual acceptance run, blocked on provider quota and not faked', tag: 'GATE OPEN', cls: 'failing' },
  { name: 'A hosted deployment target for production verification outside my own machine', tag: 'GATE OPEN', cls: 'failing' },
  { name: 'Stale-approval escalation and multi-step approval chains', tag: 'NEXT', cls: 'next' },
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

/* ── top-of-page: try the interactive demo ────────────────── */
function TryZarvinOne() {
  return (
    <div className="container-wide zarvin-try">
      <div className="zarvin-try-head">
        <div className="eyebrow">Try Zarvin One</div>
        <h2>The original product demo.</h2>
        <p>
          This is the first Zarvin One prototype from August 2026: the mobile interface running
          scripted scenarios with sample data. It shows the product feel and the approval
          boundary. It does not show responsibilities, Aven, or the live backend described below.
        </p>
      </div>

      <div className="zarvin-try-embed">
        <div className="zarvin-try-frame">
          <div className="zarvin-try-bar">
            <span className="zarvin-try-live" aria-hidden="true" />
            <span>ZARVIN ONE · EARLIER INTERACTIVE DEMO</span>
          </div>
          <iframe
            className="zarvin-try-iframe"
            src={ZARVIN_DEMO_URL}
            title="Zarvin One interactive product demo"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <div className="zarvin-try-actions">
          <a className="zarvin-btn zarvin-btn-primary" href={ZARVIN_DEMO_URL} target="_blank" rel="noreferrer">
            Open interactive demo ↗
          </a>
          <a className="zarvin-btn" href={ZARVIN_GUIDED_TOUR_URL} target="_blank" rel="noreferrer">
            Take the guided tour →
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
            <span className="placeholder-label">Zarvin One</span>
          </div>
        </div>
        <div className="zarvin-try-actions">
          <a className="zarvin-btn zarvin-btn-primary zarvin-btn-lg" href={ZARVIN_DEMO_URL} target="_blank" rel="noreferrer">
            Open interactive demo ↗
          </a>
          <a className="zarvin-btn zarvin-btn-lg" href={ZARVIN_GUIDED_TOUR_URL} target="_blank" rel="noreferrer">
            Take the guided tour →
          </a>
        </div>
      </div>

      <p className="zarvin-try-disclosure">
        Earlier interactive demo · scripted scenarios with sample data, not the live backend. Every
        "something went wrong" moment in it is scripted, not a recorded incident.
      </p>
    </div>
  );
}

export default function ZarvinCaseStudy() {
  return (
    <>
      <Section index="01" label="What it is now" title="I hand it a responsibility, not a prompt.">
        <p>
          I built Zarvin One to take responsibility for work, not just answer prompts. It is a
          personal AI operating system running on my own Mac. When I ask for something that takes
          more than one answer, Zarvin turns it into a durable responsibility: one record with an
          objective, a completion criterion, a next action, and an owner. That record survives
          restarts, waits when it should wait, stops for my approval when the next step is
          consequential, and is only marked complete when there is verified evidence that the
          outcome happened.
        </p>
        <p>
          I talk to it from the Zarvin One mobile app, the Home Screen web app, or Telegram. The
          heavy work runs locally on my own models.
        </p>
      </Section>

      <Section index="02" label="Why I built it" title="Chat forgets. Work doesn't.">
        <p>
          I already had local models, agents, tools, and integrations working. The problem was
          follow-through. A chat answer ends when the reply ends. Real work waits on people,
          fails halfway, needs a decision, or has to be checked later. I was the one carrying all
          of that state in my head.
        </p>
        <p>
          Zarvin One carries it instead, and tells me plainly when something needs me.
        </p>
      </Section>

      <Section index="03" label="How responsibility moves" title="One record, from request to evidence.">
        <FlowMockup label="zarvin one · the responsibility lifecycle" stages={RESPONSIBILITY_FLOW} className="zarvin-flow-mockup" />
        <p>
          Every responsibility lives in WorkSpine, Zarvin's durable work ledger. A coordinator
          wakes it on a timer, a watched project change, an approval outcome, or a restart, claims
          it under a lease, and runs at most one bounded step before writing the result back. The
          same responsibility ID carries through every cycle, every notice, and every approval.
          At any moment it is in one of seven states:
        </p>
        <ul className="zarvin-principle-list">
          {STATES.map((s) => (
            <li key={s.k}>
              <span className="zarvin-principle-copy"><strong><code>{s.k}</code></strong> {s.d}</span>
            </li>
          ))}
        </ul>
        <p>
          State is committed before any notification goes out. If Telegram or Web Push fails, only
          the delivery record changes; the truth about the work does not.
        </p>
      </Section>

      <Section index="04" label="Aven and Ava" title="One I talk to. One that decides what needs attention.">
        <p>
          <strong>Aven</strong> is my head assistant inside Zarvin One: the persistent worker I
          actually talk to. Aven has a durable identity, a live status on the app's Home screen
          (working, waiting, needs approval, recovering, completed), skills scored only from
          verified work, and lessons learned from real failures and confirmed recoveries. In
          development runs, the commits Zarvin makes are authored as "Aven (Zarvin)". Aven's
          status is read from the system's own stores, never invented by the app.
        </p>
        <p>
          <strong>Ava</strong> is internal. When responsibilities are due, Ava scores them and
          decides which one deserves a cycle now, which can wait, and when a suppressed one should
          be reconsidered. Ava has no voice of her own, cannot approve anything, and does not
          execute. Zarvin's executor still enforces authorization, runs the step, and verifies it.
        </p>
        <p>
          Neither is a separate product. Zarvin One is the system; Aven and Ava are roles inside it.
        </p>
      </Section>

      <Section index="05" label="One real workflow" title="A calendar write, proposed, approved, verified.">
        <p>
          A real example from my own system, redacted: I asked for a calendar hold. It mapped to{' '}
          <code>CALENDAR_WRITE</code>, a Tier-3 consequential capability, so the responsibility
          moved to <code>NEEDS_APPROVAL</code> instead of running on its own. The approval card
          showed the exact event and expired after 15 minutes. I approved it. Zarvin executed it
          against Google Calendar, then read the event back from Calendar itself, not just the
          tool's own response, and recorded the result as <code>VERIFIED</code>. Approve to verify
          took about two seconds. The record, with evidence attached, is in the ledger.
        </p>
        <p>
          The rule that makes this matter: if that read-back had not matched, the work would not
          have been marked complete.
        </p>
      </Section>

      <Section index="06" label="Human control" title="What runs alone, what waits for me, what's next.">
        <p>
          Human approval is not a missing feature here. It is a deliberate boundary. Safe,
          reversible work runs on its own. Anything with a real-world consequence waits for me,
          bound to that exact action.
        </p>
        <CapabilityMatrix />
      </Section>

      <Section index="07" label="Verification and evidence" title="COMPLETED is not the same as VERIFIED.">
        <FlowMockup label="zarvin one · reliability gate" stages={RELIABILITY_STAGES} className="zarvin-reliability-mockup" />
        <ul className="zarvin-principle-list">
          <li><span className="zarvin-principle-copy"><strong>Complete needs proof.</strong> A responsibility cannot be marked COMPLETE without a VERIFIED evidence record.</span></li>
          <li><span className="zarvin-principle-copy"><strong>A worker's "done" is a claim.</strong> Only Zarvin writes the VERIFIED row, after checking the result itself.</span></li>
          <li><span className="zarvin-principle-copy"><strong>Approvals expire.</strong> A Tier-3 approval is a short window bound to one action, revalidated before it runs.</span></li>
          <li><span className="zarvin-principle-copy"><strong>Unknown isn't retried.</strong> A crash-orphaned action becomes <code>EXECUTION_UNKNOWN</code>, never a blind retry.</span></li>
          <li><span className="zarvin-principle-copy"><strong>Retries are bounded and classified.</strong> Only failures known to be safe and transient retry, with backoff and a limit.</span></li>
          <li><span className="zarvin-principle-copy"><strong>Tests decide, not the model.</strong> A proposed code fix only counts if the project's own tests pass; otherwise it is rolled back.</span></li>
          <li><span className="zarvin-principle-copy"><strong>Commands are allowlisted.</strong> Recognized-and-safe runs; anything else needs approval, and nothing runs through a raw shell string.</span></li>
        </ul>
        <div className="zarvin-gate-story">
          <span className="lab">From the runtime's history: the reliability gate</span>
          <ol>
            <li>Reproduced a real concurrent-write race under load: two processes racing the same on-disk store.</li>
            <li>Replaced the ad hoc temp-file convention with an atomic, cross-process store shared across every JSON-backed store.</li>
            <li>Closed a duplicate-execution race where two concurrent approvals could both reach the broker.</li>
            <li>Added an explicit <code>EXECUTION_UNKNOWN</code> state for a crash-orphaned action, instead of it looking active forever.</li>
            <li>Fixed a blind spot where a durably-recorded job wasn't showing up in the activity feed at all.</li>
          </ol>
        </div>
      </Section>

      <Section index="08" label="Architecture and interfaces" title="Local models underneath, one bridge on top.">
        <p>
          Zarvin runs as a Python service on my Mac behind the Zarvin Bridge API, reached privately
          over Tailscale. Underneath a step, the capability it needs maps to a named specialist and
          a pinned local model, deterministically. A non-local provider is rejected outright.
        </p>
        <SpecialistTable />
        <ul className="bullet-list">
          <li>Mobile app (Expo, iOS and web): Home with Aven's live status, Ask, approvals, activity, and receipts, all read from the backend, never from a client-side guess</li>
          <li>Device pairing: a short-lived code from the Mac gives each device its own scoped credential, stored in the iOS Keychain</li>
          <li>Notices: Web Push to the Home Screen web app, and Telegram, with a durable receipt when I actually open one</li>
          <li>Connected services: Google Calendar, two Gmail accounts, and Granola meeting notes</li>
          <li>A cloud model exists only as a narrow escalation path, never an automatic fallback</li>
        </ul>
      </Section>

      <Section index="09" label="What I learned" title="Reliable agents need more than good prompts.">
        <ol className="learned-list">
          <li><span className="num">01</span><span>The unit of work is the responsibility, not the message. Without a durable owner, nothing gets followed through.</span></li>
          <li><span className="num">02</span><span>A successful API response is not proof of a successful side effect. The provider has to confirm it, not just accept the call.</span></li>
          <li><span className="num">03</span><span>UI state has to agree with persisted runtime state, or the interface starts lying to the person using it.</span></li>
          <li><span className="num">04</span><span>Consequential actions need explicit, tiered boundaries: a blanket "ask before doing anything" doesn't scale and a blanket "just do it" isn't safe.</span></li>
          <li><span className="num">05</span><span>Retries can themselves become dangerous: a naive retry after a crash can turn one action into two.</span></li>
          <li><span className="num">06</span><span>A notification is not the work. If delivery fails, the record of what happened has to stay true.</span></li>
        </ol>
      </Section>

      <Section index="10" label="What remains next" title="What's still being proven.">
        <p>
          The engineering loop below passed end to end on a disposable project, and my own release
          gate still says it is not ready for the live system. I'm keeping that call.
        </p>
        <CurrentDevelopment />
      </Section>

      <TryZarvinOne />

      <div className="container-wide">
        <div className="zarvin-try-head" style={{ marginBottom: 28 }}>
          <div className="eyebrow">What I built, what I didn't</div>
          <h2>Own the layer, not the foundation.</h2>
        </div>
        <div className="stack-grid" style={{ maxWidth: 900, margin: '0 auto 80px' }}>
          <div className="stack-col">
            <h4>What I built</h4>
            <ul>
              <li>The Zarvin One product experience and mobile client</li>
              <li>The Bridge API</li>
              <li>WorkSpine and the responsibility lifecycle</li>
              <li>The coordinator, Ava's attention layer, and Aven's character system</li>
              <li>The approval and verification workflow</li>
              <li>Device pairing and notice delivery</li>
              <li>The capability/specialist routing layer</li>
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

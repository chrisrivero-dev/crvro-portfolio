// ============================================================
// Zarvin One — case study body
//
// The approved copy (docs/zarvin-one-approved-copy.md) has its own
// eight-section shape, not the generic overview/problem/built/
// features/stack/learned/next template every other case study uses
// (see CaseStudy.jsx). This component renders that shape directly,
// reusing existing CRVRO primitives (Section, capability-grid, the
// flow-diagram mockup classes) rather than inventing new chrome.
//
// Placement note: the approved copy's own §08 ("Try it") comes last
// in the source document, but the interactive-demo requirement calls
// for it to be prominent near the top of the page -- so it's moved
// here to lead the case study, right after the hero. §06 ("Trust")
// is used verbatim as the shared hero disclaimer instead of repeating
// as a body section. Nothing else is reordered, and no wording in any
// section is changed.
// ============================================================

import React from 'react';

/**
 * The production Zarvin One web build (deployed via EAS Hosting), pinned
 * to demo mode at build time (see zarvin-one-mobile/.env.production) --
 * always shows the actual demo scenarios to a visitor, regardless of what
 * mode any local dev server happens to be running in.
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

const SCENARIOS = [
  {
    title: 'Urgent meeting',
    desc: 'Find the conflict, gather the context, and show me what I need to decide.',
  },
  {
    title: 'Monthly business check',
    desc: 'Pull together the important numbers, show me what changed, and flag what needs attention.',
  },
  {
    title: 'Family schedule',
    desc: 'Look across the week, catch conflicts, and tell me what needs preparation.',
  },
  {
    title: 'Project deadline',
    desc: 'Coordinate the work, test the result, and stop for approval before consequential actions.',
  },
  {
    title: 'Something broke',
    desc: 'Figure out what failed, recover safely when possible, and verify the result before calling it fixed.',
  },
];

const FLOW_STAGES = [
  'YOU',
  'ZARVIN ONE',
  'CAPTAIN',
  'SPECIALISTS',
  'MODELS + TOOLS',
  'EVALUATOR / REVIEWER',
  'VERIFIED RESULT',
];

function WhoItsFor() {
  return (
    <div className="container-wide zarvin-who">
      <div className="eyebrow">Who it's for</div>
      <p>
        Built for people with too many moving parts. Zarvin One is for someone juggling work, schedules,
        decisions, messages, follow-up, and everyday responsibilities -- a business to run, a family to keep
        track of, a project on a deadline. They talk to Zarvin. The complicated AI machinery stays underneath.
      </p>
    </div>
  );
}

function TryZarvinOne() {
  return (
    <div className="container-wide zarvin-try">
      <div className="zarvin-try-head">
        <div className="eyebrow">Try Zarvin One</div>
        <h2>See Zarvin One for yourself.</h2>
        <p>The current interactive demo shows the product experience through controlled scenarios.</p>
      </div>

      {/* Desktop / tablet: the real, live, interactive app -- not a screenshot. */}
      <div className="zarvin-try-embed">
        <div className="zarvin-try-frame">
          <div className="zarvin-try-bar">
            <span className="zarvin-try-live" aria-hidden="true" />
            <span>ZARVIN ONE · INTERACTIVE DEMO</span>
          </div>
          <iframe
            className="zarvin-try-iframe"
            src={ZARVIN_DEMO_URL}
            title="Zarvin One interactive demo"
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

      {/* Small / mobile portfolio widths: launch the standalone demo
          instead of nesting a cramped app inside the page. */}
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
        Controlled demo scenarios · Live integrations validated separately.
      </p>
    </div>
  );
}

export default function ZarvinCaseStudy() {
  return (
    <>
      <WhoItsFor />
      <TryZarvinOne />

      <Section index="01" label="Overview" title="What it is.">
        <p>Zarvin One grew out of the AI systems I was already building and using for myself.</p>
        <p>
          I had local models, agents, tools, approvals, and different workflows working together. They
          were useful, but I kept coming back to the same question: why should the person using it have
          to think about any of that?
        </p>
        <p>
          Zarvin One is my answer. One place to ask for something, see what needs attention, approve
          important actions, and understand what happened. The complicated part stays underneath.
        </p>
      </Section>

      <Section index="02" label="The problem" title="Too many pieces.">
        <p>
          A useful AI assistant can quickly turn into a collection of models, agents, tools, automations,
          dashboards, and prompts.
        </p>
        <p>I didn't want another interface that made the user manage the machinery.</p>
        <p>
          I wanted something that could figure out what needed to happen, do the work it was allowed to
          do, and come back when it actually needed a decision.
        </p>
      </Section>

      <Section index="03" label="The idea" title="Do less. Get more.">
        <p>The basic idea is simple: you ask Zarvin One. Zarvin One coordinates the rest.</p>
        <p>
          Behind that can be a chief-of-staff agent, specialists, local models, connected services,
          evaluation, and recovery.
        </p>
        <p>
          The user shouldn't need to know which one handled the job. They should know what happened, what
          was verified, and whether anything needs their attention.
        </p>
      </Section>

      <Section index="04" label="What I built" title="One system for different parts of life.">
        <p>I built the prototype around situations I actually wanted an assistant to handle:</p>
        <div className="capability-grid">
          {SCENARIOS.map((s) => (
            <div key={s.title} className="capability-card">
              <h4>{s.title}</h4>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section index="05" label="Underneath" title="Simple on the surface. Deliberate underneath.">
        <p>The product is one interface. Behind it, the system can coordinate:</p>
        <div className="mockup zarvin-flow-mockup">
          <div className="mockup-bar">
            <span className="mockup-fname">zarvin one · coordination path</span>
          </div>
          <div className="flow-row">
            {FLOW_STAGES.map((stage, i) => (
              <React.Fragment key={stage}>
                <div className="flow-node">
                  <span className="flow-k">{stage}</span>
                </div>
                {i < FLOW_STAGES.length - 1 && (
                  <span className="flow-arrow" aria-hidden="true">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        <p>
          Different models and agents can have different jobs. Evaluation happens before a result is
          treated as trustworthy. Important actions can stop for human approval.
        </p>
        <p>
          The architecture can change underneath without making the person using Zarvin One learn a new
          system.
        </p>
      </Section>

      <Section index="07" label="How I work" title="Build it. Break it. Fix it. Verify it. Teach it.">
        <p>Getting something to work once isn't enough.</p>
        <p>
          I build the workflow, deliberately break it, fix what failed, verify that the result can be
          repeated, and then turn what I learned into something another person can understand.
        </p>
        <p>
          A good workflow can become a working automation, a regression test, a five-minute tutorial, a
          Help Center article, or a support answer.
        </p>
        <p>That's how I want Zarvin One to improve: the product gets more reliable, and using it gets easier.</p>
      </Section>
    </>
  );
}

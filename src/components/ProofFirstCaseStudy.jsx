// ============================================================
// Proof First: case study body
//
// Content is limited to what the proof-first and proof-first-worker
// repositories implement and document (see proof-first/docs/
// automation-audit.md, revised 2026-10-05). The demo is the finished
// video from proof-first/assets/demo, shot on a sample app with
// synthetic data. The worked example comes from the published case
// record proof-first/proof/cases/blob-list-polling.json: a bug from
// my own project, rerun from real commit history. No customer,
// revenue, or adoption claims appear anywhere on this page.
//
// Reuses existing CRVRO primitives (Section, flow-row/flow-node,
// stack-col, bullet-list). New CSS lives in src/styles/case-study.css
// under the pf-* rules.
// ============================================================

import React from 'react';

const DEMO_VIDEO = '/videos/proof-first-demo.mp4';
const DEMO_POSTER = '/images/proof-first-demo-poster.png';

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

/* ── top of page: the sequence ────────────────────────────── */
const SEQUENCE = [
  { k: 'FAIL', tone: 'fail' },
  { k: 'REPAIR' },
  { k: 'SAME TEST', tone: 'same' },
  { k: 'PASS', tone: 'pass' },
  { k: 'PROOF' },
];

function SequenceStrip() {
  return (
    <div className="mockup pf-sequence-mockup">
      <div className="mockup-bar">
        <span className="mockup-fname">proof first · the sequence</span>
      </div>
      <div className="flow-row">
        {SEQUENCE.map((s, i) => (
          <React.Fragment key={s.k}>
            <div className="flow-node" data-tone={s.tone}>
              <span className="flow-k">{s.k}</span>
            </div>
            {i < SEQUENCE.length - 1 && (
              <span className="flow-arrow" aria-hidden="true">→</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function ProofFirstLead() {
  return (
    <div className="container-wide pf-lead">
      <div className="pf-lead-head">
        <div className="eyebrow">Active product</div>
        <h2>A code change is not proof that the problem is fixed.</h2>
        <p>
          Proof First reproduces the failure, repairs it, reruns the same test, and records the
          result. The same test that failed before the repair has to pass after it.
        </p>
      </div>

      <SequenceStrip />

      <figure className="pf-demo">
        <video
          className="pf-demo-video"
          controls
          playsInline
          preload="metadata"
          poster={DEMO_POSTER}
          aria-describedby="pf-demo-caption"
        >
          <source src={DEMO_VIDEO} type="video/mp4" />
          <a href={DEMO_VIDEO}>Download the demo video (MP4, 22 seconds).</a>
        </video>
        <figcaption id="pf-demo-caption">
          <span className="pf-demo-state">
            <b className="pf-fail">BEFORE = FAIL</b>
            <i aria-hidden="true">→</i>
            <b className="pf-same">SAME TEST</b>
            <i aria-hidden="true">→</i>
            <b className="pf-pass">AFTER = PASS</b>
            <em>COUNT 4 → 5</em>
          </span>
          <span className="pf-demo-note">
            Demo on a sample app with synthetic data, not a customer case. The Create Project
            click does nothing before the repair. The same click adds a project after it.
          </span>
        </figcaption>
      </figure>
    </div>
  );
}

/* ── §02: the mechanism ───────────────────────────────────── */
const MECHANISM = [
  {
    k: 'BEFORE = FAIL',
    tone: 'fail',
    body: 'Reproduce the failure first, inside a disposable sandbox. If it does not fail, the job stops.',
  },
  {
    k: 'SAME TEST',
    tone: 'same',
    body: 'Define what working means, then freeze it. The criteria, commands, and scripts are hashed. Changing the test after the repair starts means a new job.',
  },
  {
    k: 'REPAIR',
    body: 'A local model proposes a patch. A person applies it to an isolated copy of the code. A reviewer model can block it, and overriding that block is a recorded decision.',
  },
  {
    k: 'AFTER = PASS',
    tone: 'pass',
    body: 'The frozen test reruns in the sandbox. Only the test run writes the result. A model cannot.',
  },
  {
    k: 'PROOF',
    body: 'A record of the failure, what changed, what was tested, and what was not checked. A person approves it. Changing anything afterward voids the approval.',
  },
];

function Mechanism() {
  return (
    <ol className="pf-seq">
      {MECHANISM.map((m, i) => (
        <li key={m.k} data-tone={m.tone}>
          <span className="pf-seq-n">{String(i + 1).padStart(2, '0')}</span>
          <span className="pf-seq-k">{m.k}</span>
          <span className="pf-seq-body">{m.body}</span>
        </li>
      ))}
    </ol>
  );
}

/* ── §03: a real bug, run twice ───────────────────────────── */
function WorkedExample() {
  return (
    <>
      <p>
        From my own project history, in the Proof First worker. Viewing the Operations Desk
        dashboard re-ran a full storage listing whenever its 20 second cache expired. Reading a
        page should not touch storage listings.
      </p>
      <div className="pf-compare" role="group" aria-label="Before and after, same test">
        <div className="pf-compare-cell" data-tone="fail">
          <span className="pf-compare-k">BEFORE = FAIL</span>
          <span className="pf-compare-v">10</span>
          <span className="pf-compare-d">storage listing passes caused by 10 page renders</span>
        </div>
        <div className="pf-compare-cell" data-tone="same">
          <span className="pf-compare-k">SAME TEST</span>
          <span className="pf-compare-v">10</span>
          <span className="pf-compare-d">
            authenticated renders through the same handler, clock advanced 21 seconds before each
          </span>
        </div>
        <div className="pf-compare-cell" data-tone="pass">
          <span className="pf-compare-k">AFTER = PASS</span>
          <span className="pf-compare-v">0</span>
          <span className="pf-compare-d">storage listing passes caused by the same 10 renders</span>
        </div>
      </div>
      <p>
        The check was written before the fixed commit was run, and it is identical on both sides.
        The counts are logical listing passes, not necessarily provider calls. This is a bug from
        my own project, rerun from real commit history. It is not a customer case.
      </p>
      <p>
        Two more cases from my own projects are recorded the same way: a club homepage that showed
        one conversation twice, and a support drafting step that deleted the question the draft was
        meant to ask.
      </p>
    </>
  );
}

/* ── §04: what exists today ───────────────────────────────── */
const STATUS = [
  {
    key: 'built',
    label: 'Built',
    items: [
      'Intake that validates, signs, and stores each submission as a private record',
      'A worker that turns a verified submission into one job and resumes the same job on retry',
      'Reproduction and test runs in a disposable sandbox',
      'A frozen test, hashed before the repair starts',
      'Verification written only by a test run',
      'A reviewer step that blocks progress until the repair is revised or the block is overridden on record',
      'A local operations desk showing what needs me, what is new, what is active, and what is verified',
      'A proof record that lists what was not verified',
    ],
  },
  {
    key: 'person',
    label: 'Still done by a person',
    items: [
      'Writing the reproduction',
      'Deciding what working means and calibrating the test',
      'Applying the patch to the isolated copy',
      'Capturing the real before and after recordings',
      'Signing off the cause',
      'Approving the result before anyone sees it',
    ],
  },
  {
    key: 'not',
    label: 'Not built yet',
    items: [
      'Checkout and payment',
      'Releasing the repaired code after the customer accepts',
      'A live private proof page for real jobs (the page and its rules exist as an example)',
      'Email notifications',
      'Background polling for new submissions (ingest is triggered by me)',
    ],
  },
];

function StatusColumns() {
  return (
    <div className="pf-status">
      {STATUS.map((col) => (
        <div key={col.key} className={`stack-col pf-status-col pf-status-col--${col.key}`}>
          <h4>{col.label}</h4>
          <ul>
            {col.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function ProofFirstCaseStudy() {
  return (
    <>
      <ProofFirstLead />

      <Section index="01" label="The problem" title="Someone says it is fixed. Is it?">
        <p>
          A tool, an AI, or a developer says a bug is fixed, and the part that mattered is still
          broken. A passing build and a confident summary are claims. Neither shows that the
          original failure is gone.
        </p>
        <p>
          Proof First has one rule. A repair counts when the agreed behavior is tested again and
          visibly passes.
        </p>
      </Section>

      <Section index="02" label="The mechanism" title="Fail, repair, same test, pass, proof.">
        <Mechanism />
      </Section>

      <Section index="03" label="A real bug" title="Ten page reads, ten listings. Then zero.">
        <WorkedExample />
      </Section>

      <Section index="04" label="Current working system" title="What exists today.">
        <p>
          Status as of October 2026, taken from the code and docs in the Proof First repositories.
          Models assist, but they never decide what counts as proof.
        </p>
        <StatusColumns />
      </Section>

      <Section index="05" label="What I am building next" title="Checkout, delivery, and fewer manual steps.">
        <ul className="bullet-list">
          <li>Checkout after approval, so payment follows the proof.</li>
          <li>Release of the repaired code once the customer accepts.</li>
          <li>A private proof page served for real jobs.</li>
          <li>
            Fewer manual steps, one at a time. A step gets automated only when code and a test back
            it.
          </li>
        </ul>
      </Section>
    </>
  );
}

// ============================================================
// HeyHab.ai: case study body
//
// Content is limited to what the heyhab repository and worktrees implement and document as of 2026-10-31 (see README,
// docs/PROMISE-TO-PROOF.md, docs/INTELLIGENCE-ENGINE.md, docs/JEV-EVALUATION.md, docs/LIVING-KNOWLEDGE.md, docs/LEARN-MY-WAY.md,
// and the heyhab.app compare page). Screenshots are real captures of heyhab.app. Atlas Ridge Electronics is a fictional business.
// No customer, revenue, or adoption claims appear on this page.
// ============================================================

import React from 'react';
import { getProjectBySlug } from '../data/projects.js';

const SITE = getProjectBySlug('heyhab').site;
const IMG = '/images/heyhab';

function Section({ index, label, title, children }) {
  return (
    <section className="case-section">
      <div className="case-section-head">
        <div className="idx">{index}: {label}</div>
        <h2 className="title">{title}</h2>
      </div>
      <div className="case-section-body">{children}</div>
    </section>
  );
}

function Shot({ src, alt, children }) {
  return (
    <figure className="hh-shot">
      <img src={`${IMG}/${src}.jpg`} alt={alt} loading="lazy" />
      <figcaption>{children}</figcaption>
    </figure>
  );
}

function Table({ head, rows }) {
  return (
    <div className="hh-table-wrap">
      <table className="hh-table">
        <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i} data-label={head[i]}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

const STAGES = [
  ['CONNECT', 'Start from the business website. A bounded crawl reads it and proposes source-linked knowledge.'],
  ['REVIEW', 'The owner approves, edits, or rejects what was found. Conflicts and gaps are shown, not guessed through.'],
  ['AUTHORIZE', 'The owner decides what HeyHab may prepare. Each reply still waits for approval.'],
  ['SEE RESULTS', 'A history of what was prepared, approved, sent by the owner, and reported as resolved.'],
];

export default function HeyHabCaseStudy() {
  return (
    <>
      <Section index="01" label="What is HeyHab" title="Your business. Handled.">
        <p className="hh-lead">HeyHab is an early AI-powered support and business operations prototype. It is more than an AI email assistant. A chatbot answers a question. HeyHab is being built to organize the work around that question, help the owner make the decision, and keep track of whether it actually got done.</p>
        <p>Picture someone running a small business. A customer asks for a custom order. Answering is the easy part. Someone still has to check what is possible, decide, promise a date, remember the promise, and make sure it happens. HeyHab is aimed at everything after the first reply.</p>
        <div className="hh-note">
          <p><b>Where it stands.</b> Early prototype. Tested on synthetic data. Not available to customers, no pricing, and not measured as faster, cheaper, or more accurate than any other tool. The final section of this page separates what works from what does not exist yet.</p>
        </div>
        <Shot src="home" alt="The HeyHab home page with the headline Your business. Handled. beside a glowing A-frame cabin.">The public site at heyhab.app. Everything on it is labeled as a fictional example.</Shot>
        <div className="hh-actions">
          <a className="btn btn-primary" href={`${SITE}demo/`} target="_blank" rel="noopener noreferrer">Watch the demo ↗</a>
          <a className="btn" href={`${SITE}compare`} target="_blank" rel="noopener noreferrer">How it compares ↗</a>
        </div>
      </Section>

      <Section index="02" label="Why I built it" title="Support is more than answering emails.">
        <p>I have worked in customer support, and I keep building tools around it. Sidecar, one of my earlier projects, drafts replies from approved knowledge base articles. It taught me that a good draft only solves part of the job. The rest of the job is:</p>
        <ul className="bullet-list">
          <li>Finding accurate information.</li>
          <li>Understanding what the customer actually needs.</li>
          <li>Keeping knowledge organized, so employees do not give conflicting answers.</li>
          <li>Identifying the work that requires attention.</li>
          <li>Preparing the next appropriate action.</li>
          <li>Keeping humans responsible for important decisions.</li>
          <li>Verifying that something was actually completed.</li>
        </ul>
        <p>Those steps are where things get dropped. Nobody loses a customer over a slow greeting. They lose one over a promise nobody tracked. I built HeyHab to test whether software can carry that load for an owner without pretending to replace their judgment.</p>
      </Section>

      <Section index="03" label="What makes it different" title="Your AI answered the questions. Who's handling the rest?">
        <p>The existing tools are good, and HeyHab is not trying to replace them. Shopify Inbox is free and includes an AI agent. Freshdesk, Gorgias, and Intercom are built for support teams and do tracking, escalation, and reporting well. If they already cover what you need, you should not need HeyHab.</p>
        <p>One Shopify merchant told us Shopify handles about 90% of the questions that would otherwise reach them, and they still use Freshdesk. That is one owner's experience, not a benchmark. It does show the gap: the remaining requests are the ones with a decision, a date, or work attached.</p>
        <Table
          head={['', 'What it is for', 'Where the work stops']}
          rows={[
            ['AI chatbot', 'Answers a question.', 'At the answer.'],
            ['Shopify Inbox', 'Storefront chat with an AI agent connected to the catalog and policies.', 'At the handoff, once a conversation needs the owner.'],
            ['Freshdesk and similar', 'Help desks with queues, seats, and workflow settings for support teams.', 'Tracks the work well, but someone has to run the help desk.'],
            ['HeyHab (being built)', 'Organize, prepare, coordinate, and track the work around a question, for an owner.', 'At the owner\'s decision and a recorded result. Early, and its advantage is unproven.'],
          ]}
        />
        <h3>A practical example</h3>
        <p>A customer writes: "Can you make a custom order?" A chatbot can reply with whatever the policy page says. Then the real work starts. HeyHab's workflow recognizes that this needs the owner, names the information that is missing, prepares the next reply for approval, and records what was decided. In testing it also keeps "drafted", "authorized", "sent", and "worked" as four different facts, so a drafted reply is never mistaken for a finished job.</p>
        <p>This example describes tested behavior on synthetic data. Shopify integration is proposed, not built, and connecting a live email inbox is in development.</p>
      </Section>

      <Section index="04" label="How it works" title="Connect. Review. Authorize. See results.">
        <ol className="hh-stages">
          {STAGES.map(([k, t]) => <li key={k}><b>{k}</b>{t}</li>)}
        </ol>
        <h3>Connect</h3>
        <p>The owner enters their website. A same-origin crawl with size and time limits reads it. Each page section becomes a proposed article linked to its source. Scripts are stripped, requests to private addresses are blocked, and text that tries to give instructions to an AI is quarantined.</p>
        <h3>Review</h3>
        <p>Nothing is usable until the owner approves it. Only approved knowledge can be retrieved. If the FAQ says 14 days and the returns page says 30, HeyHab shows the conflict and asks.</p>
        <Shot src="readiness" alt="The Atlas Ridge website readiness page listing a return policy conflict and answers the site can give.">Website readiness in the synthetic demo: what the site can answer, and what needs a decision first.</Shot>
        <h3>Authorize</h3>
        <p>Customer questions run through classification, an evidence check, drafting, and a grounding check, then wait for the owner. The owner sends the message themselves. Permissions for routine replies exist as a bounded simulation that fails closed: address changes, refunds, delivery commitments, cancellations, and safety concerns are always blocked.</p>
        <Shot src="autopilot" alt="The Autopilot page titled Narrow permission. Fail closed. listing allowed and always blocked request types.">The permission boundary, shown in the demo as a static snapshot. Delivery here is simulated. No messages are sent.</Shot>
        <h3>See results</h3>
        <p>Every case keeps its history. The closest thing to proof today is an owner-recorded resolution, so HeyHab labels it owner-reported. It has no independent way to confirm an outcome, and it never says it does.</p>
      </Section>

      <Section index="05" label="Atlas Ridge Electronics" title="A fictional business, a real workflow.">
        <div className="hh-note">
          <p><b>Atlas Ridge Electronics is synthetic.</b> The business, customers, and cases are invented. The public demo is static and scripted: it calls no server, reads no real business, and sends nothing. Every step illustrates behavior tested in the private prototype.</p>
        </div>
        <p>The demo follows one question through six chapters: "Does the Beacon Lamp come in blue?" The catalog does not list blue, so HeyHab says it cannot confirm that rather than inventing an answer. The owner decides. When the catalog changes, the old answer is pulled back for review.</p>
        <div className="hh-grid">
          <Shot src="ch3" alt="Demo chapter three: a prepared reply says blue cannot be confirmed, waiting for the owner.">The owner decides. The catalog does not list blue, so the prepared reply does not promise it.</Shot>
          <Shot src="ch5" alt="Demo chapter five: the catalog gains blue and the earlier reply goes back to the owner.">The business changes. An earlier reply is withdrawn and a new one waits for review.</Shot>
        </div>
        <Shot src="brief" alt="The Brief page reading 8 things need you, 4 replies are ready, with a critical safety case escalated.">The Brief: what needs the owner first. A charger that smells like burning is escalated to a person, with no draft of safety advice.</Shot>
        <div className="hh-grid">
          <Shot src="cases" alt="A table of synthetic cases with their categories and states.">Every case with its state and category.</Shot>
          <Shot src="knowledge" alt="Approved knowledge cards with source links and a conflict banner.">Only approved evidence supports a reply. The return-window conflict is surfaced at the top.</Shot>
        </div>
        <div className="hh-actions">
          <a className="btn btn-primary" href={`${SITE}demo/`} target="_blank" rel="noopener noreferrer">Open the Atlas Ridge demo ↗</a>
        </div>
      </Section>

      <Section index="06" label="Technical architecture" title="Models propose. Checks and the owner decide.">
        <p>The prototype is a Node application with no runtime dependencies beyond Node itself, using SQLite for durable state. The central decision was to give language models the smallest possible job. Each responsibility sits where it can be tested.</p>
        <Table
          head={['Responsibility', 'How', 'Why']}
          rows={[
            ['Classification', 'Versioned deterministic rules for intent, urgency, and safety.', 'Safety handling must behave the same every time, and it must work when every model is down.'],
            ['Local Ollama models', 'Language drafting through Ollama, restricted to localhost, with an extractive fallback that quotes approved text.', 'Customer text stays on the machine, and no model means degraded wording, not a stopped workflow.'],
            ['JEV', 'TypeSafe\'s hosted structured decision API. In shadow mode it only records a recommendation. In the explicitly selected active mode it may influence allowlisted internal routing such as category, priority, and owner attention.', 'Useful judgment without control. Urgency may only rise, safety cannot be downgraded, and JEV writes no customer text.'],
            ['Knowledge', 'Articles with versions and sources, owner approval, and contradiction detection. Approved FAQs are bound to the exact source version.', 'When a source changes, reuse stops and the answer returns to review.'],
            ['Source-grounded replies', 'Retrieval from approved knowledge only. Every subject term must be covered or HeyHab abstains.', 'Abstaining is safer than a confident guess.'],
            ['Deterministic verification', 'Evidence contract heyhab-evidence/1 checks each claim against a source passage, including numbers, negation, and citations. A separate answer-fit gate checks that each part of the question is answered.', 'A check that is not a model cannot be talked out of its result.'],
            ['Human approval', 'The owner approves the exact reply. A changed draft or source invalidates it. Standing authorizations cannot send.', 'Responsibility stays with a person, enforced in code.'],
            ['Workflow states', 'Received, Classified, Preparing response, Awaiting owner approval, Approved, Follow-up required or Awaiting information, Resolved, plus Escalated and Merged duplicate.', 'Resolved requires a recorded resolution, so a case cannot quietly disappear.'],
            ['Error handling', 'Transactions, version checks, idempotent ingest, and job recovery. If a process stops during a hosted call, the attempt is recorded as execution unknown and is not repeated.', 'No duplicate paid calls, and no invisible failure.'],
            ['Evidence and observability', 'Audit log, provider attempts with model, latency, and cost metadata, and a hash of the input instead of a second copy of customer text.', 'Any decision can be explained afterward.'],
          ]}
        />
        <p>The proof ladder runs identified, drafted, authorized, executed, attested. Each rung needs its own evidence. "Executed" can only mean the owner reported sending it, and that rule is enforced by the database schema. A simulated delivery never counts.</p>
      </Section>

      <Section index="07" label="Design and experience" title="Making business operations feel approachable.">
        <p>I wanted HeyHab to feel less like a traditional support dashboard and more like a workspace where business owners can see what needs attention.</p>
        <p>The A-frame identity brings warmth to the experience, while the owner application focuses on clarity, organization, and making the next action obvious.</p>
        <p>The design supports the same principle as the technology: simplify complex work without hiding what is happening.</p>
        <Shot src="intro" alt="The HeyHab A-frame with a miniature workspace of shelves and a lamp inside.">The A-frame identity on heyhab.app.</Shot>
      </Section>

      <Section index="08" label="Challenges, results, lessons" title="What was hard, and what is still unfinished.">
        <h3>A verified answer can still be wrong</h3>
        <p>In one test, a customer asked how many sizes a bag came in, and the draft replied with a free shipping sentence. Every word was grounded, and it passed. The grounding check only asked whether a sentence came from a source. The fix was a separate deterministic answer-fit gate: a question is split into parts, each part needs a sentence that actually answers it, and otherwise the draft is withheld.</p>
        <h3>Testing a model honestly</h3>
        <p>In a 20-case comparison, deterministic rules and replayed JEV results each matched 13 support-outcome labels, a local decision engine matched 3, and none produced an unsafe draft. JEV added no workflow gain on that fixture, so it did not get automatic routing. It is only used when selected, inside narrow limits. The sample is small, and the document says so.</p>
        <h3>Results</h3>
        <Table
          head={['Measure', 'Result', 'Reading it honestly']}
          rows={[
            ['Automated tests', '381 of 381 passing', 'Latest engine branch, re-run on 2026-10-31.'],
            ['Incorrect ready answers', '0 of 83', 'Frozen 83-question evaluation with the extractive engine. Baseline was also 0.'],
            ['Correct and ready', '39 (baseline 27)', 'A clear gain, but more than half still did not reach ready.'],
            ['Justified escalations', '22 (baseline 33)', 'A person was the right answer.'],
            ['Unnecessary escalations', '22 (baseline 23)', 'The biggest remaining weakness. HeyHab is still too cautious.'],
            ['Messages sent, hosted spend', '0 and 0', 'Integrity check for that run.'],
          ]}
        />
        <p>These are evaluation results on test questions, not results from a running business. There are no customer outcomes to report.</p>
        <h3>What works today, and what does not</h3>
        <Table
          head={['Status', 'What']}
          rows={[
            ['Tested on synthetic data', 'Website review, approved knowledge, conflict detection, recognizing what needs the owner, naming missing information, prepared replies, usual replies, Living FAQ, decision history, owner-reported completion.'],
            ['Built, not available', 'Tracking responsibility and authorized deadlines, and bringing overdue commitments back to the owner.'],
            ['In development', 'Connecting a live email inbox.'],
            ['Proposed', 'Shopify integration, ranking open work by urgency, independently confirming outcomes.'],
          ]}
        />
        <h3>What I learned</h3>
        <ul className="bullet-list">
          <li>The word "handled" is a promise, so the product has to show its evidence for it.</li>
          <li>Being honest about status is a design problem as much as a writing problem.</li>
          <li>Separate checks catch separate failures. Sourced, relevant, approved, and finished are four questions.</li>
          <li>The next job is reducing unnecessary escalations without giving up zero incorrect answers.</li>
        </ul>
      </Section>
    </>
  );
}

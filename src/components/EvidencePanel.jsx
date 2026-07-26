import React, { useRef } from 'react';
import { motion, useReducedMotion, useInView } from 'framer-motion';
import { FLOWS } from '../data/evidenceFlows.js';

const EASE = [0.16, 1, 0.3, 1];

function stageVariants(reduced) {
  return {
    hidden: reduced ? { opacity: 1 } : { opacity: 0, y: 12 },
    show: (i) => ({
      opacity: 1,
      y: 0,
      transition: reduced ? { duration: 0 } : { duration: 0.5, ease: EASE, delay: i * 0.09 },
    }),
  };
}

/** State-colored classification tag — color comes from the shared
 * --state-* token vocabulary so hero, homepage, and case-study all agree. */
function StateTag({ state, children }) {
  return (
    <span className="ep-tag" style={{ '--tag-c': `var(--state-${state}, var(--graphite))` }}>
      {children}
    </span>
  );
}

/**
 * One workflow-stage row: numbered node + label + detail, with an
 * optional classification tag. Shared by every project's flow list.
 */
function Stage({ n, label, detail, tag, state = 'incoming', last = false, i, reduced }) {
  return (
    <motion.li
      className={'ep-stage' + (last ? ' ep-stage--last' : '')}
      variants={stageVariants(reduced)}
      custom={i}
    >
      <span className="ep-stage-rail" aria-hidden="true">
        <span className="ep-stage-node" style={{ background: `var(--state-${state}, var(--ink))` }} />
      </span>
      <div className="ep-stage-body">
        <div className="ep-stage-head">
          <span className="ep-stage-n">{n}</span>
          <span className="ep-stage-label">{label}</span>
          {tag && <StateTag state={state}>{tag}</StateTag>}
        </div>
        <p className="ep-stage-detail">{detail}</p>
      </div>
    </motion.li>
  );
}

function PanelFrame({ title, children, ariaLabel }) {
  return (
    <div className="ep-panel" role="group" aria-label={ariaLabel}>
      <div className="ep-panel-bar">
        <span className="ep-panel-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="ep-panel-title">{title}</span>
      </div>
      <div className="ep-panel-body">{children}</div>
    </div>
  );
}

function Flow({ stages, reduced }) {
  return (
    <ol className="ep-flow">
      {stages.map((s, i) => (
        <Stage key={s.n} {...s} i={i} reduced={reduced} last={!!s.last} />
      ))}
    </ol>
  );
}

/* ── Sidecar ─────────────────────────────────────────────── */
function SidecarPanel({ reduced }) {
  return (
    <PanelFrame
      title="sidecar · support console (example)"
      ariaLabel="Sidecar example workflow: incoming request through human review"
    >
      <Flow stages={FLOWS.sidecar.stages} reduced={reduced} />
    </PanelFrame>
  );
}

/* ── OpenClaw / Hermes ───────────────────────────────────── */
function HermesPanel({ reduced }) {
  const f = FLOWS.openclaw;
  return (
    <>
      <PanelFrame
        title="hermes · supervised inspection (example)"
        ariaLabel="Hermes example workflow: request through verification, no external action performed"
      >
        <Flow stages={f.stages} reduced={reduced} />

        <div className="ep-audit">
          <div className="ep-audit-label">Sanitized audit-style excerpt — ordered events, not timestamps</div>
          <ol className="ep-audit-list">
            {f.audit.map((line) => <li key={line}>{line}</li>)}
          </ol>
        </div>
      </PanelFrame>

      <div className="ep-stack-split">
        <div className="ep-stack-tag">BUILT AROUND HERMES AGENT + OLLAMA + CUSTOM WORKFLOWS</div>
        <div className="ep-stack-cols">
          <div className="ep-stack-col">
            <div className="ep-stack-col-head">Open-source foundation</div>
            <ul>{f.openSource.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div className="ep-stack-col ep-stack-col--mine">
            <div className="ep-stack-col-head">Christopher's system layer</div>
            <ul>{f.systemLayer.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Help Nearby ─────────────────────────────────────────── */
function HelpNearbyPanel({ reduced }) {
  return (
    <PanelFrame
      title="help nearby · resource finder (example)"
      ariaLabel="Help Nearby example workflow: ZIP search through verification"
    >
      <Flow stages={FLOWS['help-nearby'].stages} reduced={reduced} />
    </PanelFrame>
  );
}

/* ── GroundRules ─────────────────────────────────────────── */
function GroundRulesPanel() {
  return (
    <PanelFrame
      title="groundrules · screening packet (representative)"
      ariaLabel="GroundRules representative screening report with source and verification labels"
    >
      <div className="ep-packet-note">REPRESENTATIVE OUTPUT — sample screening packet, not a live lookup</div>
      <dl className="ep-packet">
        {FLOWS.groundrules.rows.map((r) => (
          <div className="ep-packet-row" key={r.k}>
            <dt>{r.k}</dt>
            <dd>
              <span className="ep-packet-val">{r.v}</span>
              <StateTag state={r.tone === 'confirmed' ? 'verified' : r.tone === 'verify' ? 'review' : 'evidence'}>
                {r.tag}
              </StateTag>
            </dd>
          </div>
        ))}
      </dl>
    </PanelFrame>
  );
}

/* ── Parcel Engine ───────────────────────────────────────── */
function ParcelEnginePanel({ reduced }) {
  return (
    <PanelFrame
      title="parcel-engine · parse-to-export (representative)"
      ariaLabel="Parcel Engine representative workflow from legal description to export"
    >
      <div className="ep-packet-note">REPRESENTATIVE OUTPUT — illustrative parcel, not real APN or legal description</div>
      <svg
        className="ep-parcel-diagram"
        viewBox="0 0 320 170"
        role="img"
        aria-label="Simplified five-sided parcel boundary diagram with point-of-beginning marker"
      >
        <polygon points="70,132 92,54 178,40 232,86 214,140" className="ep-parcel-poly" />
        <circle cx="70" cy="132" r="4" className="ep-parcel-pob" />
        <text x="58" y="146" className="ep-parcel-text">POB</text>
        {[[92,54],[178,40],[232,86],[214,140]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="2.6" className="ep-parcel-vtx" />
        ))}
      </svg>
      <ol className="ep-flow">
        <Stage n="01" label="INPUT" detail="Legal-description calls." state="incoming" i={0} reduced={reduced} />
        <Stage n="02" label="PARSE" detail="Lines, bearings, distances, and curves interpreted." state="processing" i={1} reduced={reduced} />
        <Stage n="03" label="GEOMETRY" detail="Parcel boundary generated." state="processing" i={2} reduced={reduced} />
        <Stage n="04" label="CLOSURE" detail="Closure and misclosure calculated for review." tag="REQUIRES VERIFICATION" state="review" i={3} reduced={reduced} />
        <Stage n="05" label="OUTPUT" detail="DXF, GeoJSON, and a coordinate report exported." state="export" i={4} reduced={reduced} last />
      </ol>
    </PanelFrame>
  );
}

const PANELS = {
  sidecar: SidecarPanel,
  openclaw: HermesPanel,
  'help-nearby': HelpNearbyPanel,
  groundrules: GroundRulesPanel,
  'parcel-engine': ParcelEnginePanel,
};

const COPY = {
  sidecar: {
    heading: 'How a draft actually gets built.',
    body:
      'This is a sanitized walkthrough of the Sidecar drafting loop — the same stages every ticket goes through, shown with example content instead of real customer data. Nothing here calls a live service.',
  },
  openclaw: {
    heading: 'What a supervised action looks like.',
    body:
      'OpenClaw proposes actions; it does not take them unsupervised. This is a sanitized example of the request → permission → execution → verification sequence, plus where the open-source foundation ends and the system layer Christopher built begins.',
  },
  'help-nearby': {
    heading: 'From a ZIP code to a next step.',
    body:
      'A representative walkthrough of the Help Nearby search flow — the same category structure the live prototype uses, ending with an honest reminder that resource data is not yet date-verified.',
  },
  groundrules: {
    heading: 'What a first-pass report actually shows.',
    body:
      'A representative screening packet — the same category structure GroundRules produces for a real address, with source and verification labels so it is clear what is confirmed, what is a signal, and what still needs a human to check.',
  },
  'parcel-engine': {
    heading: 'From legal description to exportable geometry.',
    body:
      'A representative walkthrough of the parse → geometry → closure → export pipeline, illustrated with a simplified parcel shape rather than a real legal description or APN.',
  },
};

export default function EvidencePanel({ project }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.12 });
  const Panel = PANELS[project.slug];
  if (!Panel) return null;
  const copy = COPY[project.slug];
  const show = reduced || inView;

  return (
    <div className="container-wide evidence-block" ref={ref}>
      <div className="evidence-grid">
        <motion.div
          className="evidence-copy"
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={show ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <div className="idx">§ Evidence — how it actually works</div>
          <h2>{copy.heading}</h2>
          <p>{copy.body}</p>
          <div className="evidence-cta">
            {project.demo && (
              <a href={project.demo} target="_blank" rel="noreferrer" className="btn btn-primary">
                Live demo ↗
              </a>
            )}
            {project.repo && (
              <a href={project.repo} target="_blank" rel="noreferrer" className="btn">
                Source ↗
              </a>
            )}
          </div>
        </motion.div>
        <motion.div
          className="evidence-panel"
          initial="hidden"
          animate={show ? 'show' : 'hidden'}
        >
          <Panel reduced={reduced} />
        </motion.div>
      </div>
    </div>
  );
}

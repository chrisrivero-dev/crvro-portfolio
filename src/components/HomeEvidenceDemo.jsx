import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FLOWS } from '../data/evidenceFlows.js';

const EASE = [0.16, 1, 0.3, 1];

/**
 * Compact homepage version of a project's workflow evidence — same
 * FLOWS data as the case-study EvidencePanel, shortened labels, no
 * audit excerpt / open-source split (those stay case-study-only).
 */
function CompactFlow({ stages }) {
  const reduced = useReducedMotion();
  return (
    <ol className="hd-flow">
      {stages.map((s, i) => (
        <motion.li
          key={s.n}
          className="hd-stage"
          initial={reduced ? false : { opacity: 0, x: -6 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.4, ease: EASE, delay: reduced ? 0 : i * 0.08 }}
        >
          <span className="hd-dot" style={{ background: `var(--state-${s.state}, var(--ink))` }} aria-hidden="true" />
          <span className="hd-label">{s.label}</span>
          <span className="hd-short">{s.short}</span>
          {s.tag && (
            <span className="hd-tag" style={{ '--tag-c': `var(--state-${s.state}, var(--graphite))` }}>
              {s.tag}
            </span>
          )}
        </motion.li>
      ))}
    </ol>
  );
}

function CompactPacket({ rows }) {
  const reduced = useReducedMotion();
  return (
    <dl className="hd-packet">
      {rows.slice(0, 4).map((r, i) => (
        <motion.div
          className="hd-packet-row"
          key={r.k}
          initial={reduced ? false : { opacity: 0, x: -6 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.4, ease: EASE, delay: reduced ? 0 : i * 0.08 }}
        >
          <dt>{r.k}</dt>
          <dd>
            <span>{r.v}</span>
            <span
              className="hd-tag"
              style={{ '--tag-c': `var(--state-${r.tone === 'confirmed' ? 'verified' : r.tone === 'verify' ? 'review' : 'evidence'})` }}
            >
              {r.tag}
            </span>
          </dd>
        </motion.div>
      ))}
    </dl>
  );
}

export default function HomeEvidenceDemo({ slug }) {
  const flow = FLOWS[slug];
  if (!flow) return null;
  return (
    <div className="hd-demo" role="group" aria-label={`${flow.console} — compact demonstration`}>
      <div className="hd-demo-bar">
        <span className="hd-demo-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="hd-demo-title">{flow.console}</span>
      </div>
      <div className="hd-demo-body">
        {flow.rows ? <CompactPacket rows={flow.rows} /> : <CompactFlow stages={flow.stages} />}
      </div>
    </div>
  );
}

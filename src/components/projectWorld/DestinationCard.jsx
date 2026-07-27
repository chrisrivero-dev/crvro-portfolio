// ============================================================
// Project World — destination card
//
// Deliberately the same card as the rest of the site: it reuses
// .pr-card, .proj-status, .pr-process-rail and ProjectMark, and
// shows only the homepage summary. The detailed evidence panels
// stay on the case-study pages.
// ============================================================

import React from "react";
import ProjectMark from "../ProjectMark.jsx";

function ProcessRail({ labels, title }) {
  return (
    <ol className={`pr-process-rail cols-${labels.length}`} aria-label={`${title} process preview`}>
      {labels.map((label, i) => (
        <li key={label} style={{ "--i": i }}>
          <span className="pr-process-node" aria-hidden="true" />
          <span>{label}</span>
        </li>
      ))}
    </ol>
  );
}

export default function DestinationCard({ card, onSail }) {
  return (
    <>
      <div className="pr-card-top">
        <span className="pr-idx">{card.idx}</span>
        <ProjectMark shape={card.shape} color={card.accent} size={38} />
        <div className="pr-meta">
          {card.badge && <span className="proj-status">{card.badge}</span>}
          <span className="prm-kind">{card.kind}</span>
        </div>
      </div>

      <h3 className="pr-title">
        {card.title} <em>{card.em}</em>
      </h3>
      <p className="pr-desc">{card.desc}</p>
      <span className="pr-tags">{card.tags}</span>

      <ProcessRail labels={card.process} title={card.title} />

      {card.slug ? (
        <a href={`/projects/${card.slug}`} className="pr-cta-link">
          View case study <span className="ar">→</span>
        </a>
      ) : (
        <button type="button" className="pr-cta-link" onClick={() => onSail(card.ctaStop)}>
          {card.ctaText} <span className="ar">→</span>
        </button>
      )}

      {card.foot && <p className="pr-foot-note">{card.foot}</p>}
    </>
  );
}

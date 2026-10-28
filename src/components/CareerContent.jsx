// The career pages as real DOM, rendered from src/data/career.js. One set of components feeds both surfaces:
//   - the reading surface laid over the open notebook in the 3D room (workspace3d), and
//   - the plain LO-FI career page (CareerPage.jsx), which never loads the 3D engine.
// Nothing here knows about the camera; `onProof` is how a host handles case-study links (the room remembers where you were).
import React from 'react';
import { ROLES, HIGHLIGHTS, CONTACT, CAREER_PAGES } from '../data/career.js';
import { PROJECTS, GIS_PROJECTS } from '../data/projects.js';
import { CASE_IDS } from '../data/caseIds.js';
import '../styles/career.css';

const BY_SLUG = Object.fromEntries([...PROJECTS, ...GIS_PROJECTS].map((p) => [p.slug, p]));

export function WorkHistory({ headingProps = {} }) {
  return (
    <div className="career-page" data-career-page="work">
      <h2 className="career-h" {...headingProps}>Work history</h2>
      <ol className="career-roles">
        {ROLES.map((r) => (
          <li key={r.id} className="career-role" data-role={r.id}>
            <p className="career-dates">{r.dates}</p>
            <h3 className="career-title">{r.title}</h3>
            <p className="career-employer">{r.employer}{r.type ? ` · ${r.type}` : ''} · {r.place}</p>
            <p className="career-summary">{r.summary}</p>
            <ul className="career-does">{r.does.map((d) => <li key={d}>{d}</li>)}</ul>
            <p className="career-strengths"><span className="career-k">Strengths</span> {r.strengths.join(' · ')}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Highlights({ onProof, headingProps = {} }) {
  return (
    <div className="career-page" data-career-page="highlights">
      <h2 className="career-h" {...headingProps}>Selected highlights</h2>
      <ul className="career-hl">
        {HIGHLIGHTS.map((h) => (
          <li key={h.id} className="career-hlitem" data-highlight={h.id}>
            <h3 className="career-title">{h.topic}</h3>
            <p><span className="career-k">Problem</span> {h.problem}</p>
            <p><span className="career-k">What I did</span> {h.did}</p>
            {h.result && <p><span className="career-k">Result</span> {h.result}</p>}
            {h.proof && (
              <p>
                <a className="career-link" href={`/projects/${h.proof}`} onClick={onProof ? (e) => { e.preventDefault(); onProof(h.proof); } : undefined}>
                  Read the case study · {CASE_IDS[h.proof]} {BY_SLUG[h.proof].title} →
                </a>
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ResumeContact({ onWork, headingProps = {} }) {
  return (
    <div className="career-page" data-career-page="resume">
      <h2 className="career-h" {...headingProps}>Résumé and contact</h2>
      <ul className="career-contact">
        <li>
          <a className="career-link" href="/#career/work" onClick={onWork ? (e) => { e.preventDefault(); onWork(); } : undefined}>Professional background</a>
          <span> The work history on the first page, with the roles and dates above.</span>
        </li>
        {CONTACT.resumePdf && (
          <li><a className="career-link" href={CONTACT.resumePdf} download>Download résumé (PDF)</a></li>
        )}
        <li><a className="career-link" href={CONTACT.linkedin.href} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a> <span>{CONTACT.linkedin.text}</span></li>
        <li><a className="career-link" href={CONTACT.email.href}>Email</a> <span>{CONTACT.email.text}</span></li>
        <li><a className="career-link" href={CONTACT.github.href} target="_blank" rel="noopener noreferrer">GitHub ↗</a> <span>{CONTACT.github.text}</span></li>
      </ul>
      {!CONTACT.resumePdf && <p className="career-note">A downloadable résumé is not posted on this site.</p>}
    </div>
  );
}

export const PAGE_VIEW = { work: WorkHistory, highlights: Highlights, resume: ResumeContact };
export { CAREER_PAGES };

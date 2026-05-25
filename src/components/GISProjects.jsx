import React from 'react';
import ProjectMark from './ProjectMark.jsx';
import { GIS_PROJECTS } from '../data/projects.js';

export default function GISProjects() {
  return (
    <section className="work" id="gis-tools" data-screen-label="03 GIS Tools">
      <div className="container-wide">
        <div className="section-head reveal">
          <div className="index">§ 03 — Mapping &amp; GIS Tools</div>
          <div className="h">
            GIS and CAD tools built from <em>real mapping workflows.</em>
          </div>
        </div>
        <p
          className="reveal"
          style={{
            marginTop: 'var(--sp-6)',
            marginBottom: 'var(--sp-7)',
            color: 'var(--fg-2)',
            fontSize: 'var(--fs-16)',
            lineHeight: '1.6',
            maxWidth: '640px',
          }}
        >
          My professional background includes several years working directly in
          GIS/CAD support and mapping operations. These tools come from workflows
          I know firsthand — parcel processing, procedural documentation,
          assessment records, and local QA.
        </p>
        <ul className="project-list" data-stagger>
          {GIS_PROJECTS.map((p) => (
            <li key={p.id} style={{ listStyle: 'none' }}>
              <a
                className="project-row reveal"
                href={'/projects/' + p.slug}
                data-screen-label={'GIS Project ' + p.slug}
              >
                <span className="idx">{p.n}</span>
                <span className="mark-cell">
                  <ProjectMark shape={p.shape} color={p.accent} />
                </span>
                <span className="info">
                  <h3 className="title">
                    {p.title} <em>{p.titleEm}</em>
                  </h3>
                  <p className="desc">{p.desc}</p>
                </span>
                <span className="meta-cell">
                  {p.statusBadge && (
                    <span className="proj-status">{p.statusBadge}</span>
                  )}
                  <span className="kind">{p.kind}</span>
                  <span className="yr">{p.year}</span>
                  <span className="tags">{p.tags[0]}</span>
                </span>
                <span className="arrow">→</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

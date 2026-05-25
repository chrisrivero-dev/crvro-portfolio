import React from "react";
import ProjectMark from "./ProjectMark.jsx";
import { PROJECTS } from "../data/projects.js";

export default function Projects() {
  return (
    <section className="work" id="work" data-screen-label="02 Work">
      <div className="container-wide">
        <div className="section-head reveal">
          <div className="index">§ 01 — Selected Work</div>
          <div className="h">A few systems I built around <em>support, automation, and decision workflows.</em></div>
        </div>
        <ul className="project-list" data-stagger>
          {PROJECTS.map((p) => (
            <li key={p.id} style={{ listStyle: "none" }}>
              <a className="project-row reveal" href={"/projects/" + p.slug} data-screen-label={"Project " + p.slug}>
                <span className="idx">{p.n}</span>
                <span className="mark-cell"><ProjectMark shape={p.shape} color={p.accent} /></span>
                <span className="info">
                  <h3 className="title">{p.title} <em>{p.titleEm}</em></h3>
                  <p className="desc">{p.desc}</p>
                </span>
                <span className="meta-cell">
                  {p.statusBadge && <span className="proj-status">{p.statusBadge}</span>}
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

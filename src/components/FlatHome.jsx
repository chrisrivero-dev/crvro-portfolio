import React from "react";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import { EXPERIENCES, hrefFor } from "../lib/experiences.js";
import { DISK_PROJECTS } from "../data/caseIds.js";
import { PROJECTS, GIS_PROJECTS } from "../data/projects.js";

const BY_SLUG = Object.fromEntries([...PROJECTS, ...GIS_PROJECTS].map((p) => [p.slug, p]));

// The non-3D home page: plain, semantic, fast. Used when WebGL2 is unavailable, when the 3D context is lost for good,
// or when the visitor chooses it. Deliberately not a second retro computer.
export default function FlatHome({ theme, onToggleTheme, notice, canTry3D, onTry3D }) {
  return (
    <>
      <Header activeId={null} theme={theme} onToggleTheme={onToggleTheme} />
      <main id="main" className="flat-home">
        <div className="container-wide">
          {notice && <p className="flat-notice" role="status">{notice}</p>}
          <p className="flat-eyebrow">SUPPORT AUTOMATION · AI OPERATIONS · GIS SYSTEMS</p>
          <h1 className="flat-h1">I turn difficult support and mapping workflows into controlled, testable software.</h1>
          <p className="flat-sub">I build Python automation and AI tools for support and GIS/CAD work I know firsthand.</p>
          <div className="flat-modeswitch" role="group" aria-label="Portfolio mode"><button type="button" onClick={onTry3D}>HI-FI <small>3D studio</small></button><span aria-current="true">LO-FI <small>plain 2D</small></span></div>

          <h2 className="flat-h2">Explore</h2>
          <ul className="flat-list">
            {EXPERIENCES.map((e) => (
              <li key={e.id}><a href={hrefFor(e)}><strong>{e.label}</strong></a> <span>{e.blurb}</span></li>
            ))}
          </ul>

          <h2 className="flat-h2">Case studies</h2>
          <ul className="flat-list">
            {DISK_PROJECTS.map((d) => (
              <li key={d.slug}><a href={`/projects/${d.slug}`}><strong>{BY_SLUG[d.slug].title}</strong></a> <span>{BY_SLUG[d.slug].titleEm}</span></li>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
    </>
  );
}

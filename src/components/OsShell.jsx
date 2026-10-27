import React, { useEffect, useRef } from "react";
import { EXPERIENCES } from "../lib/experiences.js";
import { CASE_IDS } from "../data/caseIds.js";
import { useReveal } from "../lib/pageEffects.js";
import { PROJECTS, GIS_PROJECTS } from "../data/projects.js";

const BY_SLUG = Object.fromEntries([...PROJECTS, ...GIS_PROJECTS].map((p) => [p.slug, p]));

// The immersive computer interface: what the CRT "becomes" when the visitor goes into it.
// It is a themed frame around the existing components (they are rendered unchanged inside it): a phosphor-dark palette
// (the site's own dark tokens, retuned to the CRT), the screen's scanline texture, a bezel frame, and a bar with the file
// tabs and an obvious Return to Workspace. Scrolling stays the document's, so Project World's scroll-driven journey,
// sticky stage and scroll restoration work exactly as before.
// `view` is an experience id, or `{ caseSlug }` for a project case study.
export default function OsShell({ view, children }) {
  const mainRef = useRef(null);
  const caseSlug = view?.caseSlug || null;
  const exp = caseSlug ? null : EXPERIENCES.find((e) => e.id === view);
  const title = caseSlug ? `${BY_SLUG[caseSlug].title}` : exp.label;
  useReveal(caseSlug || exp.id);

  useEffect(() => {
    document.body.classList.add("os-open");
    return () => document.body.classList.remove("os-open");
  }, []);

  useEffect(() => {
    const prev = document.title;
    document.title = caseSlug ? `${title}: Christopher Rivero` : `${title}: Christopher Rivero`;
    mainRef.current?.focus({ preventScroll: true });   // keyboard and screen-reader users land in the new content
    return () => { document.title = prev; };
  }, [caseSlug, exp?.id, title]);

  const path = caseSlug ? `CASE ${CASE_IDS[caseSlug] || ""}` : `${exp.file}.${exp.ext}`;
  return (
    <div className="os" data-theme="dark" data-os={caseSlug ? "case" : exp.id}>
      <div className="os__bg" aria-hidden="true" />
      <div className="os__frame" aria-hidden="true" />
      <header className="os__bar">
        <div className="os__id">
          <span className="os__brand">CRVRO-OS</span>
          <span className="os__path" aria-hidden="true">A:\{path}</span>
        </div>
        <nav className="os__tabs" aria-label="Computer">
          {EXPERIENCES.map((e) => (
            <a key={e.id} href={`/#${e.id}`} className={`os__tab${!caseSlug && e.id === exp.id ? " is-on" : ""}`} aria-current={!caseSlug && e.id === exp.id ? "page" : undefined}>
              <span className="os__tabn">{e.file}</span><span className="os__tabe">.{e.ext}</span>
            </a>
          ))}
        </nav>
        <a className="os__return" href="/" aria-label="Return to workspace">
          <span aria-hidden="true">◂</span> <span>Return to workspace</span>
        </a>
      </header>
      <main id="main" className="os__main" tabIndex={-1} ref={mainRef} aria-label={title}>
        {children}
      </main>
      <footer className="os__foot">
        <span>CRVRO-OS · {path}</span>
        <a href="mailto:christopherarivero@gmail.com">email</a>
        <a href="https://github.com/chrisrivero-dev" target="_blank" rel="noreferrer">github</a>
      </footer>
    </div>
  );
}

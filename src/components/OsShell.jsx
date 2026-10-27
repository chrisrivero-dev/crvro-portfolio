import React, { useEffect, useRef, useState } from "react";
import { EXPERIENCES } from "../lib/experiences.js";
import { CASE_IDS } from "../data/caseIds.js";
import { useReveal } from "../lib/pageEffects.js";
import { PROJECTS, GIS_PROJECTS } from "../data/projects.js";

const BY_SLUG = Object.fromEntries([...PROJECTS, ...GIS_PROJECTS].map((p) => [p.slug, p]));

// The immersive computer interface: what the CRT "becomes" when the visitor goes into it.
// It is the monitor itself: a bezel with the copper ring of the 3D screen opening, rounded glass with a vignette and a faint
// highlight, the CRVRO badge and power LED in the lower bezel, and a bar with the file tabs and an obvious Return to workspace.
// The existing components render unchanged inside it (phosphor-dark palette via the site's own dark tokens). Scrolling stays the
// document's, so Project World's scroll-driven journey, sticky stage and scroll restoration work exactly as before.
// `view` is an experience id, or `{ caseSlug }` for a project case study.
export default function OsShell({ view, children }) {
  const mainRef = useRef(null);
  const filesBtnRef = useRef(null);
  const panelRef = useRef(null);
  const [filesOpen, setFilesOpen] = useState(false);
  const caseSlug = view?.caseSlug || null;
  const exp = caseSlug ? null : EXPERIENCES.find((e) => e.id === view);
  const title = caseSlug ? BY_SLUG[caseSlug].title : exp.label;
  const key = caseSlug || exp.id;
  useReveal(key);

  useEffect(() => {
    document.body.classList.add("os-open");
    return () => document.body.classList.remove("os-open");
  }, []);

  useEffect(() => {
    const prev = document.title;
    document.title = `${title}: Christopher Rivero`;
    setFilesOpen(false);
    mainRef.current?.focus({ preventScroll: true });   // keyboard and screen-reader users land in the new content
    return () => { document.title = prev; };
  }, [key, title]);

  // phone file menu: Escape or an outside tap closes it; opening moves focus to the first file
  useEffect(() => {
    if (!filesOpen) return undefined;
    panelRef.current?.querySelector("a")?.focus({ preventScroll: true });
    const onKey = (e) => { if (e.key === "Escape") { e.preventDefault(); setFilesOpen(false); filesBtnRef.current?.focus({ preventScroll: true }); } };
    const onDown = (e) => { if (!panelRef.current?.contains(e.target) && !filesBtnRef.current?.contains(e.target)) setFilesOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onDown); };
  }, [filesOpen]);

  const path = caseSlug ? `CASE ${CASE_IDS[caseSlug] || ""}` : `${exp.file}.${exp.ext}`;
  return (
    <div className="os" data-theme="dark" data-os={caseSlug ? "case" : exp.id}>
      <div className="os__bg" aria-hidden="true" />
      <div className="os__glass" aria-hidden="true" />
      <div className="os__badge" aria-hidden="true"><span className="os__led" />CRVRO</div>
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
        <button
          type="button"
          ref={filesBtnRef}
          className="os__files"
          aria-expanded={filesOpen}
          aria-controls="os-files"
          onClick={() => setFilesOpen((v) => !v)}
        >
          <span className="os__filesk">FILES</span>
          <span className="os__filescur">{path}</span>
          <span aria-hidden="true">{filesOpen ? "▾" : "▸"}</span>
        </button>
        <a className="os__return" href="/" aria-label="Return to workspace">
          <span aria-hidden="true">◂</span> <span className="os__returnt">Return to workspace</span>
        </a>
        {filesOpen && (
          <nav id="os-files" className="os__filepanel" aria-label="Computer files" ref={panelRef}>
            {EXPERIENCES.map((e) => (
              <a key={e.id} href={`/#${e.id}`} className={`os__file${!caseSlug && e.id === exp.id ? " is-on" : ""}`} aria-current={!caseSlug && e.id === exp.id ? "page" : undefined}>
                <span className="os__filen">{e.file}<span className="os__tabe">.{e.ext}</span></span>
                <span className="os__fileb">{e.blurb}</span>
              </a>
            ))}
          </nav>
        )}
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

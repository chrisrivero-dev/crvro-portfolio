import React, { useEffect } from 'react';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import { WorkHistory, Highlights, ResumeContact } from './CareerContent.jsx';
import { navigate } from '../lib/location.js';

// LO-FI: the career notebook's content as one plain, semantic page. No 3D engine is loaded; the three pages are three
// sections of one document, and /#career/<page> scrolls to its section. Same components as the notebook's reading surface.
export default function CareerPage({ theme, onToggleTheme, page = 'work', onTry3D }) {
  useEffect(() => {
    const prev = document.title;
    document.title = 'Career: Christopher Rivero';
    return () => { document.title = prev; };
  }, []);
  // a hash on this page (/#career/highlights) scrolls to that section; the first page is the top of the document
  useEffect(() => {
    const el = page === 'work' ? null : document.getElementById(`career-${page}`);
    const t = setTimeout(() => { if (el) { el.scrollIntoView({ block: 'start' }); el.querySelector('h2')?.focus({ preventScroll: true }); } }, 60);
    return () => clearTimeout(t);
  }, [page]);
  return (
    <>
      <Header activeId={null} theme={theme} onToggleTheme={onToggleTheme} />
      <main id="main" className="flat-home career-flat" aria-label="Career">
        <div className="container-wide">
          <p className="flat-eyebrow">CAREER · WORK HISTORY · HIGHLIGHTS · CONTACT</p>
          <h1 className="flat-h1">Career</h1>
          <p className="flat-sub">Where I have worked, what I have built, and how to reach me. The same pages are in the notebook on the desk in the 3D studio.</p>
          {onTry3D && <div className="flat-modeswitch" role="group" aria-label="Portfolio mode"><button type="button" onClick={onTry3D}>HI-FI <small>open the notebook</small></button><span aria-current="true">LO-FI <small>plain 2D</small></span></div>}
          <nav aria-label="Career sections" className="career-jump">
            <a href="/#career/work">Work history</a> · <a href="/#career/highlights">Selected highlights</a> · <a href="/#career/resume">Résumé and contact</a>
          </nav>
          <section id="career-work" aria-label="Work history"><WorkHistory headingProps={{ tabIndex: -1 }} /></section>
          <section id="career-highlights" aria-label="Selected highlights"><Highlights headingProps={{ tabIndex: -1 }} /></section>
          <section id="career-resume" aria-label="Résumé and contact"><ResumeContact onWork={() => navigate('/#career/work')} headingProps={{ tabIndex: -1 }} /></section>
        </div>
      </main>
      <Footer />
    </>
  );
}

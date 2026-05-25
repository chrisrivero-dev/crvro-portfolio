import React from 'react';
import HeroSystemTrace from './HeroSystemTrace.jsx';

export default function Hero() {
  return (
    <section className="hero" id="top" data-screen-label="01 Hero">
      <div className="container-wide">
        <div className="grid">
          <div className="marker">
            <span>§ crvro.com</span>
            <span className="yr">2024 — 2026</span>
            <span>Lakewood, CA</span>
          </div>
          <div>
            <h1>
              I build internal tools for support teams and GIS workflows —{' '}
              <em>from systems I've actually worked in.</em>
            </h1>
            <p className="lede">
              Draft assistants grounded in approved KB content, local
              automation with confirmation gates and audit trails, and
              workflow tools for mapping and procedural work. Built from
              direct experience, not from the outside looking in.
            </p>
            <div className="meta-row">
              <span>
                <span className="lab">Focus —</span>AI Support Systems · Workflow Automation ·
                GIS / CAD Tooling
              </span>
              <span className="dot">·</span>
              <span>
                <span className="lab">Status —</span>Open to new work
              </span>
            </div>
            <a href="#work" className="scroll-cue">
              <span>01 — see the work</span>
              <span className="ar">↓</span>
            </a>
          </div>
        </div>
        <HeroSystemTrace />
      </div>
    </section>
  );
}

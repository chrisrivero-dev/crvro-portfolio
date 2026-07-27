import React from 'react';
import HeroCommandCenter from './HeroCommandCenter.jsx';

export default function Hero() {
  return (
    <section className="hero" id="top" data-screen-label="01 Hero">
      <div className="container-wide">
        <div className="grid">
          <div className="marker">
            <span>§ crvro.com</span>
            <span className="yr">2024 to 2026</span>
            <span>Lakewood, CA</span>
          </div>
          <div>
            <div className="eyebrow hero-eyebrow">
              SUPPORT AUTOMATION · AI OPERATIONS · GIS SYSTEMS
            </div>
            <h1>
              I turn difficult support and mapping workflows into{' '}
              <em>controlled, testable software.</em>
            </h1>
            <p className="hero-sub">
              I build Python automation and AI tools for support and GIS/CAD work I know firsthand.
            </p>
            <div className="meta-row">
              <span>
                <span className="lab">Focus</span>AI Support Systems · Workflow Automation ·
                GIS / CAD Tooling
              </span>
              <span className="dot">·</span>
              <span>
                <span className="lab">Status</span>Open to new work
              </span>
            </div>
            <a href="#work" className="scroll-cue">
              <span>01: see the work</span>
              <span className="ar">↓</span>
            </a>
          </div>
        </div>
        <HeroCommandCenter />
      </div>
    </section>
  );
}

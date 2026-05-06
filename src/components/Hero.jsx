import React from 'react';

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
              A builder of <em>small, useful systems.</em>
            </h1>
            <p className="lede">
              Automation, AI support systems, and small data workflows. Software
              that lives in a cron job, a Telegram bot, or a quiet python script
              that saves hours, reduces mistakes, and makes repetitive work feel
              manageable.
            </p>
            <div className="meta-row">
              <span>
                <span className="lab">Focus —</span>Automation · AI support ·
                GIS / CAD
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
      </div>
    </section>
  );
}

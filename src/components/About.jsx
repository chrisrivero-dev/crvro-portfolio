import React from 'react';

export default function About() {
  return (
    <section className="about" id="about" data-screen-label="03 About">
      <div className="container-wide">
        <div className="section-head reveal">
          <div className="index">§ 02 — About</div>
          <div className="h">
            Support ops, GIS work, and <em>the tools that came out of both.</em>
          </div>
        </div>
        <div className="grid">
          <div className="marker">
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--graphite)',
                paddingTop: 14,
                borderTop: '1px solid var(--ink)',
              }}
            >
              Bio
            </div>
          </div>
          <div className="body">
            <p>
              <em>I’m Christopher.</em> I build internal tools for support
              teams, automation workflows, and GIS/CAD operations — usually from
              problems I’ve seen up close.
            </p>
            <p>
              My background started in GIS/CAD support, where I worked across
              technical troubleshooting, mapping workflows, and procedural
              documentation. That experience pushed me deeper into support
              operations and practical automation: draft assistants grounded in
              approved content, confirmation gates before anything changes,
              audit trails that show what happened, and tools that help teams
              move faster without losing control.
            </p>
            <p>
              I’ve spent enough time inside these workflows to know where the
              real problems are — an AI that guesses when it has no match,
              automation that acts without showing its work, or a process where
              nobody owns the approved wording.
            </p>
            <p>
              If the work involves support engineering, automation, AI ops, or
              GIS/CAD tooling, I’d like to hear about it.
            </p>

            <div className="stat-list" data-stagger>
              <div className="row reveal">
                <span className="label">Based</span>
                <span className="value">Lakewood, CA · PT</span>
              </div>
              <div className="row reveal">
                <span className="label">Currently</span>
                <span className="value">
                  Building automation &amp; AI tooling
                </span>
              </div>
              <div className="row reveal">
                <span className="label">Open to</span>
                <span className="value">
                  Automation · AI support · GIS / CAD ops
                </span>
              </div>
              <div className="row reveal">
                <span className="label">Background</span>
                <span className="value">CAD / GIS, Python, on-device AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

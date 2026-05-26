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
              <em>I’m Christopher.</em> For several years I worked as a GIS/CAD
              Senior Customer Support Specialist — technical support, mapping
              workflows, and the procedural documentation that sits between the
              GIS software and the people using it. Later I moved into support
              operations and started building tools for those same workflows.
            </p>
            <p>
              I’ve spent enough time in those environments to know where the
              real problems are — not the ones that make good demos, but the
              ones that break trust quietly: an AI that guesses when it has no
              match, automation that acts without showing its work, a process
              where nobody owns the approved wording. The tools I build tend to
              start there.
            </p>
            <p>
              If the work involves support engineering, automation, AI ops, or
              GIS/CAD tooling — especially building for teams doing real
              operational work — I’d like to hear about it.
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

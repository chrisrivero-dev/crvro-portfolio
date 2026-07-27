import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1];

const OPERATOR_POINTS = [
  'Builds practical AI systems and internal tools.',
  'Focused on support operations, workflow automation, and GIS/CAD.',
  'Uses Hermes daily to coordinate projects, investigate problems, and troubleshoot workflows.',
  'Keeps human review, evidence, and final approval central to important actions.',
];

function OperatorProfile() {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="operator-profile"
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, ease: EASE }}
    >
      <div className="operator-portrait-frame">
        <div className="operator-portrait-bar">
          <span className="operator-portrait-dots" aria-hidden="true"><i /><i /><i /></span>
          <span className="operator-portrait-label">builder · profile</span>
        </div>
        <div className="operator-portrait-img-wrap">
          <span className="operator-tick operator-tick--tl" aria-hidden="true" />
          <span className="operator-tick operator-tick--tr" aria-hidden="true" />
          <span className="operator-tick operator-tick--bl" aria-hidden="true" />
          <span className="operator-tick operator-tick--br" aria-hidden="true" />
          <img
            className="operator-portrait-img"
            src="/images/6B4B95A1-EA8E-4643-B494-D08EB3979D57.JPG"
            alt="Portrait of Christopher Rivero."
            width="600"
            height="667"
            loading="lazy"
          />
        </div>
        <span className="operator-tag">SYSTEMS BUILDER</span>
      </div>

      <div className="operator-copy">
        <p className="operator-quote">
          “I tend to get a little obsessed with building. I’m always
          improving one system, starting another, or looking for practical
          ways AI can make difficult work easier for people.”
        </p>
        <ul className="operator-list">
          {OPERATOR_POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

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

        <OperatorProfile />

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
              <em>I’m Christopher.</em> I build practical AI systems and
              internal tools for support teams, workflow automation, and
              GIS/CAD operations — usually from problems I’ve worked with
              firsthand.
            </p>
            <p>
              My background started in GIS/CAD support, where I worked across
              technical troubleshooting, mapping workflows, procedural
              documentation, and customer support. That experience pushed me
              deeper into practical automation and human-supervised AI
              systems built around real operational needs.
            </p>
            <p>
              I built and configured my own local AI workstation and use
              Hermes as a second brain and daily AI assistant. It helps me
              coordinate projects, investigate problems, troubleshoot bugs,
              and keep work moving, while I remain responsible for final
              decisions and approvals.
            </p>
            <p>
              I focus on systems that use approved sources, show their
              evidence, require human review before important actions, and
              keep a clear record of what happened. I’ve seen where workflows
              break down — AI that guesses, automation that acts without
              showing its work, and processes with no clear ownership.
            </p>
            <p>
              I like to think about the big picture, but I also like to make
              things real. I’m constantly improving what I’ve built,
              exploring new projects, and looking for practical ways AI and
              technology can make difficult work easier for people.
            </p>
            <p>
              If the work involves applied AI, AI operations, support
              engineering, workflow automation, or GIS/CAD tooling, I’d like
              to hear about it.
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

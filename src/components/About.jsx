import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1];

const OPERATOR_POINTS = [
  'Builds practical AI systems and internal tools.',
  'Works across support operations, workflow automation, and GIS/CAD.',
  'Uses Hermes daily to coordinate projects and troubleshoot problems.',
  'Approves important actions before they run.',
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
              GIS/CAD operations. Most of them start with problems I’ve
              worked with firsthand.
            </p>
            <p>
              My background started in GIS/CAD support, where I handled
              technical problems, mapping workflows, documentation, and
              customer support. That work led me to build automation and AI
              tools for the same kinds of day-to-day problems.
            </p>
            <p>
              I built and configured my own local AI workstation, where I use
              Hermes as a second brain and daily assistant. It helps me
              organize projects, investigate problems, and troubleshoot bugs.
              I still make the final calls.
            </p>
            <p>
              I build tools that show where an answer came from and pause
              before important actions. Automation should save time without
              hiding what happened or who approved it.
            </p>
            <p>
              I’ve seen AI guess when it has no match. I’ve also seen
              automation make changes without leaving a clear record. I build
              around those failures so the person using the tool can see what
              happened.
            </p>
            <p>
              I usually have more ideas than time. I keep improving the
              systems I already use, and I start new projects when I see a
              problem worth solving.
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

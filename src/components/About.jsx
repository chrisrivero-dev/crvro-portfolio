import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1];

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
      </div>
    </motion.div>
  );
}

export default function About() {
  return (
    <section className="about" id="about" data-screen-label="03 About">
      <div className="container-wide">
        <div className="section-head reveal">
          <div className="index">§ 02: About</div>
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
              I’m Christopher. Most of what I build starts with a problem
              I’ve dealt with myself.
            </p>
            <p>
              I started in GIS/CAD support and gradually moved deeper into
              automation and human-supervised AI. I built my own local AI
              workstation and use Hermes every day. I still make the final
              calls.
            </p>
            <p>
              I usually have more ideas than time.
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

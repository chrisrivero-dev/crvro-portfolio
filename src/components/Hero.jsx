import React, { useEffect, useState } from 'react';
import RetroComputer, { useTypewriter } from './RetroComputer.jsx';

// Everything the visitor needs to understand the site lives on the
// screen now — the machine is the hero, not a decoration beside one.
// Only the two boot lines type character by character; the headline,
// sub-copy, and CTA reveal as quick staged chunks so the whole
// sequence resolves in a few seconds, not a slow crawl.
const BOOT_LINES = ['power on', 'portfolio.system initialized'];

function HeroIntroLines({ awake, reduced }) {
  const { output, done } = useTypewriter(BOOT_LINES, awake && !reduced);
  const [stage, setStage] = useState(reduced ? 4 : 0);

  useEffect(() => {
    if (reduced) {
      setStage(4);
      return undefined;
    }
    if (!awake) {
      setStage(0);
      return undefined;
    }
    if (!done) return undefined;
    let cancelled = false;
    const timeouts = [
      setTimeout(() => !cancelled && setStage(1), 130),
      setTimeout(() => !cancelled && setStage(2), 360),
      setTimeout(() => !cancelled && setStage(3), 680),
      setTimeout(() => !cancelled && setStage(4), 960),
    ];
    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [awake, done, reduced]);

  const shown = awake ? output : BOOT_LINES.map(() => '');

  return (
    <>
      <span className="retro-term-line retro-term-dim">{`> ${shown[0] || ''}`}</span>
      <span className="retro-term-line retro-term-dim">{`> ${shown[1] || ''}`}</span>
      <span className={`retro-term-eyebrow retro-reveal${stage >= 1 ? ' is-visible' : ''}`}>
        SUPPORT AUTOMATION · AI OPERATIONS · GIS SYSTEMS
      </span>
      <h1 className={`retro-term-headline retro-reveal${stage >= 2 ? ' is-visible' : ''}`}>
        I turn difficult support and mapping workflows into controlled, testable software.
      </h1>
      <p className={`retro-term-sub retro-reveal${stage >= 3 ? ' is-visible' : ''}`}>
        I build Python automation and AI tools for support and GIS/CAD work I know firsthand.
      </p>
      <a
        href="#work"
        className={`retro-term-link retro-term-link--cta retro-reveal${stage >= 4 ? ' is-visible' : ''}`}
      >
        BEGIN JOURNEY &darr;
      </a>
    </>
  );
}

export default function Hero() {
  return (
    <section className="hero hero--crt-only" id="top" data-screen-label="01 Hero">
      <div className="container-wide">
        <div className="hero-crt-stage">
          <RetroComputer mode="intro" dominant interactive>
            {({ awake, reduced }) => <HeroIntroLines awake={awake} reduced={reduced} />}
          </RetroComputer>
        </div>
      </div>
    </section>
  );
}

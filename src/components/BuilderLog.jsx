import React, { useEffect, useRef, useState } from "react";

const PHRASES = [
  "Support + GIS/CAD workflows",
  "Repetitive manual steps",
  "Scripts that made work reviewable",
  "AI-assisted support systems",
  "Logs, gates, dashboards, human review",
];

const CHAR_MS   = 36;
const PAUSE_MS  = 480;

export default function BuilderLog() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx,   setCharIdx]   = useState(0);
  const [started,   setStarted]   = useState(false);
  const [done,      setDone]      = useState(false);
  const ref    = useRef(null);
  const timers = useRef([]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      setStarted(true);

      if (reduced) {
        setPhraseIdx(PHRASES.length - 1);
        setCharIdx(PHRASES[PHRASES.length - 1].length);
        setDone(true);
        return;
      }

      let p = 0, c = 0;

      const tick = () => {
        const phrase = PHRASES[p];
        if (c < phrase.length) {
          c++;
          setPhraseIdx(p);
          setCharIdx(c);
          timers.current.push(setTimeout(tick, CHAR_MS));
        } else if (p < PHRASES.length - 1) {
          timers.current.push(setTimeout(() => {
            p++;
            c = 1;
            setPhraseIdx(p);
            setCharIdx(1);
            timers.current.push(setTimeout(tick, CHAR_MS));
          }, PAUSE_MS));
        } else {
          setDone(true);
        }
      };

      timers.current.push(setTimeout(tick, 240));
    }, { threshold: 0.3 });

    obs.observe(el);
    return () => {
      obs.disconnect();
      timers.current.forEach(clearTimeout);
    };
  }, []);

  return (
    <div
      className={`builder-log${started ? " builder-log--in" : ""}`}
      ref={ref}
      aria-label="Builder path"
    >
      <div className="bl-label">Builder Path</div>
      <div className="bl-phrases">
        {PHRASES.map((phrase, i) => {
          const isActive  = !done && i === phraseIdx;
          const isVisible = started && (i < phraseIdx || i === phraseIdx || done);
          if (!isVisible) return null;
          const text = isActive ? phrase.slice(0, charIdx) : phrase;
          return (
            <div key={i} className={`bl-phrase${isActive ? " bl-phrase--typing" : ""}`}>
              {text}
              {isActive && <span className="bl-cursor" aria-hidden="true" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

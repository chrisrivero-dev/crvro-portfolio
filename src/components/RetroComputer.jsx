import React, { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================
// RetroComputer — reusable 1970s CRT hardware shell.
//
// Two jobs, two modes:
//   mode="intro"      hero — introduces Christopher, sends the
//                      visitor into Project World
//   mode="navigator"  post-journey — returns as a small,
//                      deterministic destination router
//
// State machine: off -> waking -> power -> on
//   off     dormant or manually powered down — screen dim, hardware idle
//   waking  knob is turning toward ON
//   power   knob has landed, amber indicator catches
//   on      screen brightness ramps up; screen content (passed as a
//           render-prop child) takes over its own boot/type/ready beats
//
// Wakes automatically once, the first time it enters the viewport.
// When `interactive`, the knob is also a real button: it can power
// the machine off (screen dims, content becomes unavailable, but
// site navigation is never blocked) and back on (the sequence plays
// again — a manual replay, not the automatic one-time intro).
// ============================================================

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

// Types `lines` in one character at a time. When `enabled` is false
// (reduced motion, or not yet awake) the full text is shown immediately.
export function useTypewriter(lines, enabled, { charDelay = 15, lineGap = 260 } = {}) {
  const key = lines.join('');
  const [output, setOutput] = useState(() => (enabled ? lines.map(() => '') : lines));
  const [done, setDone] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setOutput(lines);
      setDone(true);
      return undefined;
    }
    setOutput(lines.map(() => ''));
    setDone(false);
    let cancelled = false;
    const timeouts = [];

    function typeLine(lineIndex, charIndex) {
      if (cancelled) return;
      const line = lines[lineIndex];
      setOutput((prev) => {
        const next = prev.slice();
        next[lineIndex] = line.slice(0, charIndex);
        return next;
      });
      if (charIndex < line.length) {
        timeouts.push(setTimeout(() => typeLine(lineIndex, charIndex + 1), charDelay));
      } else if (lineIndex < lines.length - 1) {
        timeouts.push(setTimeout(() => typeLine(lineIndex + 1, 1), lineGap));
      } else {
        setDone(true);
      }
    }

    timeouts.push(setTimeout(() => typeLine(0, 1), 0));
    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key, charDelay, lineGap]);

  return { output, done };
}

export default function RetroComputer({
  mode = 'intro',
  chrome = 'full',
  label = 'CRVRO.COM',
  sublabel = 'INTELLIGENT SYSTEMS INTERFACE',
  className = '',
  dominant = false,
  interactive = false,
  children,
}) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef(null);
  const timeoutsRef = useRef([]);
  const [phase, setPhase] = useState(reduced ? 'on' : 'off');
  const wokenRef = useRef(reduced);
  const isFullChrome = chrome === 'full';
  const canToggle = interactive && isFullChrome;

  const clearTimers = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const runWakeSequence = useCallback(() => {
    clearTimers();
    if (!isFullChrome) {
      setPhase('on');
      return;
    }
    setPhase('waking');
    timeoutsRef.current = [
      setTimeout(() => setPhase('power'), 340),
      setTimeout(() => setPhase('on'), 560),
    ];
  }, [clearTimers, isFullChrome]);

  // Automatic one-time wake, the first time the unit is actually visible.
  useEffect(() => {
    if (wokenRef.current) return undefined;
    const el = rootRef.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry || !entry.isIntersecting || wokenRef.current) return;
        wokenRef.current = true;
        observer.disconnect();
        runWakeSequence();
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manual power toggle — only wired up when `interactive`. Turning off
  // is immediate (no choreography needed to go dark); turning back on
  // replays the same wake sequence as a deliberate user action, not an
  // automatic replay.
  const togglePower = useCallback(() => {
    if (!canToggle) return;
    wokenRef.current = true;
    if (phase === 'off') {
      runWakeSequence();
    } else {
      clearTimers();
      setPhase('off');
    }
  }, [canToggle, phase, runWakeSequence, clearTimers]);

  const awake = phase === 'on';
  const isOn = phase !== 'off';

  const knob = (
    <span className="retro-crt__knob-dial">
      <span className="retro-crt__knob-mark" />
    </span>
  );

  return (
    <div
      ref={rootRef}
      className={`retro-crt retro-crt--${mode} retro-crt--chrome-${chrome}${dominant ? ' retro-crt--dominant' : ''} ${className}`.trim()}
      data-phase={phase}
    >
      <div className="retro-crt__shell">
        <div className="retro-crt__bezel">
          <div className="retro-crt__screen" aria-live="off">
            <div className="retro-crt__scanlines" aria-hidden="true" />
            <div className="retro-crt__screen-content">
              {typeof children === 'function' ? children({ awake, reduced }) : children}
            </div>
          </div>
        </div>

        {isFullChrome && (
          <div className="retro-crt__hardware">
            <div className="retro-crt__label">
              <span className="retro-crt__label-name">{label}</span>
              <span className="retro-crt__label-sub">{sublabel}</span>
              {dominant && <span className="retro-crt__label-model">MODEL II · SER. 2026</span>}
            </div>

            <div className="retro-crt__controls">
              <div className="retro-crt__power" aria-hidden="true">
                <span className="retro-crt__power-dot" />
                <span className="retro-crt__power-text">POWER</span>
              </div>
              <div className="retro-crt__switch">
                <span className="retro-crt__switch-track" aria-hidden="true">
                  <span className="retro-crt__switch-off">OFF</span>
                  <span className="retro-crt__switch-on">ON</span>
                </span>
                {canToggle ? (
                  <button
                    type="button"
                    className="retro-crt__knob retro-crt__knob--button"
                    onClick={togglePower}
                    aria-pressed={isOn}
                    aria-label={`${isOn ? 'Turn off' : 'Turn on'} the CRVRO terminal`}
                  >
                    {knob}
                  </button>
                ) : (
                  <span className="retro-crt__knob" aria-hidden="true">
                    {knob}
                  </span>
                )}
              </div>
              <div className="retro-crt__vents" aria-hidden="true" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

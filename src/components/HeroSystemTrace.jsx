import React, { useEffect, useRef } from 'react';

/**
 * Faint system-trace diagram for the hero.
 * manual → script → logs → tool → decision
 * One soft amber signal travels the path on a slow loop.
 */
export default function HeroSystemTrace() {
  const wrapRef = useRef(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(max-width: 720px)').matches) return;

    let rafId;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / window.innerWidth;
      const dy = (e.clientY - cy) / window.innerHeight;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        el.style.setProperty('--tx', `${dx * 6}px`);
        el.style.setProperty('--ty', `${dy * 4}px`);
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Node positions (in SVG units, viewBox 520 x 132)
  const nodes = [
    { x: 28,  y: 64, label: 'manual' },
    { x: 150, y: 48, label: 'script' },
    { x: 268, y: 76, label: 'logs' },
    { x: 386, y: 44, label: 'tool' },
    { x: 496, y: 64, label: 'decision' },
  ];

  // Smooth path through the nodes (cubic curves between successive points)
  const d = (() => {
    let p = `M ${nodes[0].x} ${nodes[0].y}`;
    for (let i = 1; i < nodes.length; i++) {
      const a = nodes[i - 1];
      const b = nodes[i];
      const dx = (b.x - a.x) / 2;
      p += ` C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
    }
    return p;
  })();

  return (
    <div className="hero-trace" ref={wrapRef} aria-hidden="true">
      <svg
        viewBox="0 0 520 132"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* hairline path */}
        <path
          d={d}
          className="trace-path"
          fill="none"
          strokeLinecap="round"
        />

        {/* nodes */}
        {nodes.map((n, i) => (
          <g key={n.label} className="trace-node">
            <circle cx={n.x} cy={n.y} r="3.2" className="trace-node-dot" />
            <circle cx={n.x} cy={n.y} r="6.2" className="trace-node-ring" />
            <text
              x={n.x}
              y={n.y + 22}
              textAnchor="middle"
              className="trace-label"
            >
              {String(i + 1).padStart(2, '0')} {n.label}
            </text>
          </g>
        ))}

        {/* the moving signal */}
        <g className="trace-signal">
          <circle r="3.6" className="trace-signal-dot">
            <animateMotion dur="9s" repeatCount="indefinite" rotate="auto" path={d} />
          </circle>
          <circle r="8" className="trace-signal-halo">
            <animateMotion dur="9s" repeatCount="indefinite" path={d} />
          </circle>
        </g>
      </svg>
    </div>
  );
}

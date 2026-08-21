// ============================================================
// Project World — the illustrated chart
//
// One component renders every instance of the map: the desktop
// stage, the overlay overview, and the closing mini-chart. SVG
// ids are namespaced per instance (useId) so clip paths and
// patterns never collide when several maps are on the page.
// ============================================================

import React, { useId } from "react";
import { coastFor, contourFor } from "./geometry.js";
import { LEGS, MAP_H, MAP_W, SIDE_ISLAND, STOPS } from "./worldData.jsx";

/** GroundRules is the one island with a parcel-grid clip/hatch pattern. Looked
 * up by id rather than a fixed array index, since the journey order changes. */
const GROUNDRULES_STOP = STOPS.find((s) => s.id === "groundrules");

function Decorations({ ids }) {
  const vLines = [];
  for (let x = 94; x < MAP_W; x += 76) {
    vLines.push(<line className="pw-grat" key={`v${x}`} x1={x} y1="18" x2={x} y2={MAP_H - 14} />);
  }
  const hLines = [];
  for (let y = 94; y < MAP_H - 14; y += 76) {
    hLines.push(<line className="pw-grat" key={`h${y}`} x1="18" y1={y} x2={MAP_W - 18} y2={y} />);
  }

  const ticks = [];
  for (let tx = 78; tx < MAP_W - 30; tx += 60) {
    ticks.push(<line className="pw-frame-tick" key={`tt${tx}`} x1={tx} y1="18" x2={tx} y2="24" />);
    ticks.push(
      <line className="pw-frame-tick" key={`tb${tx}`} x1={tx} y1={MAP_H - 20} x2={tx} y2={MAP_H - 14} />
    );
  }
  for (let ty = 78; ty < MAP_H - 30; ty += 60) {
    ticks.push(<line className="pw-frame-tick" key={`tl${ty}`} x1="18" y1={ty} x2="24" y2={ty} />);
    ticks.push(
      <line className="pw-frame-tick" key={`tr${ty}`} x1={MAP_W - 24} y1={ty} x2={MAP_W - 18} y2={ty} />
    );
  }

  const waves = [
    [470, 250], [540, 320], [420, 350], [740, 480], [870, 580],
    [330, 470], [910, 240], [180, 420], [760, 720], [940, 420],
  ];

  return (
    <g aria-hidden="true">
      <rect className="pw-seabg" x="0" y="0" width={MAP_W} height={MAP_H} />
      <g>{vLines}{hLines}</g>
      <rect x="0" y="0" width={MAP_W} height={MAP_H} filter={`url(#${ids.noise})`} opacity="0.5" />
      <rect className="pw-frame" x="18" y="18" width={MAP_W - 36} height={MAP_H - 32} />
      <g>{ticks}</g>

      <g>
        {waves.map((p, i) => (
          <path className="pw-wave" key={i} d={`M ${p[0] - 12} ${p[1]} q 6 -5 12 0 q 6 5 12 0`} />
        ))}
      </g>

      <text className="pw-sealabel" x="455" y="428" transform="rotate(-7 455 428)" textAnchor="middle">
        SEA OF SMALL, USEFUL SYSTEMS
      </text>
      <text
        className="pw-sealabel"
        x="268"
        y="438"
        transform="rotate(83 268 438)"
        textAnchor="middle"
        style={{ fontSize: 11 }}
      >
        APPROVAL SOUND
      </text>

      {/* Cartouche — title block and route legend */}
      <rect className="pw-cart-rect" x="36" y="30" width="248" height="96" rx="2" />
      <rect className="pw-cart-rect" x="41" y="35" width="238" height="86" rx="1" fill="none" />
      <text className="pw-cart-title" x="56" y="66">Project World</text>
      <text className="pw-cart-sub" x="56" y="84">CHART № 01 · THE SYSTEMS I BUILD</text>
      <text className="pw-cart-sub2" x="56" y="98">surveyed 2024 to 2026 · drawn at Daventry One</text>
      <line className="pw-route" x1="56" y1="106" x2="86" y2="106" />
      <text className="pw-cart-sub2" x="92" y="109">planned</text>
      <line className="pw-route-gone" x1="140" y1="106" x2="170" y2="106" />
      <text className="pw-cart-sub2" x="176" y="109">traveled</text>

      {/* Scale bar */}
      <line className="pw-scale-line" x1="40" y1="758" x2="160" y2="758" />
      <line className="pw-scale-line" x1="40" y1="754" x2="40" y2="762" />
      <line className="pw-scale-line" x1="100" y1="755" x2="100" y2="761" />
      <line className="pw-scale-line" x1="160" y1="754" x2="160" y2="762" />
      <text className="pw-scale-t" x="40" y="772">0</text>
      <text className="pw-scale-t" x="146" y="772">10 leagues</text>
      <text className="pw-scale-t" x="40" y="746">one league ≈ one shipped iteration</text>

      {/* Compass rose */}
      <g transform="translate(474 512)">
        <circle className="pw-compass-ring" r="30" />
        <circle className="pw-compass-ring" r="22" opacity="0.6" />
        {[0, 45, 90, 135].map((a) => (
          <line className="pw-compass-ray" key={a} x1="0" y1="-30" x2="0" y2="30" transform={`rotate(${a})`} />
        ))}
        <path className="pw-compass-needle" d="M 0 -26 L 5 0 L 0 26 L -5 0 Z" />
        <circle className="pw-compass-needle" r="2.5" />
        <text className="pw-compass-t" x="0" y="-36" textAnchor="middle">N</text>
        <text className="pw-compass-t" x="38" y="3" textAnchor="middle">E</text>
        <text className="pw-compass-t" x="0" y="44" textAnchor="middle">S</text>
        <text className="pw-compass-t" x="-38" y="3" textAnchor="middle">W</text>
      </g>
    </g>
  );
}

function Island({ stop, index, state, interactive, onSelect, ids }) {
  const labelY = stop.cy + (stop.parcel ? 96 : stop.ry + 26) + (stop.labelDY || 0);
  const marks = stop.landmarks(ids.grClip, ids.hatch);

  const handlers = interactive
    ? {
        role: "button",
        tabIndex: 0,
        "aria-pressed": state === "active",
        "aria-label": `${stop.name}, stop ${index + 1} of ${STOPS.length}. Activate to sail here.`,
        onClick: () => onSelect(index),
        onKeyDown: (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(index);
          }
        },
      }
    : {};

  return (
    <g
      className={
        "pw-isle" +
        (state === "active" ? " active" : "") +
        (state === "visited" || state === "active" ? " visited" : "")
      }
      style={{ "--isle": stop.accent }}
      {...handlers}
    >
      <path className="isle-contour" d={contourFor(stop)} />
      <path className="isle-coast" d={coastFor(stop)} />
      <g className="isle-lms">
        {marks.map((m, i) => (
          <g className="lm" key={i} style={{ "--d": `${(0.35 + i * 0.09).toFixed(2)}s` }}>
            {m}
          </g>
        ))}
      </g>
      <circle className="isle-harbor" cx={stop.harbor[0]} cy={stop.harbor[1]} r="4.5" />
      <g className="isle-label">
        <text className="isle-name" x={stop.cx} y={labelY}>{stop.name}</text>
        <text className="isle-sub" x={stop.cx} y={labelY + 14}>{stop.sub}</text>
      </g>
    </g>
  );
}

function Ship() {
  return (
    <g className="pw-ship-inner">
      <path className="pw-ship-hull" d="M -13 2 C -9 8 9 8 13 2 L 8 2 L -11 2 Z" />
      <line className="pw-ship-mast" x1="0" y1="1" x2="0" y2="-15" />
      <path className="pw-ship-sail" d="M 1 -3 L 1 -13 C 7 -10 9 -6 2 -3 Z" />
      <path className="pw-ship-sail" d="M -1 -4 L -9 -4 L -1 -12 Z" />
      <path className="pw-ship-flag" d="M 0 -15 L 6 -13 L 0 -11 Z" />
    </g>
  );
}

/**
 * @param {number|null} activeStop  island currently activated
 * @param {number} flagsThrough     harbors with a flag planted
 * @param {boolean} allRoutesGone   overview: draw every leg as traveled
 */
export default function WorldMap({
  svgRef,
  activeStop = null,
  flagsThrough = 0,
  interactive = false,
  showShip = false,
  allRoutesGone = false,
  onSelectStop = () => {},
  onSelectSide = () => {},
  title,
  className = "",
}) {
  const uid = useId().replace(/[:]/g, "");
  const ids = {
    grClip: `pwGr-${uid}`,
    hatch: `pwHatch-${uid}`,
    noise: `pwNoise-${uid}`,
  };

  const sideHandlers = interactive
    ? {
        role: "button",
        tabIndex: 0,
        "aria-label": "Parcel Engine, optional side island. Activate for details.",
        onClick: onSelectSide,
        onKeyDown: (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectSide();
          }
        },
      }
    : {};

  return (
    <svg
      ref={svgRef}
      className={"pw-map " + className}
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      role="group"
      aria-label={
        title ||
        "Illustrated map of Project World. Six destinations: Daventry One, OpenClaw / Hermes, Zarvin One, Sidecar, Help Nearby, GroundRules."
      }
    >
      <defs>
        <clipPath id={ids.grClip}>
          <path d={coastFor(GROUNDRULES_STOP)} />
        </clipPath>
        <pattern
          id={ids.hatch}
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="1.4" opacity="0.5" />
        </pattern>
        <filter id={ids.noise}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n" />
          <feColorMatrix
            in="n"
            type="matrix"
            values="0 0 0 0 0.4 0 0 0 0 0.38 0 0 0 0 0.34 0 0 0 0.05 0"
          />
        </filter>
      </defs>

      <Decorations ids={ids} />

      {/* Planned route, then the traveled overlay the ship reveals */}
      <g aria-hidden="true">
        {LEGS.map((d, i) => (
          <path className="pw-route" key={`p${i}`} d={d} />
        ))}
        {LEGS.map((d, i) => (
          <path
            className="pw-route-gone"
            key={`g${i}`}
            d={d}
            data-leg={i}
            // With a ship aboard the engine owns the dash; without one
            // (overlay, mini-chart) the route is simply drawn complete.
            style={!showShip && allRoutesGone ? { strokeDasharray: "none" } : undefined}
          />
        ))}
      </g>

      {STOPS.map((stop, i) => (
        <Island
          key={stop.id}
          stop={stop}
          index={i}
          state={
            activeStop === i ? "active" : allRoutesGone || i < flagsThrough ? "visited" : "planned"
          }
          interactive={interactive}
          onSelect={onSelectStop}
          ids={ids}
        />
      ))}

      {/* Parcel Engine — optional, off the sailed route */}
      <g className="pw-isle pw-isle--side" style={{ "--isle": SIDE_ISLAND.accent }} {...sideHandlers}>
        <path className="isle-coast" d={SIDE_ISLAND.path} />
        <g className="isle-lms" style={{ opacity: 0.8 }}>
          <path className="lm-dash" d="M 930 654 L 978 668" />
          <text className="lm-t" x="954" y="652">N 42° E</text>
        </g>
        <g className="isle-label">
          <text className="isle-name" x={SIDE_ISLAND.labelX} y={SIDE_ISLAND.labelY} style={{ fontSize: 9.5 }}>
            {SIDE_ISLAND.name}
          </text>
          <text className="isle-sub" x={SIDE_ISLAND.labelX} y={SIDE_ISLAND.labelY + 12}>
            {SIDE_ISLAND.sub}
          </text>
        </g>
      </g>

      {/* Flags mark harbors already visited */}
      <g aria-hidden="true">
        {STOPS.slice(0, allRoutesGone ? STOPS.length : flagsThrough).map((s) => (
          <g className="pw-flag" key={s.id}>
            <line
              className="pw-flag-pole"
              x1={s.harbor[0] + 8}
              y1={s.harbor[1] - 2}
              x2={s.harbor[0] + 8}
              y2={s.harbor[1] - 16}
            />
            <path
              className="pw-flag-cloth"
              d={`M ${s.harbor[0] + 8} ${s.harbor[1] - 16} l 9 3 l -9 3 Z`}
            />
          </g>
        ))}
      </g>

      {showShip && (
        <>
          <g data-wake="" aria-hidden="true" />
          <g data-ship="" aria-hidden="true">
            <Ship />
          </g>
        </>
      )}
    </svg>
  );
}

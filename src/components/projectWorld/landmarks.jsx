// ============================================================
// Project World — hand-drawn map landmarks
//
// Small structural primitives shared by every island. They draw
// with `currentColor`, so an island's accent color flows down
// from `.isle-lms` when that island activates.
// ============================================================

import React from "react";

export function Label({ x, y, children, anchor }) {
  return (
    <text className="lm-t" x={x} y={y} style={anchor ? { textAnchor: anchor } : undefined}>
      {children}
    </text>
  );
}

export function Tower({ x, y, h }) {
  return (
    <>
      <rect className="lm-fill" x={x - 7} y={y - h} width="14" height={h} />
      <path className="lm-line" d={`M ${x - 9} ${y - h} L ${x} ${y - h - 9} L ${x + 9} ${y - h}`} />
      <line className="lm-line" x1={x} y1={y - h - 9} x2={x} y2={y - h - 16} />
      <rect className="lm-fill" x={x - 2.5} y={y - h + 6} width="5" height="6" />
    </>
  );
}

export function Hut({ x, y, w, h }) {
  return (
    <>
      <rect className="lm-fill" x={x - w / 2} y={y - h} width={w} height={h} />
      <path
        className="lm-line"
        d={`M ${x - w / 2 - 2} ${y - h} L ${x} ${y - h - w * 0.34} L ${x + w / 2 + 2} ${y - h}`}
      />
    </>
  );
}

/** Approval gate — the bar scales in when the island activates. */
export function Gate({ x, y }) {
  return (
    <>
      <line className="lm-line" x1={x - 10} y1={y - 14} x2={x - 10} y2={y} />
      <line className="lm-line" x1={x + 10} y1={y - 14} x2={x + 10} y2={y} />
      <rect className="lm-fill lm-gatebar" x={x - 10} y={y - 12} width="20" height="6" />
    </>
  );
}

/** Signal mast — the Telegram relay at Daventry One. */
export function Mast({ x, y, h }) {
  return (
    <>
      <line className="lm-line" x1={x} y1={y} x2={x} y2={y - h} />
      <path className="lm-line" d={`M ${x - 8} ${y - h + 2} q 8 -8 16 0`} opacity="0.85" />
      <path className="lm-line" d={`M ${x - 13} ${y - h + 7} q 13 -13 26 0`} opacity="0.5" />
      <line className="lm-line" x1={x - 5} y1={y} x2={x + 5} y2={y} />
    </>
  );
}

export function CloudPuff({ x, y }) {
  return (
    <path
      className="lm-line"
      opacity="0.9"
      d={`M ${x - 10} ${y} q 2 -7 9 -6 q 3 -6 9 -2 q 6 -1 5 6 q 4 4 -3 5 l -17 0 q -6 -1 -3 -3 Z`}
    />
  );
}

export function Boat({ x, y }) {
  return (
    <>
      <path className="lm-fill" d={`M ${x - 9} ${y} q 9 6 18 0 l -3 -1 l -12 0 Z`} />
      <line className="lm-line" x1={x} y1={y} x2={x} y2={y - 11} />
      <path className="lm-fill" d={`M ${x} ${y - 11} l 8 3 l -8 3 Z`} />
    </>
  );
}

export function Pin({ x, y, text }) {
  return (
    <>
      <path className="lm-line" d={`M ${x} ${y} c -6 -8 -6 -14 0 -14 c 6 0 6 6 0 14 Z`} />
      <circle className="lm-dot" cx={x} cy={y - 9} r="1.8" />
      {text ? (
        <Label x={x} y={y - 18}>
          {text}
        </Label>
      ) : null}
    </>
  );
}

/** Verification beacon — pulses while its island is active. */
export function Beacon({ x, y }) {
  return (
    <>
      <circle className="lm-beacon-ring" cx={x} cy={y} r="10" />
      <circle className="lm-dot" cx={x} cy={y} r="3.4" />
    </>
  );
}

export function Peak({ x, y, w, h }) {
  return (
    <>
      <path className="lm-line" d={`M ${x - w} ${y} L ${x} ${y - h} L ${x + w} ${y}`} />
      <path
        className="lm-line"
        opacity="0.7"
        d={`M ${x - w * 0.25} ${y - h * 0.55} l ${w * 0.2} ${h * 0.18} l ${w * 0.2} -${h * 0.3}`}
      />
    </>
  );
}

export function Pine({ x, y }) {
  return (
    <>
      <path
        className="lm-line"
        d={`M ${x - 5} ${y} L ${x} ${y - 12} L ${x + 5} ${y} M ${x - 4} ${y - 5} L ${x} ${y - 15} L ${x + 4} ${y - 5}`}
      />
      <line className="lm-line" x1={x} y1={y} x2={x} y2={y + 3} />
    </>
  );
}

/** Verification sign — the check before arrival on Help Nearby. */
export function Signpost({ x, y }) {
  return (
    <>
      <line className="lm-line" x1={x} y1={y} x2={x} y2={y - 14} />
      <rect className="lm-fill" x={x - 9} y={y - 14} width="18" height="7" />
      <path className="lm-line" d={`M ${x - 5} ${y - 10.5} l 3 3 l 6 -6`} />
    </>
  );
}

/** Screening report — the GroundRules map scroll. */
export function ScrollDoc({ x, y }) {
  return (
    <>
      <rect className="lm-fill" x={x - 11} y={y - 14} width="22" height="14" rx="1" />
      <circle className="lm-line" cx={x - 11} cy={y - 7} r="2.6" fill="none" />
      <circle className="lm-line" cx={x + 11} cy={y - 7} r="2.6" fill="none" />
      <line className="lm-line" x1={x - 6} y1={y - 10} x2={x + 6} y2={y - 10} opacity="0.7" />
      <line className="lm-line" x1={x - 6} y1={y - 6} x2={x + 3} y2={y - 6} opacity="0.7" />
    </>
  );
}

/** Support-console lighthouse — the beam sweeps while Sidecar is active. */
export function Lighthouse({ x, y }) {
  return (
    <>
      {/* Beam springs from the lamp itself (y − 38.5), not above it */}
      <path className="lm-beam" d={`M ${x} ${y - 38.5} L ${x + 48} ${y - 50} L ${x + 48} ${y - 28} Z`} />
      <path
        className="lm-fill"
        d={`M ${x - 6} ${y} L ${x - 3} ${y - 36} L ${x + 3} ${y - 36} L ${x + 6} ${y} Z`}
      />
      <line className="lm-line" x1={x - 4.5} y1={y - 12} x2={x + 4.5} y2={y - 12} />
      <line className="lm-line" x1={x - 3.5} y1={y - 24} x2={x + 3.5} y2={y - 24} />
      <rect className="lm-fill" x={x - 5} y={y - 42} width="10" height="7" />
      <circle className="lm-dot" cx={x} cy={y - 38.5} r="2" />
    </>
  );
}

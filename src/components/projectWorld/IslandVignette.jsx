// ============================================================
// Project World — single-island vignette (mobile)
//
// A cropped window onto one island so it stays legible on a
// phone, instead of shrinking the whole chart to an unreadable
// thumbnail. Same geometry and landmarks as the desktop map.
// ============================================================

import React, { useId } from "react";
import { coastFor, contourFor } from "./geometry.js";
import { STOPS } from "./worldData.jsx";

const PAD_X = 150;
const PAD_Y = 135;
const VIEW_H = 290;

export default function IslandVignette({ stop, index, active }) {
  const uid = useId().replace(/[:]/g, "");
  const ids = { grClip: `pwvGr-${uid}`, hatch: `pwvHatch-${uid}` };
  const labelY = stop.cy + (stop.parcel ? 96 : stop.ry + 26) + (stop.labelDY || 0);
  const marks = stop.landmarks(ids.grClip, ids.hatch);
  const x0 = stop.cx - PAD_X;
  const y0 = stop.cy - PAD_Y;

  return (
    <svg
      className="pw-map"
      viewBox={`${x0} ${y0} ${PAD_X * 2} ${VIEW_H}`}
      role="img"
      aria-label={`Illustrated island of ${stop.name}, stop ${index + 1} of ${STOPS.length}.`}
    >
      <defs>
        <clipPath id={ids.grClip}>
          <path d={coastFor(STOPS[4])} />
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
      </defs>

      <rect className="pw-seabg" x={x0} y={y0} width={PAD_X * 2} height={VIEW_H} />

      <g className={"pw-isle" + (active ? " active visited" : "")} style={{ "--isle": stop.accent }}>
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
    </svg>
  );
}

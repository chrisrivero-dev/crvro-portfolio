import React from "react";

export default function ProjectMark({ shape = "circle", color = "var(--amber)", size = 80 }) {
  if (shape === "triangle") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        <path d="M50 8 L94 92 L6 92 Z" fill="none" stroke={color} strokeWidth="6" strokeLinejoin="round" />
        <rect x="42" y="64" width="16" height="28" fill={color} />
      </svg>
    );
  }
  if (shape === "stack") {
    return (
      <span className="mark mark-stack stack" style={{ color, width: size, height: size }} aria-hidden="true">
        <span className="mark-dot" />
        <span className="mark-dot" />
      </span>
    );
  }
  return (
    <span className={"mark mark-" + shape + " " + shape}
          style={{ color, width: size, height: size }} aria-hidden="true" />
  );
}

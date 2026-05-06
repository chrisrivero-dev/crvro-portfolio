import React from "react";

export default function ProjectMark({ shape = "circle", color = "var(--amber)", size = 80 }) {
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

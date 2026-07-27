// ============================================================
// Project World — full-chart overlay
//
// The optional overview: the whole map at once with a text list
// of every destination, so nothing on the chart is reachable by
// pointing alone. Focus is trapped while open and returned to
// whatever opened it on close.
// ============================================================

import React, { useEffect, useRef } from "react";
import WorldMap from "./WorldMap.jsx";
import { STOPS } from "./worldData.jsx";

const FOCUSABLE = 'button, [href], [tabindex]:not([tabindex="-1"])';

export default function WorldOverlay({ open, onClose, onSelect }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const openerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement;
    closeRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = Array.from(panelRef.current?.querySelectorAll(FOCUSABLE) || []);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      const opener = openerRef.current;
      if (opener && typeof opener.focus === "function") opener.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="pw-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="World map overview"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pw-overlay-panel" ref={panelRef}>
        <div className="pw-overlay-head">
          <span className="t">Project World: full chart</span>
          <button type="button" className="pwbtn" onClick={onClose} ref={closeRef}>
            ✕ Close
          </button>
        </div>

        <WorldMap
          allRoutesGone
          interactive
          onSelectStop={onSelect}
          onSelectSide={() => onSelect(null)}
          title="Project World: the complete chart. Select any destination to travel there."
        />

        <ol className="pw-ov-list">
          {STOPS.map((s, i) => (
            <li key={s.id}>
              <button type="button" className="pwbtn" onClick={() => onSelect(i)}>
                <span className="n">0{i + 1}</span> {s.name}
              </button>
            </li>
          ))}
          <li>
            <button type="button" className="pwbtn" onClick={() => onSelect(STOPS.length)}>
              <span className="n">▣</span> FULL OVERVIEW
            </button>
          </li>
        </ol>
      </div>
    </div>
  );
}

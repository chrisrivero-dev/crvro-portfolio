import React from "react";

const SIGNALS = [
  { state: "ACTIVE", name: "Sidecar", note: "build" },
  { state: "RESEARCH", name: "Predmkt", note: "edge validation" },
  { state: "LIVE", name: "Help Nearby", note: "prototype" },
  { state: "ITERATING", name: "OpenClaw", note: "local-first" },
];

const INVESTIGATING = [
  "support AI reliability",
  "local-first automation workflows",
  "operational dashboards and diagnostics",
  "evidence-based decision systems",
];

export default function BuilderTelemetry() {
  return (
    <section className="telemetry" aria-label="Builder telemetry" data-screen-label="01b Telemetry">
      <div className="container-wide">
        <div className="tele-strip reveal">
          <span className="tele-strip-label">Status signals</span>
          <ul className="tele-strip-list">
            {SIGNALS.map((s) => (
              <li key={s.name} className="tele-signal">
                <span className={`tele-state state-${s.state.toLowerCase()}`}>[{s.state}]</span>
                <span className="tele-name">{s.name}</span>
                <span className="tele-note">— {s.note}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="tele-grid" data-stagger>
          <div className="tele-block reveal">
            <h3 className="tele-head">Currently investigating</h3>
            <ul className="tele-invest">
              {INVESTIGATING.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

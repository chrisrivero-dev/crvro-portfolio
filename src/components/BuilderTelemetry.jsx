import React from "react";
import BuilderLog from "./BuilderLog.jsx";

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
        <BuilderLog />

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

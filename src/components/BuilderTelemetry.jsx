import React from "react";
import BuilderLog from "./BuilderLog.jsx";

export default function BuilderTelemetry() {
  return (
    <section className="telemetry" aria-label="Builder telemetry" data-screen-label="01b Telemetry">
      <div className="container-wide">
        <BuilderLog />
      </div>
    </section>
  );
}

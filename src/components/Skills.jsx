import React from "react";

const SKILLS = [
  { head: "languages", items: ["Python", "JavaScript", "SQL", "Bash", "HTML / CSS"] },
  { head: "data & infra", items: ["SQLite", "Postgres", "JSON / JSONL", "Git / GitHub", "Railway", "REST APIs"] },
  { head: "AI & support systems", items: ["OpenAI API", "OpenClaw", "KB-grounded drafting", "RAG-style retrieval", "Prompt guardrails", "Canned response workflows"] },
  { head: "GIS & CAD", items: ["ArcGIS Pro", "QGIS", "PostGIS", "AutoCAD", "MicroStation", "Civil 3D", "Shapefile / GeoPackage"] },
  { head: "automation", items: ["Telegram Bot API", "GitHub Actions", "cron / scheduled jobs", "Python scripts", "Excel automation", "pandas / openpyxl"] },
  { head: "ops & testing", items: ["Structured logging", "CLI tools", "curl / API testing", "Railway deploy logs", "Local test scripts", "Lightweight dashboards"] },
];

export default function Skills() {
  return (
    <section className="skills" id="skills" data-screen-label="04 Skills">
      <div className="container-wide">
        <div className="section-head">
          <div className="index">§ 03 — Skills &amp; tools</div>
          <div className="h">Stacks I reach for <em>when I'm building something real.</em></div>
        </div>
        <div className="grid">
          <div></div>
          <div className="col-grid">
            {SKILLS.map((s) => (
              <div key={s.head} className="col">
                <h4>{s.head}</h4>
                <ul>{s.items.map((it) => <li key={it}>{it}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import React from "react";

const SKILLS = [
  { head: "languages", items: ["Python", "TypeScript", "SQL", "Bash", "Lua"] },
  { head: "data & infra", items: ["Postgres", "DuckDB", "Redis", "Docker", "Linux", "Raspberry Pi"] },
  { head: "AI & tools", items: ["Claude API", "OpenAI API", "Ollama / on-device", "RAG pipelines", "n8n"] },
  { head: "GIS & CAD", items: ["QGIS", "PostGIS", "AutoCAD", "Civil 3D", "Shapefile / GeoPackage"] },
  { head: "automation", items: ["Telegram bots", "GitHub Actions", "cron / systemd", "Playwright"] },
  { head: "ops & analytics", items: ["Grafana", "Metabase", "Loki", "Structured logging"] },
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

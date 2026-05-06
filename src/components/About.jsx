import React from "react";

export default function About() {
  return (
    <section className="about" id="about" data-screen-label="03 About">
      <div className="container-wide">
        <div className="section-head">
          <div className="index">§ 02 — About</div>
          <div className="h">A builder of <em>small, useful systems.</em></div>
        </div>
        <div className="grid">
          <div className="marker">
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em",
              textTransform: "uppercase", color: "var(--graphite)",
              paddingTop: 14, borderTop: "1px solid var(--ink)"
            }}>Bio</div>
          </div>
          <div className="body">
            <p>
              <em>I'm Christopher.</em> I build the small, quiet systems
              nobody notices until they stop working. I specialize in the
              &ldquo;boring&rdquo; stuff — cron jobs, Telegram bots, and
              Python scripts — that takes mundane tasks off your plate
              and gives you hours back. I don't build for hype. If
              something doesn't pass the sniff test, I don't force it. I
              build for the relief of a cleared to-do list.
            </p>
            <p>
              Most of what I build does not need a big landing page. It
              might be an AI assistant that drafts a customer reply, a
              scanner that watches markets and logs every decision, or a
              workflow tool that turns a repeatable task into something
              clean and reliable.
            </p>
            <p>
              I work across automation, AI support tooling, and GIS / CAD
              pipelines — places where a careful tool can replace hours
              of manual work. I prefer plain stacks like Python, Postgres,
              JavaScript, and a little TypeScript, and I would rather
              ship something narrow that works than something broad that
              almost works.
            </p>
            <p>
              I tend to dig deeply into problems, trace the edge cases,
              and keep going until the system is reliable enough to trust.
            </p>
            <p>
              If you're looking for someone in technical operations,
              automation, AI support, GIS / CAD workflows, or anywhere a
              thoughtful tool would matter — I'd like to hear about it.
            </p>

            <div className="stat-list">
              <div className="row"><span className="label">Based</span><span className="value">Lakewood, CA · PT</span></div>
              <div className="row"><span className="label">Currently</span><span className="value">Building automation &amp; AI tooling</span></div>
              <div className="row"><span className="label">Open to</span><span className="value">Automation · AI support · GIS / CAD ops</span></div>
              <div className="row"><span className="label">Background</span><span className="value">CAD / GIS, Python, on-device AI</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

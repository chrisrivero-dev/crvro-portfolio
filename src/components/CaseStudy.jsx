import React from "react";
import ProjectMark from "./ProjectMark.jsx";

/**
 * Reusable image-block placeholder. Renders a wide editorial frame
 * with a label + caption — designed to be replaced by a real image
 * later (just swap the inner <div className="frame"> with an <img>).
 */
function ImageBlock({ label, caption, ratio = "16 / 9" }) {
  return (
    <figure className="case-figure">
      <div className="frame" style={{ aspectRatio: ratio }}>
        <span className="placeholder-mark" aria-hidden="true">
          <span /><span /><span />
        </span>
        <span className="placeholder-label">{label}</span>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function Section({ index, label, title, children }) {
  return (
    <section className="case-section">
      <div className="case-section-head">
        <div className="idx">{index} — {label}</div>
        <h2 className="title">{title}</h2>
      </div>
      <div className="case-section-body">{children}</div>
    </section>
  );
}

function MetaRow({ label, value }) {
  return (
    <div className="meta-row-item">
      <span className="lab">{label}</span>
      <span className="val">{value}</span>
    </div>
  );
}

export default function CaseStudy({ project: p }) {
  return (
    <article className="case-study" data-screen-label={"Case " + p.slug}>
      {/* ── back link ─────────────────────────────────────── */}
      <div className="container-wide case-back">
        <a href="/" className="back-link">
          <span className="ar">←</span>
          <span>Back to all work</span>
        </a>
      </div>

      {/* ── hero ─────────────────────────────────────────── */}
      <header className="case-hero">
        <div className="container-wide">
          <div className="grid">
            <div className="marker">
              <span className="num">{p.n} / 04</span>
              <span className="kind">{p.kind}</span>
              <span className="yr">{p.year}</span>
            </div>
            <div>
              <div className="eyebrow">§ Case study</div>
              <h1 className="case-title">
                {p.title} <em>{p.titleEm}</em>
              </h1>
              <div className="mark-row">
                <ProjectMark shape={p.shape} color={p.accent} size={120} />
              </div>
              <div className="meta-grid">
                <MetaRow label="Role"   value={p.role} />
                <MetaRow label="Status" value={p.status} />
                {p.repo && <MetaRow label="Repo" value={<a href={p.repo} target="_blank" rel="noreferrer">{p.repo.replace(/^https?:\/\//,'')} ↗</a>} />}
                {p.demo && <MetaRow label="Demo" value={<a href={p.demo} target="_blank" rel="noreferrer">{p.demo.replace(/^https?:\/\//,'')} ↗</a>} />}
                {!p.repo && !p.demo && <MetaRow label="Links" value={<span style={{color:"var(--pencil)"}}>Repo / demo coming soon</span>} />}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── disclaimer (predmkt) ────────────────────────── */}
      {p.disclaimer && (
        <div className="container-wide">
          <div className="disclaimer">
            <span className="lab">Note</span>
            <span>{p.disclaimer}</span>
          </div>
        </div>
      )}

      {/* ── overview ─────────────────────────────────────── */}
      <Section index="01" label="Overview" title="What it is.">
        {p.overview.map((para, i) => <p key={i}>{para}</p>)}
      </Section>

      {/* ── problem ─────────────────────────────────────── */}
      <Section index="02" label="Problem" title="What I was trying to solve.">
        {p.problem.map((para, i) => <p key={i}>{para}</p>)}
      </Section>

      {/* ── lead screenshot ─────────────────────────────── */}
      {p.screenshots && p.screenshots[0] && (
        <div className="container-wide case-figure-wrap">
          <ImageBlock label={p.screenshots[0].label} caption={p.screenshots[0].caption} ratio="16 / 9" />
        </div>
      )}

      {/* ── what I built ─────────────────────────────────── */}
      <Section index="03" label="What I built" title="The shape of the system.">
        <ul className="bullet-list">
          {p.built.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
        {p.architecture && (
          <div className="architecture">
            <div className="lab">Flow</div>
            {p.architecture.map((a, i) => <p key={i}>{a}</p>)}
          </div>
        )}
      </Section>

      {/* ── key features ─────────────────────────────────── */}
      <Section index="04" label="Key features" title="What it does.">
        <ul className="feature-list">
          {p.features.map((f, i) => (
            <li key={i}>
              <span className="bullet">·</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* ── secondary screenshots ──────────────────────── */}
      {p.screenshots && p.screenshots.length > 1 && (
        <div className="container-wide case-figure-wrap">
          <div className="figure-grid">
            {p.screenshots.slice(1, 3).map((s, i) => (
              <ImageBlock key={i} label={s.label} caption={s.caption} ratio="4 / 3" />
            ))}
          </div>
        </div>
      )}

      {/* ── tech stack ─────────────────────────────────── */}
      <Section index="05" label="Tech stack" title="Tools I reached for.">
        <div className="stack-grid">
          {p.stack.map((s) => (
            <div key={s.group} className="stack-col">
              <h4>{s.group}</h4>
              <ul>{s.items.map((it) => <li key={it}>{it}</li>)}</ul>
            </div>
          ))}
        </div>
      </Section>

      {/* ── remaining screenshots ──────────────────────── */}
      {p.screenshots && p.screenshots.length > 3 && (
        <div className="container-wide case-figure-wrap">
          <div className="figure-grid">
            {p.screenshots.slice(3).map((s, i) => (
              <ImageBlock key={i} label={s.label} caption={s.caption} ratio="4 / 3" />
            ))}
          </div>
        </div>
      )}

      {/* ── what I learned ─────────────────────────────── */}
      <Section index="06" label="What I learned" title="Notes to my future self.">
        <ol className="learned-list">
          {p.learned.map((l, i) => (
            <li key={i}>
              <span className="num">{String(i + 1).padStart(2, "0")}</span>
              <span>{l}</span>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── status / next ─────────────────────────────── */}
      <Section index="07" label="Status &amp; next steps" title="Where it goes from here.">
        <p className="status-line">
          <span className="lab">Status —</span>
          <span>{p.status}</span>
        </p>
        <ul className="bullet-list">
          {p.next.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      </Section>

      {/* ── footer cta ─────────────────────────────────── */}
      <div className="container-wide case-cta">
        <div className="cta-card">
          <div>
            <div className="eyebrow">§ Next</div>
            <h3>See the rest of the work, or get in touch.</h3>
          </div>
          <div className="actions">
            <a href="/" className="btn">All projects →</a>
            <a href="/#contact" className="btn btn-primary">Contact ↗</a>
          </div>
        </div>
      </div>
    </article>
  );
}

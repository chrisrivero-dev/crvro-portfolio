import React, { useRef, useCallback } from 'react';
import ProjectMark from './ProjectMark.jsx';
import ParcelPreview from './ParcelPreview.jsx';
import EvidencePanel from './EvidencePanel.jsx';
import { PROJECTS, GIS_PROJECTS } from '../data/projects.js';

function ToolRouterMockup() {
  return (
    <div className="mockup mockup-json">
      <div className="mockup-bar">
        <span className="mockup-dots"><i /><i /><i /></span>
        <span className="mockup-fname">tool_router · output</span>
      </div>
      <pre className="mockup-pre">
        <span className="mp">{`{\n`}</span>
        <span className="mk">{`  "input"`}</span><span className="mp">{`:    `}</span><span className="mv">{`"Remind me Tuesday to review the invoice"`}</span><span className="mp">{`,\n`}</span>
        <span className="mk">{`  "intent"`}</span><span className="mp">{`:   `}</span><span className="mv">{`"create_reminder"`}</span><span className="mp">{`,\n`}</span>
        <span className="mk">{`  "tool"`}</span><span className="mp">{`:     `}</span><span className="mv">{`"calendar.reminder.create"`}</span><span className="mp">{`,\n`}</span>
        <span className="mk">{`  "arguments"`}</span><span className="mp">{`: {\n`}</span>
        <span className="mk">{`    "title"`}</span><span className="mp">{`:    `}</span><span className="mv">{`"Review the invoice"`}</span><span className="mp">{`,\n`}</span>
        <span className="mk">{`    "date"`}</span><span className="mp">{`:     `}</span><span className="mv">{`"Tuesday"`}</span><span className="mp">{`,\n`}</span>
        <span className="mk">{`    "time"`}</span><span className="mp">{`:     `}</span><span className="mv">{`"09:00"`}</span><span className="mp">{`,\n`}</span>
        <span className="mk">{`    "timezone"`}</span><span className="mp">{`: `}</span><span className="mv">{`"America/Los_Angeles"`}</span><span className="mp">{`\n  },\n`}</span>
        <span className="mk">{`  "requires_confirmation"`}</span><span className="mp">{`: `}</span><span className="mb">{`true`}</span><span className="mp">{`,\n`}</span>
        <span className="mk">{`  "status"`}</span><span className="mp">{`:  `}</span><span className="ms">{`"proposed"`}</span><span className="mp">{`\n}`}</span>
      </pre>
    </div>
  );
}

function WorkflowFlowMockup() {
  const stages = [
    { k: 'Request', d: 'Telegram · local' },
    { k: 'Route', d: 'Local or cloud model' },
    { k: 'Tools', d: 'Code · repo · files' },
    { k: 'Test', d: 'Build + verify' },
    { k: 'Review', d: 'Human approval' },
    { k: 'Deploy', d: 'Git → GitHub → live' },
  ];
  return (
    <div className="mockup mockup-flow">
      <div className="mockup-bar">
        <span className="mockup-dots"><i /><i /><i /></span>
        <span className="mockup-fname">hermes · workflow</span>
      </div>
      <div className="flow-row">
        {stages.map((s, i) => (
          <React.Fragment key={s.k}>
            <div className="flow-node">
              <span className="flow-k">{s.k}</span>
              <span className="flow-d">{s.d}</span>
            </div>
            {i < stages.length - 1 && (
              <span className="flow-arrow" aria-hidden="true">→</span>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="flow-trace">Every step logged — traceable from request to deployment.</div>
    </div>
  );
}

function AuditLogMockup() {
  return (
    <div className="mockup mockup-log">
      <div className="mockup-bar">
        <span className="mockup-dots"><i /><i /><i /></span>
        <span className="mockup-fname">audit.log</span>
      </div>
      <div className="mockup-log-body">
        <div className="log-entry">
          <div className="log-head"><span className="log-ts">[09:00:12]</span><span className="log-ev">command_received</span></div>
          <div className="log-kv">source=telegram</div>
          <div className="log-kv">intent=create_reminder</div>
        </div>
        <div className="log-entry">
          <div className="log-head"><span className="log-ts">[09:00:14]</span><span className="log-ev">action_proposed</span></div>
          <div className="log-kv">tool=calendar.reminder.create</div>
          <div className="log-kv">status=awaiting_confirmation</div>
        </div>
        <div className="log-entry">
          <div className="log-head"><span className="log-ts">[09:00:21]</span><span className="log-ev">user_confirmed</span></div>
          <div className="log-kv">confirmation_id=rem_0427</div>
        </div>
        <div className="log-entry">
          <div className="log-head"><span className="log-ts">[09:00:22]</span><span className="log-ev log-ok">action_executed</span></div>
          <div className="log-kv">result=success</div>
          <div className="log-kv">logged=true</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable image block.
 * If an image path exists, it renders the image.
 * If not, it keeps the original editorial placeholder.
 */
function ImageBlock({
  label,
  caption,
  image,
  images,
  mockup,
  ratio = '16 / 9',
  fit = 'cover',
  position = 'center center',
  zoom = 1,
  hoverScale = 1.08,
  panOnHover = false,
}) {
  const frameRef = useRef(null);
  const imgRef = useRef(null);
  const hasPan = panOnHover && !!image;

  const handleMouseMove = useCallback(
    (e) => {
      if (!hasPan || !frameRef.current || !imgRef.current) return;
      const img = imgRef.current;
      const rect = frameRef.current.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      const S = zoom * hoverScale;
      const maxTx = (rect.width * (S - 1)) / 2;
      const maxTy = (rect.height * (S - 1)) / 2;
      img.style.transition = 'none';
      img.style.setProperty('--frame-scale', String(S));
      img.style.setProperty('--pan-x', `${(nx - 0.5) * maxTx * 0.5}px`);
      img.style.setProperty('--pan-y', `${(ny - 0.5) * maxTy * 0.5}px`);
    },
    [hasPan, zoom, hoverScale]
  );

  const handleMouseLeave = useCallback(() => {
    if (!hasPan || !imgRef.current) return;
    const img = imgRef.current;
    img.style.transition = '';
    img.style.removeProperty('--frame-scale');
    img.style.setProperty('--pan-x', '0px');
    img.style.setProperty('--pan-y', '0px');
  }, [hasPan]);

  return (
    <figure className="case-figure">
      <div
        className={
          'frame' +
          (hasPan ? ' frame--pan' : '') +
          (mockup ? ` frame--${mockup}` : '')
        }
        ref={frameRef}
        style={{ aspectRatio: ratio }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {image ? (
          <img
            ref={(el) => {
              imgRef.current = el;
              if (el?.complete) el.classList.add('img-loaded');
            }}
            className="frame-img"
            src={image}
            alt={label || caption || 'Project screenshot'}
            loading="lazy"
            onLoad={(e) => e.currentTarget.classList.add('img-loaded')}
            style={{
              objectFit: fit,
              objectPosition: position,
              '--img-zoom': zoom,
              '--img-hover-scale': hoverScale,
            }}
          />
        ) : images && images.length > 0 ? (
          <>
            <div className="tg-slideshow" aria-label={label}>
              {images.map((src, i) => (
                <div key={i} className="tg-slide">
                  <img src={src} alt={`${label} — frame ${i + 1}`} />
                </div>
              ))}
            </div>
            <span className="placeholder-label">{label}</span>
          </>
        ) : mockup === 'tool-router' ? (
          <>
            <ToolRouterMockup />
            <span className="placeholder-label">{label}</span>
          </>
        ) : mockup === 'workflow-flow' ? (
          <>
            <WorkflowFlowMockup />
            <span className="placeholder-label">{label}</span>
          </>
        ) : mockup === 'audit-log' ? (
          <>
            <AuditLogMockup />
            <span className="placeholder-label">{label}</span>
          </>
        ) : mockup === 'parcel-preview' ? (
          <ParcelPreview />
        ) : (
          <>
            <span className="placeholder-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="placeholder-label">{label}</span>
          </>
        )}
      </div>

      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function Section({ index, label, title, children }) {
  return (
    <section className="case-section">
      <div className="case-section-head">
        <div className="idx">
          {index} — {label}
        </div>
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
  const total = PROJECTS.some((proj) => proj.slug === p.slug)
    ? PROJECTS.length
    : GIS_PROJECTS.length;
  return (
    <article className="case-study" data-screen-label={'Case ' + p.slug}>
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
              <span className="num">{p.n} / {String(total).padStart(2, '0')}</span>
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
                <MetaRow label="Role" value={p.role} />
                <MetaRow label="Status" value={p.status} />
                {p.outcome && <MetaRow label="Outcome" value={p.outcome} />}

                {p.repo && (
                  <MetaRow
                    label="Repo"
                    value={
                      <a href={p.repo} target="_blank" rel="noreferrer">
                        {p.repo.replace(/^https?:\/\//, '')} ↗
                      </a>
                    }
                  />
                )}

                {p.demo && (
                  <MetaRow
                    label="Demo"
                    value={
                      <a href={p.demo} target="_blank" rel="noreferrer">
                        {p.demo.replace(/^https?:\/\//, '')} ↗
                      </a>
                    }
                  />
                )}

                {!p.repo && !p.demo && (
                  <MetaRow
                    label="Links"
                    value={
                      <span style={{ color: 'var(--pencil)' }}>
                        No public repo or demo yet
                      </span>
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── disclaimer ───────────────────────────────────── */}
      {p.disclaimer && (
        <div className="container-wide">
          <div className="disclaimer">
            <span className="lab">Note</span>
            <span>{p.disclaimer}</span>
          </div>
        </div>
      )}

      {/* ── evidence panel ───────────────────────────────── */}
      <EvidencePanel project={p} />

      {/* ── overview ─────────────────────────────────────── */}
      <Section index="01" label="Overview" title="What it is.">
        {p.overview.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </Section>

      {/* ── problem ─────────────────────────────────────── */}
      <Section index="02" label="Problem" title="What I was trying to solve.">
        {p.problem.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </Section>

      {/* ── lead screenshot ─────────────────────────────── */}
      {p.screenshots && p.screenshots[0] && (
        <div className="container-wide case-figure-wrap" data-parallax="0.035">
          <ImageBlock
            label={p.screenshots[0].label}
            caption={p.screenshots[0].caption}
            image={p.screenshots[0].image}
            images={p.screenshots[0].images}
            mockup={p.screenshots[0].mockup}
            ratio={p.screenshots[0].ratio || '16 / 9'}
            fit={p.screenshots[0].fit || 'cover'}
            position={p.screenshots[0].position || 'center center'}
            zoom={p.screenshots[0].zoom || 1}
            hoverScale={p.screenshots[0].hoverScale}
            panOnHover={p.screenshots[0].panOnHover}
          />
        </div>
      )}
      {/* ── what I built ─────────────────────────────────── */}
      <Section index="03" label="What I built" title="The shape of the system.">
        <ul className="bullet-list">
          {p.built.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>

        {p.architecture && (
          <div className="architecture">
            <div className="lab">Flow</div>
            {p.architecture.map((a, i) => (
              <p key={i}>{a}</p>
            ))}
          </div>
        )}
      </Section>

      {/* ── key features ─────────────────────────────────── */}
      <Section index="04" label="Key features" title="What it does.">
        {p.capabilities ? (
          <div className="capability-grid">
            {p.capabilities.map((c) => (
              <div key={c.title} className="capability-card">
                <h4>{c.title}</h4>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        ) : (
          <ul className="feature-list">
            {p.features.map((f, i) => (
              <li key={i}>
                <span className="bullet">·</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        )}

        {p.useCases && (
          <div className="use-cases">
            <div className="lab">Representative use cases</div>
            <ul className="bullet-list">
              {p.useCases.map((u, i) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      {/* ── secondary screenshots ───────────────────────── */}
      {p.screenshots && p.screenshots.length > 1 && (() => {
        const pair = p.screenshots.slice(1, 3);
        if (pair.some((s) => s.fullWidth)) {
          return pair.map((s, i) => (
            <div key={i} className="container-wide case-figure-wrap" data-parallax="0.025">
              {s.fullWidth ? (
                <ImageBlock
                  label={s.label}
                  caption={s.caption}
                  image={s.image}
                  images={s.images}
                  mockup={s.mockup}
                  ratio={s.ratio || '16 / 9'}
                  fit={s.fit || 'contain'}
                  position={s.position || 'center center'}
                  zoom={s.zoom || 1}
                  hoverScale={s.hoverScale}
                  panOnHover={s.panOnHover}
                />
              ) : (
                <div className="figure-single--narrow">
                  <ImageBlock
                    label={s.label}
                    caption={s.caption}
                    image={s.image}
                    images={s.images}
                    mockup={s.mockup}
                    ratio={s.ratio || '3 / 4'}
                    fit={s.fit || 'contain'}
                    position={s.position || 'center top'}
                    zoom={s.zoom || 1}
                    hoverScale={s.hoverScale}
                    panOnHover={s.panOnHover}
                  />
                </div>
              )}
            </div>
          ));
        }
        return (
          <div className="container-wide case-figure-wrap" data-parallax="0.025">
            <div className="figure-grid">
              {pair.map((s, i) => (
                <ImageBlock
                  key={i}
                  label={s.label}
                  caption={s.caption}
                  image={s.image}
                  images={s.images}
                  mockup={s.mockup}
                  ratio={s.ratio || '4 / 3'}
                  fit={s.fit || 'cover'}
                  position={s.position || 'center center'}
                  zoom={s.zoom || 1}
                  hoverScale={s.hoverScale}
                  panOnHover={s.panOnHover}
                />
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── tech stack ─────────────────────────────────── */}
      <Section index="05" label="Tech stack" title="Tools I reached for.">
        <div className="stack-grid">
          {p.stack.map((s) => (
            <div key={s.group} className="stack-col">
              <h4>{s.group}</h4>
              <ul>
                {s.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* ── remaining screenshots ───────────────────────── */}
      {p.screenshots && p.screenshots.length > 3 && (() => {
        const rest = p.screenshots.slice(3);
        const groups = [];
        let currentGrid = [];
        for (const s of rest) {
          if (s.fullWidth) {
            if (currentGrid.length > 0) { groups.push({ type: 'grid', items: currentGrid }); currentGrid = []; }
            groups.push({ type: 'full', item: s });
          } else {
            currentGrid.push(s);
          }
        }
        if (currentGrid.length > 0) groups.push({ type: 'grid', items: currentGrid });

        return groups.map((group, i) => {
          if (group.type === 'full') {
            const s = group.item;
            return (
              <div key={i} className="container-wide case-figure-wrap" data-parallax="0.025">
                <ImageBlock
                  label={s.label}
                  caption={s.caption}
                  image={s.image}
                  images={s.images}
                  mockup={s.mockup}
                  ratio={s.ratio || '16 / 9'}
                  fit={s.fit || 'contain'}
                  position={s.position || 'center center'}
                  zoom={s.zoom || 1}
                  hoverScale={s.hoverScale}
                  panOnHover={s.panOnHover}
                />
              </div>
            );
          }
          return (
            <div key={i} className="container-wide case-figure-wrap" data-parallax="0.025">
              <div className="figure-grid">
                {group.items.map((s, j) => (
                  <ImageBlock
                    key={j}
                    label={s.label}
                    caption={s.caption}
                    image={s.image}
                    images={s.images}
                    mockup={s.mockup}
                    ratio={s.ratio || '4 / 3'}
                    fit={s.fit || 'cover'}
                    position={s.position || 'center center'}
                    zoom={s.zoom || 1}
                    hoverScale={s.hoverScale}
                    panOnHover={s.panOnHover}
                  />
                ))}
              </div>
            </div>
          );
        });
      })()}

      {/* ── what I learned ─────────────────────────────── */}
      <Section
        index="06"
        label="What I learned"
        title="Notes to my future self."
      >
        <ol className="learned-list">
          {p.learned.map((l, i) => (
            <li key={i}>
              <span className="num">{String(i + 1).padStart(2, '0')}</span>
              <span>{l}</span>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── status / next ─────────────────────────────── */}
      <Section
        index="07"
        label="Status &amp; next steps"
        title="Where it goes from here."
      >
        <p className="status-line">
          <span className="lab">Status —</span>
          <span>{p.status}</span>
        </p>

        <ul className="bullet-list">
          {p.next.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
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
            <a href="/" className="btn">
              All projects →
            </a>
            <a href="/#contact" className="btn btn-primary">
              Contact ↗
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

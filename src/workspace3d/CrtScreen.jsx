// ============================================================
// What the 3D CRT shows. React portals this into the CSS3D screen element, so it is real,
// sharp, focusable DOM at any camera distance. Three panes:
//   home  the idle screen in the room (the production hero copy + "use the computer")
//   menu  the directory of full-page experiences (WORLD.MAP, ASK.EXE, ...)
//   disk  the directory of the floppy in the drive, built from the project registry
// Nothing here is invented: disk files are registry fields, menu blurbs are the sections' own wording. Content appears at once:
// no typing or staged loading (the only motion is the cursor's blink, and the disk's physical travel in the room).
// ============================================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PROJECTS, GIS_PROJECTS } from '../data/projects.js';
import { CASE_IDS } from '../data/caseIds.js';
import { EXPERIENCES } from '../lib/experiences.js';
import PortfolioNavigator from '../components/PortfolioNavigator.jsx';
import Contact from '../components/Contact.jsx';

const SITE = 'https://crvro.com';
const BY_SLUG = Object.fromEntries([...PROJECTS, ...GIS_PROJECTS].map((p) => [p.slug, p]));

/** The disk's files: each is a registry field, shown only when the project has it. */
export function filesFor(p) {
  const stack = [...(p.tags || [])];
  for (const g of p.stack || []) stack.push(`${g.group}: ${g.items.join(', ')}`);
  const files = [
    { name: 'README', ext: 'TXT', head: `${p.title.toUpperCase()}  ·  ${p.kind}`, body: [p.titleEm, p.desc] },
    { name: 'STATUS', ext: 'TXT', head: (p.statusBadge || 'STATUS').toUpperCase(), body: [p.status] },
    { name: 'ROLE', ext: 'TXT', head: p.year, body: [p.role] },
  ];
  if (stack.length) files.push({ name: 'STACK', ext: 'TXT', head: 'BUILT WITH', body: stack });
  files.push({ name: 'CASE', ext: 'LNK', head: 'CASE STUDY', body: ['The full write-up.'], link: { href: `${SITE}/projects/${p.slug}`, local: `/projects/${p.slug}`, label: 'OPEN CASE STUDY' } });
  if (p.demo) files.push({ name: 'DEMO', ext: 'LNK', head: 'DEMO', body: ['A hosted demo.'], link: { href: p.demo, label: 'OPEN DEMO', external: true } });
  if (p.site) files.push({ name: 'SITE', ext: 'LNK', head: 'PRODUCT SITE', body: ['The product site.'], link: { href: p.site, label: 'OPEN SITE', external: true } });
  if (p.repo) files.push({ name: 'REPO', ext: 'LNK', head: 'SOURCE', body: ['The source repository.'], link: { href: p.repo, label: 'OPEN REPOSITORY', external: true } });
  return files.filter((f) => f.body.every(Boolean));
}

function Prompt({ cmd, cursor = true }) {
  return (
    <div className="ws-prompt" aria-hidden={!cmd}>
      <span className="ws-ps">A:\&gt;</span> <span className="ws-cmd">{cmd}</span>
      {cursor && <span className="ws-cursor" aria-hidden="true" />}
    </div>
  );
}

function arrowNav(e, listRef, idx, count, onMove) {
  const d = { ArrowDown: 1, ArrowUp: -1, Home: -Infinity, End: Infinity }[e.key];
  if (!d) return;
  e.preventDefault();
  const n = d === Infinity ? count - 1 : d === -Infinity ? 0 : (idx + d + count) % count;
  listRef.current?.children[n]?.focus({ preventScroll: true });
  onMove?.(n);
}

/* ── idle: the screen as seen from the room ─────────────────────── */
function HomePane({ onUse }) {
  return (
    <div className="ws-pane ws-home">
      <pre className="ws-boot">CRVRO-OS 1970 · PHOSPHOR P1 · 80 COLUMNS</pre>
      <div className="ws-rule" aria-hidden="true" />
      <p className="ws-eyebrow">SUPPORT AUTOMATION · AI OPERATIONS · GIS SYSTEMS</p>
      <p className="ws-headline">I turn difficult support and mapping workflows into controlled, testable software.</p>
      <p className="ws-sub">I build Python automation and AI tools for support and GIS/CAD work I know firsthand.</p>
      <p className="ws-idle" aria-hidden="true"><span className="ws-ps">A:\&gt;</span> READY<span className="ws-cursor" /></p>
      <button type="button" className="ws-cta" onClick={onUse} data-ws="use">
        <span>USE THE COMPUTER</span><span aria-hidden="true">→</span>
      </button>
      <p className="ws-hint">or load a project disk from the tray</p>
    </div>
  );
}

/* ── menu: the full-page experiences ────────────────────────────── */
function MenuPane({ loaded, focusEntry, onPick, onOpenDisk, active }) {
  const cmd = 'DIR';
  const rows = EXPERIENCES.length;
  const listRef = useRef(null);
  const done = true;
  useEffect(() => {
    if (!active || !done) return;
    const want = focusEntry ? listRef.current?.querySelector(`[data-entry="${focusEntry}"]`) : null;
    (want || listRef.current?.children[0])?.focus({ preventScroll: true });
  }, [active, done, focusEntry]);
  return (
    <div className="ws-pane ws-menu">
      <Prompt cmd={cmd} />
      <div className="ws-vol">Directory of A:\COMPUTER</div>
      <div className="ws-list ws-list--menu" ref={listRef} role="group" aria-label="Open an experience">
        {EXPERIENCES.slice(0, rows).map((e, i) => (
          <button
            key={e.id}
            type="button"
            className="ws-file ws-file--menu"
            data-entry={e.id}
            onClick={() => onPick(e)}
            onKeyDown={(ev) => arrowNav(ev, listRef, i, EXPERIENCES.length)}
            aria-label={`${e.label}: ${e.blurb}`}
          >
            <span className="ws-fn">{e.file}</span>
            <span className="ws-fe">{e.ext}</span>
            <span className="ws-fb">{e.blurb}</span>
          </button>
        ))}
      </div>
      {done && (
        <p className="ws-sum">
          {loaded ? (
            <>A: <b>{BY_SLUG[loaded].title}</b> is in the drive. <button type="button" className="ws-linkbtn" onClick={onOpenDisk}>OPEN DISK</button></>
          ) : (
            <>Load a floppy from the tray to open a case study.</>
          )}
          {'   ·   Esc: back to the room'}
        </p>
      )}
    </div>
  );
}

/* ── disk: the floppy in the drive ──────────────────────────────── */
function DiskPane({ slug, active, onMenu }) {
  const p = BY_SLUG[slug];
  const files = useMemo(() => filesFor(p), [p]);
  const rows = files.length;
  const [sel, setSel] = useState(0);
  const listRef = useRef(null);
  const done = true;
  useEffect(() => { setSel(0); }, [slug]);
  useEffect(() => { if (active && done) listRef.current?.children[sel]?.focus({ preventScroll: true }); }, [active, done]); // eslint-disable-line react-hooks/exhaustive-deps
  const f = files[sel];
  return (
    <div className="ws-pane ws-disk">
      <Prompt cmd={`TYPE ${f.name}.${f.ext}`} />
      <div className="ws-vol">Volume in drive A is {slug.toUpperCase().replace(/-/g, ' ')}  ·  CASE {CASE_IDS[slug]}</div>
      <div className="ws-body">
        <div className="ws-list" ref={listRef} role="group" aria-label="Files on the disk">
          {files.slice(0, rows).map((x, i) => (
            <button
              key={x.name}
              type="button"
              className={`ws-file${i === sel ? ' is-on' : ''}`}
              aria-current={i === sel}
              onClick={() => setSel(i)}
              onKeyDown={(ev) => arrowNav(ev, listRef, i, files.length, setSel)}
            >
              <span className="ws-fn">{x.name}</span><span className="ws-fe">{x.ext}</span>
            </button>
          ))}
        </div>
        {done && (
          <div className="ws-view" tabIndex={0} role="region" aria-label={`${f.name}.${f.ext}`}>
            <div className="ws-vhead">{f.head}</div>
            {f.body.map((t, i) => <p key={i} className="ws-vp">{t}</p>)}
            {f.link && (
              <>
                <a
                  className="ws-link"
                  href={f.link.local || f.link.href}
                  {...(f.link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >{f.link.label} →</a>
                {f.link.external && <span className="ws-note">opens in a new tab</span>}
              </>
            )}
          </div>
        )}
      </div>
      {done && (
        <p className="ws-sum">
          {files.length} file(s)   ·   <button type="button" className="ws-linkbtn" onClick={onMenu}>MENU</button>   ·   Esc: back to the room
        </p>
      )}
    </div>
  );
}

/* ── programs that run on the physical CRT (05A): the existing components, unchanged, in a scrolling screen pane ── */
const APPS = {
  navigator: { title: 'ASK.EXE', Body: () => <PortfolioNavigator direct />, full: '/#navigator' },
  contact: { title: 'CONTACT.TXT', Body: () => <Contact />, full: '/#contact' },
};
function AppPane({ app, active, onMenu, onExpand }) {
  const a = APPS[app];
  const ref = useRef(null);
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => (ref.current?.querySelector('input, a[href], button') || ref.current)?.focus({ preventScroll: true }), 60);
    return () => clearTimeout(t);
  }, [active, app]);
  return (
    <div className="ws-pane ws-apppane">
      <div className="ws-apphead">
        <span><span className="ws-ps">A:\&gt;</span> {a.title}</span>
        <span className="ws-appactions">
          <button type="button" className="ws-linkbtn" onClick={() => onExpand(app)}>FULL SCREEN ↗</button>
          <button type="button" className="ws-linkbtn" onClick={onMenu}>MENU</button>
        </span>
      </div>
      <div className="ws-app" ref={ref} tabIndex={-1}><a.Body /></div>
    </div>
  );
}

export default function CrtScreen({ ui, reduced, menuOpen, focusEntry, app, onUse, onPick, onOpenDisk, onMenu, onExpand }) {
  const atScreen = ui.view === 'crt' || ui.view === 'fill';
  const showDisk = ui.session && !menuOpen;
  return (
    <div className={`ws-screen-inner${atScreen ? ' is-near' : ''}`}>
      {app && atScreen && !showDisk ? (
        <AppPane app={app} active={ui.view === 'crt'} onMenu={onMenu} onExpand={onExpand} />
      ) : showDisk ? (
        <DiskPane slug={ui.session} active={ui.view === 'crt'} onMenu={onMenu} />
      ) : atScreen ? (
        <MenuPane loaded={ui.session} focusEntry={focusEntry} onPick={onPick} onOpenDisk={onOpenDisk} active={ui.view === 'crt'} />
      ) : (
        <HomePane onUse={onUse} />
      )}
    </div>
  );
}

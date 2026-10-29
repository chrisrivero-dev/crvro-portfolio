// ============================================================
// The 3D-first homepage. Lazy-loaded (Three.js is a separate chunk) and kept mounted while the visitor is
// inside a full-page experience or a case study; `active` says whether the room is what they are looking at.
//   active   -> rendering on demand, steam allowed
//   inactive -> engine.suspend(): no frames, no steam timer, the scene stays in memory for an instant return
// Unavailable (no WebGL2, init failure, a context that never comes back) -> onUnavailable(reason): App shows the 2D page.
// ============================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createWorkspace } from './engine.js';
import { createController } from './controller.js';
import CrtScreen from './CrtScreen.jsx';
import { DISK_PROJECTS, CASE_IDS } from '../data/caseIds.js';
import { PLAN_NOTE_PROJECTS } from '../data/planNotes.js';
import { CAREER_PAGES } from '../data/career.js';
import { PAGE_VIEW, CareerIndex } from '../components/CareerContent.jsx';
import { EXPERIENCES, hrefFor } from '../lib/experiences.js';
import { navigate } from '../lib/location.js';
import { PHOTOS } from '../data/photos.js';
import { LAB } from '../data/daventryLab.js';
import { STATIONS, SWITCHER, STATION_LABEL, stationOfUi, hrefForStation, baseStation, rememberOrigin } from '../lib/stations.js';
import '../styles/workspace3d.css';

const supportsWebGL2 = () => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } };
const lowQuality = () => window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 700;
const TITLES = Object.fromEntries(DISK_PROJECTS.map((d) => [d.slug, d.label]));
const prettyTitle = (slug) => TITLES[slug].replace(/\b([A-Z])([A-Z]+)/g, (m, a, b) => a + b.toLowerCase());
const NOTES = Object.fromEntries(PLAN_NOTE_PROJECTS.map((p) => [p.slug, p]));
const openCase = (slug, origin) => { rememberOrigin(origin); return { id: 'case', href: `/projects/${slug}` }; };

/** The open notebook's reading surface: real DOM laid over the right-hand page (src/components/CareerContent.jsx), placed from the page's projected corners. */
function NotebookReader({ rect, page, onPage, onProof, paperRef }) {
  const idx = Math.max(0, CAREER_PAGES.findIndex((p) => p.id === page));
  const cur = CAREER_PAGES[idx];
  const View = PAGE_VIEW[cur.id];
  // more text below the fold: a "continues" cue at the foot of the page, gone once the reader reaches the end
  const bodyRef = useRef(null);
  const [more, setMore] = useState(false);
  const measure = () => { const b = bodyRef.current; setMore(!!b && b.scrollHeight - b.scrollTop - b.clientHeight > 8); };
  useEffect(() => { measure(); }, [rect, page]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <section
      ref={paperRef}
      className="nb-sheet nb-paper"
      data-page={cur.id}
      data-more={more || undefined}
      aria-label={`Career notebook, page ${idx + 1} of ${CAREER_PAGES.length}: ${cur.label}`}
      hidden={!rect}
      style={rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height, clipPath: `polygon(${rect.poly})`, '--pw': `${rect.width}px` } : undefined}
    >
      <nav className="nb-tabs" aria-label="Notebook pages">
        {CAREER_PAGES.map((p) => (
          <button key={p.id} type="button" aria-current={p.id === cur.id ? 'page' : undefined} onClick={() => onPage(p.id)}><span aria-hidden="true">{p.short} </span>{p.tab}</button>
        ))}
      </nav>
      <div className="nb-body" key={cur.id} ref={bodyRef} onScroll={measure} tabIndex={0} aria-label={`${cur.label}, scrollable`}>
        <View headingProps={{ tabIndex: -1 }} onProof={onProof} onWork={() => onPage('work')} />
      </div>
      {more && (
        <button type="button" className="nb-more" onClick={() => bodyRef.current?.scrollBy({ top: bodyRef.current.clientHeight * 0.8, behavior: 'smooth' })}>
          Continued below <span aria-hidden="true">↓</span>
        </button>
      )}
    </section>
  );
}

/** The left-hand page of the open spread (wide screens only): an overview and an index of the page on the right. */
function NotebookIndex({ rect, page, onPick }) {
  return (
    <aside
      className="nb-sheet nb-index"
      aria-label="Notebook overview"
      style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height, clipPath: `polygon(${rect.poly})`, '--pw': `${rect.width}px` }}
    >
      <div className="nb-body"><CareerIndex page={page} onPick={onPick} /></div>
    </aside>
  );
}

export default function Workspace3D({ active, station = 'desk', onLaunch, onUnavailable, onPrefer2D }) {
  const stageRef = useRef(null);
  const engineRef = useRef(null);
  const ctlRef = useRef(null);
  const activeRef = useRef(active);
  const disksOpenRef = useRef(false);
  activeRef.current = active;
  const [engine, setEngine] = useState(null);
  const [ui, setUi] = useState({ view: 'rest', session: null, pending: null, held: null, busy: false, lastEntry: null, note: null, page: null, fit: 0, locs: {} });
  const [app, setApp] = useState(null);           // a program running on the CRT (ask / contact)
  const stationRef = useRef(station);
  stationRef.current = station;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const [hover, setHover] = useState(null);
  const [photo, setPhoto] = useState(null);   // 11: the print open in the camera view
  const [menuOpen, setMenuOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [announce, setAnnounce] = useState('');
  const [disksOpen, setDisksOpen] = useState(false);
  const diskListRef = useRef(null);
  const [stationsOpen, setStationsOpen] = useState(false);   // phones: one "Stations" button opens the list (05B.1)
  const stationsOpenRef = useRef(false);
  stationsOpenRef.current = stationsOpen;
  const stMenuRef = useRef(null);
  useEffect(() => { if (stationsOpen) (stMenuRef.current?.querySelector('[aria-current]') || stMenuRef.current?.querySelector('button'))?.focus({ preventScroll: true }); }, [stationsOpen]);
  // opening the list moves keyboard focus into it; Escape closes it and returns focus to its button
  useEffect(() => { if (disksOpen) diskListRef.current?.querySelector('button')?.focus({ preventScroll: true }); }, [disksOpen]);
  // the room fades out under the incoming interface instead of cutting (see .ws3d--leaving); it is suspended at once
  const [shown, setShown] = useState(active);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (active) { setShown(true); setLeaving(false); return undefined; }
    setLeaving(true);
    const t = setTimeout(() => { setShown(false); setLeaving(false); }, 380);
    return () => clearTimeout(t);
  }, [active]);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const onLaunchRef = useRef(onLaunch);
  onLaunchRef.current = onLaunch;
  const onUnavailableRef = useRef(onUnavailable);
  onUnavailableRef.current = onUnavailable;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const f = () => setReduced(mq.matches);
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);

  /* ── create / dispose the engine ─────────────────────────────── */
  useEffect(() => {
    if (!supportsWebGL2()) { onUnavailableRef.current('no-webgl2'); return undefined; }
    let cancelled = false;
    let eng = null, ctl = null, lostTimer = 0;
    (async () => {
      try {
        eng = await createWorkspace({ stage: stageRef.current, quality: lowQuality() ? 'low' : 'high' });
        if (cancelled) { eng.dispose(); return; }
        ctl = createController(eng, {
          onChange: (s) => { setUi(s); if (s.session) { setMenuOpen(false); setDisksOpen(false); } },
          onHover: setHover,
          onLaunch: (entry) => { rememberOrigin('/#computer'); onLaunchRef.current(entry); },
          // a printed stamp on a pinned note was pressed
          onNoteLink: (slug, kind) => {
            if (kind === 'case') onLaunchRef.current(openCase(slug, `/#plans/${slug}`));
            else if (kind === 'repo' && NOTES[slug]?.repo) window.open(NOTES[slug].repo, '_blank', 'noopener,noreferrer');
          },
        });
        eng.on('contextlost', () => {
          setPaused(true);
          clearTimeout(lostTimer);
          lostTimer = setTimeout(() => onUnavailableRef.current('context-lost'), 4000);   // restore normally takes well under a second
        });
        eng.on('contextrestored', () => { clearTimeout(lostTimer); setPaused(false); });
        engineRef.current = eng; ctlRef.current = ctl;
        if (!activeRef.current) eng.suspend();
        window.__WS__ = { engine: eng, ctl };
        setEngine(eng);
      } catch (err) {
        console.warn('[workspace3d] init failed:', err);
        if (!cancelled) onUnavailableRef.current('init-failed');
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(lostTimer);
      ctl?.dispose();
      eng?.dispose();
      engineRef.current = null; ctlRef.current = null;
      if (window.__WS__?.engine === eng) delete window.__WS__;
    };
  }, []);

  /* ── dormant while a full-page experience (or a case study) is open ── */
  const wasActive = useRef(active);
  useEffect(() => {
    const eng = engineRef.current, ctl = ctlRef.current;
    if (!eng || !ctl) return;
    if (!active) { eng.suspend(); wasActive.current = false; return; }
    eng.resume();
    if (!wasActive.current) {
      wasActive.current = true;
      ctl.returnFromScreen().then(() => {
        // hand focus back to the entry that was opened, so keyboard users land where they left
        const want = ctl.state.lastEntry && engineRef.current?.screenEl.querySelector(`[data-entry="${ctl.state.lastEntry}"]`);
        (want || engineRef.current?.screenEl.querySelector('[data-ws="use"]'))?.focus({ preventScroll: true });
      });
    }
  }, [active, engine]);

  /* ── keyboard: Escape steps back; C / D / arrows are secondary aids to the physical objects ── */
  useEffect(() => {
    const onKey = (e) => {
      if (!activeRef.current || e.metaKey || e.ctrlKey || e.altKey) return;
      const ctl = ctlRef.current;
      if (!ctl) return;
      const typing = e.target.closest?.('input, textarea, [contenteditable="true"]');
      if (e.key === 'Escape') {
        if (stationsOpenRef.current) { e.preventDefault(); setStationsOpen(false); document.querySelector('.ws3d__stbtn')?.focus({ preventScroll: true }); return; }
        if (disksOpenRef.current) { e.preventDefault(); setDisksOpen(false); document.querySelector('.ws3d__disks')?.focus({ preventScroll: true }); return; }
        const v = ctl.state.view;
        if (v === 'hold') { e.preventDefault(); ctl.putBack(); setAnnounce('Disk put back in the organizer.'); return; }
        if (v === 'note') { e.preventDefault(); ctl.goPlans(); setAnnounce('Back over the drafting plans.'); return; }
        if (v === 'plans' || v === 'mug' || v === 'book' || v === 'corner' || v === 'seat' || v === 'record' || v === 'lab' || v === 'camera') { e.preventDefault(); ctl.back(); setAnnounce('Back at the desk.'); return; }
        if (v === 'crt' || v === 'drive') { e.preventDefault(); ctl.back(); setAnnounce('Back at the desk.'); }
        return;
      }
      if (typing || e.target.closest?.('#screen')) return;          // the CRT's own lists use the arrow keys
      const k = e.key.toLowerCase();
      if (k === 'c') { e.preventDefault(); goStation('computer'); }
      else if (k === 'd') { e.preventDefault(); goStation('disks'); }
      else if (k === 'p') { e.preventDefault(); goStation('plans'); }
      else if (k === 'n') { e.preventDefault(); goStation('career'); }
      else if (k === 'l') { e.preventDefault(); goStation('corner'); }
      else if (k === ' ' && ctl.state.view === 'record' && !e.target.closest?.('button, a')) { e.preventDefault(); ctl.togglePlay(); }
      else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && ctl.state.view === 'book' && !e.shiftKey && flipPage(e.key === 'ArrowRight' ? 1 : -1)) { e.preventDefault(); }   // pages first; past the first or last page the arrows go on to the neighbouring station
      else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && e.shiftKey && ctl.state.view === 'rest') { e.preventDefault(); ctl.nudgeLook(e.key === 'ArrowLeft' ? 0.12 : -0.12, 0); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (e.target.closest?.('.ws3d__stations')) return;          // the switcher handles its own arrows
        e.preventDefault();
        const cur = baseStation(stationOfUi(ctl.state)) || 'desk';
        const i = STATIONS.indexOf(cur), n = STATIONS.length;
        goStation(STATIONS[(i + (e.key === 'ArrowRight' ? 1 : -1) + n) % n]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── stations <-> URL. A visitor action writes the new station; Back/Forward (or a link) drives the room to it. ── */
  function goStation(s) {
    const ctl = ctlRef.current;
    if (!ctl) return;
    setDisksOpen(false); setStationsOpen(false);
    if (s === 'desk') ctl.back();
    else if (s === 'plans') ctl.goPlans();
    else if (s === 'mug') ctl.goMug();
    else if (s === 'career') ctl.openBook('work');
    else if (s.startsWith('career/')) ctl.openBook(s.slice(7));
    else if (s === 'corner') ctl.goCorner();
    else if (s === 'corner/seat') ctl.sit();
    else if (s === 'corner/record') ctl.inspectRecord();
    else if (s === 'corner/lab') ctl.inspectLab();
    else if (s === 'corner/camera') ctl.inspectCamera();
    else if (s.startsWith('plans/')) ctl.inspectNote(s.slice(6));
    else if (s === 'computer') { setMenuOpen(true); ctl.approach(); }
    else if (s === 'disks') { if (ctl.state.held) ctl.putBack(); else ctl.focusTray(); }
    else if (s.startsWith('disk/')) ctl.pickUp(s.slice(5));
  }
  /** Turn the open notebook one page forward (+1) or back (-1). Returns false at the first and last pages (nothing turned). */
  function flipPage(d) {
    const ctl = ctlRef.current;
    if (!ctl || ctl.state.view !== 'book') return false;
    const i = ctl.pages.indexOf(ctl.state.page), n = i + d;
    if (n < 0 || n >= ctl.pages.length) return false;
    ctl.turnPage(ctl.pages[n]);
    return true;
  }
  const syncedRef = useRef(false);                 // the room writes the URL only after it has first applied the URL it was opened with
  useEffect(() => {                                // URL -> room
    const ctl = ctlRef.current;
    if (!ctl || !active || !station) return;
    syncedRef.current = true;
    const cur = stationOfUi(ctl.state);
    if (cur === station || ctl.state.busy || ctl.state.pending) return;
    if (ctl.state.view === 'fill') return;        // returning from the expanded interface handles itself
    goStation(station);
  }, [station, engine, active]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {                                // room -> URL (only settled states; push so Back retraces the visit)
    if (!activeRef.current || !syncedRef.current || !engineRef.current || !ctlRef.current) return;
    const s = stationOfUi(ctlRef.current.state);   // the live state, not a render that may already be stale
    if (s && s !== stationRef.current) navigate(hrefForStation(s));
  }, [ui]);

  // leaving the screen: keyboard focus must not stay on a control that is no longer in view; it moves to the current station
  useEffect(() => {
    if (ui.view === 'crt' || ui.view === 'fill' || ui.busy) return;
    if (!document.activeElement?.closest('#screen')) return;
    const cur = document.querySelector('.ws3d__stations [aria-current]');
    (cur?.offsetParent ? cur : document.querySelector('.ws3d__stbtn'))?.focus({ preventScroll: true });
  }, [ui.view, ui.busy]);
  useEffect(() => { if (ui.session) setAnnounce(`${prettyTitle(ui.session)} loaded. Directory shown on the screen.`); }, [ui.session]);

  // the notebook's reading surface: measured from the page's projected corners once the camera has settled over the book
  const [pageRect, setPageRect] = useState(null);
  const paperRef = useRef(null);
  const bookReading = ui.view === 'book' && !ui.busy && ui.fit > 0;   // fit counts the settled poses: 0 while the camera is still flying to the book
  const [leftRect, setLeftRect] = useState(null);
  useEffect(() => {
    const e = engineRef.current;
    // a short landscape phone leaves the open book too small to read: the page becomes a full-width sheet above the dock instead
    const dock = document.querySelector('.ws3d__dock')?.getBoundingClientRect();
    const sheet = bookReading && e && e.size.vh < 500 && dock
      ? (() => { const width = Math.min(e.size.vw - 150, 760), height = Math.max(160, dock.top - 16); return { left: 12, top: 8, width, height, poly: '0% 0%, 100% 0%, 100% 100%, 0% 100%', sheet: true }; })()
      : null;
    setPageRect(sheet || (bookReading && e ? e.bookPageRect() : null));
    setLeftRect(bookReading && e && e.book.spread(e.size) ? e.bookPageRect('left') : null);
  }, [bookReading, ui.fit, engine]);
  // keyboard and screen-reader users arrive at the page heading when the notebook settles open
  useEffect(() => { if (bookReading && pageRect) paperRef.current?.querySelector('h2')?.focus({ preventScroll: true }); }, [bookReading, !!pageRect]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (ui.view !== 'book' || !ui.page) return;
    const i = CAREER_PAGES.findIndex((p) => p.id === ui.page);
    setAnnounce(`Career notebook, page ${i + 1} of ${CAREER_PAGES.length}: ${CAREER_PAGES[i].label}.`);
  }, [ui.view, ui.page]);
  // the dock's height changes with the station (and on rotation); the notebook is re-framed in what it leaves free
  useEffect(() => {
    if (!engine || typeof ResizeObserver === 'undefined') return undefined;
    const dock = document.querySelector('.ws3d__dock');
    if (!dock) return undefined;
    const ro = new ResizeObserver(() => ctlRef.current?.refit());
    ro.observe(dock);
    return () => ro.disconnect();
  }, [engine, active]);

  const use = useCallback(() => { setMenuOpen(true); setApp(null); ctlRef.current?.approach(); setAnnounce('At the computer. Choose an experience.'); }, []);
  // ASK.EXE and CONTACT.TXT run on the physical CRT; everything long-form expands into the full interface
  const pick = useCallback((entry) => { if (entry.id === 'navigator' || entry.id === 'contact') { setApp(entry.id); setAnnounce(`${entry.label} on the computer screen.`); return; } ctlRef.current?.launch(entry); }, []);
  // one tap to a readable, full-size view of whatever the CRT is showing (the in-world screen stays the primary surface)
  const expandView = () => {
    if (app) { expand(app); return; }
    if (ui.session) { rememberOrigin('/#computer'); onLaunchRef.current({ id: 'case', href: `/projects/${ui.session}` }); }
  };
  const expand = useCallback((id) => { const e = EXPERIENCES.find((x) => x.id === id); setApp(null); ctlRef.current?.launch(e); }, []);
  disksOpenRef.current = disksOpen;
  const sessionSlug = ui.session || ui.pending;
  const ctl = () => ctlRef.current;
  // the actions that make sense where the visitor is standing; the room itself stays the primary way to act
  function ContextRow() {
    if (ui.busy && !ui.pending) return <div className="ws3d__row ws3d__row--ctx"><span className="ws3d__label">…</span></div>;
    if (ui.pending) return (<div className="ws3d__row ws3d__row--ctx"><span className="ws3d__label">Inserting {TITLES[ui.pending]} …</span><button type="button" onClick={() => ctl()?.eject()}>Cancel</button></div>);
    if (ui.view === 'hold') {
      const d = DISK_PROJECTS.find((x) => x.slug === ui.held);
      return (
        <div className="ws3d__row ws3d__row--ctx">
          <span className="ws3d__label ws3d__label--hold">{d.caseId} · {TITLES[ui.held]}</span>
          <button type="button" className="ws3d__use" onClick={() => ctl()?.load(ui.held)}>Insert into drive</button>
          <button type="button" onClick={() => { rememberOrigin(`/#disk/${ui.held}`); onLaunchRef.current({ id: 'case', href: `/projects/${ui.held}` }); }}>Read case study</button>
          <button type="button" onClick={() => ctl()?.putBack()}>Put back</button>
        </div>
      );
    }
    if (ui.view === 'crt') return (
      <div className="ws3d__row ws3d__row--ctx">
        {ui.session && <span className="ws3d__label">A: {TITLES[ui.session]}</span>}
        {(app || (ui.session && !menuOpen)) && <button type="button" className="ws3d__use" onClick={expandView}>Expanded view ↗</button>}
        {ui.session && <button type="button" onClick={() => ctl()?.eject()}>Eject disk</button>}
        <button type="button" onClick={() => ctl()?.back()}>Back to the desk</button>
      </div>
    );
    if (ui.view === 'plans') return (
      <div className="ws3d__row ws3d__row--ctx">
        <span className="ws3d__label">{coarse ? 'Tap a pinned note to read it' : 'Click a pinned note to read it'}</span>
        {PLAN_NOTE_PROJECTS.map((p) => <button key={p.slug} type="button" onClick={() => ctl()?.inspectNote(p.slug)}>{p.title} note</button>)}
        <button type="button" onClick={() => ctl()?.back()}>Back to the desk</button>
      </div>
    );
    if (ui.view === 'note' && NOTES[ui.note]) {
      const p = NOTES[ui.note];
      return (
        <div className="ws3d__row ws3d__row--ctx">
          <span className="ws3d__label ws3d__label--hold">{CASE_IDS[p.slug]} · {p.title} · pinned note</span>
          {/* the note's printed text (a texture) for screen readers: the same registry fields */}
          <span className="ws3d__sr">{p.titleEm} {p.desc} {p.kind}, {p.year}. Status: {p.status}.</span>
          <button type="button" className="ws3d__use" onClick={() => onLaunchRef.current(openCase(p.slug, `/#plans/${p.slug}`))}>Read case study</button>
          {p.repo && <a className="ws3d__btnlink" href={p.repo} target="_blank" rel="noopener noreferrer">Repository ↗</a>}
          <button type="button" onClick={() => ctl()?.goPlans()}>Back to the sheet</button>
        </div>
      );
    }
    if (ui.view === 'book') {
      const i = Math.max(0, CAREER_PAGES.findIndex((p) => p.id === ui.page));
      return (
        <div className="ws3d__row ws3d__row--ctx">
          <span className="ws3d__label ws3d__label--hold">Page {i + 1} of {CAREER_PAGES.length} · {CAREER_PAGES[i].tab}</span>
          <button type="button" aria-label="Previous page" disabled={i === 0} onClick={() => flipPage(-1)}>‹ Prev</button>
          <button type="button" aria-label="Next page" disabled={i === CAREER_PAGES.length - 1} onClick={() => flipPage(1)}>Next ›</button>
          <button type="button" className="ws3d__use" onClick={() => ctl()?.back()}>Back to the desk</button>
        </div>
      );
    }
    if (ui.view === 'mug') return (
      <div className="ws3d__row ws3d__row--ctx">
        <span className="ws3d__label">The coffee mug · “Another shot of AI” · refill();</span>
        <button type="button" className="ws3d__use" onClick={() => ctl()?.back()}>Back to the desk</button>
      </div>
    );
    if (ui.view === 'corner') return (
      <div className="ws3d__row ws3d__row--ctx">
        <span className="ws3d__label">The reading corner · {coarse ? 'tap' : 'click'} the chair to sit, or the record player</span>
        <button type="button" onClick={() => ctl()?.sit()}>Sit in the chair</button>
        <button type="button" onClick={() => ctl()?.inspectRecord()}>Record player</button>
        <button type="button" className="ws3d__use" onClick={() => ctl()?.back()}>Back to the desk</button>
      </div>
    );
    if (ui.view === 'seat') return (
      <div className="ws3d__row ws3d__row--ctx">
        <span className="ws3d__label">Seated in the lounge chair</span>
        <button type="button" className="ws3d__use" onClick={() => ctl()?.back()}>Stand up · back to the desk</button>
      </div>
    );
    if (ui.view === 'record') return (
      <div className="ws3d__row ws3d__row--ctx">
        <span className="ws3d__label" aria-live="polite">{ui.playing ? (reduced ? 'Playing (motion reduced) · silent' : 'Playing · silent') : 'Record player · silent'}</span>
        <button type="button" aria-pressed={ui.playing} onClick={() => ctl()?.togglePlay()}>{ui.playing ? '■ Stop' : '▶ Play'}</button>
        <button type="button" className="ws3d__use" onClick={() => ctl()?.back()}>Back to the desk</button>
      </div>
    );
    if (ui.view === 'camera') {
      const ph = PHOTOS.find((x) => x.id === photo);
      return (
        <div className="ws3d__row ws3d__row--ctx">
          <span className="ws3d__label ws3d__label--hold" aria-live="polite">{ph ? ph.caption : PHOTOS.length ? 'Instant camera · choose a print' : 'Instant camera · the photograph collection is not published yet'}</span>
          {PHOTOS.map((x, i) => <button key={x.id} type="button" aria-pressed={photo === x.id} onClick={() => setPhoto(photo === x.id ? null : x.id)}>Print {i + 1}</button>)}
          <button type="button" className="ws3d__use" onClick={() => { setPhoto(null); ctl()?.back(); }}>Back to the desk</button>
        </div>
      );
    }
    if (ui.view === 'lab') {
      const n = LAB.nodes.find((m) => m.id === ui.labNode);
      return (
        <div className="ws3d__row ws3d__row--ctx">
          <span className="ws3d__label ws3d__label--hold" aria-live="polite">{n ? `${n.name} · ${n.model} · ${n.role}. ${n.desc}` : `${LAB.title} · ${LAB.subtitle} · ${coarse ? 'tap' : 'click'} a model to read about it`}</span>
          <span className="ws3d__sr">A reference drawing of the local models installed on Daventry One, Christopher's Mac Studio. It is not a live status display.</span>
          {LAB.nodes.map((m) => <button key={m.id} type="button" aria-pressed={ui.labNode === m.id} onClick={() => ctl()?.selectLabNode(m.id)}>{m.name}</button>)}
          <button type="button" className="ws3d__use" onClick={() => ctl()?.back()}>Back to the desk</button>
        </div>
      );
    }
    if (ui.view === 'drive') return (
      <div className="ws3d__row ws3d__row--ctx">
        <span className="ws3d__label">{coarse ? 'Tap a disk to lift it' : 'Click a disk to lift it'}</span>
        <button type="button" className="ws3d__disks" aria-expanded={disksOpen} aria-controls="ws-disklist" onClick={() => setDisksOpen((v) => !v)}>Disk list <span aria-hidden="true">{disksOpen ? '▾' : '▴'}</span></button>
        <button type="button" onClick={() => ctl()?.back()}>Back to the desk</button>
      </div>
    );
    return (
      <div className="ws3d__row ws3d__row--ctx ws3d__row--rest">
        <span className="ws3d__label">{coarse ? 'Drag to look · tap the computer, disks, plans, mug or notebook' : 'Look around · click the computer, disks, plans, mug or career notebook · L reading corner'}</span>
        <button type="button" className="ws3d__mugbtn" onClick={() => ctl()?.goMug()}>Look at the coffee mug</button>
        {ui.session && <button type="button" onClick={() => ctl()?.eject()}>Eject {TITLES[ui.session]}</button>}
      </div>
    );
  }

  return (
    <div className={`ws3d${leaving ? ' ws3d--leaving' : ''}`} data-active={active ? 'true' : 'false'} data-view={ui.view} hidden={!(active || shown)}>
      {/* The document's own heading and links: real text for search engines and assistive tech, whatever the canvas shows. */}
      <h1 className="ws3d__sr">Christopher Rivero: portfolio</h1>
      <p className="ws3d__sr">I turn difficult support and mapping workflows into controlled, testable software. I build Python automation and AI tools for support and GIS/CAD work I know firsthand.</p>
      <nav className="ws3d__quick" aria-label="Portfolio sections">
        <a className="ws3d__skip" href="/?view=2d" onClick={(e) => { e.preventDefault(); onPrefer2D(); }}>Browse without 3D</a>
        {EXPERIENCES.map((e) => <a key={e.id} className="ws3d__skip" href={hrefFor(e)}>{e.label}</a>)}
        <a className="ws3d__skip" href="/#career">Career notebook</a>
        <a className="ws3d__skip" href="/#corner">Reading corner</a>
      </nav>

      <div className="ws3d__mode" role="group" aria-label="Portfolio mode"><span className="ws3d__mode-on" aria-current="true">HI-FI <small>3D studio</small></span><button type="button" onClick={onPrefer2D} title="Switch to the plain 2D portfolio">LO-FI <small>plain 2D</small></button></div>

      <div className="ws3d__stage" ref={stageRef} />
      {engine && createPortal(
        <CrtScreen
          ui={ui}
          reduced={reduced}
          menuOpen={menuOpen}
          focusEntry={ui.lastEntry}
          onUse={use}
          onPick={pick}
          onOpenDisk={() => setMenuOpen(false)}
          onShowNote={(slug) => ctlRef.current?.inspectNote(slug)}
          onMenu={() => { setMenuOpen(true); setApp(null); }}
          app={app}
          onExpand={expand}
        />,
        engine.screenEl,
      )}

      {!engine && active && <p className="ws3d__loading" role="status">Loading the workspace…</p>}
      {paused && <p className="ws3d__loading" role="status">Graphics reset. Restoring the workspace…</p>}

      {hover && !ui.busy && ['rest', 'drive', 'plans', 'note', 'mug', 'corner', 'seat', 'record', 'lab', 'camera'].includes(ui.view) && !(ui.view === 'camera' && hover.camera) && !(ui.view === 'lab' && hover.lab && !hover.labNode) && !(hover.sheet && ui.view !== 'rest') && !(ui.view === 'note' && hover.note === ui.note && !hover.stamp) && !(ui.view === 'mug' && hover.mug) && (
        <div className="ws3d__tag" style={{ transform: `translate(${hover.x + 14}px, ${hover.y + 14}px)` }} aria-hidden="true">
          {hover.camera ? 'Instant camera · click to look closer'
            : hover.labNode ? `${LAB.nodes.find((m) => m.id === hover.labNode)?.name} · click to read about it`
            : hover.lab ? 'Daventry One · local model lab drawing · click to look closer'
            : hover.chair ? (ui.view === 'seat' ? 'Click to stand up' : 'Lounge chair · click to sit')
            : hover.player || hover.table ? (ui.view === 'record' ? (ui.playing ? 'Record player · click to stop' : 'Record player · click to play (silent)') : 'Record player · click to look closer')
            : hover.book ? 'Career notebook · work history, highlights, contact · click to open'
            : hover.mug ? 'Coffee mug · click to look closer'
            : hover.machine ? 'The computer · click to use it'
            : hover.tray ? 'Floppy organizer · click to look closer'
            : hover.sheet ? 'Drafting plans · project notes pinned to a studio drawing · click to look closer'
            : hover.stamp === 'case' ? `${hover.title} · open the case study`
            : hover.stamp === 'repo' ? `${hover.title} · open the repository (new tab)`
            : hover.note ? `${hover.caseId} · ${hover.title} · pinned note · click to read`
            : `${hover.caseId} · ${hover.label} · click to lift`}
        </div>
      )}

      {ui.view === 'camera' && !ui.busy && PHOTOS.find((x) => x.id === photo) && (
        <figure className="ws3d__print" style={{ position: 'absolute', left: '50%', top: '42%', transform: 'translate(-50%, -50%) rotate(-1.5deg)', margin: 0, padding: '14px 14px 44px', background: '#f4f1ea', boxShadow: '0 12px 40px rgba(0,0,0,0.45)', width: 'min(72vw, 360px)' }}>
          <img src={PHOTOS.find((x) => x.id === photo).src} alt={PHOTOS.find((x) => x.id === photo).caption} style={{ display: 'block', width: '100%', aspectRatio: '1 / 1', objectFit: 'cover' }} />
          <figcaption style={{ marginTop: 10, color: '#3a332b', font: '500 13px "JetBrains Mono", monospace' }}>{PHOTOS.find((x) => x.id === photo).caption}</figcaption>
        </figure>
      )}
      {engine && active && ui.view === 'book' && leftRect && (
        <NotebookIndex rect={leftRect} page={ui.page} onPick={(sel) => {
          const el = paperRef.current?.querySelector(sel);
          if (!el) return;
          el.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
          el.querySelector('h3')?.setAttribute('tabindex', '-1');
          el.querySelector('h3')?.focus({ preventScroll: true });
        }} />
      )}
      {engine && active && ui.view === 'book' && (
        <NotebookReader
          rect={pageRect}
          page={ui.page}
          paperRef={paperRef}
          onPage={(id) => ctlRef.current?.turnPage(id)}
          onProof={(slug) => onLaunchRef.current(openCase(slug, '/#career/highlights'))}
        />
      )}

      {engine && active && (
        <>
          {!coarse && <p className="ws3d__hint" aria-hidden="true">{ui.view === 'rest' ? 'Drag to look · ' : ''}C computer · D disks · P plans · N notebook · L corner · ←/→ · Esc back</p>}
          <div className="ws3d__dock" role="group" aria-label="Studio controls">
            {ContextRow()}
            {disksOpen && !sessionSlug && !ui.held && (
              <ul id="ws-disklist" className="ws3d__disklist" aria-label="Floppy disks, one per project" ref={diskListRef}>
                {DISK_PROJECTS.map((d) => (
                  <li key={d.slug}>
                    <button type="button" onClick={() => { setDisksOpen(false); ctlRef.current?.pickUp(d.slug); }}>
                      <span>{prettyTitle(d.slug)}</span><span className="ws3d__cid">{d.caseId}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="ws3d__stmenu">
              {stationsOpen && (
                <ul id="ws-stmenu" className="ws3d__stlist" aria-label="Stations" ref={stMenuRef}>
                  {SWITCHER.map((s) => {
                    const cur = baseStation(stationOfUi(ui)) === s;
                    return <li key={s}><button type="button" aria-current={cur ? 'location' : undefined} className={cur ? 'is-on' : ''} onClick={() => goStation(s)}>{STATION_LABEL[s]}</button></li>;
                  })}
                </ul>
              )}
              <button type="button" className="ws3d__stbtn" aria-expanded={stationsOpen} aria-controls="ws-stmenu" onClick={() => setStationsOpen((v) => !v)}>
                Stations <span className="ws3d__stcur">· {STATION_LABEL[baseStation(stationOfUi(ui))] || '…'}</span> <span aria-hidden="true">{stationsOpen ? '▾' : '▴'}</span>
              </button>
            </div>
            <nav className="ws3d__stations" aria-label="Stations">
              {SWITCHER.map((s) => {
                const cur = baseStation(stationOfUi(ui)) === s;
                return (
                  <button key={s} type="button" aria-current={cur ? 'location' : undefined} className={cur ? 'is-on' : ''} onClick={() => goStation(s)}>{STATION_LABEL[s]}</button>
                );
              })}
            </nav>
          </div>
        </>
      )}
      <p className="ws3d__sr" role="status" aria-live="polite">{announce}</p>
    </div>
  );
}

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
import { DISK_PROJECTS } from '../data/caseIds.js';
import { EXPERIENCES, hrefFor } from '../lib/experiences.js';
import '../styles/workspace3d.css';

const supportsWebGL2 = () => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } };
const lowQuality = () => window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 700;
const TITLES = Object.fromEntries(DISK_PROJECTS.map((d) => [d.slug, d.label]));
const prettyTitle = (slug) => TITLES[slug].replace(/\b([A-Z])([A-Z]+)/g, (m, a, b) => a + b.toLowerCase());

export default function Workspace3D({ active, onLaunch, onUnavailable, onPrefer2D }) {
  const stageRef = useRef(null);
  const engineRef = useRef(null);
  const ctlRef = useRef(null);
  const activeRef = useRef(active);
  const disksOpenRef = useRef(false);
  activeRef.current = active;
  const [engine, setEngine] = useState(null);
  const [ui, setUi] = useState({ view: 'rest', session: null, pending: null, lastEntry: null, locs: {} });
  const [hover, setHover] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [announce, setAnnounce] = useState('');
  const [disksOpen, setDisksOpen] = useState(false);
  const diskListRef = useRef(null);
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
          onLaunch: (entry) => onLaunchRef.current(entry),
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

  /* ── keyboard: Escape pulls back from the screen ──────────────── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || !activeRef.current) return;
      if (disksOpenRef.current) { e.preventDefault(); setDisksOpen(false); document.querySelector('.ws3d__disks')?.focus({ preventScroll: true }); return; }
      const ctl = ctlRef.current;
      if (ctl && (ctl.state.view === 'crt')) { e.preventDefault(); ctl.back(); setAnnounce('Back at the workspace.'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { if (ui.session) setAnnounce(`${prettyTitle(ui.session)} loaded. Directory shown on the screen.`); }, [ui.session]);

  const use = useCallback(() => { setMenuOpen(true); ctlRef.current?.approach(); setAnnounce('At the computer. Choose an experience.'); }, []);
  const pick = useCallback((entry) => ctlRef.current?.launch(entry), []);
  disksOpenRef.current = disksOpen;
  const sessionSlug = ui.session || ui.pending;

  return (
    <div className={`ws3d${leaving ? ' ws3d--leaving' : ''}`} data-active={active ? 'true' : 'false'} data-view={ui.view} hidden={!(active || shown)}>
      {/* The document's own heading and links: real text for search engines and assistive tech, whatever the canvas shows. */}
      <h1 className="ws3d__sr">Christopher Rivero: portfolio</h1>
      <p className="ws3d__sr">I turn difficult support and mapping workflows into controlled, testable software. I build Python automation and AI tools for support and GIS/CAD work I know firsthand.</p>
      <nav className="ws3d__quick" aria-label="Portfolio sections">
        <a className="ws3d__skip" href="/?view=2d" onClick={(e) => { e.preventDefault(); onPrefer2D(); }}>Browse without 3D</a>
        {EXPERIENCES.map((e) => <a key={e.id} className="ws3d__skip" href={hrefFor(e)}>{e.label}</a>)}
      </nav>

      <button type="button" className="ws3d__flat" onClick={onPrefer2D}>2D view</button>

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
          onMenu={() => setMenuOpen(true)}
        />,
        engine.screenEl,
      )}

      {!engine && active && <p className="ws3d__loading" role="status">Loading the workspace…</p>}
      {paused && <p className="ws3d__loading" role="status">Graphics reset. Restoring the workspace…</p>}

      {hover && !sessionSlug && (ui.view === 'rest' || ui.view === 'drive') && (
        <div className="ws3d__tag" style={{ transform: `translate(${hover.x + 14}px, ${hover.y + 14}px)` }} aria-hidden="true">
          {hover.machine ? 'The computer. Click to use it' : hover.tray ? 'The disk tray. Click to look closer' : `${hover.label}. Click to load`}
        </div>
      )}

      {engine && (
        <div className="ws3d__dock" role="group" aria-label="Computer and floppy disks">
          {!sessionSlug && (ui.view === 'rest' || ui.view === 'drive') && (
            <div className="ws3d__row">
              <button type="button" className="ws3d__use" onClick={use}>Use the computer</button>
              <button
                type="button"
                className="ws3d__disks"
                aria-expanded={disksOpen}
                aria-controls="ws-disklist"
                onClick={() => setDisksOpen((v) => !v)}
              >
                Floppy disks <span aria-hidden="true">{disksOpen ? '▾' : '▴'}</span>
              </button>
              {ui.view === 'drive' && <button type="button" onClick={() => ctlRef.current?.back()}>Back to room</button>}
            </div>
          )}
          {disksOpen && !sessionSlug && (
            <ul id="ws-disklist" className="ws3d__disklist" aria-label="Floppy disks, one per project" ref={diskListRef}>
              {DISK_PROJECTS.map((d) => (
                <li key={d.slug}>
                  <button type="button" onClick={() => { setDisksOpen(false); ctlRef.current?.load(d.slug); }}>
                    <span>{prettyTitle(d.slug)}</span><span className="ws3d__cid">{d.caseId}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {sessionSlug && (
            <div className="ws3d__row">
              <span className="ws3d__label">A: {TITLES[sessionSlug]}{ui.session ? '' : ' …'}</span>
              {ui.session && ui.view !== 'crt' && <button type="button" onClick={() => ctlRef.current?.approach()}>Approach screen</button>}
              {ui.session && ui.view === 'crt' && <button type="button" onClick={() => ctlRef.current?.back()}>Return to workspace</button>}
              <button type="button" onClick={() => ctlRef.current?.eject()}>{ui.session ? 'Eject disk' : 'Cancel'}</button>
            </div>
          )}
          {!sessionSlug && ui.view === 'crt' && (
            <div className="ws3d__row"><button type="button" onClick={() => ctlRef.current?.back()}>Return to workspace</button></div>
          )}
        </div>
      )}
      <p className="ws3d__sr" role="status" aria-live="polite">{announce}</p>
    </div>
  );
}

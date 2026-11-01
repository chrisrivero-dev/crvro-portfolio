/* 14: the Sierra shelf. An original, adventure-game style panel over the room: the character choice for Hero's Quest, and short notes for
 * the other folders. Plain DOM, so it works with touch, keyboard and screen readers. Escape closes it (see Workspace3D). */
import { useEffect, useRef, useState } from 'react';
import { ARCHIVE, CLASSES, FOLDERS, NOTES, SHEET } from '../data/sierraShelf.js';

const CREST = {
  fighter: 'M7 1h2v9h3v2H9v3H7v-3H4v-2h3z',
  magic: 'M7 1h2v4h4v2H9v2h4v2H9v4H7v-4H3V9h4V7H3V5h4z',
  thief: 'M3 3h6v6H7v2h2v2H7v2H5V9H3zm2 2v2h2V5z',
};
const Crest = ({ id }) => <svg className="sq__crest" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true"><path d={CREST[id]} fill="currentColor" /></svg>;

export default function SierraOverlay({ folder, onClose }) {
  const [pick, setPick] = useState(null);
  const [sheet, setSheet] = useState(false);
  const root = useRef(null);
  const f = FOLDERS.find((x) => x.id === folder);
  const c = CLASSES.find((x) => x.id === pick);
  useEffect(() => { root.current?.querySelector('button')?.focus({ preventScroll: true }); }, [folder, pick, sheet]);
  // arrow keys move between the choices; Tab stays inside the panel
  const onKeyDown = (e) => {
    const bs = [...root.current.querySelectorAll('button')];
    const i = bs.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); bs[(i + (e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length].focus(); }
    if (e.key === 'Tab' && ((e.shiftKey && i === 0) || (!e.shiftKey && i === bs.length - 1))) { e.preventDefault(); bs[e.shiftKey ? bs.length - 1 : 0].focus(); }
  };
  return (
    <div className="sq" role="dialog" aria-modal="true" aria-label={f.title} ref={root} onKeyDown={onKeyDown}>
      <div className="sq__panel">
        <header className="sq__bar"><span>{f.title}</span><button type="button" className="sq__x" onClick={onClose}>Close</button></header>
        <div className="sq__body">
          {folder === 'hero' && !pick && (
            <>
              <h2>So, you want to be a hero?</h2>
              <p>Choose your character.</p>
              <div className="sq__choices">
                {CLASSES.map((k) => <button type="button" key={k.id} data-class={k.id} onClick={() => setPick(k.id)}><Crest id={k.id} /><b>{k.name}</b><span>{k.trait}</span></button>)}
              </div>
            </>
          )}
          {folder === 'hero' && c && !sheet && (
            <>
              <h2><Crest id={c.id} /> {c.name}</h2>
              <p aria-live="polite">{c.story}</p>
              <div className="sq__actions">
                <button type="button" className="sq__go" onClick={() => setSheet(true)}>View character sheet</button>
                <button type="button" onClick={() => setPick(null)}>Choose again</button>
              </div>
            </>
          )}
          {folder === 'hero' && sheet && (
            <>
              <h2>{SHEET.name}</h2>
              <p className="sq__class">Class: {SHEET.charClass}</p>
              <ul className="sq__stats">
                {SHEET.stats.map(([k, v]) => <li key={k}><span>{k}</span><i aria-hidden="true"><em style={{ width: `${v}%` }} /></i><b>{v}</b></li>)}
              </ul>
              <p className="sq__small">Stats are playful, not measured.</p>
              <blockquote>{SHEET.note}</blockquote>
              <div className="sq__actions"><button type="button" onClick={() => { setSheet(false); setPick(null); }}>Play again</button></div>
            </>
          )}
          {NOTES[folder] && <p>{NOTES[folder]}</p>}
          {folder === 'sierra' && (
            <>
              <p>C:\SIERRA&gt; DIR /ARCHIVE</p>
              <ul className="sq__dir">{ARCHIVE.map((a) => <li key={a.file}><b>{a.file}</b> <span>{a.name}</span></li>)}</ul>
              <p className="sq__small">{ARCHIVE.length} file(s). The games that got me exploring.</p>
            </>
          )}
          <p className="sq__legal">A personal fan tribute. Not affiliated with Sierra.</p>
        </div>
      </div>
    </div>
  );
}

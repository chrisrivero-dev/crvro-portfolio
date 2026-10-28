// 05A station URLs. The room is the navigation; each station is a camera position at a real object, with a URL so that
// Back/Forward and shared links land in the same 3D state. Experiences (/#work, /#about, ...) are separate and unchanged.
//   /                  desk (the room)
//   /#computer         the CRT
//   /#disks            the floppy organizer
//   /#disk/<slug>      a disk lifted out of the organizer for inspection
//   /#plans            (05B.1) the drafting plans: the survey sheet with project notes pinned to it
//   /#plans/<slug>     (05B.1) one note, read up close
//   /#mug              (05B.3) the coffee mug, close up (reached by tapping the mug; not one of the four listed stations)
import { PLAN_NOTE_SLUGS } from '../data/planNotes.js';

export const STATIONS = ['desk', 'computer', 'disks', 'plans'];
export const STATION_LABEL = { desk: 'Desk', computer: 'Computer', disks: 'Disk tray', plans: 'Drafting plans' };

export function stationFromHash(hash) {
  if (!hash || hash === '#' || hash === '#top') return 'desk';
  if (hash === '#computer') return 'computer';
  if (hash === '#disks') return 'disks';
  if (hash === '#plans') return 'plans';
  if (hash === '#mug') return 'mug';
  const n = /^#plans\/([a-z0-9-]+)$/.exec(hash);
  if (n) return PLAN_NOTE_SLUGS.includes(n[1]) ? `plans/${n[1]}` : 'plans';
  const m = /^#disk\/([a-z0-9-]+)$/.exec(hash);
  return m ? `disk/${m[1]}` : null;
}
export const hrefForStation = (s) => (s === 'desk' ? '/' : `/#${s}`);
export const baseStation = (s) => (s === 'mug' ? 'desk' : s && s.startsWith('disk/') ? 'disks' : s && s.startsWith('plans/') ? 'plans' : s);

/** The station a controller state stands for, or null while it is moving between states (nothing is written to the URL then). */
export function stationOfUi(ui) {
  if (ui.busy || ui.pending) return null;
  if (ui.view === 'rest') return 'desk';
  if (ui.view === 'crt') return 'computer';
  if (ui.view === 'hold' && ui.held) return `disk/${ui.held}`;
  if (ui.view === 'drive' && !ui.session) return 'disks';
  if (ui.view === 'plans') return 'plans';
  if (ui.view === 'mug') return 'mug';
  if (ui.view === 'note' && ui.note) return `plans/${ui.note}`;
  return null;
}

const ORIGIN_KEY = 'crvro.origin';
export const rememberOrigin = (href) => { try { sessionStorage.setItem(ORIGIN_KEY, href); } catch { /* private mode */ } };
export const originHref = () => { try { return sessionStorage.getItem(ORIGIN_KEY) || '/'; } catch { return '/'; } };

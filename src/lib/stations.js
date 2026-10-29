// 05A station URLs. The room is the navigation; each station is a camera position at a real object, with a URL so that
// Back/Forward and shared links land in the same 3D state. Experiences (/#work, /#about, ...) are separate and unchanged.
//   /                  desk (the room)
//   /#computer         the CRT
//   /#disks            the floppy organizer
//   /#disk/<slug>      a disk lifted out of the organizer for inspection
//   /#plans            (05B.1) the drafting plans: the survey sheet with project notes pinned to it
//   /#plans/<slug>     (05B.1) one note, read up close
//   /#mug              (05B.3) the coffee mug, close up (reached by tapping the mug; not one of the listed stations)
//   /#career           (06) the career notebook, open at its first page (work history)
//   /#career/<page>    (06) one notebook page: work, highlights or resume. An unknown page falls back to /#career.
//   /#corner           (07) the reading corner by the window: the lounge chair, the side table and the record player
//   /#corner/seat      (07) seated in the lounge chair, looking at the desk
//   /#corner/record    (07) the record player, close up (it plays silently; it stops when you leave)
//   /#corner/lab       (11) the Daventry One local model lab drawing above the bookcase (an Easter egg; not in the switcher)
//   /#corner/camera    (11) the instant camera on the cubby bookcase, close up, with the photograph collection (an Easter egg)
// In LO-FI (no 3D engine) the same hashes open the plain career page instead; see App.jsx.
import { PLAN_NOTE_SLUGS } from '../data/planNotes.js';
import { CAREER_PAGE_IDS } from '../data/career.js';

export const STATIONS = ['desk', 'computer', 'disks', 'plans', 'career'];   // the ←/→ cycle
/** The station switcher: the cycle plus the reading corner, a side spot like the mug (reached from the switcher or L, not by ←/→). */
export const SWITCHER = [...STATIONS, 'corner'];
export const STATION_LABEL = { desk: 'Desk', computer: 'Computer', disks: 'Disk tray', plans: 'Drafting plans', career: 'Career notebook', corner: 'Reading corner' };
export const CORNER_SPOTS = ['seat', 'record', 'lab', 'camera'];
export const isCareerHash = (hash) => /^#career(\/|$)/.test(hash || '');
/** The notebook page a hash names (null when it is not a career hash). */
export function careerPageFromHash(hash) {
  const m = /^#career(?:\/([a-z0-9-]+))?$/.exec(hash || '');
  if (!m) return null;
  return CAREER_PAGE_IDS.includes(m[1]) ? m[1] : 'work';
}

export function stationFromHash(hash) {
  if (!hash || hash === '#' || hash === '#top') return 'desk';
  if (hash === '#computer') return 'computer';
  if (hash === '#disks') return 'disks';
  if (hash === '#plans') return 'plans';
  if (hash === '#mug') return 'mug';
  if (hash === '#corner') return 'corner';
  const c = /^#corner\/([a-z]+)$/.exec(hash);
  if (c) return CORNER_SPOTS.includes(c[1]) ? `corner/${c[1]}` : 'corner';
  const cp = careerPageFromHash(hash);
  if (cp) return cp === 'work' ? 'career' : `career/${cp}`;
  const n = /^#plans\/([a-z0-9-]+)$/.exec(hash);
  if (n) return PLAN_NOTE_SLUGS.includes(n[1]) ? `plans/${n[1]}` : 'plans';
  const m = /^#disk\/([a-z0-9-]+)$/.exec(hash);
  return m ? `disk/${m[1]}` : null;
}
export const hrefForStation = (s) => (s === 'desk' ? '/' : `/#${s}`);
export const baseStation = (s) => (s === 'mug' ? 'desk' : s && s.startsWith('disk/') ? 'disks' : s && s.startsWith('plans/') ? 'plans' : s && s.startsWith('career/') ? 'career' : s && s.startsWith('corner/') ? 'corner' : s);

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
  if (ui.view === 'corner') return 'corner';
  if (ui.view === 'seat') return 'corner/seat';
  if (ui.view === 'record') return 'corner/record';
  if (ui.view === 'lab') return 'corner/lab';
  if (ui.view === 'camera') return 'corner/camera';
  if (ui.view === 'book') return !ui.page || ui.page === 'work' ? 'career' : `career/${ui.page}`;
  return null;
}

const ORIGIN_KEY = 'crvro.origin';
export const rememberOrigin = (href) => { try { sessionStorage.setItem(ORIGIN_KEY, href); } catch { /* private mode */ } };
export const originHref = () => { try { return sessionStorage.getItem(ORIGIN_KEY) || '/'; } catch { return '/'; } };

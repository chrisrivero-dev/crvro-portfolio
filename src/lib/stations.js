// 05A station URLs. The room is the navigation; each station is a camera position at a real object, with a URL so that
// Back/Forward and shared links land in the same 3D state. Experiences (/#work, /#about, ...) are separate and unchanged.
//   /                  desk (the room)
//   /#computer         the CRT
//   /#disks            the floppy organizer
//   /#disk/<slug>      a disk lifted out of the organizer for inspection
export const STATIONS = ['desk', 'computer', 'disks'];
export const STATION_LABEL = { desk: 'Desk', computer: 'Computer', disks: 'Disk tray' };

export function stationFromHash(hash) {
  if (!hash || hash === '#' || hash === '#top') return 'desk';
  if (hash === '#computer') return 'computer';
  if (hash === '#disks') return 'disks';
  const m = /^#disk\/([a-z0-9-]+)$/.exec(hash);
  return m ? `disk/${m[1]}` : null;
}
export const hrefForStation = (s) => (s === 'desk' ? '/' : `/#${s}`);
export const baseStation = (s) => (s && s.startsWith('disk/') ? 'disks' : s);

/** The station a controller state stands for, or null while it is moving between states (nothing is written to the URL then). */
export function stationOfUi(ui) {
  if (ui.busy || ui.pending) return null;
  if (ui.view === 'rest') return 'desk';
  if (ui.view === 'crt') return 'computer';
  if (ui.view === 'hold' && ui.held) return `disk/${ui.held}`;
  if (ui.view === 'drive' && !ui.session) return 'disks';
  return null;
}

const ORIGIN_KEY = 'crvro.origin';
export const rememberOrigin = (href) => { try { sessionStorage.setItem(ORIGIN_KEY, href); } catch { /* private mode */ } };
export const originHref = () => { try { return sessionStorage.getItem(ORIGIN_KEY) || '/'; } catch { return '/'; } };

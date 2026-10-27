// ============================================================
// Tiny location store: pathname + search + hash as one observable value, plus
// history-aware scroll bookkeeping. App uses it through useSyncExternalStore.
//
//  - Every history entry remembers its own scrollY in history.state (saved on
//    scroll settle and just before a push), so Back / Forward restore the place
//    the visitor left, including inside Project World.
//  - `kind` says how the current location was reached: 'push' (link / navigate)
//    or 'pop' (Back / Forward / first load). Only 'pop' restores scroll.
// ============================================================
const listeners = new Set();
const read = (kind) => ({ path: window.location.pathname || '/', search: window.location.search, hash: window.location.hash, kind, state: window.history.state || {} });
let snap = typeof window === 'undefined' ? null : read('pop');

function emit(kind) {
  snap = read(kind);
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  window.history.scrollRestoration = 'manual';
  window.addEventListener('popstate', () => emit('pop'));
  window.addEventListener('hashchange', () => { if (snap.hash !== window.location.hash) emit('pop'); });
  let t = 0;
  window.addEventListener('scroll', () => {
    clearTimeout(t);
    t = setTimeout(() => window.history.replaceState({ ...(window.history.state || {}), scrollY: window.scrollY }, ''), 120);
  }, { passive: true });
}

export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const getSnapshot = () => snap;

/** Same-origin navigation without a reload. Saves the scroll of the entry being left. */
export function navigate(href, { replace = false } = {}) {
  const url = new URL(href, window.location.origin);
  if (url.origin !== window.location.origin) { window.location.assign(href); return; }
  const next = url.pathname + url.search + url.hash;
  if (next === window.location.pathname + window.location.search + window.location.hash) return;
  window.history.replaceState({ ...(window.history.state || {}), scrollY: window.scrollY }, '');
  window.history[replace ? 'replaceState' : 'pushState']({ scrollY: 0, from: window.location.pathname + window.location.hash }, '', next);
  emit('push');
}

/** After a location change: restore the remembered scroll on Back/Forward, otherwise go to the top. Retries while layout settles. */
export function applyScroll(snapshot) {
  const target = snapshot.kind === 'pop' ? snapshot.state.scrollY || 0 : 0;
  const start = performance.now();
  const step = () => {
    window.scrollTo({ top: target, behavior: 'instant' });
    if (Math.abs(window.scrollY - target) >= 2 && performance.now() - start < 900) requestAnimationFrame(step);
  };
  requestAnimationFrame(() => requestAnimationFrame(step));
}

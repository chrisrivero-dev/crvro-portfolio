// Page-level effects that used to live inline in App.jsx, unchanged in behaviour, so the full-page experiences
// (and the classic stacked home page) keep their staggered reveals, scrollspy and parallax.
import { useEffect } from 'react';

/** Staggered reveal for `.reveal` elements. Re-runs whenever `key` changes (a new experience mounted). */
export function useReveal(key) {
  useEffect(() => {
    const firedGroups = new Set();
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target;
          const group = el.closest('[data-stagger]');
          if (group) {
            if (firedGroups.has(group)) return;
            firedGroups.add(group);
            Array.from(group.querySelectorAll('.reveal')).forEach((child, i) => {
              child.style.setProperty('--reveal-delay', `${i * 55}ms`);
              child.classList.add('visible');
              revealObs.unobserve(child);
            });
          } else {
            el.classList.add('visible');
            revealObs.unobserve(el);
          }
        });
      },
      { threshold: 0.06 },
    );
    // observe now and once more after children mount (ProjectWorld renders its own .reveal nodes)
    const observeAll = () => document.querySelectorAll('.reveal:not(.visible)').forEach((el) => revealObs.observe(el));
    observeAll();
    const t = setTimeout(observeAll, 250);
    return () => { clearTimeout(t); revealObs.disconnect(); };
  }, [key]);
}

/** Active section id for the header while scrolling a long page. */
export function useScrollspy(ids, setActive, key) {
  useEffect(() => {
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-40% 0px -50% 0px', threshold: 0 },
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Subtle scroll parallax for [data-parallax] elements. Off under reduced motion. */
export function useParallax() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let rafId;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        document.querySelectorAll('[data-parallax]').forEach((el) => {
          const rect = el.getBoundingClientRect();
          const centerOffset = rect.top + rect.height / 2 - window.innerHeight / 2;
          const factor = parseFloat(el.dataset.parallax) || 0.04;
          el.style.setProperty('--py', `${Math.max(-36, Math.min(36, centerOffset * factor))}px`);
        });
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(rafId); };
  }, []);
}

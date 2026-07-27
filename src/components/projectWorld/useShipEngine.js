// ============================================================
// Project World — ship engine
//
// The ship moves every frame, so it is driven imperatively
// against the SVG rather than through React state: position is
// sampled from the route paths with getPointAtLength, and the
// heading comes from a second sample just ahead (or behind, when
// sailing back) so the hull rotates naturally into the curve.
//
// Position is expressed as a single continuous number `s`:
// leg index + progress through that leg. s=0 is Daventry One,
// s=4 is GroundRules.
// ============================================================

import { useCallback, useEffect, useRef } from "react";
import { clamp, easeInOut, F } from "./geometry.js";

const WAKE_INTERVAL_MS = 90;
const WAKE_LIFETIME_MS = 1100;

export default function useShipEngine(svgRef, { reduced }) {
  const legsRef = useRef([]);
  const lensRef = useRef([]);
  const shipRef = useRef(null);
  const wakeRef = useRef(null);
  const posRef = useRef(0);
  const rafRef = useRef(null);
  const lastWakeRef = useRef(0);
  const readyRef = useRef(false);

  /** Sample a point at continuous position `s`. */
  const pointAt = useCallback((s) => {
    const lens = lensRef.current;
    const legs = legsRef.current;
    if (!legs.length) return null;
    const max = legs.length;
    const c = clamp(s, 0, max);
    let leg = clamp(Math.floor(c), 0, max - 1);
    let t = c - leg;
    if (c >= max) {
      leg = max - 1;
      t = 1;
    }
    return legs[leg].getPointAtLength(t * lens[leg]);
  }, []);

  /** Place the ship and reveal the traveled route behind it. */
  const place = useCallback(
    (s, dir = 1) => {
      const ship = shipRef.current;
      const legs = legsRef.current;
      const lens = lensRef.current;
      if (!ship || !legs.length) return null;

      const p = pointAt(s);
      const q = pointAt(clamp(s + (dir < 0 ? -0.015 : 0.015), 0, legs.length));
      if (!p || !q) return null;
      let ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
      if (dir < 0) ang += 180;
      ship.setAttribute("transform", `translate(${F(p.x)} ${F(p.y)}) rotate(${F(ang)})`);

      for (let i = 0; i < lens.length; i++) {
        let off;
        if (s >= i + 1) off = 0;
        else if (s <= i) off = lens[i];
        else off = lens[i] * (1 - (s - i));
        legs[i].style.strokeDashoffset = off;
      }
      return p;
    },
    [pointAt]
  );

  const dropWake = useCallback((p) => {
    const layer = wakeRef.current;
    if (!layer || !p) return;
    const now = performance.now();
    if (now - lastWakeRef.current < WAKE_INTERVAL_MS) return;
    lastWakeRef.current = now;
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", F(p.x));
    c.setAttribute("cy", F(p.y));
    c.setAttribute("r", "3");
    c.setAttribute("class", "pw-wake-dot");
    layer.appendChild(c);
    window.setTimeout(() => c.remove(), WAKE_LIFETIME_MS);
  }, []);

  /** Measure route lengths once the SVG is laid out. */
  const measure = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const legs = Array.from(svg.querySelectorAll("[data-leg]"));
    if (!legs.length) return;
    legsRef.current = legs;
    lensRef.current = legs.map((p) => p.getTotalLength());
    legs.forEach((p, i) => {
      p.style.strokeDasharray = lensRef.current[i];
      if (!readyRef.current) p.style.strokeDashoffset = lensRef.current[i];
    });
    shipRef.current = svg.querySelector("[data-ship]");
    wakeRef.current = svg.querySelector("[data-wake]");
    readyRef.current = true;
    place(posRef.current, 1);
  }, [svgRef, place]);

  useEffect(() => {
    measure();
    const t = window.setTimeout(measure, 300);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", measure);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [measure]);

  /** Sail to a destination; resolves when the ship has moored. */
  const travelTo = useCallback(
    (target, onArrive) => {
      const legs = legsRef.current;
      if (!legs.length) {
        posRef.current = target;
        if (onArrive) onArrive();
        return;
      }
      const dest = clamp(target, 0, legs.length);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (reduced || Math.abs(dest - posRef.current) < 0.001) {
        posRef.current = dest;
        place(dest, 1);
        if (onArrive) onArrive();
        return;
      }

      const from = posRef.current;
      const dist = dest - from;
      const dur = clamp(Math.abs(dist) * 850, 500, 2100);
      const t0 = performance.now();

      const step = (now) => {
        const t = clamp((now - t0) / dur, 0, 1);
        posRef.current = from + dist * easeInOut(t);
        const p = place(posRef.current, dist >= 0 ? 1 : -1);
        if (t > 0.04 && t < 0.96) dropWake(p);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          rafRef.current = null;
          posRef.current = dest;
          place(dest, 1);
          if (onArrive) onArrive();
        }
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [reduced, place, dropWake]
  );

  return { travelTo, remeasure: measure };
}

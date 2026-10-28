import React, { Suspense, lazy, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import CaseStudy from "./components/CaseStudy.jsx";
import ExperienceShell from "./components/ExperienceShell.jsx";
import ClassicExperience from "./components/ClassicExperience.jsx";
import OsShell from "./components/OsShell.jsx";
import FlatHome from "./components/FlatHome.jsx";
import CareerPage from "./components/CareerPage.jsx";
import LegacyHome from "./components/LegacyHome.jsx";
import { PROJECTS, GIS_PROJECTS } from "./data/projects.js";
import { experienceFromHash } from "./lib/experiences.js";
import { applyScroll, getSnapshot, navigate, subscribe } from "./lib/location.js";
import { useParallax } from "./lib/pageEffects.js";
import { stationFromHash, careerPageFromHash } from "./lib/stations.js";
import "./styles/experience.css";
import "./styles/os.css";

// Three.js lives in this chunk only; case studies and the 2D pages never download it.
const Workspace3D = lazy(() => import("./workspace3d/Workspace3D.jsx"));

function useTheme() {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute("data-theme") || "light"
  );

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.add("theme-transitioning");
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
      setTimeout(() => document.documentElement.classList.remove("theme-transitioning"), 400);
      return next;
    });
  }, []);

  return [theme, toggleTheme];
}


// Same-origin link clicks become in-app navigation (as before), now through the location store so the hash is a real
// route on the home page (/#work, /#about, ...) and every history entry remembers its own scroll position.
const supportsWebGL2 = () => { try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; } };

function useLinkInterception(homeRef, immersiveRef) {
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href) return;
      if (a.target && a.target !== "_self") return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (/^(https?:|mailto:|tel:)/i.test(href)) return;
      const url = new URL(a.href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      // Immersive case study: "Back to all work" means Project World, at the place the visitor left it.
      if (immersiveRef.current === "case" && a.classList.contains("back-link")) {
        e.preventDefault();
        if (window.history.state?.from === "/#work") window.history.back(); else navigate("/#work");
        return;
      }
      if (href.startsWith("#")) {
        // in-page anchors are only app routes on the home page; elsewhere (case studies) the browser scrolls natively
        if (!homeRef.current) return;
        // "top" inside an experience means the top of that page, not the 3D room
        if (href === "#top" && homeRef.current.kind === "experience") { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
        // Project World's "Skip journey" skips the journey: it goes to what follows the voyage (the Destination Lookup) on the same page.
        if (homeRef.current.kind === "experience" && homeRef.current.exp === "work" && a.closest(".project-world") && href === "#about") {
          const next = document.getElementById("navigator");
          if (next) {
            e.preventDefault();
            next.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
            next.querySelector("input")?.focus({ preventScroll: true });
            return;
          }
        }
        url.pathname = window.location.pathname;
        url.search = window.location.search;
      }
      e.preventDefault();
      navigate(url.pathname + url.search + url.hash);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [homeRef, immersiveRef]);
}

function parseRoute(path) {
  // /projects/<slug>  →  case study
  const m = path.match(/^\/projects\/([a-z0-9-]+)\/?$/i);
  if (m) {
    const project =
      PROJECTS.find((p) => p.slug === m[1]) ||
      GIS_PROJECTS.find((p) => p.slug === m[1]);
    if (project) return { kind: "case", project };
  }
  return { kind: "home" };
}

const SITE_URL = "https://crvro.com";
const DEFAULT_META = {
  title: "crvro.com: Christopher Rivero",
  description:
    "Christopher Rivero, a builder of small, useful systems. Automation, AI support tooling, GIS / CAD pipelines.",
};

function setMetaTag(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

// Keeps <title>, description, canonical, and OG/Twitter tags in sync with
// the current SPA route — direct loads get the right tags from index.html;
// this covers client-side navigation between them.
function useRouteMeta(route) {
  useEffect(() => {
    const isCase = route.kind === "case";
    const p = isCase ? route.project : null;

    const title = isCase
      ? `${p.title}: Christopher Rivero`
      : DEFAULT_META.title;
    const description = isCase ? p.desc : DEFAULT_META.description;
    const path = isCase ? `/projects/${p.slug}` : "/";
    const url = SITE_URL + path;

    document.title = title;
    setMetaTag("name", "description", description);
    setCanonical(url);
    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:url", url);
    setMetaTag("property", "og:type", isCase ? "article" : "website");
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", title);
    setMetaTag("name", "twitter:description", description);
  }, [route.kind, route.kind === "case" ? route.project.slug : null]);
}


const PREF_KEY = "crvro.view";
const UNAVAILABLE_COPY = {
  "no-webgl2": "This browser can't run the 3D workspace, so here is the plain version of the same site.",
  "init-failed": "The 3D workspace couldn't start, so here is the plain version of the same site.",
  "context-lost": "The graphics were reset and didn't recover, so here is the plain version of the same site.",
};

export default function App() {
  const snap = useSyncExternalStore(subscribe, getSnapshot);
  const route = parseRoute(snap.path);
  const [theme, toggleTheme] = useTheme();
  useRouteMeta(route);
  useParallax();

  // 3D availability: the visitor's choice, or a reason the engine reported.
  // ?view=2d is read on the first render, so a visitor asking for the plain page never downloads the 3D engine first
  const [prefer2D, setPrefer2D] = useState(() => {
    if (new URLSearchParams(window.location.search).get("view") === "2d") return true;
    try { return localStorage.getItem(PREF_KEY) === "2d"; } catch { return false; }
  });
  const [unavailable, setUnavailable] = useState(() => (supportsWebGL2() ? null : "no-webgl2"));
  const choose = useCallback((v) => { setPrefer2D(v); try { localStorage.setItem(PREF_KEY, v ? "2d" : "3d"); } catch { /* private mode */ } if (!v) setUnavailable(null); }, []);
  // ?view=2d is a shareable way to ask for the plain page
  useEffect(() => {
    if (new URLSearchParams(snap.search).get("view") !== "2d") return;
    let stored = null;
    try { stored = localStorage.getItem(PREF_KEY); } catch { /* private mode */ }
    if (stored !== "2d") choose(true);   // remember the choice (prefer2D itself may already be true from the first render)
  }, [snap.search]); // eslint-disable-line react-hooks/exhaustive-deps
  // What the home route is showing: the 3D room, a full-page experience, or the preserved classic page.
  const exp = route.kind === "home" ? experienceFromHash(snap.hash) : null;
  const classic = route.kind === "home" && new URLSearchParams(snap.search).get("classic") === "1";
  // /#career is the notebook in the 3D room, and the plain career page when the 3D room is off (LO-FI, or no WebGL2)
  const careerPage = route.kind === "home" ? careerPageFromHash(snap.hash) : null;
  const careerPlain = !!careerPage && !classic && (prefer2D || !!unavailable);
  const homeKind = route.kind !== "home" ? null : classic ? "classic" : careerPlain ? "career" : exp ? "experience" : "workspace";
  const homeRef = useRef(null);
  homeRef.current = homeKind === "classic" || !homeKind ? null : { kind: homeKind, exp: exp?.id };

  const use3D = !prefer2D && !unavailable && homeKind !== "classic";
  // The immersive computer interface wraps experiences and case studies whenever the 3D computer is the site's front door.
  const immersive = !prefer2D && !unavailable && homeKind !== "classic";
  const immersiveRef = useRef(null);
  immersiveRef.current = immersive && route.kind === "case" ? "case" : null;
  useLinkInterception(homeRef, immersiveRef);

  // Keep the room mounted (suspended) once it has been shown, so coming back from an experience or a case study is instant.
  const [roomShown, setRoomShown] = useState(false);
  useEffect(() => { if (use3D && homeKind === "workspace") setRoomShown(true); }, [use3D, homeKind]);
  useEffect(() => { if (!use3D) setRoomShown(false); }, [use3D]);

  // Scroll: restore on Back/Forward, top on a new page.
  useEffect(() => { applyScroll(snap); }, [snap]);

  // Case-study scroll-to-top is covered by applyScroll; keep route-kind transitions focus-friendly.
  const launch = useCallback((entry) => navigate(entry.href || `/#${entry.id}`), []);

  let content;
  if (route.kind === "case" && immersive) {
    content = (
      <OsShell view={{ caseSlug: route.project.slug }}>
        <CaseStudy project={route.project} />
      </OsShell>
    );
  } else if (route.kind === "case") {
    content = (
      <>
        <Header activeId={null} theme={theme} onToggleTheme={toggleTheme} />
        <CaseStudy project={route.project} />
        <Footer />
      </>
    );
  } else if (homeKind === "classic") {
    content = <LegacyHome theme={theme} onToggleTheme={toggleTheme} />;
  } else if (homeKind === "experience") {
    content = immersive ? <ExperienceShell exp={exp} /> : <ClassicExperience exp={exp} theme={theme} onToggleTheme={toggleTheme} />;
  } else if (homeKind === "career") {
    content = <CareerPage theme={theme} onToggleTheme={toggleTheme} page={careerPage} onTry3D={() => choose(false)} />;
  } else if (!use3D) {
    content = (
      <FlatHome
        theme={theme}
        onToggleTheme={toggleTheme}
        notice={unavailable ? UNAVAILABLE_COPY[unavailable] : null}
        canTry3D={prefer2D || !!unavailable}
        onTry3D={() => choose(false)}
      />
    );
  }

  return (
    <>
      {use3D && (roomShown || homeKind === "workspace") && (
        <Suspense fallback={<p className="ws3d__loading" role="status">Loading the workspace…</p>}>
          <Workspace3D
            active={homeKind === "workspace"}
            station={homeKind === "workspace" ? stationFromHash(snap.hash) || "desk" : null}
            onLaunch={launch}
            onUnavailable={setUnavailable}
            onPrefer2D={() => choose(true)}
          />
        </Suspense>
      )}
      {content}
    </>
  );
}

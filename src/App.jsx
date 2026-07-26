import React, { useEffect, useState, useCallback } from "react";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import BuilderTelemetry from "./components/BuilderTelemetry.jsx";
import Projects from "./components/Projects.jsx";
import About from "./components/About.jsx";
import GISProjects from "./components/GISProjects.jsx";
import Skills from "./components/Skills.jsx";
import Contact from "./components/Contact.jsx";
import Footer from "./components/Footer.jsx";
import CaseStudy from "./components/CaseStudy.jsx";
import { PROJECTS, GIS_PROJECTS } from "./data/projects.js";

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

function usePathRoute() {
  const [path, setPath] = useState(() => window.location.pathname || "/");
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || "/");
    window.addEventListener("popstate", onPop);
    // Intercept same-origin link clicks so we get SPA navigation
    // without changing every <a> in the codebase.
    const onClick = (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href) return;
      // ignore: external, hash-only, mailto/tel, target=_blank, modifier-clicks
      if (a.target && a.target !== "_self") return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (/^(https?:|mailto:|tel:)/i.test(href)) return;
      if (href.startsWith("#")) return;
      // only handle our own paths
      const url = new URL(a.href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      e.preventDefault();
      if (url.pathname !== window.location.pathname || url.search !== window.location.search) {
        window.history.pushState({}, "", url.pathname + url.search + url.hash);
        setPath(url.pathname);
      }
      if (url.hash) {
        // allow in-page anchor scroll after route swap
        setTimeout(() => {
          const el = document.getElementById(url.hash.slice(1));
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 60);
      } else {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    };
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("click", onClick);
    };
  }, []);
  return path;
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
  title: "crvro.com — Christopher Rivero",
  description:
    "Christopher Rivero — a builder of small, useful systems. Automation, AI support tooling, GIS / CAD pipelines.",
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
      ? `${p.title} — Christopher Rivero`
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

export default function App() {
  const path = usePathRoute();
  const route = parseRoute(path);
  const [activeId, setActiveId] = useState("work");
  const [theme, toggleTheme] = useTheme();
  useRouteMeta(route);

  // Scroll to top whenever a route change happens (case ↔ home)
  useEffect(() => {
    if (route.kind === "case") window.scrollTo({ top: 0, behavior: "instant" });
  }, [route.kind, route.kind === "case" ? route.project.slug : null]);

  // After navigating to home, scroll to the hash target (e.g. /#work from a project page)
  useEffect(() => {
    if (route.kind !== "home") return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const rafId = requestAnimationFrame(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(rafId);
  }, [path]);

  // Scrollspy + staggered reveal — home page
  useEffect(() => {
    if (route.kind !== "home") return;
    const ids = ["work", "about", "skills", "contact"];
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActiveId(e.target.id)),
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => obs.observe(s));

    // Staggered reveal: elements inside [data-stagger] fire together with delays
    const firedGroups = new Set();
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target;
          const group = el.closest("[data-stagger]");
          if (group) {
            if (firedGroups.has(group)) return;
            firedGroups.add(group);
            Array.from(group.querySelectorAll(".reveal")).forEach((child, i) => {
              child.style.setProperty("--reveal-delay", `${i * 55}ms`);
              child.classList.add("visible");
              revealObs.unobserve(child);
            });
          } else {
            el.classList.add("visible");
            revealObs.unobserve(el);
          }
        });
      },
      { threshold: 0.06 }
    );
    document.querySelectorAll(".reveal").forEach((el) => revealObs.observe(el));

    return () => { obs.disconnect(); revealObs.disconnect(); };
  }, [route.kind]);

  // Subtle parallax — runs on all pages, lightweight rAF-based
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let rafId;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        document.querySelectorAll("[data-parallax]").forEach((el) => {
          const rect = el.getBoundingClientRect();
          const centerOffset = (rect.top + rect.height / 2) - window.innerHeight / 2;
          const factor = parseFloat(el.dataset.parallax) || 0.04;
          const raw = centerOffset * factor;
          // Clamp to ±36px so off-screen elements don't have jarring pre-offset
          const py = Math.max(-36, Math.min(36, raw));
          el.style.setProperty("--py", `${py}px`);
        });
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (route.kind === "case") {
    return (
      <>
        <Header activeId={null} theme={theme} onToggleTheme={toggleTheme} />
        <CaseStudy project={route.project} />
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header activeId={activeId} theme={theme} onToggleTheme={toggleTheme} />
      <main>
        <Hero />
        <BuilderTelemetry />
        <Projects />
        <About />
        <GISProjects />
        <Skills />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

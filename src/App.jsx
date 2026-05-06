import React, { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import Projects from "./components/Projects.jsx";
import About from "./components/About.jsx";
import Skills from "./components/Skills.jsx";
import Contact from "./components/Contact.jsx";
import Footer from "./components/Footer.jsx";
import CaseStudy from "./components/CaseStudy.jsx";
import { PROJECTS } from "./data/projects.js";

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
        window.history.pushState({}, "", url.pathname + url.search);
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
    const project = PROJECTS.find((p) => p.slug === m[1]);
    if (project) return { kind: "case", project };
  }
  return { kind: "home" };
}

export default function App() {
  const path = usePathRoute();
  const route = parseRoute(path);
  const [activeId, setActiveId] = useState("work");

  // Scroll to top whenever a route change happens (case ↔ home)
  useEffect(() => {
    if (route.kind === "case") window.scrollTo({ top: 0, behavior: "instant" });
  }, [route.kind, route.kind === "case" ? route.project.slug : null]);

  // Scrollspy + reveal — only attach when home is mounted
  useEffect(() => {
    if (route.kind !== "home") return;
    const ids = ["work", "about", "skills", "contact"];
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActiveId(e.target.id)),
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => obs.observe(s));

    const revealObs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            revealObs.unobserve(e.target);
          }
        }),
      { threshold: 0.08 }
    );
    document.querySelectorAll(".reveal").forEach((el) => revealObs.observe(el));

    return () => { obs.disconnect(); revealObs.disconnect(); };
  }, [route.kind]);

  if (route.kind === "case") {
    return (
      <>
        <Header activeId={null} />
        <CaseStudy project={route.project} />
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header activeId={activeId} />
      <main>
        <Hero />
        <Projects />
        <About />
        <Skills />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

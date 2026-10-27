import React, { useEffect, useRef } from "react";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import ProjectWorld from "./ProjectWorld.jsx";
import PortfolioNavigator from "./PortfolioNavigator.jsx";
import About from "./About.jsx";
import Skills from "./Skills.jsx";
import AIConsultation from "./AIConsultation.jsx";
import Contact from "./Contact.jsx";
import { useReveal } from "../lib/pageEffects.js";

const NAV = [
  { id: "work", short: "world" },
  { id: "navigator", short: "ask" },
  { id: "about", short: "about" },
  { id: "skills", short: "skills" },
  { id: "ai-consultation", short: "consult" },
  { id: "contact", short: "contact" },
].map((l, i) => ({ id: l.id, n: `0${i + 1}`, label: l.short }));

// One full-page experience at a time, each one the existing component unchanged. Project World is followed by the
// Destination Lookup, its original post-journey placement; the lookup is also an experience of its own.
const BODY = {
  work: () => (<><ProjectWorld /><PortfolioNavigator /></>),
  navigator: () => <PortfolioNavigator />,
  about: () => <About />,
  skills: () => <Skills />,
  "ai-consultation": () => <AIConsultation />,
  contact: () => <Contact />,
};

export default function ExperienceShell({ exp, theme, onToggleTheme }) {
  const mainRef = useRef(null);
  useReveal(exp.id);

  useEffect(() => {
    const prev = document.title;
    document.title = `${exp.label}: Christopher Rivero`;
    mainRef.current?.focus({ preventScroll: true });   // keyboard and screen-reader users land in the new content
    return () => { document.title = prev; };
  }, [exp.id, exp.label]);

  const Body = BODY[exp.id];
  return (
    <div className="xp" data-experience={exp.id}>
      <Header activeId={exp.id} theme={theme} onToggleTheme={onToggleTheme} links={NAV} />
      <a className="xp-return" href="/">
        <span aria-hidden="true">◂</span> Computer
      </a>
      <main id="main" className="xp-main" tabIndex={-1} ref={mainRef} aria-label={exp.label}>
        <Body />
      </main>
      <Footer />
    </div>
  );
}



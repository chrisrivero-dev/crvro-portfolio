import React, { useState } from "react";
import Header from "./Header.jsx";
import Hero from "./Hero.jsx";
import ProjectWorld from "./ProjectWorld.jsx";
import PortfolioNavigator from "./PortfolioNavigator.jsx";
import About from "./About.jsx";
import Skills from "./Skills.jsx";
import AIConsultation from "./AIConsultation.jsx";
import Contact from "./Contact.jsx";
import Footer from "./Footer.jsx";
import { useReveal, useScrollspy } from "../lib/pageEffects.js";

// The original stacked home page (CSS retro-computer hero, Project World, navigator, About, ...), preserved
// byte-for-byte in behaviour until the 3D redesign is approved for production. Reached at /?classic=1.
export default function LegacyHome({ theme, onToggleTheme }) {
  const [activeId, setActiveId] = useState("work");
  useReveal("classic");
  useScrollspy(["work", "about", "skills", "contact"], setActiveId, "classic");
  return (
    <>
      <Header activeId={activeId} theme={theme} onToggleTheme={onToggleTheme} />
      <main>
        <Hero />
        <ProjectWorld />
        <PortfolioNavigator />
        <About />
        <Skills />
        <AIConsultation />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

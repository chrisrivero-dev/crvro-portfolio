import React from "react";
import OsShell from "./OsShell.jsx";
import ProjectWorld from "./ProjectWorld.jsx";
import PortfolioNavigator from "./PortfolioNavigator.jsx";
import About from "./About.jsx";
import Skills from "./Skills.jsx";
import AIConsultation from "./AIConsultation.jsx";
import Contact from "./Contact.jsx";

// One experience at a time inside the immersive computer interface, each one the existing component unchanged.
// Project World is followed by the Destination Lookup, its original post-journey placement; the lookup is also an
// experience of its own (ASK.EXE).
const BODY = {
  work: () => (<><ProjectWorld /><PortfolioNavigator /></>),
  navigator: () => <PortfolioNavigator direct />,
  about: () => <About />,
  skills: () => <Skills />,
  "ai-consultation": () => <AIConsultation />,
  contact: () => <Contact />,
};

export default function ExperienceShell({ exp }) {
  const Body = BODY[exp.id];
  return (
    <OsShell view={exp.id}>
      <Body />
    </OsShell>
  );
}

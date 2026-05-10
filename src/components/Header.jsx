import React, { useEffect, useState } from "react";
import Icon from "./Icon.jsx";

const links = [
  { id: "work",    n: "01", label: "work" },
  { id: "about",   n: "02", label: "about" },
  { id: "skills",  n: "03", label: "skills" },
  { id: "contact", n: "04", label: "contact" },
];

export default function Header({ activeId, theme, onToggleTheme }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={"site-header" + (scrolled ? " scrolled" : "")} data-screen-label="Header">
      <div className="inner">
        <a href="#top" className="wordmark" aria-label="crvro.com — Christopher Rivero">
          <span className="top">crvro.com · Portfolio</span>
          <span className="name">Christopher Rivero</span>
        </a>
        <nav className={"site-nav" + (open ? " open" : "")}>
          {links.map((l) => (
            <a key={l.id} href={"#" + l.id} className={activeId === l.id ? "active" : ""} onClick={() => setOpen(false)}>
              <span className="num">{l.n}</span>{l.label}
            </a>
          ))}
        </nav>
        <div className="header-controls">
          <button
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={15} stroke={1.5} />
          </button>
          <button className="menu-btn" aria-label={open ? "close menu" : "open menu"} onClick={() => setOpen((o) => !o)}>
            <Icon name={open ? "close" : "menu"} size={22} />
          </button>
        </div>
      </div>
    </header>
  );
}

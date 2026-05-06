import React from "react";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="inner">
        <div className="sig">
          <span className="name">Christopher Rivero</span>
          <span style={{ color: "var(--pencil)" }}>crvro.com · 2026</span>
        </div>
        <div className="right">
          <a href="mailto:contact@crvro.com">email</a>
          <a href="https://github.com/chrisrivero-dev" target="_blank" rel="noreferrer">github</a>
          <a href="#top">top ↑</a>
        </div>
      </div>
    </footer>
  );
}

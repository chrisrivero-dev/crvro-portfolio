import React from "react";

export default function Contact() {
  return (
    <section className="contact" id="contact" data-screen-label="05 Contact">
      <div className="container-wide">
        <div className="section-head">
          <div className="index">§ 04 — Contact</div>
          <div className="h">Want to work together, <em>or just talk shop?</em></div>
        </div>
        <div className="grid">
          <div></div>
          <div className="body">
            <p>
              Email is fastest. I read everything; I usually reply within a day.
              If you'd rather keep it short, GitHub or LinkedIn work too.
            </p>
            <div className="links">
              <a href="mailto:contact@crvro.com">
                <span className="left"><span className="lab">Email</span>contact@crvro.com</span>
                <span className="right">primary <span className="ar">↗</span></span>
              </a>
              <a href="https://github.com/chrisrivero-dev" target="_blank" rel="noreferrer">
                <span className="left"><span className="lab">GitHub</span>github.com/chrisrivero-dev</span>
                <span className="right">repos <span className="ar">↗</span></span>
              </a>
              <a href="https://www.linkedin.com/in/christopher-rivero-47b03b97/" target="_blank" rel="noreferrer">
                <span className="left"><span className="lab">LinkedIn</span>linkedin.com/in/christopher-rivero-47b03b97</span>
                <span className="right">background <span className="ar">↗</span></span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

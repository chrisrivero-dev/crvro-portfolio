import React from "react";
import PortfolioShare from "./PortfolioShare.jsx";

export default function Contact() {
  return (
    <section className="contact" id="contact" data-screen-label="05 Contact">
      <div className="container-wide">
        <div className="section-head reveal">
          <div className="index">§ 04: Contact</div>
          <div className="h">
            Want to talk about AI, GIS/CAD, support systems, <em>or
            something you’re trying to build?</em> Let me know.
          </div>
        </div>
        <div className="grid">
          <div></div>
          <div className="body">
            <p>
              Email is fastest. I usually reply within a day.
            </p>
            <div className="links" data-stagger>
              {/* No backend contact form exists on this static site — this is a
                  plain mailto: link. Visible text stays contact@crvro.com (the
                  public address); the mailto target is the actual inbox that
                  receives it, christopherarivero@gmail.com, so mail doesn't
                  bounce. Footer.jsx uses the same destination for consistency. */}
              <a href="mailto:christopherarivero@gmail.com" className="reveal">
                <span className="left"><span className="lab">Email</span>contact@crvro.com</span>
                <span className="right">primary <span className="ar">↗</span></span>
              </a>
              <a href="https://github.com/chrisrivero-dev" target="_blank" rel="noreferrer" className="reveal">
                <span className="left"><span className="lab">GitHub</span>github.com/chrisrivero-dev</span>
                <span className="right">repos <span className="ar">↗</span></span>
              </a>
              <a href="https://www.linkedin.com/in/christopherarivero" target="_blank" rel="noreferrer" className="reveal">
                <span className="left"><span className="lab">LinkedIn</span>linkedin.com/in/christopherarivero</span>
                <span className="right">background <span className="ar">↗</span></span>
              </a>
              <PortfolioShare />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

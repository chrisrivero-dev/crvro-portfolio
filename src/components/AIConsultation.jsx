import React, { useEffect, useRef } from "react";

export default function AIConsultation() {
  const ref = useRef(null);
  const [visible, setVisible] = React.useState(false);

  useEffect(() => {
    if (!ref.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );
    
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="ai-consultation" id="ai-consultation" ref={ref}>
      <div className="container-wide">
        <div className="grid">
          <div></div>
          <div className="body">
            <h3>Trying to figure out where AI could actually help in your workflow?</h3>
            <p>I can help you map the problem, decide what should be automated, and keep the important decisions with people.</p>
            
            {/* Workflow diagram */}
            <div className={`workflow-diagram ${visible ? 'signal-in-motion' : ''}`}>
              <div className="workflow-node">
                <span>YOUR WORK</span>
              </div>
              <div className="arrow">↓</div>
              <div className="workflow-node">
                <span>FRICTION</span>
              </div>
              <div className="arrow">↓</div>
              <div className={`workflow-node ${visible ? 'signal-active' : ''}`}>
                <span>AI / AUTOMATION</span>
              </div>
              <div className="arrow">↓</div>
              <div className="workflow-node">
                <span>HUMAN DECISION</span>
              </div>
            </div>
            
            <a href="mailto:contact@crvro.com" className="cta-btn reveal">
              Talk about your workflow <span className="ar">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

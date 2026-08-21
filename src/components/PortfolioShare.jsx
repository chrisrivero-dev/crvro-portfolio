import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export const PORTFOLIO_URL = "https://www.crvro.com/";

export default function PortfolioShare() {
  const [open, setOpen] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy link");
  const canvasRef = useRef(null);
  const closeRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);

    QRCode.toCanvas(canvasRef.current, PORTFOLIO_URL, {
      width: 224,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#171713", light: "#ffffff" },
    }).catch(() => setCopyLabel("QR unavailable"));

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      requestAnimationFrame(() => triggerRef.current?.focus());
    };
  }, [open]);

  const copyLink = async () => {
    let copied = false;
    try {
      await navigator.clipboard.writeText(PORTFOLIO_URL);
      copied = true;
    } catch {
      const fallback = document.createElement("textarea");
      fallback.value = PORTFOLIO_URL;
      fallback.setAttribute("readonly", "");
      fallback.style.position = "fixed";
      fallback.style.opacity = "0";
      document.body.appendChild(fallback);
      fallback.select();
      copied = document.execCommand("copy");
      fallback.remove();
    }
    setCopyLabel(copied ? "Copied" : "Copy unavailable");
    window.setTimeout(() => setCopyLabel("Copy link"), 1800);
  };

  const share = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: "CRVRO.COM",
        text: "Christopher Rivero's portfolio",
        url: PORTFOLIO_URL,
      });
    } catch (error) {
      if (error?.name !== "AbortError") setCopyLabel("Share unavailable");
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="share-trigger reveal"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <span className="left"><span className="lab">Share</span>CRVRO.COM</span>
        <span className="right">scan / share <span className="ar">↗</span></span>
      </button>

      {open ? (
        <div className="share-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
          <section
            className="share-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-title"
            aria-describedby="share-description"
          >
            <button ref={closeRef} type="button" className="share-close" onClick={() => setOpen(false)} aria-label="Close share portfolio dialog">
              Close
            </button>
            <div className="share-copy">
              <div className="share-kicker">SHARE PORTFOLIO</div>
              <h2 id="share-title">CRVRO.COM</h2>
              <p id="share-description">Scan to view my work</p>
            </div>
            <div className="share-qr" aria-label={`QR code for ${PORTFOLIO_URL}`}>
              <canvas ref={canvasRef} />
            </div>
            <div className="share-actions">
              <button type="button" onClick={copyLink}>{copyLabel}</button>
              {typeof navigator.share === "function" ? (
                <button type="button" onClick={share}>Share</button>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

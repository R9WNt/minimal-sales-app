"use client";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

export type FAQTabProps = {
  onClick?: () => void;
  placeAt?: "top" | "bottom";
};

export const FAQTab: React.FC<FAQTabProps> = ({ onClick, placeAt = "bottom" }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Defer the state update to the next frame to avoid synchronous setState in effect.
    const id = typeof window !== "undefined" ? window.requestAnimationFrame(() => setMounted(true)) : null;
    return () => {
      if (id != null) window.cancelAnimationFrame(id);
    };
  }, []);

  if (!mounted) return null;

  const containerStyle: React.CSSProperties =
    placeAt === "bottom"
      ? { position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 99999, pointerEvents: "auto" }
      : { position: "fixed", left: 0, right: 0, top: 0, zIndex: 99999, pointerEvents: "auto" };

  const tab = (
    <div style={containerStyle} aria-hidden={false}>
      <div className="faq-tab-wrap">
        <button type="button" onClick={onClick} aria-label="Frequently Asked Questions" className="faq-tab">
          <span className="faq-tab-text">Frequently Asked Questions</span>

          <span className="faq-tab-glint" aria-hidden="true" />

          <span className="faq-tab-blocks faq-tab-blocks-left" aria-hidden="true">
            <i className="block b1" />
            <i className="block b2" />
            <i className="block b3" />
            <i className="block b4" />
          </span>

          <span className="faq-tab-blocks faq-tab-blocks-right" aria-hidden="true">
            <i className="block b1" />
            <i className="block b2" />
            <i className="block b3" />
            <i className="block b4" />
          </span>
        </button>
      </div>
    </div>
  );

  return ReactDOM.createPortal(tab, document.body);
};
"use client";
import React, { useEffect, useState } from "react";

/**
 * Inline FAQTab component (no portal).
 * Keeps the original class names so existing globals.css rules remain valid.
 * Exports both named and default so imports like `import { FAQTab }` or `import FAQTab` work.
 */

export type FAQTabProps = {
  onClick?: () => void;
  placeAt?: "top" | "bottom";
};

export const FAQTab: React.FC<FAQTabProps> = ({ onClick, placeAt = "bottom" }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // keep same mounting behavior to avoid SSR/hydration issues
    const id = typeof window !== "undefined" ? window.requestAnimationFrame(() => setMounted(true)) : null;
    return () => {
      if (id != null && typeof window !== "undefined") window.cancelAnimationFrame(id);
    };
  }, []);

  if (!mounted) return null;

  // Render inline and rely on the parent/layout to position it.
  // The element will participate in normal document flow and remain inside the app container.
  return (
    <div data-place={placeAt} aria-hidden={false}>
      <div className="faq-tab-wrap">
        <button
          type="button"
          onClick={onClick}
          aria-label="Frequently Asked Questions"
          className="faq-tab"
        >
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
};

export default FAQTab;
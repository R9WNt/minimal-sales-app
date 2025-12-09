import React from "react";

export type FAQTabProps = {
  onClick?: () => void;
  placeAt?: "top" | "bottom";
};

export const FAQTab: React.FC<FAQTabProps> = ({ onClick, placeAt = "bottom" }) => {
  const containerStyle: React.CSSProperties =
    placeAt === "bottom"
      ? { position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 40, pointerEvents: "auto" }
      : { position: "fixed", left: 0, right: 0, top: 0, zIndex: 40, pointerEvents: "auto" };

  return (
    <div style={containerStyle} aria-hidden={false}>
      <div className="faq-tab-wrap">
        <button type="button" onClick={onClick} aria-label="Frequently Asked Questions" className="faq-tab">
          <span className="faq-tab-text">Frequently Asked Questions</span>

          {/* glint element sits behind text */}
          <span className="faq-tab-glint" aria-hidden="true" />

          {/* multi-block (Tetris) bevels left */}
          <span className="faq-tab-blocks faq-tab-blocks-left" aria-hidden="true">
            <i className="block b1" />
            <i className="block b2" />
            <i className="block b3" />
          </span>

          {/* multi-block (Tetris) bevels right */}
          <span className="faq-tab-blocks faq-tab-blocks-right" aria-hidden="true">
            <i className="block b1" />
            <i className="block b2" />
            <i className="block b3" />
          </span>
        </button>
      </div>
    </div>
  );
};
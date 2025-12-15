import React from "react";
import styles from "./FAQWidget.module.css";
import Overlay from "./Overlay";

export type FAQItem = { title: string; body: string };

type Props = {
  faqs: FAQItem[];
  selected: number;
  showDescription: boolean;
  allowDescription: boolean;
  isSmallScreen: boolean;
  overlayPanelRef: React.RefObject<HTMLDivElement | null>;
  descRef: React.RefObject<HTMLDivElement | null>;
  descId: string;
  descTitleId: string;
  setShowDescription: (b: boolean) => void;
  setAllowDescription: (b: boolean) => void;
};

export default function FAQDescription({
  faqs,
  selected,
  showDescription,
  allowDescription,
  isSmallScreen,
  overlayPanelRef,
  descRef,
  descId,
  descTitleId,
  setShowDescription,
  setAllowDescription,
}: Props) {
  const overlay = isSmallScreen && showDescription && allowDescription ? (
    <>
      {/* Overlay focus-trap handles Escape, initial focus, and focus restoration */}
      <Overlay onClose={() => { setShowDescription(false); setAllowDescription(false); }} panelRef={overlayPanelRef} ariaLabel={faqs[selected]?.title ?? "FAQ detail"}>
        <button className={styles.overlayClose} aria-label="Close description" onClick={() => { setShowDescription(false); setAllowDescription(false); }}>
          ×
        </button>

        <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{faqs[selected]?.title}</div>
        <div style={{ fontSize: 14, color: "#475569", lineHeight: "1.4" }}>{faqs[selected]?.body}</div>
      </Overlay>
    </>
  ) : null;

  const descStyleInline: React.CSSProperties = {
    visibility: showDescription && allowDescription && !isSmallScreen ? "visible" : "hidden",
    pointerEvents: showDescription && allowDescription && !isSmallScreen ? "auto" : "none",
    opacity: showDescription && allowDescription && !isSmallScreen ? 1 : 0,
  };

  return (
    <>
      <div
        id={descId}
        ref={descRef}
        role="region"
        aria-labelledby={descTitleId}
        className={styles.desc}
        style={descStyleInline}
        aria-hidden={!(showDescription && allowDescription) || isSmallScreen}
      >
        <button
          onClick={(ev) => {
            ev.stopPropagation();
            setShowDescription(false);
            setAllowDescription(false);
          }}
          aria-label="Close description"
          data-no-drag
          className={styles.descClose}
          title="Close description"
        >
          ×
        </button>

        <h3 id={descTitleId} style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {faqs[selected ?? 0]?.title}
        </h3>
        <div style={{ marginTop: 6, fontSize: 12, color: "#475569", lineHeight: "1.2em", maxHeight: "5.6em", overflow: "hidden" }}>
          {faqs[selected ?? 0]?.body}
        </div>
      </div>

      {/* overlay for small screens */}
      {overlay}
    </>
  );
}

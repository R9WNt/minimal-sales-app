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
    side?: 'left' | 'right';
    forceOverlay?: boolean;
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
    side = 'right',
    forceOverlay = false,
    overlayPanelRef,
    descRef,
    descId,
    descTitleId,
    setShowDescription,
    setAllowDescription,
}: Props) {
    const overlay = (isSmallScreen || forceOverlay) && showDescription && allowDescription ? (
        <>
            {/* Overlay focus-trap handles Escape, initial focus, and focus restoration */}
            <Overlay
                open={showDescription && (isSmallScreen || forceOverlay) && allowDescription}
                onClose={() => {
                    // Defer state updates to avoid races with pointer/focus handlers
                    requestAnimationFrame(() => {
                        setShowDescription(false);
                        setAllowDescription(false);
                    });
                }}
                panelRef={overlayPanelRef}

                ariaLabel={faqs[selected]?.title ?? "FAQ detail"}
            >
                <button
                    className={styles.overlayClose}
                    aria-label="Close description"
                    onClick={() => {
                        requestAnimationFrame(() => {
                            setShowDescription(false);
                            setAllowDescription(false);
                        });
                    }}
                >
                    ×
                </button>

                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{faqs[selected]?.title}</div>
                <div style={{ fontSize: 13, color: "#475569", lineHeight: "1.4" }}>{faqs[selected]?.body}</div>
            </Overlay>
        </>
    ) : null;
  
    const descStyleInline: React.CSSProperties = {
        display: showDescription && allowDescription && !isSmallScreen && !forceOverlay ? "flex" : "none",
        pointerEvents: showDescription && allowDescription && !isSmallScreen && !forceOverlay ? "auto" : "none",
    };

    return (
        <>
            <div
            id={descId}
            ref={descRef}
            role="region"
            aria-labelledby={descTitleId}
            className={`${styles.desc} ${side === 'left' ? styles.descLeft : ''}`}
            style={descStyleInline}
            aria-hidden={!(showDescription && allowDescription) || isSmallScreen}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}>
                <button
                onClick={(ev) => {
                    ev.stopPropagation();
                    requestAnimationFrame(() => {
                        setShowDescription(false);
                        setAllowDescription(false);
                    });
                }}
                aria-label="Close description"
                data-no-drag
                className={styles.descClose}
                title="Close description">
                    ×
                </button>

                <div className={styles.descHeader}>
                    <h3 id={descTitleId} style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {faqs[selected ?? 0]?.title}
                    </h3>
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#475569", lineHeight: "1.2em", maxHeight: "5.6em", overflow: "hidden" }}>
                    {faqs[selected ?? 0]?.body}
                </div>
            </div>

            {/* overlay for small screens */}
            {overlay}
        </>
    );
}
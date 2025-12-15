import React, { useEffect, useRef } from "react";
import styles from "./FAQWidget.module.css";

function getTabbableElements(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  const selectors = [
    'a[href]:not([tabindex^="-"])',
    'area[href]:not([tabindex^="-"])',
    'input:not([disabled]):not([type="hidden"]):not([tabindex^="-"])',
    'select:not([disabled]):not([tabindex^="-"])',
    'textarea:not([disabled]):not([tabindex^="-"])',
    'button:not([disabled]):not([tabindex^="-"])',
    'iframe:not([tabindex^="-"])',
    'audio[controls]:not([tabindex^="-"])',
    'video[controls]:not([tabindex^="-"])',
    '[contenteditable]:not([tabindex^="-"])',
    '[tabindex]:not([tabindex^="-"])',
  ].join(",");

  const nodeList = Array.from(root.querySelectorAll<HTMLElement>(selectors));
  return nodeList.filter((el) => {
    const style = window.getComputedStyle(el);
    return style.visibility !== "hidden" && style.display !== "none" && el.offsetWidth > 0 && el.offsetHeight > 0;
  });
}

type Props = {
  onClose: () => void;
  panelRef?: React.RefObject<HTMLDivElement | null>;
  ariaLabel?: string;
  children?: React.ReactNode;
};

export default function Overlay({ onClose, panelRef, ariaLabel, children }: Props) {
  const localRef = useRef<HTMLDivElement | null>(null);
  const containerRef = panelRef ?? localRef;

  useEffect(() => {
    const panelEl = containerRef.current;
    if (!panelEl) return;

    const previouslyFocused = (document.activeElement as HTMLElement) || null;

    const tabbables = getTabbableElements(panelEl);
    const initialFocus = tabbables.length ? tabbables[0] : panelEl;
    try {
      (initialFocus as HTMLElement).focus();
    } catch {
      /* ignore */
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        if (tabbables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = tabbables[0];
        const last = tabbables[tabbables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          if (active === first || panelEl === active) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    function onFocusIn(e: FocusEvent) {
      const target = e.target as Node | null;
      if (!panelEl) return;
      if (!panelEl.contains(target)) {
        const tabb = getTabbableElements(panelEl);
        const t = (tabb.length ? tabb[0] : panelEl) as HTMLElement;
        try {
          t.focus();
        } catch {
          /* ignore */
        }
      }
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("focusin", onFocusIn);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("focusin", onFocusIn);
      try {
        previouslyFocused?.focus();
      } catch {
        /* ignore */
      }
    };
  }, [containerRef, onClose]);

  return (
    <div className={styles.overlayBackdrop} role="dialog" aria-modal="true" onClick={() => onClose()}>
      <div className={styles.overlayPanel} ref={containerRef} tabIndex={-1} onClick={(e) => e.stopPropagation()} aria-label={ariaLabel}>
        {children}
      </div>
    </div>
  );
}

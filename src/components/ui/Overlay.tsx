import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";

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
    open?: boolean; // allow callers to render conditionally too
    onClose?: () => void;
    panelRef?: React.RefObject<HTMLDivElement | null>;
    ariaLabel?: string;
    children?: React.ReactNode;
    backdropClickCloses?: boolean;
    className?: string; // extra class for backdrop wrapper
    panelClassName?: string; // extra class for inner panel
};

export default function Overlay({
    open = true,
    onClose,
    panelRef,
    ariaLabel,
    children,
    backdropClickCloses = true,
    className = "",
    panelClassName = "",
}: Props) {
    const localRef = useRef<HTMLDivElement | null>(null);
    const containerRef = panelRef ?? localRef;
    
    useEffect(() => {
        // nothing to do if not open yet
        const panelEl = containerRef.current;
        if (!panelEl || !open) return;

        const previouslyFocused = (document.activeElement as HTMLElement) || null;
        const tabbables = getTabbableElements(panelEl);
        const initialFocus = tabbables.length ? tabbables[0] : panelEl;
        try {
            (initialFocus as HTMLElement).focus();
        } catch {
            /* ignore */
        }

        // lock body scroll
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") {
                onClose?.();
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
            if (!panelEl.contains(target)) return;
            const tabb = getTabbableElements(panelEl);
            const t = (tabb.length ? tabb[0] : panelEl) as HTMLElement;
            if (t === document.activeElement) return;
            try {
                t.focus();
            } catch {
                /* ignore */
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
            document.body.style.overflow = prevOverflow || "";
        };
    }, [containerRef, onClose, open]);

    if (!open) return null;
    if (typeof document === "undefined") return null;
    const portalRoot = document.getElementById("portal-root") ?? document.body;

    const overlay = (
    <div
    className={`fixed inset-0 z-backdrop bg-black/40 flex items-center justify-center ${className}`}
    role="presentation"
    onMouseDown={(e) => {
        //if (!backdropClickCloses) return;
        // only close when clicking the backdrop itself
        if (e.target === e.currentTarget) {
            onClose?.();
        }
    }}>
        <div
        ref={containerRef}
        className={`relative z-modal w-full max-w-full ${panelClassName}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onMouseDown={(e) => e.stopPropagation()}
        tabIndex={-1}>
            {children}
        </div>
    </div>
    );

    return ReactDOM.createPortal(overlay, portalRoot);
}
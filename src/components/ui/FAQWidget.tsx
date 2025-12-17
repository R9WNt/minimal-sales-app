import React, { useEffect, useRef, useState, useId, useLayoutEffect } from "react";
import ReactDOM from "react-dom";
import styles from "./FAQWidget.module.css";
import { cssVarsInline, readLayout } from "../layout/faqLayout";
/* Visual cube extracted to its own component (src/components/layout/Cube.tsx) */
import Draggable from "../layout/Draggable";
import Circle from "../layout/Circle";
import FAQRing from "./FAQRing";
import FAQDescription from "./FAQDescription";

/**
 * FAQWidget.tsx
 *
 * Adds position clamping so the widget cannot be dragged fully off-screen.
 *
 * Key changes:
 * - on pointer up we measure the container's bounding rect and adjust the final translate
 *   so at least a small part of the widget remains visible.
 * - on mount and on window resize we re-clamp any persisted position so the widget
 *   is always recoverable after viewport changes.
 *
 * The file keeps the overlay, focus-trap, and CSS-var defensive application from previous versions.
 */

type FAQItem = { title: string; body: string };

const DEFAULT_FAQS: FAQItem[] = [
    { title: "How to pay?", body: "We accept card, mobile money and in-person over-the-counter payments." },
    { title: "Return policy?", body: "Return within 7 days with receipt in original condition for a full refund." },
    { title: "Shipping time?", body: "Standard shipping is 3-5 business days. Expedited in 1-2 days." },
    { title: "Size guides?", body: "Each product page has sizing — contact us if unsure and we'll help." },
    { title: "Coupons & discounts?", body: "Coupons are applied at checkout. See terms for min spend." },
    { title: "Store hours?", body: "We are open Mon–Sat, 9am–6pm local time." },
    { title: "Bulk orders?", body: "Contact sales for bulk pricing and dedicated support." },
    { title: "Contact support?", body: "Use the 'Tell us' CTA to open a message, or raise a query in account settings." },
];

const STORAGE_KEY_POS = "faqwidget:pos";
const STORAGE_KEY_DESC = "faqwidget:descOpen";
const STORAGE_KEY_SELECTED = "faqwidget:selected";

function clamp(n: number, a: number, b: number) {
    return Math.max(a, Math.min(b, n));
}

/* Utility: get tabbable elements inside a container (nullable root allowed) */
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

export default function FAQWidget({ open, onClose, faqs = DEFAULT_FAQS }: { open: boolean; onClose: () => void; faqs?: FAQItem[] }) {
    // persisted selection
    const [selected, setSelected] = useState<number>(() => {
        if (typeof window === "undefined") return 0;
        try {
        const raw = localStorage.getItem(STORAGE_KEY_SELECTED);
        if (raw === null) return 0;
        const parsed = Number(JSON.parse(raw));
        return Number.isFinite(parsed) ? clamp(parsed, 0, Math.max(0, (faqs && faqs.length - 1) || 0)) : 0;
        } catch {
        return 0;
        }
    });

    // description visibility persisted; default to CLOSED on mount to avoid
    // flashing behavior where the description briefly replaces the cube ring.
    // We still persist user changes, but we don't auto-open the description on
    // widget mount — users must select a cube to open details.
    const [showDescription, _setShowDescription] = useState<boolean>(false);

    function setShowDescription(debugValue: boolean) {
        // Log the call and a short stack to identify the caller
        try {
            // keep log small but include stack
            const stack = new Error().stack || "";
            console.log("DEBUG setShowDescription called ->", debugValue, "\nstack:\n", stack.split("\n").slice(1, 8).join("\n"));
        } catch { /* ignore logging errors */ }
        _setShowDescription(debugValue);
    }

    const [allowDescription, setAllowDescription] = useState<boolean>(false);
    const [persistedDescPref, setPersistedDescPref] = useState<boolean>(false);

    // position persisted
    const [pos, setPos] = useState<{ x: number; y: number }>(() => {
        if (typeof window === "undefined") return { x: 0, y: 0 };
        try {
        const raw = localStorage.getItem(STORAGE_KEY_POS);
        if (!raw) return { x: 0, y: 0 };
        const parsed = JSON.parse(raw);
        if (typeof parsed?.x === "number" && typeof parsed?.y === "number") return parsed;
        } catch {
        /* ignore */
        }
        return { x: 0, y: 0 };
    });

    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetRef = useRef<HTMLDivElement | null>(null);
    const overlayPanelRef = useRef<HTMLDivElement | null>(null);
    const descRef = useRef<HTMLDivElement | null>(null);
    const prevFocusedRef = useRef<HTMLElement | null>(null);
    const descId = useId();
    const descTitleId = useId();
    const [showDebugCrosshair, setShowDebugCrosshair] = useState(false);
    const cubeRefs = useRef<Array<HTMLButtonElement | null>>([]);

    // numeric layout derived from computed CSS vars
    const [layout, setLayout] = useState<{ circle: number; cube: number; hit: number; desc: number; gap: number; radius: number; center: number }>({
        circle: 200,
        cube: 18,
        hit: 44,
        desc: 170,
        gap: 8,
        radius: 80,
        center: 100,
    });

    // small-screen detection (overlay if true)
    const [isSmallScreen, setIsSmallScreen] = useState<boolean>(() => {
        if (typeof window === "undefined") return false;
        return window.matchMedia("(max-width: 420px)").matches;
    });

    // in FAQWidget component top-level (after hooks)
    const lastOpenedAtRef = useRef<number | null>(null);

    useEffect(() => {
        // record open time when showDescription becomes true
        if (showDescription) lastOpenedAtRef.current = performance.now();
    }, [showDescription]);

    useEffect(() => {
        // when description closes, if it closed quickly after opening, log stack to help trace caller
        if (!showDescription) {
            const openedAt = lastOpenedAtRef.current;
            if (openedAt && performance.now() - openedAt < 150) {
                // brief close after open — log minimal stack trace
                console.warn("FAQDescription closed quickly after opening. selected:", selected);
                // log stack without console.trace spam
                try {
                    throw new Error("FAQDescription quick-close trace");
                } catch (err) {
                    // print a short stack
                    console.warn((err as Error).stack);
                }
            }
            lastOpenedAtRef.current = null;
        }
    }, [showDescription, selected]);

    // persist states
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY_SELECTED, JSON.stringify(selected));
        } catch {}
    }, [selected]);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY_DESC, JSON.stringify(showDescription));
        } catch {}
    }, [showDescription]);

    // Keep a small in-memory copy of the persisted preference so we can re-apply
    // it when the widget is opened without auto-showing the panel immediately.
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_DESC);
            setPersistedDescPref(raw === null ? false : JSON.parse(raw) === true);
        } catch {
            setPersistedDescPref(false);
        }
    }, []);

    // Keep the persisted copy in sync when the user changes the panel state.
    useEffect(() => setPersistedDescPref(showDescription), [showDescription]);

    useEffect(() => {
        try {
        localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(pos));
        } catch {}
    }, [pos]);

    // CSS variables applied inline to guarantee availability (shared helper)
    // `cssVarsInline` imported from `faqLayout.ts` is used below in the render.
    // Apply JS fallbacks for CSS variables synchronously if globals aren't present
    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const cs = getComputedStyle(el);
        // If the primary variable isn't set, apply inline fallbacks from cssVarsInline
        if (!cs.getPropertyValue("--circle") || cs.getPropertyValue("--circle").trim() === "") {
            Object.entries(cssVarsInline).forEach(([k, v]) => el.style.setProperty(k, v));
        }
    }, []);

    // read computed CSS variables and derive numeric layout values using shared helper
    useEffect(() => {
        function measure() {
            const values = readLayout(containerRef.current);
            if (!values) return;
            setLayout(values);
        }

        // initial read
        measure();

        // re-read on resize (debounced via RAF)
        let rafId: number | null = null;
        function onResize() {
            if (rafId != null) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                measure();
                rafId = null;
            });
        }
        window.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("resize", onResize);
            if (rafId != null) cancelAnimationFrame(rafId);
        };
    }, []);

    // watch matchMedia for small screens — properly typed listeners (no any)
    useEffect(() => {
        if (typeof window === "undefined") return;
        const mq = window.matchMedia("(max-width: 420px)");

        // modern handler
        const onChange = (ev: MediaQueryListEvent) => {
            setIsSmallScreen(Boolean(ev.matches));
        };

        // legacy wrapper for addListener which may pass a MediaQueryList (no event)
        const legacyHandler = (e: MediaQueryListEvent | MediaQueryList) => {
            const matches = "matches" in e ? e.matches : mq.matches;
            setIsSmallScreen(Boolean(matches));
        };

        if (typeof mq.addEventListener === "function") {
            mq.addEventListener("change", onChange);
            return () => {
                mq.removeEventListener("change", onChange);
            };
        } else if (typeof mq.addListener === "function") {
            mq.addListener(legacyHandler);
            return () => {
                mq.removeListener(legacyHandler);
            };
        }
        // fallback: no-op cleanup
        return () => {};
    }, []);

    // Helper: clamp currently intended pos so container remains at least partly visible
    function clampPosToViewport(x: number, y: number) {
        const el = containerRef.current;
        if (!el) return { x, y };

        // compute current bounding rect (it includes applied transform)
        const rect = el.getBoundingClientRect();

        // viewport margins to keep visible (in px)
        const minVisible = 12; // how many px of widget should remain visible
        const minLeft = minVisible;
        const maxRight = window.innerWidth - minVisible;
        const minTop = minVisible;
        const maxBottom = window.innerHeight - minVisible;

        // We'll compute adjustments needed to bring rect within [minLeft, maxRight] x [minTop, maxBottom]
        let deltaX = 0;
        if (rect.left < minLeft) deltaX = minLeft - rect.left;
        else if (rect.right > maxRight) deltaX = maxRight - rect.right;

        let deltaY = 0;
        if (rect.top < minTop) deltaY = minTop - rect.top;
        else if (rect.bottom > maxBottom) deltaY = maxBottom - rect.bottom;

        return { x: x + deltaX, y: y + deltaY };
    }

    // clamp persisted pos on mount and when viewport changes
    useEffect(() => {
        // Try to clamp immediately (in case persisted pos put the widget off-screen)
        // so the widget becomes visible as soon as it's mounted. If containerRef
        // isn't yet available we'll fall back to the RAF measured clamp below.
        try {
            const adjustedImmediate = clampPosToViewport(pos.x, pos.y);
            if (adjustedImmediate.x !== pos.x || adjustedImmediate.y !== pos.y) {
                setPos(adjustedImmediate);
            }
        } catch {
            // ignore
        }

        // also schedule a measured clamp after first paint to handle cases where
        // CSS variables or layout haven't been fully applied yet.
        const id = requestAnimationFrame(() => {
            const adjusted = clampPosToViewport(pos.x, pos.y);
            if (adjusted.x !== pos.x || adjusted.y !== pos.y) {
                setPos(adjusted);
            }
        });

        // also clamp on resize
        function onResize() {
            const adjusted = clampPosToViewport(pos.x, pos.y);
            if (adjusted.x !== pos.x || adjusted.y !== pos.y) {
                setPos(adjusted);
            }
        }
        window.addEventListener("resize", onResize);
        return () => {
            cancelAnimationFrame(id);
            window.removeEventListener("resize", onResize);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // When the inline description is opened on large screens, move focus into it
    // (prefer the first focusable element, typically the close button) so screen
    // readers get a clear context change. Save the previously focused element and
    // restore focus when the panel closes to preserve keyboard user's context.
    useEffect(() => {
        if (isSmallScreen) return;

        if (showDescription) {
            prevFocusedRef.current = (document.activeElement as HTMLElement) || null;
            const panel = descRef.current;
            if (!panel) return;

            const id = requestAnimationFrame(() => {
                const tabbables = getTabbableElements(panel);
                const target = (tabbables.length ? tabbables[0] : panel) as HTMLElement;
                try {
                    target.focus();
                } catch {
                    /* ignore */
                }
            });

            return () => cancelAnimationFrame(id);
        } else {
            // closed: restore focus to previously focused element (or fallback to selected cube)
            const prev = prevFocusedRef.current;
            try {
                if (prev && document.contains(prev)) {
                prev.focus();
                } else {
                    cubeRefs.current[selected]?.focus();
                }
            } catch {
                /* ignore */
            }
            prevFocusedRef.current = null;
        }
        // include `selected` so fallback focuses the right cube after close
    }, [showDescription, isSmallScreen, selected]);

    // Crosshair is developer-only aid. Enable via URL `?faqDebug=1` or
    // `localStorage.setItem('faqwidget:debug','1')` to inspect alignment briefly.
    useEffect(() => {
        try {
            if (typeof window === "undefined") return;
            const params = new URLSearchParams(window.location.search || "");
            const paramOn = params.get("faqDebug") === "1";
            const lsOn = localStorage.getItem("faqwidget:debug") === "1";
            setShowDebugCrosshair(Boolean(paramOn || lsOn));
        } catch {
            /* ignore */
        }
    }, []);

    // Close the whole widget with Escape when appropriate. We avoid closing the widget
    // when a small-screen description overlay is open so that its own handler can
    // manage the Escape behavior and close the overlay first.
    useEffect(() => {
        if (!open) return;

        function onKey(e: KeyboardEvent) {
            if (e.key !== "Escape") return;
            // If the small-screen description overlay is open, don't close the widget;
            // the overlay's handler will manage Escape to close the description first.
            if (isSmallScreen && showDescription) return;
            e.preventDefault();
            onClose();
        }

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, isSmallScreen, showDescription, onClose]);

    // When the widget is opened on small screens, avoid auto-opening the
    // description overlay even if persisted setting says it's open. This prevents
    // the behavior where the cubes flash briefly then the overlay replaces them
    // as the component mounts. Users can still open the description by selecting
    // a cube.
    useEffect(() => { 
        // Only run when the widget is opened (and on screen-size change). 
        // This prevents auto-closing when the user explicitly opens the description. 
        if (!open) return; 
        if (isSmallScreen) { 
            // Ensure the widget doesn't auto-open the description 
            // when first mounting on a small screen. 
            setShowDescription(false); 
        } 
    }, [open, isSmallScreen]);

    // Ensure the widget opens showing the cube ring by default; some persisted
    // state could leave the description open which causes the cubes to flash then
    // disappear on mount. Force the description closed when the widget is opened
    // so users see the cubes first and can select a cube to open the detail.
    useEffect(() => {
        if (!open) return;
        setShowDescription(false);
        // Restore allowDescription from the saved preference so the user's last
        // choice is respected across sessions, but don't auto-open the panel to
        // avoid flashes; user still needs to select a cube to reveal content.
        setAllowDescription(Boolean(persistedDescPref));
    }, [open, persistedDescPref]);

    if (!open) return null;

    // fallback portal root (use document.body if portal missing)
    const mountNode: Element | null = typeof window !== "undefined" ? document.getElementById("portal-root") ?? document.body : null;
    if (!mountNode) return null;
    const mountEl: Element = mountNode as Element;

    // render cube ring via FAQRing component

    // description rendered by FAQDescription component

    return ReactDOM.createPortal(
        <>
            <Draggable pos={pos} onSetPos={setPos} clamp={(x, y) => clampPosToViewport(x, y)} containerRef={containerRef} className={styles.container}>
                <div ref={widgetRef} className={styles.widget} role="dialog" aria-label="FAQ widget">
                    <Circle layout={layout} showDebugCrosshair={showDebugCrosshair} onClose={onClose}>
                        <FAQRing faqs={faqs} selected={selected} setSelected={setSelected} setShowDescription={_setShowDescription} setAllowDescription={setAllowDescription} layout={layout} cubeRefs={cubeRefs} descId={descId} />
                    </Circle>

                    <FAQDescription
                        faqs={faqs}
                        selected={selected}
                        showDescription={showDescription}
                        allowDescription={allowDescription}
                        isSmallScreen={isSmallScreen}
                        overlayPanelRef={overlayPanelRef}
                        descRef={descRef}
                        descId={descId}
                        descTitleId={descTitleId}
                        setShowDescription={setShowDescription}
                        setAllowDescription={setAllowDescription}
                    />
                </div>
            </Draggable>
        </>,
        mountEl
    );
}
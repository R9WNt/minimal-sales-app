import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

/**
 * FAQWidget
 * - 8 radial slots, click slot to show description in a card.
 * - Draggable via Pointer Events: drag anywhere on the header/top area.
 * - Toggle: clicking center button will close the widget. Parent may also toggle it.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - faqs: { title: string; body: string }[]  (if omitted, sample data used)
 *
 * The widget mounts into #portal-root if present, otherwise renders inline.
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

export default function FAQWidget({
  open,
  onClose,
  faqs = DEFAULT_FAQS,
}: {
  open: boolean;
  onClose: () => void;
  faqs?: FAQItem[];
}) {
  const [selected, setSelected] = useState<number | null>(0);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // translation applied to fixed container
  const dragRef = useRef<HTMLDivElement | null>(null);
  const pointerStart = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    if (!open) {
      setSelected(0);
    }
  }, [open]);

  // Drag handlers via Pointer Events
  useEffect(() => {
    const el = dragRef.current;
    if (!el) return;

    function onPointerDown(e: PointerEvent) {
      // only left button or touch
      if ((e as PointerEvent).button && (e as PointerEvent).button !== 0) return;
      el.setPointerCapture(e.pointerId);
      pointerStart.current = {
        sx: e.clientX,
        sy: e.clientY,
        ox: pos.x,
        oy: pos.y,
      };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp, { once: true });
    }
    function onPointerMove(e: PointerEvent) {
      if (!pointerStart.current) return;
      const dx = e.clientX - pointerStart.current.sx;
      const dy = e.clientY - pointerStart.current.sy;
      setPos({
        x: pointerStart.current.ox + dx,
        y: pointerStart.current.oy + dy,
      });
    }
    function onPointerUp(e: PointerEvent) {
      if (!pointerStart.current) return;
      // release capture
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {}
      pointerStart.current = null;
      window.removeEventListener("pointermove", onPointerMove);
      // pointerup removed due to once:true
    }

    el.addEventListener("pointerdown", onPointerDown);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
    };
  }, [pos.x, pos.y]);

  if (!open) return null;

  const container = typeof window !== "undefined" ? document.getElementById("portal-root") : null;

  const widget = (
    <div
      className="fixed bottom-24 right-6 z-modal"
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        touchAction: "none",
      }}
      aria-hidden={false}
    >
      <div
        ref={dragRef}
        className="relative w-[320px] max-w-xs bg-transparent select-none"
        role="dialog"
        aria-label="FAQ widget"
      >
        {/* Circle + blocks + center */}
        <div className="relative w-[260px] h-[260px] mx-auto bg-transparent">
          {/* Radial ring (visual) */}
          <div className="absolute inset-0 rounded-full bg-white/20 backdrop-blur-sm shadow-md" style={{ clipPath: "circle(50% at 50% 50%)" }} />

          {/* 8 floating blocks around circle */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2 - Math.PI / 2; // start at top
            const radius = 88; // px from center
            const cx = 130 + Math.cos(angle) * radius; // center x (container 260 /2 =130)
            const cy = 130 + Math.sin(angle) * radius;
            const item = faqs[i] ?? { title: `FAQ ${i + 1}`, body: "" };
            const isActive = selected === i;
            return (
              <button
                key={i}
                onClick={() => setSelected(i)}
                aria-pressed={isActive}
                aria-label={item.title}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-lg flex items-center justify-center transition-transform shadow-sm focus:outline-none ${
                  isActive ? "scale-105 ring-2 ring-indigo-300 bg-white" : "bg-white/95 hover:scale-105"
                }`}
                style={{ left: cx, top: cy }}
              >
                {/* small decorative inner box */}
                <div className={`w-6 h-6 rounded ${isActive ? "bg-indigo-600" : "bg-slate-200"}`} />
              </button>
            );
          })}

          {/* Center close/toggle control */}
          <button
            onClick={() => onClose()}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg text-slate-700 hover:scale-105"
            aria-label="Close FAQ widget"
          >
            ×
          </button>
        </div>

        {/* Description card to the right of the circle */}
        <div className="absolute top-0 left-[calc(100%_+_12px)] w-[260px] bg-white rounded-lg shadow-lg p-3">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-800 truncate">{faqs[selected ?? 0]?.title}</div>
              <div className="mt-1 text-xs text-slate-600 leading-tight wrap-break-word">
                {faqs[selected ?? 0]?.body}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (container) return ReactDOM.createPortal(widget, container);
  return widget;
}
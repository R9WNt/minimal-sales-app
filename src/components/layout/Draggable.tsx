import React, { useEffect, useRef } from "react";

type Pos = { x: number; y: number };

type DraggableProps = {
  pos: Pos;
  onSetPos: (p: Pos) => void;
  clamp?: (x: number, y: number) => Pos;
  className?: string;
  children?: React.ReactNode;
  containerRef?: React.RefObject<HTMLDivElement | null>;
};

export default function Draggable({ pos, onSetPos, clamp, className, children, containerRef }: DraggableProps) {
  type PointerSnapshot = {
    sx: number;
    sy: number;
    ox: number;
    oy: number;
    latestX: number;
    latestY: number;
    captureTarget: Element | null;
  };

  const rootRef = useRef<HTMLDivElement | null>(null);
  const pointerStart = useRef<PointerSnapshot | null>(null);
  const posRef = useRef(pos);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      pointerStart.current = null;
      window.removeEventListener("pointermove", onGlobalMove);
      window.removeEventListener("pointerup", onGlobalUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onGlobalMove(e: Event) {
    const ev = e as PointerEvent;
    const start = pointerStart.current;
    if (!start) return;
    const dx = ev.clientX - start.sx;
    const dy = ev.clientY - start.sy;
    start.latestX = start.ox + dx;
    start.latestY = start.oy + dy;

    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const el = rootRef.current;
        if (!el || !pointerStart.current) return;
        el.style.transform = `translate3d(${pointerStart.current.latestX}px, ${pointerStart.current.latestY}px, 0)`;
      });
    }
  }

  function onGlobalUp(e: Event) {
    const ev = e as PointerEvent;
    const start = pointerStart.current;
    if (!start) return;

    const target = start.captureTarget as (Element & { releasePointerCapture?: (id: number) => void }) | null;
    if (target && typeof target.releasePointerCapture === "function") {
      try {
        target.releasePointerCapture(ev.pointerId);
      } catch {
        /* ignore */
      }
    }

    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const finalX = typeof start.latestX === "number" ? start.latestX : start.ox;
    const finalY = typeof start.latestY === "number" ? start.latestY : start.oy;

    const adjusted = clamp ? clamp(finalX, finalY) : { x: finalX, y: finalY };
    onSetPos({ x: adjusted.x, y: adjusted.y });

    pointerStart.current = null;
    window.removeEventListener("pointermove", onGlobalMove);
    window.removeEventListener("pointerup", onGlobalUp);
  }

  function startDragFromReactEvent(e: React.PointerEvent<HTMLElement>) {
    const targetEl = e.target as Element | null;
    if (targetEl && targetEl.closest("button, a, [data-no-drag]")) return;
    if (typeof e.button === "number" && e.button !== 0) return;

    const captureElem = (e.currentTarget as Element) as Element & { setPointerCapture?: (id: number) => void };
    try {
      captureElem.setPointerCapture?.((e.nativeEvent as PointerEvent).pointerId);
    } catch {
      /* ignore */
    }

    pointerStart.current = {
      sx: e.clientX,
      sy: e.clientY,
      ox: posRef.current.x,
      oy: posRef.current.y,
      latestX: posRef.current.x,
      latestY: posRef.current.y,
      captureTarget: captureElem,
    };

    window.addEventListener("pointermove", onGlobalMove);
    window.addEventListener("pointerup", onGlobalUp);

    e.preventDefault();
  }

  return (
    <div
      ref={(el) => {
        rootRef.current = el;
        if (containerRef && typeof containerRef === "object") (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }}
      onPointerDown={startDragFromReactEvent}
      className={className}
      style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
    >
      {children}
    </div>
  );
}

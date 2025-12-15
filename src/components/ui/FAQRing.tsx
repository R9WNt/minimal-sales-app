import React from "react";
import Cube from "../layout/Cube";
import styles from "./FAQWidget.module.css";

export type FAQItem = { title: string; body: string };

type Props = {
  faqs: FAQItem[];
  selected: number;
  setSelected: (i: number) => void;
  setShowDescription: React.Dispatch<React.SetStateAction<boolean>>;
  setAllowDescription: React.Dispatch<React.SetStateAction<boolean>>;
  layout: { center: number; radius: number; cube: number };
  cubeRefs: React.MutableRefObject<Array<HTMLButtonElement | null>>;
  descId?: string;
};

export default function FAQRing({ faqs, selected, setSelected, setShowDescription, setAllowDescription, layout, cubeRefs, descId }: Props) {
  const total = 8;

  function onCubeKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, i: number) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = (i + 1) % total;
      setSelected(next);
      cubeRefs.current[next]?.focus();
      return;
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (i - 1 + total) % total;
      setSelected(prev);
      cubeRefs.current[prev]?.focus();
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      setSelected(0);
      cubeRefs.current[0]?.focus();
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      const last = Math.max(0, total - 1);
      setSelected(last);
      cubeRefs.current[last]?.focus();
      return;
    }
  }

  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const cx = layout.center + Math.cos(angle) * layout.radius;
        const cy = layout.center + Math.sin(angle) * layout.radius;
        const item = faqs[i] ?? { title: `FAQ ${i + 1}`, body: "" };
        const isActive = selected === i;

        return (
          <button
            key={i}
            ref={(el) => {
              cubeRefs.current[i] = el;
            }}
            aria-controls={descId ?? ""}
            onKeyDown={(e) => onCubeKeyDown(e, i)}
            onClick={() => {
              if (selected === i) {
                setAllowDescription(true);
                setShowDescription((s) => !s);
              } else {
                setSelected(i);
                setAllowDescription(true);
                setShowDescription(true);
              }
            }}
            aria-pressed={isActive}
            aria-label={item.title}
            data-no-drag
            title={item.title}
            className={styles.cubeBtn}
            style={{
              left: cx,
              top: cy,
            }}
          >
            <div className={styles.cubeInner}>
              <Cube size={Math.round(layout.cube)} color={isActive ? "#10b981" : "#059669"} active={isActive} title={item.title} />
            </div>
          </button>
        );
      })}
    </>
  );
}

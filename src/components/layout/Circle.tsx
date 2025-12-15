import React from "react";
import styles from "../ui/FAQWidget.module.css";

type Layout = { center: number; radius?: number };

type Props = {
  layout: Layout;
  showDebugCrosshair?: boolean;
  onClose: () => void;
  children?: React.ReactNode;
};

export default function Circle({ layout, showDebugCrosshair = false, onClose, children }: Props) {
  return (
    <div className={styles.circle}>
      <div className={styles.circleBg} aria-hidden />
      {showDebugCrosshair ? <div className={styles.crosshair} aria-hidden /> : null}
      {children}

      <button
        onClick={() => onClose()}
        aria-label="Close widget"
        data-no-drag
        className={styles.centerBtn}
        title="Close widget"
        tabIndex={-1}
        style={{ left: layout.center, top: layout.center }}
      />
    </div>
  );
}

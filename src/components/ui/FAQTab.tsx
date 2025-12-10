import React from "react";
import styles from "./FAQTab.module.css";

export type FAQTabProps = {
  onClick?: () => void;
  placeAt?: "bottom" | "top" | string;
  className?: string;
};

const leftBlocks = ["w2h2", "w1h1", "w2h1", "w1h2"];
const rightBlocks = [...leftBlocks].reverse();

export function FAQTab({ onClick, placeAt = "bottom", className = "" }: FAQTabProps) {
  return (
    <div className={`${styles.faqTabWrap} ${className}`} data-place={placeAt}>
      <div className={styles.groupLeft} aria-hidden>
        <div className={styles.grid}>
          {leftBlocks.map((s, i) => (
            <div key={i} className={`${styles.block} ${styles[s]}`} />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onClick}
        className={styles.faqTab}
        aria-label="FAQ"
      >
        FAQ
      </button>

      <div className={styles.groupRight} aria-hidden>
        <div className={styles.grid}>
          {rightBlocks.map((s, i) => (
            <div key={i} className={`${styles.block} ${styles[s]}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default FAQTab;
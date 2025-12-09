/**
 * Walk up the DOM from an element and report ancestors that might clip or create stacking contexts
 * Returns an array of strings describing each problematic ancestor.
 */
export function detectClippingAncestors(el: Element | null) {
  if (!el) return [];
  const problems: string[] = [];
  let cur: Element | null = el.parentElement;
  while (cur) {
    const cs = getComputedStyle(cur);
    const overflow = cs.overflow + "," + cs.overflowX + "," + cs.overflowY;
    const transform = cs.transform;
    const willChange = cs.willChange;
    const filter = cs.filter;
    const position = cs.position;
    const zIndex = cs.zIndex;

    if (overflow.includes("hidden") || overflow.includes("clip")) {
      problems.push(`ancestor ${cur.tagName}.${cur.className || "(no-class)"} has overflow=${overflow}`);
    }
    // transforms (even transform: translateZ(0)) create stacking contexts & can clip positioned children
    if (transform && transform !== "none") {
      problems.push(`ancestor ${cur.tagName}.${cur.className || "(no-class)"} has transform=${transform}`);
    }
    if (filter && filter !== "none") {
      problems.push(`ancestor ${cur.tagName}.${cur.className || "(no-class)"} has filter=${filter}`);
    }
    if (willChange && willChange !== "auto") {
      problems.push(`ancestor ${cur.tagName}.${cur.className || "(no-class)"} has will-change=${willChange}`);
    }
    // position + z-index may create stacking contexts
    if ((position === "relative" || position === "absolute" || position === "fixed") && zIndex && zIndex !== "auto") {
      problems.push(`ancestor ${cur.tagName}.${cur.className || "(no-class)"} has position=${position} z-index=${zIndex}`);
    }

    cur = cur.parentElement;
  }
  return problems;
}
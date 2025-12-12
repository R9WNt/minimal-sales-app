/**
 * Conservative codemod to replace specific numeric z-index usages with semantic classes/vars.
 *
 * Run:
 *   node scripts/replace-zindex.js
 *
 * It edits only a known set of files (page.tsx, DraggableSessionBox.tsx, globals.css).
 * Review changes with git diff and test.
 */

const fs = require("fs");
const path = require("path");

const repoRoot = process.cwd();

const filesToEdit = [
  path.join(repoRoot, "src", "app", "globals.css"),
  path.join(repoRoot, "src", "app", "page.tsx"),
  path.join(repoRoot, "src", "components", "ui", "DraggableSessionBox.tsx"),
];

// helper
function read(f) {
  try { return fs.readFileSync(f, "utf8"); } catch (e) { console.warn("read fail", f); return null; }
}
function write(f, content) {
  try { fs.writeFileSync(f, content, "utf8"); console.log("Updated", f); } catch (e) { console.error("write fail", f, e); }
}

/* 1) Replace FAQ numeric z-index in globals.css */
(function updateGlobals() {
  const f = filesToEdit[0];
  const src = read(f);
  if (!src) return;

  let out = src;
  out = out.replace(/\.faq-tab-text\s*\{([^}]*?)z-index:\s*\d+([^}]*?)\}/m, (m) =>
    m.replace(/z-index:\s*\d+/, 'z-index: var(--z-faq-text)')
  );
  out = out.replace(/\.faq-tab-glint\s*\{([^}]*?)z-index:\s*\d+([^}]*?)\}/m, (m) =>
    m.replace(/z-index:\s*\d+/, 'z-index: var(--z-faq-glint)')
  );
  out = out.replace(/\.faq-tab-blocks\s*\{([^}]*?)z-index:\s*\d+([^}]*?)\}/m, (m) =>
    m.replace(/z-index:\s*\d+/, 'z-index: var(--z-faq-blocks)')
  );
  out = out.replace(/\.faq-tab::before\s*\{([^}]*?)z-index:\s*\d+([^}]*?)\}/m, (m) =>
    m.replace(/z-index:\s*\d+/, 'z-index: var(--z-faq-before)')
  );

  if (out !== src) write(f, out); else console.log("globals.css: no faq patterns matched");
})();

/* 2) Update page.tsx: replace modal/backdrop and z-50 defaults */
/* Conservative: replace 'fixed inset-0 z-50' -> 'fixed inset-0 z-backdrop'
   and replace other ' z-50' occurrences -> ' z-pin' by default
   Also replace bottom-6 right-6 container's z-pin -> z-fab
*/
(function updatePage() {
  const f = filesToEdit[1];
  const src = read(f);
  if (!src) return;
  let out = src;

  out = out.replace(/fixed\s+inset-0\s+z-50/g, "fixed inset-0 z-backdrop");
  out = out.replace(/(\s)z-50(\s|")/g, "$1z-pin$2");
  out = out.replace(/(absolute\s+bottom-6[\s\S]{0,120}?right-6\s+)(z-pin|z-50)/g, "$1z-fab");

  if (out !== src) write(f, out); else console.log("page.tsx: no replacements applied");
})();

/* 3) Update DraggableSessionBox.tsx: z-50 -> z-pin and add draggable-raise class */
(function updateDraggable() {
  const f = filesToEdit[2];
  const src = read(f);
  if (!src) return;
  let out = src;

  out = out.replace(/\bz-50\b/g, "z-pin");
  // ensure draggable-raise class present
  out = out.replace(/className=(["'`])([^]*?)\1/, (m, q, inner) => {
    if (inner.includes("draggable-raise")) return `className=${q}${inner}${q}`;
    return `className=${q}${inner.replace(/\s+$/, '')} draggable-raise${q}`;
  });

  if (out !== src) write(f, out); else console.log("DraggableSessionBox.tsx: no replacements applied");
})();

console.log("Codemod done. Review changes with `git diff` and test.");
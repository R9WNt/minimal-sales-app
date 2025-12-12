// scripts/replace-zindex.mjs
// Run: node scripts/replace-zindex.mjs
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const repoRoot = process.cwd();

const filesToEdit = [
  path.join(repoRoot, 'src', 'app', 'globals.css'),
  path.join(repoRoot, 'src', 'app', 'page.tsx'),
  path.join(repoRoot, 'src', 'components', 'ui', 'DraggableSessionBox.tsx'),
];

async function safeRead(filePath) {
  try {
    return await readFile(filePath, 'utf8');
  } catch (err) {
    console.warn(`Unable to read ${filePath}: ${err.message}`);
    return null;
  }
}

async function safeWrite(filePath, content) {
  try {
    await writeFile(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  } catch (err) {
    console.error(`Failed to write ${filePath}: ${err.message}`);
  }
}

async function run() {
  // 1) globals.css - replace numeric FAQ z-index with var(...)
  const globalsPath = filesToEdit[0];
  const globalsSrc = await safeRead(globalsPath);
  if (globalsSrc) {
    let out = globalsSrc;
    out = out.replace(/(\.faq-tab-text\s*\{[^}]*?)z-index:\s*\d+([^}]*?\})/s, (m, a, b) => `${a}z-index: var(--z-faq-text)${b}`);
    out = out.replace(/(\.faq-tab-glint\s*\{[^}]*?)z-index:\s*\d+([^}]*?\})/s, (m, a, b) => `${a}z-index: var(--z-faq-glint)${b}`);
    out = out.replace(/(\.faq-tab-blocks\s*\{[^}]*?)z-index:\s*\d+([^}]*?\})/s, (m, a, b) => `${a}z-index: var(--z-faq-blocks)${b}`);
    out = out.replace(/(\.faq-tab::before\s*\{[^}]*?)z-index:\s*\d+([^}]*?\})/s, (m, a, b) => `${a}z-index: var(--z-faq-before)${b}`);

    if (out !== globalsSrc) {
      await safeWrite(globalsPath, out);
    } else {
      console.log("globals.css: No FAQ z-index patterns replaced (pattern mismatch possible).");
    }
  }

  // 2) page.tsx - replace modal/backdrop and conservative z-50 -> z-pin, then bottom floats -> z-fab
  const pagePath = filesToEdit[1];
  const pageSrc = await safeRead(pagePath);
  if (pageSrc) {
    let out = pageSrc;
    out = out.replace(/fixed\s+inset-0\s+z-50/g, "fixed inset-0 z-backdrop");
    out = out.replace(/(\s)z-50(\s|")/g, "$1z-pin$2");
    out = out.replace(/(absolute\s+bottom-6[\s\S]{0,160}?right-6\s+)(z-pin|z-50)/g, "$1z-fab");

    if (out !== pageSrc) {
      await safeWrite(pagePath, out);
    } else {
      console.log("page.tsx: No replacements applied.");
    }
  }

  // 3) DraggableSessionBox.tsx - replace z-50 with z-pin and ensure draggable-raise class is present
  const dragPath = filesToEdit[2];
  const dragSrc = await safeRead(dragPath);
  if (dragSrc) {
    let out = dragSrc;
    out = out.replace(/\bz-50\b/g, "z-pin");
    // add draggable-raise if not present in className
    out = out.replace(/className=(["'`])([^]*?)\1/, (m, q, inner) => {
      if (inner.includes("draggable-raise")) return `className=${q}${inner}${q}`;
      return `className=${q}${inner.replace(/\s+$/, '')} draggable-raise${q}`;
    });

    if (out !== dragSrc) {
      await safeWrite(dragPath, out);
    } else {
      console.log("DraggableSessionBox.tsx: No changes applied.");
    }
  }

  console.log("replace-zindex.mjs completed. Review changes with `git diff`.");
}

run().catch((err) => {
  console.error("Codemod error:", err);
  process.exit(1);
});
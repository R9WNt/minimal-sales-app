// Note: these tokens are promoted to global theme (src/app/globals.css :root)
// `cssVarsInline` remains as a JS fallback for environments that lack the global vars.
export const cssVarsInline: Record<string, string> = {
  "--gap": "8px",
  "--cube": "clamp(14px, 2.2vw, 22px)",
  "--hit": "44px",
  "--circle": "clamp(160px, calc(var(--cube) * 10), 320px)",
  "--desc": "clamp(140px, calc(var(--circle) * 0.75), 260px)",
  "--widget-max-width": "calc(var(--circle) + var(--desc) + var(--gap) + 32px)",
};

export type LayoutValues = { circle: number; cube: number; hit: number; desc: number; gap: number; radius: number; center: number };

// Reads computed CSS variables from an element and returns numeric layout values
export function readLayout(el: HTMLElement | null): LayoutValues | null {
  if (!el) return null;
  const cs = getComputedStyle(el);
  const readPx = (name: string, fallback = "0px") => {
    const v = cs.getPropertyValue(name) || fallback;
    return parseFloat(v.trim()) || 0;
  };

  let circle = readPx("--circle", "200px");
  let cube = readPx("--cube", "18px");
  let desc = readPx("--desc", "170px");
  const gap = readPx("--gap", "8px");
  const declaredHit = readPx("--hit", "44px");

  // Enforce sensible minimums so cubes remain visible if CSS vars collapse
  cube = Math.max(12, cube);
  circle = Math.max(120, circle);
  desc = Math.max(120, desc);
  const hit = Math.max(44, declaredHit, cube);

  const center = circle / 2;
  const minRadius = Math.max(12, cube * 1.6);
  const radius = Math.max(minRadius, center - cube * 1.1);

  return { circle, cube, hit, desc, gap, radius, center };
}

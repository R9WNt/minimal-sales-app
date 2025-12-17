export function isNoCloseTarget(target: EventTarget | null): boolean {
  // Return true if the event target or any ancestor has data-no-close attribute.
  try {
    if (!(target instanceof Element)) return false;
    return target.closest && target.closest("[data-no-close]") !== null;
  } catch {
    return false;
  }
}
/** Shared scroll helpers for the app shell `<main>` container. */

export function getAppMainScrollElement(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector("main");
}

export function getAppMainScrollTop(): number {
  return getAppMainScrollElement()?.scrollTop ?? 0;
}

export function setAppMainScrollTop(scrollY: number): void {
  const main = getAppMainScrollElement();
  if (main) main.scrollTop = Math.max(0, scrollY);
}

export function restoreAppMainScrollTop(scrollY: number): void {
  if (typeof window === "undefined") return;
  requestAnimationFrame(() => {
    setAppMainScrollTop(scrollY);
  });
}

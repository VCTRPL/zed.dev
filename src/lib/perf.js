// "Lite" mode: weaker devices (or ?lite in the URL) get fewer particles,
// no live blur and no bloom. Canvases can also demote the page at runtime
// when they notice the frame rate dropping.

const nav = typeof navigator !== "undefined" ? navigator : {};
const forced = typeof location !== "undefined" && /[?&]lite\b/.test(location.search);

export const perf = {
  lite:
    forced ||
    (nav.hardwareConcurrency ?? 8) <= 4 ||
    (nav.deviceMemory ?? 8) <= 4 ||
    !!nav.connection?.saveData,
};

const listeners = new Set();

export function onLite(fn) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

export function goLite() {
  if (perf.lite) return;
  perf.lite = true;
  document.documentElement.classList.add("lite");
  listeners.forEach((fn) => fn());
}

if (perf.lite && typeof document !== "undefined") {
  document.documentElement.classList.add("lite");
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

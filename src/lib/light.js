// A light that glass catches: its direction follows the pointer on desktop
// and the tilt of the phone where the browser reports it without asking.
// Elements marked [data-light] get --lx / --ly (-1..1, where the light comes
// from, relative to the element) and --la (the same as an angle).
const els = new Set();
let px = -0.45; // default light: from the upper left
let py = -0.75;
let mode = "rest"; // "pointer" | "tilt" | "rest"
let raf = 0;

function flush() {
  raf = 0;
  for (const el of els) {
    let lx = px;
    let ly = py;
    if (mode === "pointer") {
      const r = el.getBoundingClientRect();
      // direction from the element toward the pointer, softened with distance
      const dx = px - (r.left + r.width / 2);
      const dy = py - (r.top + r.height / 2);
      const k = 1 / Math.max(Math.hypot(dx, dy), 420);
      lx = Math.max(-1, Math.min(1, dx * k * 1.4));
      ly = Math.max(-1, Math.min(1, dy * k * 1.4));
    }
    el.style.setProperty("--lx", lx.toFixed(3));
    el.style.setProperty("--ly", ly.toFixed(3));
    el.style.setProperty("--la", ((Math.atan2(ly, lx) * 180) / Math.PI + 90).toFixed(1) + "deg");
  }
}
const schedule = () => {
  raf ||= requestAnimationFrame(flush);
};

let started = false;
function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType === "touch") return;
      mode = "pointer";
      px = e.clientX;
      py = e.clientY;
      schedule();
    },
    { passive: true },
  );
  window.addEventListener("scroll", () => mode === "pointer" && schedule(), { passive: true });
  // Android Chrome reports tilt without a permission prompt; iOS asks, so it is skipped there
  if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission !== "function") {
    window.addEventListener(
      "deviceorientation",
      (e) => {
        if (mode === "pointer" || e.gamma == null) return;
        mode = "tilt";
        px = Math.max(-1, Math.min(1, e.gamma / 35));
        py = Math.max(-1, Math.min(1, (e.beta - 50) / 35));
        schedule();
      },
      { passive: true },
    );
  }
}

export function catchLight(el) {
  if (!el) return () => {};
  start();
  els.add(el);
  schedule();
  return () => els.delete(el);
}

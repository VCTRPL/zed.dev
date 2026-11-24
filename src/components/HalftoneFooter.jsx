import { useEffect, useRef } from "react";
import "./halftone-footer.css";

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || "").trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// dot radius from the coverage of its cell
const dotRadius = (coverage, gap) => Math.sqrt(Math.min(1, Math.max(0, coverage))) * gap * 0.56;

// spring each dot back home, pushed away by the pointer
function physics(x, y, vx, vy, hx, hy, px, py, radius) {
  const dx = x - px;
  const dy = y - py;
  const d2 = dx * dx + dy * dy;
  if (radius > 0 && d2 < radius * radius) {
    const d = Math.sqrt(d2) + 0.001;
    const f = (1 - d / radius) * 2.6;
    vx += (dx / d) * f;
    vy += (dy / d) * f;
  }
  vx = (vx + (hx - x) * 0.05) * 0.84;
  vy = (vy + (hy - y) * 0.05) * 0.84;
  return [x + vx, y + vy, vx, vy];
}

/**
 * Footer whose background is a giant wordmark drawn in halftone dots.
 * The dots scatter around the pointer and ripple outward on click.
 */
export default function HalftoneFooter({
  wordmark = "ZED",
  label,
  meta,
  columns = [],
  backToTopLabel = "Voltar ao topo ↑",
  palette = { background: "#0b0d12", ink: "#eef1f6", warm: "#ffa463" },
  dotGap = 6,
  radius = 80,
  crop = 0.2,
  grain = 0.5,
  fontFamily = '"Instrument Sans", "Helvetica Neue", Arial, sans-serif',
  fontWeight = 700,
  monoFamily = '"DM Mono", ui-monospace, Menlo, monospace',
  height = "620px",
}) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const key = [wordmark, dotGap, crop, grain, fontFamily, fontWeight, palette.background, palette.ink, palette.warm].join("|");

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let px = -1e5;
    let py = -1e5;
    let raf = 0;
    let visible = true;
    let moving = true;
    let ripple = { x: 0, y: 0, t: -1 };
    let dots = new Float32Array(0); // x, y, vx, vy, homeX, homeY, r
    let count = 0;
    let noise = null;
    const ink = hexToRgb(palette.ink) || [233, 228, 218];
    const warm = hexToRgb(palette.warm) || [233, 118, 43];

    const layout = () => {
      const r = root.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      // rasterise the wordmark, then sample it on a grid
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const o = off.getContext("2d", { willReadFrequently: true });
      if (!o) return;
      o.font = `${fontWeight} 100px ${fontFamily}`;
      const text = wordmark || " ";
      const size = (o.measureText(text).width > 0 ? (w * 1.02) / o.measureText(text).width : 0) * 100;
      o.font = `${fontWeight} ${size}px ${fontFamily}`;
      const m = o.measureText(text);
      const ascent = m.actualBoundingBoxAscent || size * 0.72;
      o.fillStyle = "#000";
      o.textBaseline = "alphabetic";
      o.fillText(text, (w - m.width) / 2, h + ascent * Math.max(0, Math.min(0.6, crop)));
      const pixels = o.getImageData(0, 0, w, h).data;

      const gap = Math.max(3, dotGap);
      const cols = Math.ceil(w / gap);
      const rows = Math.ceil(h / gap);
      const list = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          let sum = 0;
          for (let sy = 0; sy < 3; sy++) {
            for (let sx = 0; sx < 3; sx++) {
              const x = Math.min(w - 1, Math.floor(col * gap + ((sx + 0.5) * gap) / 3));
              const y = Math.min(h - 1, Math.floor(row * gap + ((sy + 0.5) * gap) / 3));
              sum += pixels[(y * w + x) * 4 + 3];
            }
          }
          const coverage = sum / (9 * 255);
          if (coverage < 0.06) continue;
          const cx = col * gap + gap / 2;
          const cy = row * gap + gap / 2;
          list.push(cx, cy, 0, 0, cx, cy, dotRadius(coverage, gap));
        }
      }
      dots = new Float32Array(list);
      count = list.length / 7;

      noise = document.createElement("canvas");
      noise.width = noise.height = 256;
      const n = noise.getContext("2d");
      if (n) {
        const img = n.createImageData(256, 256);
        for (let i = 0; i < img.data.length; i += 4) {
          const v = Math.random() * 255;
          img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
          img.data[i + 3] = Math.random() < 0.5 ? 0 : 255;
        }
        n.putImageData(img, 0, 0);
      }
      moving = true;
    };

    const draw = (now) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = palette.background;
      ctx.fillRect(0, 0, w, h);
      const pull = still ? 0 : radius;
      const age = ripple.t < 0 ? 1e9 : now - ripple.t;
      const front = age * 0.9;
      let active = false;

      for (let i = 0; i < count; i++) {
        const o = i * 7;
        let x = dots[o];
        let y = dots[o + 1];
        let vx = dots[o + 2];
        let vy = dots[o + 3];
        const hx = dots[o + 4];
        const hy = dots[o + 5];
        if (!still) {
          if (age < 900) {
            const dx = hx - ripple.x;
            const dy = hy - ripple.y;
            const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
            const ring = 1 - Math.min(1, Math.abs(d - front) / 26);
            if (ring > 0) {
              const f = ring * 3.2 * (1 - age / 900);
              vx += (dx / d) * f;
              vy += (dy / d) * f;
            }
          }
          [x, y, vx, vy] = physics(x, y, vx, vy, hx, hy, px, py, pull);
          if (Math.abs(vx) + Math.abs(vy) > 0.02 || Math.abs(x - hx) + Math.abs(y - hy) > 0.05) active = true;
          else {
            x = hx;
            y = hy;
            vx = 0;
            vy = 0;
          }
          dots[o] = x;
          dots[o + 1] = y;
          dots[o + 2] = vx;
          dots[o + 3] = vy;
        }
        // displaced dots warm up
        const heat = Math.min(1, Math.hypot(x - hx, y - hy) / 28);
        ctx.fillStyle =
          heat > 0.02
            ? `rgb(${Math.round(ink[0] + (warm[0] - ink[0]) * heat)},${Math.round(ink[1] + (warm[1] - ink[1]) * heat)},${Math.round(ink[2] + (warm[2] - ink[2]) * heat)})`
            : palette.ink;
        ctx.beginPath();
        ctx.arc(x, y, dots[o + 6], 0, 6.2832);
        ctx.fill();
      }

      if (noise && grain > 0) {
        ctx.globalAlpha = Math.min(1, grain) * 0.09;
        ctx.globalCompositeOperation = "overlay";
        const pattern = ctx.createPattern(noise, "repeat");
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, w, h);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }
      moving = active || age < 900 || px > -1e4;
    };

    const tick = (now) => {
      raf = 0;
      if (!visible) return;
      draw(now);
      if (moving) raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      moving = true;
      if (!raf && visible) raf = requestAnimationFrame(tick);
    };
    const local = (e) => {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const onMove = (e) => {
      [px, py] = local(e);
      wake();
    };
    const onLeave = () => {
      px = py = -1e5;
      wake();
    };
    const onDown = (e) => {
      if (still || e.target.closest("a,button")) return;
      const [x, y] = local(e);
      ripple = { x, y, t: performance.now() };
      wake();
    };

    layout();
    draw(performance.now());
    wake();
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointerdown", onDown);
    const ro = new ResizeObserver(() => {
      layout();
      wake();
    });
    ro.observe(root);
    const io = new IntersectionObserver(([e]) => {
      visible = e ? e.isIntersecting : true;
      if (visible) wake();
    });
    io.observe(root);
    let alive = true;
    document.fonts?.ready?.then(() => {
      if (alive) {
        layout();
        wake();
      }
    });

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerdown", onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <footer
      ref={rootRef}
      className="hwf-root"
      style={{ height, "--hwf-bg": palette.background, "--hwf-ink": palette.ink, "--hwf-mono": monoFamily }}
    >
      <canvas ref={canvasRef} aria-hidden="true" />
      <span className="hwf-sr">{wordmark}</span>
      <div className="hwf-top">
        <div className="hwf-brand">
          <strong>{label}</strong>
          <span>{meta}</span>
        </div>
        {columns.map((col) => (
          <nav key={col.title} className="hwf-col" aria-label={col.title}>
            <h3>{col.title}</h3>
            <ul>
              {col.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href || "#"}>{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="hwf-rule">
        <button type="button" className="hwf-up" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          {backToTopLabel}
        </button>
      </div>
    </footer>
  );
}

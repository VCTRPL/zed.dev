import { useCurrentFrame } from "remotion";
import { C, SERIF, easeIn, easeOut, io } from "./kit";

// Big serif lines with an orange dot for a full stop. Widths are measured
// with the real font, so the dot's position on screen is known exactly and
// transitions can start from it.
let ctx = null;
const measure = (text, size, italic) => {
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  ctx.font = `${italic ? "italic " : ""}400 ${size}px "Instrument Serif"`;
  return ctx.measureText(text).width;
};

const HOT_SHADOW = "0 0 34px rgb(255 164 99 / .6), 0 0 100px rgb(255 164 99 / .3)";

// segs: [["Do Figma ao "], ["deploy", true]] -> second item marks a hot word
export function layoutLine(segs, size) {
  const widths = segs.map(([t, hot]) => measure(t, size, hot));
  const textW = widths.reduce((a, b) => a + b, 0);
  const D = size * 0.15;
  const gap = size * 0.035;
  return { widths, textW, D, gap, total: textW + gap + D };
}

// Where the dot of a line sits on screen (its centre).
export function dotOf(segs, size, y, withDot = true) {
  const L = layoutLine(segs, size);
  const total = withDot ? L.total : L.textW;
  const x0 = 540 - total / 2;
  return { x: x0 + L.textW + L.gap + L.D / 2, y: y + size * 0.86 - L.D / 2, d: L.D, x0 };
}

// One line of type that rises in word by word; optionally ends with the dot.
export function Line({ segs, size, y, at, step = 4, rise = 20, dot = false, dotAt, out, outDur = 12, color = "#fff", hideDot = false }) {
  const f = useCurrentFrame();
  const p = dotOf(segs, size, y, dot);
  const o = out == null ? 0 : io(f, out, out + outDur, easeIn);
  let k = 0;
  const words = [];
  segs.forEach(([t, hot], si) => {
    t.split(/(\s+)/).forEach((w, wi) => {
      if (!w) return;
      if (/^\s+$/.test(w)) {
        words.push(<span key={`${si}-${wi}`}>{w}</span>);
        return;
      }
      const ti = io(f, at + k * step, at + k * step + rise);
      k++;
      words.push(
        <span
          key={`${si}-${wi}`}
          style={{
            display: "inline-block",
            opacity: ti * (1 - o),
            transform: `translateY(${(1 - ti) * size * 0.45 - o * size * 0.3}px)`,
            filter: `blur(${(1 - ti) * 14 + o * 14}px)`,
            ...(hot ? { color: C.orange, fontStyle: "italic", textShadow: HOT_SHADOW } : null),
          }}
        >
          {w}
        </span>,
      );
    });
  });
  const dAt = dotAt ?? at + k * step + 6;
  const ds = Math.max(0, Math.min(1.25, io(f, dAt, dAt + 8, easeOut) * 1.25 - io(f, dAt + 8, dAt + 14) * 0.25));
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: p.x0,
          top: y,
          whiteSpace: "pre",
          fontFamily: SERIF,
          fontWeight: 400,
          fontSize: size,
          lineHeight: 1,
          color,
        }}
      >
        {words}
      </div>
      {dot && !hideDot && (
        <div
          style={{
            position: "absolute",
            left: p.x - p.d / 2,
            top: p.y - p.d / 2,
            width: p.d,
            height: p.d,
            borderRadius: "50%",
            background: C.orange,
            boxShadow: `0 0 ${p.d}px rgb(255 164 99 / .9)`,
            transform: `scale(${ds})`,
            opacity: 1 - o,
          }}
        />
      )}
    </>
  );
}

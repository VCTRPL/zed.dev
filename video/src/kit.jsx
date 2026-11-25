import { Easing, interpolate, useCurrentFrame } from "remotion";

export const C = {
  black: "#0b0d12",
  ink: "#eef1f6",
  muted: "#a2a9b7",
  blue: "#2f6bff",
  orange: "#ffa463",
};
export const SANS = '"Instrument Sans", system-ui, sans-serif';
export const SERIF = '"Instrument Serif", Georgia, serif';
export const MONO = '"DM Mono", ui-monospace, monospace';

export const easeOut = Easing.bezier(0.23, 1, 0.32, 1);
export const easeInOut = Easing.bezier(0.77, 0, 0.175, 1);
export const easeIn = Easing.bezier(0.55, 0, 1, 0.45);

// clamp-eased 0..1 between two frames
export const io = (f, a, b, ease = easeOut) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
export const lerp = (t, a, b) => a + (b - a) * t;

// The site's reveal: rises, unblurs and fades in; optionally leaves upward.
export function Rise({ at, dur = 20, out, outDur = 14, y = 70, blur = 14, children, style, as: Tag = "div" }) {
  const f = useCurrentFrame();
  const t = io(f, at, at + dur);
  const o = out == null ? 0 : io(f, out, out + outDur, easeIn);
  return (
    <Tag
      style={{
        opacity: t * (1 - o),
        transform: `translateY(${(1 - t) * y - o * y * 0.8}px)`,
        filter: `blur(${(1 - t) * blur + o * blur}px)`,
        willChange: "transform, opacity, filter",
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

// Splits a line into words that rise one after another.
export function Words({ text, at, step = 5, dur = 22, out, style, wordStyle }) {
  return (
    <span style={{ display: "inline", ...style }}>
      {text.split(" ").map((w, i) => (
        <Rise key={i} as="span" at={at + i * step} dur={dur} out={out} y={60} style={{ display: "inline-block", marginRight: "0.24em", ...wordStyle }}>
          {w}
        </Rise>
      ))}
    </span>
  );
}

export const Hot = ({ children, style }) => (
  <em
    style={{
      color: C.orange,
      fontStyle: "italic",
      textShadow: "0 0 34px rgb(255 164 99 / .6), 0 0 100px rgb(255 164 99 / .3)",
      ...style,
    }}
  >
    {children}
  </em>
);

export const glass = {
  background: "linear-gradient(180deg, rgb(255 255 255 / .1), rgb(255 255 255 / .035))",
  border: "1.5px solid rgb(255 255 255 / .14)",
  boxShadow: "inset 0 1.5px 0 rgb(255 255 255 / .18), 0 30px 80px -30px rgb(0 0 0 / .8)",
  backdropFilter: "blur(22px)",
};

export const Eyebrow = ({ children, style }) => (
  <div
    style={{
      fontFamily: MONO,
      fontSize: 26,
      letterSpacing: ".2em",
      textTransform: "uppercase",
      color: C.ink,
      opacity: 0.75,
      display: "flex",
      alignItems: "center",
      gap: 18,
      ...style,
    }}
  >
    <span style={{ width: 12, height: 12, borderRadius: 9, background: C.orange, boxShadow: "0 0 18px 3px rgb(255 164 99 / .7)" }} />
    {children}
  </div>
);

export function ZedMark({ size = 300, draw = 1, dot = 1, color = "#fff" }) {
  // the Z path is ~720 units long
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} style={{ overflow: "visible" }}>
      <g transform="translate(-22 4)">
        <path
          d="M132 150 H352 L148 362 H352"
          fill="none"
          stroke={color}
          strokeWidth="58"
          strokeLinecap="square"
          strokeDasharray="760"
          strokeDashoffset={760 * (1 - draw)}
        />
        <circle cx="414" cy="333" r={33 * dot} fill={C.orange} style={{ filter: `drop-shadow(0 0 ${30 * dot}px rgb(255 164 99))` }} />
      </g>
    </svg>
  );
}

export const Arrow = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16">
    <path d="M3 8h10m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const btnPrimary = {
  color: "#fff",
  background: "linear-gradient(180deg, #4d82ff, #2f6bff 55%, #2559e6)",
  boxShadow: "inset 0 2px #fff6, inset 0 -2px #0003, 0 20px 60px -16px #2f6bffe6, 0 0 0 2px #2f6bff99",
};

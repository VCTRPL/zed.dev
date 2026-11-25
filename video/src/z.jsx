import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, easeIn, easeInOut, io, lerp } from "./kit";

// The Z of the logo as a transition device. Path coordinates are the logo's
// (512 box, with its translate(-22 4)); (228, 260) is the middle of the
// diagonal stroke, the point the camera dives into.
export const Z_PATH = "M110 154 H330 L126 366 H330";
const AX = 228;
const AY = 260;
const SW = 58;

export const zXform = (cx, cy, s, rot = 0) => `translate(${cx} ${cy}) rotate(${rot}) scale(${s}) translate(${-AX} ${-AY})`;

const svgUrl = (inner) =>
  `url("data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='1080' height='1920' viewBox='0 0 1080 1920'>${inner}</svg>`,
  )}")`;

const zStroke = (xf, color) =>
  `<path d='${Z_PATH}' transform='${xf}' fill='none' stroke='${color}' stroke-width='${SW}' stroke-linecap='square'/>`;

// CSS mask showing only what is inside the Z (or, inverted, everything but)
export function zMask(xf, invert = false) {
  const inner = invert
    ? `<defs><mask id='m'><rect width='1080' height='1920' fill='white'/>${zStroke(xf, "black")}</mask></defs><rect width='1080' height='1920' fill='white' mask='url(#m)'/>`
    : zStroke(xf, "white");
  const url = svgUrl(inner);
  return { WebkitMaskImage: url, maskImage: url, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" };
}

// Outline of the stroked Z (58 wide, square caps, mitred), for clip-path:
// CSS masks drop content that has 3D transforms, clip-path does not.
const Z_POLY = [[81, 125], [398.1, 125], [194.1, 337], [359, 337], [359, 395], [57.9, 395], [261.9, 183], [81, 183]];
function zPolyPath(cx, cy, sc, rot) {
  const r = (rot * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  return (
    Z_POLY.map(([x, y], i) => {
      const dx = (x - AX) * sc;
      const dy = (y - AY) * sc;
      return `${i ? "L" : "M"}${(cx + dx * cos - dy * sin).toFixed(1)} ${(cy + dx * sin + dy * cos).toFixed(1)}`;
    }).join(" ") + " Z"
  );
}
export function zClip(cx, cy, sc, rot, invert = false) {
  const z = zPolyPath(cx, cy, sc, rot);
  return { clipPath: invert ? `path(evenodd, "M-20 -20 H1100 V1940 H-20 Z ${z}")` : `path("${z}")` };
}

// scale of the Z through a wipe: from a speck to wider than the screen
export const wipeScale = (t) => Math.exp(lerp(t, Math.log(0.3), Math.log(60)));

// The glowing rim drawn between the outgoing and incoming scenes.
export function ZRim({ xf, s, opacity = 1 }) {
  // masked to the outside of the Z, so it only rims the window
  return (
    <AbsoluteFill style={{ opacity, ...zMask(zXform(...xf, s.s, s.rot), true) }}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{ filter: "drop-shadow(0 0 24px rgb(255 164 99 / .9))" }}>
        <path d={Z_PATH} transform={zXform(...xf, s.s, s.rot)} fill="none" stroke={C.orange} strokeWidth={SW + 22 / s.s} strokeLinecap="square" />
        <path d={Z_PATH} transform={zXform(...xf, s.s, s.rot)} fill="none" stroke="#fff3e6" strokeWidth={SW + 6 / s.s} strokeLinecap="square" />
      </svg>
    </AbsoluteFill>
  );
}

const D = 22; // transition length

// A scene with its entrance and exit: "zwipe" (through a Z), "through"
// (camera flies through it), "back" (camera pulls back), or none.
export function Shot({ range: [a, b], enter, exit, children }) {
  const f = useCurrentFrame();
  if (f < a || f >= b) return null;
  const ti = enter ? io(f, a, a + D, (x) => x) : 1;
  const te = exit ? io(f, b - D, b, easeIn) : 0;
  let style = {};
  let rim = null;
  let backdrop = 0;
  if (ti < 1) {
    const e = easeInOut(ti);
    if (enter === "zwipe") {
      // the next scene grows through a Z: a speck, then wider than the screen
      const s = { s: wipeScale(Math.pow(ti, 1.7)), rot: (1 - e) * -16 };
      style = zClip(540, 960, s.s, s.rot);
      rim = <ZRim xf={[540, 960]} s={s} opacity={1 - io(f, a + D - 5, a + D)} />;
      backdrop = 1 - io(f, a + D - 8, a + D);
    }
    if (enter === "through") style = { transform: `scale(${0.7 + 0.3 * e})`, filter: `blur(${(1 - e) * 18}px)`, opacity: e };
    if (enter === "back") style = { transform: `scale(${1.5 - 0.5 * e})`, filter: `blur(${(1 - e) * 18}px)`, opacity: e };
  }
  if (te > 0) {
    if (exit === "zwipe") style = { transform: `scale(${1 + te * 0.12})`, filter: `blur(${te * 6}px)`, opacity: 1 - io(te, 0.55, 1) };
    if (exit === "through") style = { transform: `scale(${1 + te * 0.9})`, filter: `blur(${te * 22}px)`, opacity: 1 - te };
    if (exit === "back") style = { transform: `scale(${1 - te * 0.4})`, filter: `blur(${te * 18}px)`, opacity: 1 - te };
  }
  return (
    <>
      {/* a plain div: Remotion's AbsoluteFill does not pass clip-path through */}
      <div style={{ position: "absolute", inset: 0, ...style }}>
        {backdrop > 0 && <div style={{ position: "absolute", inset: 0, background: `rgb(11 13 18 / ${0.8 * backdrop})` }} />}
        {children}
      </div>
      {rim}
    </>
  );
}

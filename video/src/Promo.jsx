import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import LightCanvas from "./LightCanvas";
import { C, Hot, MONO, SANS, SERIF, Rise, ZedMark, easeIn, easeInOut, easeOut, glass, io, lerp } from "./kit";
import { Shot, ZRim, Z_PATH, zMask, zXform } from "./z";
import { Line, dotOf } from "./type";

// A brand film: no screens, no UI. The orange dot of the logo drives it:
// it lights the horizon, ends every sentence, punches and opens the cuts,
// and finally becomes the profile picture.

export const DURATION = 1080;

// ---- the dot's moments
const IGNITE = 60; // the falling dot hits the horizon
const LOGO_DOT = 214; // the dot lands on the Z
const ZOOM_A = 264; // camera dives through the Z
const ZOOM_B = 294;
const SLAMS = [290, 326, 362]; // Sites / Sistemas / Experiências em 3D
const ORB_AT = 946; // the profile picture forms
const END_POP = 978; // its dot pops

// ---- copy and where each line's dot sits
const A1 = [["Seu cliente decide"]];
const A2 = [["em segundos"]];
const B1 = [["Faça esses segundos"]];
const B2 = [["contarem"]];
const MAN = { size: 122, y1: 640, y2: 774 };
const dotA = () => dotOf(A2, MAN.size, MAN.y2);
const dotB = () => dotOf(B2, MAN.size, MAN.y2);

const SLAM_WORDS = [
  { lines: [[["Sites"]]], size: 300 },
  { lines: [[["Sistemas"]]], size: 228 },
  { lines: [[["Experiências"]], [["em 3D"]]], size: 172 },
];
const SLAM_Y = 760;

const VALUES = [
  { segs: [["Rápido"]], at: 520 },
  { segs: [["Responsivo"]], at: 560 },
  { segs: [["Sob medida"]], at: 600 },
];
const VAL = { size: 196, y: 760 };
const valDot = (i) => dotOf(VALUES[i].segs, VAL.size, VAL.y);

const BH2 = [["e região"]];
const BHL = { size: 150, y1: 690, y2: 846 };
const dotBH = () => dotOf(BH2, BHL.size, BHL.y2);

const AVATAR_Y = 760;
const ZDOT = { x: 520 + (392 - 228) * 0.82, y: 610 + (337 - 260) * 0.82 }; // the logo's dot on screen

const on = (f, a, b) => f >= a && f < b;
const decay = (f, at, tau) => (f >= at ? Math.exp(-(f - at) / tau) : 0);

// ---------------------------------------------------------------- background
function Background() {
  const f = useCurrentFrame();
  const k = (pts) =>
    interpolate(f, pts.map((p) => p[0]), pts.map((p) => p[1]), { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
  const horizon = k([[0, 0.62], [ZOOM_A, 0.62], [ZOOM_B + 6, 0.86], [ORB_AT - 30, 0.86], [ORB_AT + 10, 0.6]]);
  const gain = k([[0, 0], [IGNITE - 2, 0], [IGNITE + 18, 1], [ZOOM_B, 1], [ZOOM_B + 30, 0.62], [ORB_AT - 30, 0.62], [ORB_AT + 10, 0.95]]);
  const rise = k([[0, 0.002], [IGNITE, 0.002], [IGNITE + 50, 1.05], [ZOOM_B, 1.05], [ZOOM_B + 30, 0.82], [ORB_AT - 30, 0.82], [ORB_AT + 10, 0.85]]);
  const pulse = Math.max(
    decay(f, IGNITE, 14),
    0.7 * decay(f, LOGO_DOT, 10),
    ...SLAMS.map((s) => 0.55 * decay(f, s, 9)),
    0.4 * decay(f, 530, 10),
    0.4 * decay(f, 852, 10),
    decay(f, END_POP, 14),
  );
  const zoom = 1 + 0.05 * io(f, IGNITE, ZOOM_A) - 0.03 * io(f, ZOOM_A, ZOOM_B + 20) + 0.04 * io(f, ORB_AT, DURATION, easeInOut);
  return (
    <AbsoluteFill style={{ background: C.black }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <LightCanvas horizon={horizon} gain={gain} rise={rise} pulse={pulse} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: "linear-gradient(to bottom, #0b0d12 0%, rgb(11 13 18 / .5) 14%, transparent 34%, transparent 82%, rgb(11 13 18 / .6) 100%)",
        }}
      />
    </AbsoluteFill>
  );
}

// a soft dark pool behind type, so it reads over the light
const Scrim = ({ y = 800, h = 760, o = 0.72 }) => (
  <div
    style={{
      position: "absolute",
      left: -120,
      right: -120,
      top: y - h / 2,
      height: h,
      background: `radial-gradient(50% 50% at 50% 50%, rgb(11 13 18 / ${o}), rgb(11 13 18 / ${o * 0.5}) 55%, transparent 80%)`,
    }}
  />
);

const Dot = ({ x, y, d, glow = 1, style }) => (
  <div
    style={{
      position: "absolute",
      left: x - d / 2,
      top: y - d / 2,
      width: d,
      height: d,
      borderRadius: "50%",
      background: "radial-gradient(circle at 40% 35%, #ffd2ad, #ffa463 55%, #ff8a48)",
      boxShadow: `0 0 ${d * 0.8 * glow}px rgb(255 164 99 / .9), 0 0 ${d * 2 * glow}px rgb(255 140 70 / .45)`,
      ...style,
    }}
  />
);

const Eyebrow = ({ y, at, out, children }) => (
  <div style={{ position: "absolute", top: y, width: "100%", textAlign: "center" }}>
    <Rise at={at} out={out} y={30}>
      <span style={{ fontFamily: MONO, fontSize: 28, letterSpacing: ".24em", textTransform: "uppercase", color: C.ink, opacity: 0.75 }}>{children}</span>
    </Rise>
  </div>
);

// ------------------------------------------------------------------ 1. spark
// Black. The dot beats twice, falls, and lights the horizon.
function Spark() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appear = Math.max(0, spring({ frame: f - 8, fps, config: { damping: 11, stiffness: 140 } }));
  const beat = 0.38 * decay(f, 24, 4) + 0.38 * decay(f, 36, 4);
  const fall = io(f, 44, IGNITE, (x) => x * x * x);
  const y = lerp(fall, 900, 1920 * 0.62);
  const stretch = 1 + 0.6 * fall;
  const line = io(f, IGNITE, IGNITE + 22, easeOut);
  const shock = io(f, IGNITE, IGNITE + 30);
  return (
    <AbsoluteFill>
      {f < IGNITE && (
        <Dot x={540} y={y} d={40 * appear * (1 + beat)} glow={1 + beat * 2} style={{ transform: `scaleY(${stretch}) scaleX(${1 / Math.sqrt(stretch)})` }} />
      )}
      {f >= IGNITE && (
        <>
          {/* the dot flattens into the horizon */}
          <div
            style={{
              position: "absolute",
              top: 1920 * 0.62 - 3,
              left: "50%",
              width: 40 + 1100 * line,
              height: 6,
              transform: "translateX(-50%)",
              borderRadius: 6,
              background: "linear-gradient(90deg, transparent, #fff1e2 25%, #fff 50%, #fff1e2 75%, transparent)",
              boxShadow: "0 0 50px 10px rgb(255 164 99 / .8)",
              opacity: 1 - io(f, IGNITE + 16, IGNITE + 40),
            }}
          />
          {/* shockwave across the floor */}
          <div
            style={{
              position: "absolute",
              left: 540 - 300,
              top: 1920 * 0.62 - 300,
              width: 600,
              height: 600,
              borderRadius: "50%",
              border: "4px solid rgb(255 220 190 / .9)",
              transform: `scale(${0.1 + shock * 2.4}, ${(0.1 + shock * 2.4) * 0.18})`,
              opacity: (1 - shock) * 0.9,
            }}
          />
          <AbsoluteFill style={{ background: "radial-gradient(60% 40% at 50% 62%, rgb(255 200 150 / .9), rgb(255 164 99 / .25) 60%, transparent 100%)", opacity: decay(f, IGNITE, 4) }} />
        </>
      )}
    </AbsoluteFill>
  );
}

// -------------------------------------------------------------- 2. manifesto
function ManifestoA() {
  return (
    <AbsoluteFill>
      <Scrim y={760} />
      <Line segs={A1} size={MAN.size} y={MAN.y1} at={84} />
      <Line segs={A2} size={MAN.size} y={MAN.y2} at={96} dot dotAt={114} />
    </AbsoluteFill>
  );
}

function ManifestoB() {
  const f = useCurrentFrame();
  const p = dotB();
  // the full stop comes loose and flies onto the Z
  const fly = io(f, 194, LOGO_DOT, easeInOut);
  const x = lerp(fly, p.x, ZDOT.x);
  const y = lerp(fly, p.y, ZDOT.y) - Math.sin(fly * Math.PI) * 140;
  const d = lerp(fly, p.d, 54);
  return (
    <AbsoluteFill>
      <Scrim y={760} />
      <Line segs={B1} size={MAN.size} y={MAN.y1} at={150} out={190} />
      <Line segs={B2} size={MAN.size} y={MAN.y2} at={162} dot dotAt={174} out={192} hideDot={f >= 194} />
      {on(f, 194, LOGO_DOT) && <Dot x={x} y={y} d={d} glow={1.4} />}
    </AbsoluteFill>
  );
}

// ------------------------------------------------------------------ 3. logo
function Logo() {
  const f = useCurrentFrame();
  const draw = io(f, 198, 232, easeInOut);
  const squash = f >= LOGO_DOT ? 1 + 0.45 * Math.exp(-(f - LOGO_DOT) / 6) * Math.cos((f - LOGO_DOT) / 1.6) : 0;
  const ring = io(f, LOGO_DOT, LOGO_DOT + 34);
  const zt = io(f, ZOOM_A, ZOOM_B, easeIn);
  const s = 0.82 * Math.exp(Math.log(90) * zt);
  const m = io(f, ZOOM_A - 8, ZOOM_B, easeInOut);
  const cx = lerp(m, 520, 540);
  const cy = lerp(m, 610, 960);
  const rot = -10 * io(f, ZOOM_A - 4, ZOOM_B, easeInOut);
  const xf = zXform(cx, cy, s, rot);
  const win = io(f, 250, 266);
  const tail = io(f, ZOOM_B - 4, ZOOM_B);
  return (
    <AbsoluteFill>
      <Scrim y={720} h={1000} o={0.7 * (1 - win)} />
      <Scrim y={960} h={520} o={0.85 * io(f, 218, 232) * (1 - win)} />
      <AbsoluteFill style={{ background: C.black, opacity: win * (1 - tail), ...zMask(xf, true) }} />
      <ZRim xf={[cx, cy]} s={{ s, rot }} opacity={win * (1 - tail) * 0.9} />
      <AbsoluteFill>
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{ overflow: "visible" }}>
          <g transform={xf}>
            <path
              d={Z_PATH}
              fill="none"
              stroke="#fff"
              strokeWidth="58"
              strokeLinecap="square"
              strokeDasharray="760"
              strokeDashoffset={760 * (1 - draw)}
              opacity={1 - win}
            />
            <circle
              cx="392"
              cy="337"
              r={33 * squash}
              fill={C.orange}
              opacity={1 - io(f, ZOOM_A, ZOOM_A + 8)}
              style={{ filter: "drop-shadow(0 0 30px rgb(255 164 99))" }}
            />
          </g>
        </svg>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: ZDOT.x - 90,
          top: ZDOT.y - 90,
          width: 180,
          height: 180,
          borderRadius: "50%",
          border: "3px solid rgb(255 214 180 / .9)",
          transform: `scale(${0.2 + ring * 3.4})`,
          opacity: f >= LOGO_DOT ? (1 - ring) * 0.9 : 0,
        }}
      />
      <div style={{ position: "absolute", top: 860, width: "100%", textAlign: "center", textShadow: "0 4px 40px rgb(11 13 18 / .9)" }}>
        <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 150, letterSpacing: "-0.04em", color: "#fff" }}>
          {"zed.dev".split("").map((ch, i) => (
            <Rise key={i} as="span" at={222 + i * 3} dur={18} y={50} out={248 + i * 1.5} outDur={12} style={{ display: "inline-block", color: i >= 3 ? C.muted : "#fff" }}>
              {ch}
            </Rise>
          ))}
        </div>
        <Rise at={232} dur={18} out={248} outDur={12}>
          <p style={{ fontFamily: MONO, fontSize: 30, letterSpacing: ".18em", color: C.ink, opacity: 0.8, textTransform: "uppercase", margin: "26px 0 0" }}>
            Estúdio de desenvolvimento web
          </p>
        </Rise>
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- 4. slams
// Each word punches in; its dot then blows up to fill the screen orange and
// the next word comes out of the flash.
function DotPunch({ at, from }) {
  const f = useCurrentFrame();
  if (f < at - 7 || f > at + 10) return null;
  const grow = io(f, at - 7, at, (x) => x * x * x);
  const r = lerp(grow, from.d / 2, 2400);
  const fade = io(f, at, at + 10, easeOut);
  return (
    <div
      style={{
        position: "absolute",
        left: from.x - r,
        top: from.y - r,
        width: 2 * r,
        height: 2 * r,
        borderRadius: "50%",
        background: "radial-gradient(circle, #fff4ea 0%, #ffb27a 30%, #ffa463 55%, #f27a3a 100%)",
        opacity: 1 - fade,
        transform: `scale(${1 + fade * 0.2})`,
      }}
    />
  );
}

function slamGeom(i, f) {
  const w = SLAM_WORDS[i];
  const at = SLAMS[i];
  const top = SLAM_Y - (w.lines.length * w.size * 1.02) / 2;
  const scale = 1 + 0.4 * (1 - io(f, at, at + 9, easeOut)) + 0.05 * io(f, at, at + 40);
  return { w, at, top, scale };
}

function Slams() {
  const f = useCurrentFrame();
  const els = [];
  SLAM_WORDS.forEach((w, i) => {
    const at = SLAMS[i];
    const until = SLAMS[i + 1] ?? 432;
    if (f < at || f >= until) return;
    const g = slamGeom(i, f);
    els.push(
      <AbsoluteFill
        key={i}
        style={{
          transform: `scale(${g.scale})`,
          transformOrigin: `540px ${SLAM_Y}px`,
          filter: `blur(${(1 - io(f, at, at + 7)) * 14}px)`,
          opacity: io(f, at, at + 4),
        }}
      >
        {w.lines.map((segs, li) => (
          <Line key={li} segs={segs} size={w.size} y={g.top + li * w.size * 1.02} at={at - 30} rise={1} step={0} dot={li === w.lines.length - 1} dotAt={at + 4} />
        ))}
      </AbsoluteFill>,
    );
  });
  // the punch out of each word's dot (placed at the scale the word has by then)
  const punches = SLAMS.slice(1).map((s, i) => {
    const g = slamGeom(i, s - 7);
    const last = g.w.lines.length - 1;
    const d = dotOf(g.w.lines[last], g.w.size, g.top + last * g.w.size * 1.02);
    const from = { x: 540 + (d.x - 540) * g.scale, y: SLAM_Y + (d.y - SLAM_Y) * g.scale, d: d.d * g.scale };
    return <DotPunch key={s} at={s} from={from} />;
  });
  return (
    <AbsoluteFill>
      <Scrim y={SLAM_Y} h={900} o={0.6} />
      <Eyebrow y={470} at={286}>
        O que a zed faz
      </Eyebrow>
      {els}
      {punches}
    </AbsoluteFill>
  );
}

// -------------------------------------------------------------- 5. figma
function Figma() {
  return (
    <AbsoluteFill>
      <Scrim y={800} />
      <Eyebrow y={560} at={414}>
        Do layout ao ar
      </Eyebrow>
      <Line segs={[["Do Figma"]]} size={196} y={640} at={418} />
      <Line segs={[["ao "], ["deploy", true]]} size={196} y={846} at={428} dot dotAt={446} />
      <div style={{ position: "absolute", top: 1120, width: "100%", textAlign: "center" }}>
        <Rise at={452}>
          <p style={{ fontFamily: MONO, fontSize: 31, lineHeight: 1.7, color: C.ink, margin: "0 auto", maxWidth: 860, textShadow: "0 2px 24px rgb(11 13 18 / .95)" }}>
            Design, código e publicação.
            <br />
            Tudo no mesmo lugar.
          </p>
        </Rise>
      </div>
    </AbsoluteFill>
  );
}

// ------------------------------------------------------------- 6. values
function Value({ i }) {
  const v = VALUES[i];
  return <Line segs={v.segs} size={VAL.size} y={VAL.y} at={v.at + 2} step={0} rise={14} dot dotAt={v.at + 10} />;
}

function Values() {
  return (
    <AbsoluteFill>
      <Scrim y={820} />
      <Eyebrow y={640} at={514}>
        Todo projeto é
      </Eyebrow>
      <Shot range={[508, 566]} exit="iris">
        <Value i={0} />
      </Shot>
      <Shot range={[544, 606]} enter="iris" from={valDot(0)} exit="iris">
        <Value i={1} />
      </Shot>
      <Shot range={[584, 648]} enter="iris" from={valDot(1)}>
        <Value i={2} />
      </Shot>
    </AbsoluteFill>
  );
}

// ------------------------------------------------------------ 7. promise
function Promise_() {
  return (
    <AbsoluteFill>
      <Scrim y={840} h={900} />
      <Eyebrow y={520} at={630}>
        Sem intermediários
      </Eyebrow>
      <Line segs={[["Uma pessoa"]]} size={168} y={600} at={634} dot dotAt={650} />
      <Line segs={[["Do primeiro traço"]]} size={112} y={826} at={652} />
      <Line segs={[["ao site "], ["no ar", true]]} size={112} y={946} at={662} dot dotAt={680} />
      <div style={{ position: "absolute", top: 1150, width: "100%", textAlign: "center" }}>
        <Rise at={684}>
          <p style={{ fontFamily: MONO, fontSize: 31, color: C.ink, margin: 0, textShadow: "0 2px 24px rgb(11 13 18 / .95)" }}>Quem atende é quem constrói.</p>
        </Rise>
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- 8. tech
const TECH = ["React", "Next.js", "TypeScript", "Three.js", "WebGL", "Node.js", "Tailwind", "Figma", "Vercel", "GitHub"];
function Marquee({ items, dir, y, at, speed = 7 }) {
  const f = useCurrentFrame();
  const shift = (f - at) * speed * dir;
  const row = [...items, ...items, ...items];
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 0,
        display: "flex",
        gap: 22,
        transform: `translateX(${(dir > 0 ? -1400 : -200) + shift}px)`,
        opacity: io(f, at, at + 14),
      }}
    >
      {row.map((t, i) => (
        <span
          key={i}
          style={{ ...glass, borderRadius: 99, padding: "22px 40px", fontFamily: MONO, fontSize: 38, color: "#fff", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 18 }}
        >
          <span style={{ width: 12, height: 12, borderRadius: 9, background: C.orange, boxShadow: "0 0 14px rgb(255 164 99)" }} />
          {t}
        </span>
      ))}
    </div>
  );
}
function Tech() {
  return (
    <AbsoluteFill>
      <Scrim y={850} h={1000} />
      <Line segs={[["Feito com o "], ["melhor", true]]} size={132} y={600} at={748} dot dotAt={764} />
      <Marquee items={TECH} dir={1} y={860} at={752} />
      <Marquee items={[...TECH].reverse()} dir={-1} y={990} at={758} />
    </AbsoluteFill>
  );
}

// ------------------------------------------------------------------ 9. bh
function BH() {
  const f = useCurrentFrame();
  const p = dotBH();
  // the dot becomes a pin: radar rings, then it flies off to become the orb
  const rings = [0, 1, 2].map((k) => {
    if (f < 880 + k * 14 || f > ORB_AT - 20) return null;
    const t = ((f - 880 - k * 14) % 42) / 42;
    return (
      <div
        key={k}
        style={{
          position: "absolute",
          left: p.x - 60,
          top: p.y - 60,
          width: 120,
          height: 120,
          borderRadius: "50%",
          border: "3px solid rgb(255 164 99 / .9)",
          transform: `scale(${0.2 + t * 2.2})`,
          opacity: 1 - t,
        }}
      />
    );
  });
  const fly = io(f, ORB_AT - 22, ORB_AT + 2, easeInOut);
  return (
    <AbsoluteFill>
      <Scrim y={800} />
      <Eyebrow y={600} at={856} out={ORB_AT - 26}>
        Atendimento
      </Eyebrow>
      <Line segs={[["Belo Horizonte"]]} size={BHL.size} y={BHL.y1} at={860} out={ORB_AT - 24} />
      <Line segs={BH2} size={BHL.size} y={BHL.y2} at={872} dot dotAt={878} out={ORB_AT - 22} hideDot={f >= ORB_AT - 22} />
      {rings}
      {on(f, ORB_AT - 22, ORB_AT + 4) && (
        <Dot x={lerp(fly, p.x, 540)} y={lerp(fly, p.y, AVATAR_Y) - Math.sin(fly * Math.PI) * 120} d={lerp(fly, p.d, 60)} glow={1.5} />
      )}
    </AbsoluteFill>
  );
}

// ----------------------------------------------------------------- 10. end
function Orb({ size, draw, dot }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        backgroundImage:
          "radial-gradient(100% 55% at 50% 0%, rgb(255 255 255 / .56), transparent 62%), radial-gradient(70% 40% at 50% 100%, rgb(255 255 255 / .28), transparent 70%), radial-gradient(circle at 50% 50%, rgb(255 255 255 / .06), rgb(255 255 255 / .18) 100%)",
        backgroundColor: "rgb(255 255 255 / .1)",
        border: "4px solid rgb(255 255 255 / .7)",
        boxShadow:
          "inset 0 3px 8px rgb(255 255 255 / .9), inset 0 0 80px rgb(255 255 255 / .25), 0 0 120px rgb(255 255 255 / .25), 0 0 240px rgb(255 200 160 / .25)",
        backdropFilter: "blur(14px)",
      }}
    >
      <ZedMark size={size * 0.5} draw={draw} dot={dot} />
    </div>
  );
}

function End() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const grow = Math.max(0, spring({ frame: f - ORB_AT, fps, config: { damping: 13, stiffness: 120 } }));
  const draw = io(f, ORB_AT + 8, ORB_AT + 30, easeInOut);
  const dot = f < END_POP ? 0 : Math.max(0, spring({ frame: f - END_POP, fps, config: { damping: 8, stiffness: 170 } }));
  const ring = io(f, END_POP, END_POP + 36);
  const fadeEnd = io(f, DURATION - 12, DURATION);
  const size = 560;
  return (
    <AbsoluteFill style={{ opacity: 1 - fadeEnd }}>
      <div style={{ position: "absolute", left: 540 - size / 2, top: AVATAR_Y - size / 2, transform: `scale(${grow})` }}>
        <Orb size={size} draw={draw} dot={dot} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 540 - size / 2,
          top: AVATAR_Y - size / 2,
          width: size,
          height: size,
          borderRadius: "50%",
          border: "4px solid rgb(255 230 210 / .9)",
          transform: `scale(${1 + ring * 0.7})`,
          opacity: f >= END_POP ? (1 - ring) * 0.8 : 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -60,
          right: -60,
          top: AVATAR_Y + 430,
          height: 520,
          opacity: io(f, END_POP, END_POP + 14),
          background: "radial-gradient(50% 50% at 50% 45%, rgb(11 13 18 / .82), rgb(11 13 18 / .45) 60%, transparent 85%)",
        }}
      />
      <div style={{ position: "absolute", top: AVATAR_Y + 470, width: "100%", textAlign: "center", textShadow: "0 4px 40px rgb(11 13 18 / .95)" }}>
        <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 132, letterSpacing: "-0.04em", color: "#fff" }}>
          {"zed.dev".split("").map((ch, i) => (
            <Rise key={i} as="span" at={END_POP + 4 + i * 2} dur={16} y={46} style={{ display: "inline-block", color: i >= 3 ? C.muted : "#fff" }}>
              {ch}
            </Rise>
          ))}
        </div>
        <Rise at={END_POP + 18}>
          <p style={{ fontFamily: SERIF, fontSize: 66, color: "#fff", margin: "18px 0 0" }}>
            Sites que trazem <Hot>clientes</Hot>.
          </p>
        </Rise>
        <Rise at={END_POP + 28}>
          <p style={{ fontFamily: MONO, fontSize: 27, letterSpacing: ".22em", textTransform: "uppercase", color: C.ink, opacity: 0.85, margin: "34px 0 0" }}>
            Belo Horizonte · MG
          </p>
        </Rise>
      </div>
    </AbsoluteFill>
  );
}

// ------------------------------------------------------------------ finish
function Grain() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: 0.07, mixBlendMode: "overlay" }}>
      <svg width="100%" height="100%">
        <filter id="g">
          <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed={f % 12} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#g)" />
      </svg>
    </AbsoluteFill>
  );
}

export default function Promo({ music = true }) {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.black, fontFamily: SANS, overflow: "hidden" }}>
      <Background />
      {on(f, 0, IGNITE + 42) && <Spark />}
      <Shot range={[82, 160]} exit="iris">
        <ManifestoA />
      </Shot>
      <Shot range={[138, 216]} enter="iris" from={dotA()}>
        <ManifestoB />
      </Shot>
      {on(f, 270, 432) && <Slams />}
      {on(f, 196, ZOOM_B + 1) && <Logo />}
      <Shot range={[410, 530]} enter="through" exit="zwipe">
        <Figma />
      </Shot>
      <Shot range={[508, 648]} enter="zwipe" exit="through">
        <Values />
      </Shot>
      <Shot range={[626, 766]} enter="through" exit="back">
        <Promise_ />
      </Shot>
      <Shot range={[744, 852]} enter="back" exit="zwipe">
        <Tech />
      </Shot>
      <Shot range={[830, 960]} enter="zwipe">
        <BH />
      </Shot>
      {on(f, ORB_AT - 2, DURATION) && <End />}
      <AbsoluteFill style={{ background: "radial-gradient(130% 90% at 50% 45%, transparent 55%, rgb(5 6 10 / .7) 100%)" }} />
      <Grain />
      {music && <Audio src={staticFile("audio/score.wav")} />}
    </AbsoluteFill>
  );
}

import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import LightCanvas from "./LightCanvas";
import { Shot, ZRim, Z_PATH, zMask, zXform } from "./z";
import { Arrow, C, Eyebrow, Hot, MONO, Rise, SANS, SERIF, Words, ZedMark, btnPrimary, easeIn, easeInOut, easeOut, glass, io, lerp } from "./kit";

// ---- timeline (frames @ 30fps) ----
export const T = {
  intro: [0, 105],
  logo: [95, 216],
  head: [184, 352],
  proj: [345, 666],
  serv: [644, 800],
  proc: [778, 916],
  stack: [894, 986],
  cta: [964, 1250],
};
export const DURATION = 1250;
const on = (f, [a, b]) => f >= a && f < b;
const LOGO_DOT = 140;
const CLICK = 1062;
const END = 1124; // the orb lands as the profile picture
const AVATAR_Y = 760; // its centre

// ---------------------------------------------------------------- background
function Background() {
  const f = useCurrentFrame();
  const k = (pts) =>
    interpolate(f, pts.map((p) => p[0]), pts.map((p) => p[1]), { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
  const horizon = k([[0, 0.6], [180, 0.6], [240, 0.84], [345, 0.84], [380, 0.97], [640, 0.97], [700, 0.99], [900, 0.99], [990, 0.78], [END - 24, 0.78], [END + 6, 0.6]]);
  const gain = k([[0, 0], [8, 0.9], [200, 1], [345, 1], [380, 0.55], [640, 0.55], [700, 0.42], [960, 0.5], [1000, 1], [END - 24, 1], [END + 6, 0.9]]);
  const rise = k([[0, 0.002], [12, 0.002], [80, 1.05], [345, 1.05], [380, 0.75], [920, 0.75], [1010, 1.15], [END - 24, 1.15], [END + 6, 0.8]]);
  const pulse = Math.max(
    f >= LOGO_DOT ? Math.exp(-(f - LOGO_DOT) / 12) : 0,
    f >= CLICK ? Math.exp(-(f - CLICK) / 13) : 0,
    f >= 342 && f < 400 ? 0.5 * Math.exp(-(f - 342) / 10) : 0,
    f >= END + 4 ? 0.9 * Math.exp(-(f - END - 4) / 14) : 0,
    f >= 650 && f < 700 ? 0.4 * Math.exp(-(f - 660) / 10) * (f >= 660) : 0,
    f >= 980 && f < 1030 ? 0.4 * Math.exp(-(f - 986) / 10) * (f >= 986) : 0,
  );
  // a slow push-in so the frame is never still
  const zoom = 1 + 0.06 * io(f, 0, 200) - 0.03 * io(f, 330, 400) + 0.05 * io(f, 980, 1100, easeInOut) - 0.05 * io(f, END - 24, END + 6, easeInOut) + 0.04 * io(f, END, DURATION);
  return (
    <AbsoluteFill style={{ background: C.black }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <LightCanvas horizon={horizon} gain={gain} rise={rise} pulse={pulse} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, #0b0d12 0%, rgb(11 13 18 / .5) 14%, transparent 34%, transparent 82%, rgb(11 13 18 / .6) 100%)",
        }}
      />
    </AbsoluteFill>
  );
}

// ------------------------------------------------------------------- intro
function Intro() {
  const f = useCurrentFrame();
  const line = io(f, 2, 34, easeInOut);
  const out = io(f, 88, 104, easeIn);
  const spacing = lerp(io(f, 10, 80), 0.9, 0.34);
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      {/* the horizon igniting before the curtain rises */}
      <div
        style={{
          position: "absolute",
          top: 1920 * 0.6 - 2,
          left: "50%",
          width: 1080 * line,
          height: 4,
          transform: "translateX(-50%)",
          borderRadius: 4,
          background: "linear-gradient(90deg, transparent, #fff1e2 30%, #fff 50%, #fff1e2 70%, transparent)",
          boxShadow: "0 0 40px 8px rgb(255 164 99 / .7)",
          opacity: 1 - io(f, 40, 80),
        }}
      />
      <div style={{ position: "absolute", top: 560, width: "100%", textAlign: "center" }}>
        <Rise at={16} dur={30}>
          <p style={{ fontFamily: MONO, fontSize: 30, letterSpacing: `${spacing}em`, color: C.ink, textTransform: "uppercase", margin: 0 }}>
            Belo Horizonte · MG
          </p>
        </Rise>
        <Rise at={30} dur={30}>
          <p style={{ fontFamily: SERIF, fontSize: 88, color: "#fff", margin: "34px 0 0", fontStyle: "italic" }}>apresenta</p>
        </Rise>
      </div>
    </AbsoluteFill>
  );
}

// -------------------------------------------------------------------- logo
// The Z is drawn, its dot lands, then the Z turns into a window onto the
// light and the camera dives through it into the headline.
const ZOOM_A = 184;
const ZOOM_B = 214;
function Logo() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const draw = io(f, 100, 136, easeInOut);
  const dot = Math.max(0, spring({ frame: f - LOGO_DOT, fps, config: { damping: 9, stiffness: 160 } }));
  const ring = io(f, LOGO_DOT, LOGO_DOT + 34);
  const zt = io(f, ZOOM_A, ZOOM_B, easeIn);
  const s = 0.82 * Math.exp(Math.log(90) * zt);
  const cx = lerp(io(f, ZOOM_A - 8, ZOOM_B, easeInOut), 520, 540);
  const cy = lerp(io(f, ZOOM_A - 8, ZOOM_B, easeInOut), 610, 960);
  const rot = -10 * io(f, ZOOM_A - 4, ZOOM_B, easeInOut);
  const xf = zXform(cx, cy, s, rot);
  const window_ = io(f, 172, 190); // the Z goes from white ink to a window
  const tail = io(f, ZOOM_B - 4, ZOOM_B);
  // where the dot sits on screen (it rides the same transform until it fades)
  const dotOpacity = 1 - io(f, ZOOM_A, ZOOM_A + 8);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: -100, right: -100, top: 230, height: 1000, opacity: io(f, 140, 170) * (1 - window_), background: "radial-gradient(50% 50% at 50% 55%, rgb(11 13 18 / .78), rgb(11 13 18 / .4) 55%, transparent 80%)" }} />
      {/* everything but the Z goes dark */}
      <AbsoluteFill style={{ background: C.black, opacity: window_ * (1 - tail), ...zMask(xf, true) }} />
      <ZRim xf={[cx, cy]} s={{ s, rot }} opacity={window_ * (1 - tail) * 0.9} />
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
              opacity={1 - window_}
            />
            <circle cx="392" cy="337" r={33 * dot} fill={C.orange} opacity={dotOpacity} style={{ filter: `drop-shadow(0 0 ${30 * dot}px rgb(255 164 99))` }} />
          </g>
        </svg>
      </AbsoluteFill>
      {/* the orb's ripple, out of the dot */}
      <div
        style={{
          position: "absolute",
          left: 520 + (392 - 228) * 0.82 - 90,
          top: 610 + (337 - 260) * 0.82 - 90,
          width: 180,
          height: 180,
          borderRadius: "50%",
          border: "3px solid rgb(255 214 180 / .9)",
          transform: `scale(${0.2 + ring * 3.2})`,
          opacity: f >= LOGO_DOT ? (1 - ring) * 0.9 : 0,
        }}
      />
      <div style={{ position: "absolute", top: 860, width: "100%", textAlign: "center", textShadow: "0 4px 40px rgb(11 13 18 / .9)" }}>
        <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 150, letterSpacing: "-0.04em", color: "#fff" }}>
          {"zed.dev".split("").map((ch, i) => (
            <Rise key={i} as="span" at={146 + i * 3} dur={18} y={50} out={170 + i * 1.5} outDur={12} style={{ display: "inline-block", color: i >= 3 ? C.muted : "#fff" }}>
              {ch}
            </Rise>
          ))}
        </div>
        <Rise at={160} dur={20} out={170} outDur={12}>
          <p style={{ fontFamily: MONO, fontSize: 30, letterSpacing: ".18em", color: C.ink, opacity: 0.8, textTransform: "uppercase", margin: "26px 0 0" }}>
            Estúdio de desenvolvimento web
          </p>
        </Rise>
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- headline
function Headline() {
  const f = useCurrentFrame();
  const out = io(f, 330, 352, easeInOut); // the page scrolls up into the projects
  const tap = io(f, 308, 316) - io(f, 318, 328);
  const cursorIn = io(f, 286, 308, easeInOut);
  return (
    <AbsoluteFill style={{ transform: `translateY(${-out * 900}px)`, opacity: 1 - out * 0.9 }}>
      <div style={{ position: "absolute", top: 300, left: 60, right: 60, textAlign: "center" }}>
        <Rise at={204} dur={20}>
          <div style={{ ...glass, display: "inline-flex", alignItems: "center", gap: 18, padding: "12px 30px 12px 14px", borderRadius: 99, fontFamily: SANS, fontSize: 30, color: C.ink }}>
            <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 500, letterSpacing: ".08em", textTransform: "uppercase", background: C.orange, color: C.black, borderRadius: 99, padding: "6px 16px" }}>
              Novo
            </span>
            Seu site, feito sob medida
          </div>
        </Rise>
        <h1 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 168, lineHeight: 0.98, letterSpacing: "-0.02em", color: "#fff", margin: "60px 0 0" }}>
          <Words text="Sites e sistemas," at={212} step={6} />
          <br />
          <Words text="do Figma ao" at={228} step={6} />{" "}
          <Rise as="span" at={246} dur={26} y={60} style={{ display: "inline-block" }}>
            <Hot>deploy</Hot>.
          </Rise>
        </h1>
        <Rise at={262} dur={22}>
          <p style={{ fontFamily: MONO, fontSize: 32, lineHeight: 1.75, color: C.ink, margin: "56px auto 0", maxWidth: 900, textShadow: "0 2px 24px rgb(11 13 18 / .95)" }}>
            React, Next.js e TypeScript, do primeiro layout ao site no ar.
          </p>
        </Rise>
        <div style={{ marginTop: 64, display: "flex", flexDirection: "column", gap: 26, alignItems: "center" }}>
          <Rise at={272} dur={20}>
            <div style={{ ...btnPrimary, width: 760, height: 112, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: SANS, fontWeight: 500, fontSize: 38 }}>
              Pedir um orçamento <Arrow />
            </div>
          </Rise>
          <Rise at={278} dur={20}>
            <div
              style={{
                ...glass,
                background: `rgb(11 13 18 / ${0.55 - tap * 0.2})`,
                width: 760,
                height: 112,
                borderRadius: 99,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: SANS,
                fontWeight: 500,
                fontSize: 38,
                color: "#fff",
                transform: `scale(${1 - tap * 0.05})`,
              }}
            >
              Ver os projetos
            </div>
          </Rise>
        </div>
      </div>
      {/* a finger taps "Ver os projetos" */}
      <div
        style={{
          position: "absolute",
          left: lerp(cursorIn, 1150, 640),
          top: lerp(cursorIn, 1700, 1160),
          width: 84,
          height: 84,
          borderRadius: "50%",
          background: "rgb(255 255 255 / .28)",
          border: "2px solid rgb(255 255 255 / .8)",
          boxShadow: "0 0 40px rgb(255 255 255 / .35)",
          transform: `translate(-50%,-50%) scale(${1 - tap * 0.25})`,
          opacity: cursorIn * (1 - io(f, 326, 336)),
        }}
      />
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- projects
const PROJECTS = [
  {
    name: "XCAR Veículos",
    tag: "Next.js 15 · Logo em 3D",
    line: "Site da loja em Betim: estoque com fotos e WhatsApp.",
    screen: "img/xcar-scroll.jpg",
    scroll: 2400,
    desk: "img/xcar.webp",
    glow: "rgb(200 20 50 / .55)",
  },
  {
    name: "Portfólio 3D",
    tag: "Three.js · React",
    line: "Um escritório retrô: o currículo abre na tela CRT.",
    screen: "img/p3d-m.jpg",
    desk: "img/portfolio3d-2.webp",
    glow: "rgb(255 122 61 / .5)",
  },
  {
    name: "zed.dev",
    tag: "React · WebGL",
    line: "Este site: luz em WebGL e pastas de vidro.",
    screen: "img/zed-scroll.jpg",
    scroll: 2300,
    desk: "img/zed-home.webp",
    glow: "rgb(47 107 255 / .6)",
  },
];
const P0 = 352;
const PLEN = 104;

function Phone({ p, t }) {
  // t: 0..1 progress through this project's window
  const sw = 600;
  const sh = 1230;
  const y = p.scroll ? -p.scroll * io(t, 0.12, 0.92, easeInOut) : 0;
  return (
    <div
      style={{
        width: sw + 28,
        height: sh + 28,
        borderRadius: 86,
        padding: 14,
        background: "linear-gradient(160deg, #3a3f4a, #12141a 40%, #0a0b0f)",
        boxShadow: "inset 0 0 0 2px rgb(255 255 255 / .16), 0 60px 140px -30px rgb(0 0 0 / .9)",
      }}
    >
      <div style={{ width: sw, height: sh, borderRadius: 72, overflow: "hidden", position: "relative", background: "#000" }}>
        {p.scroll ? (
          <Img src={staticFile(p.screen)} style={{ width: sw, transform: `translateY(${y}px)` }} />
        ) : (
          <Img
            src={staticFile(p.screen)}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0%", transform: `scale(${1.02 + 0.08 * t})`, transformOrigin: "50% 30%" }}
          />
        )}
        <div style={{ position: "absolute", top: 18, left: "50%", width: 170, height: 46, marginLeft: -85, borderRadius: 30, background: "#000" }} />
        {/* glass sheen */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgb(255 255 255 / .1), transparent 30%)" }} />
      </div>
    </div>
  );
}

function Project({ p, i }) {
  const f = useCurrentFrame();
  const s = P0 + i * PLEN;
  const t = (f - s) / PLEN;
  const inT = i === 0 ? io(f, s - 6, s + 22) : io(f, s - 8, s + 18, easeOut);
  const outT = i === PROJECTS.length - 1 ? 0 : io(f, s + PLEN - 10, s + PLEN + 10, easeInOut);
  if (inT <= 0 || outT >= 1) return null;
  // phones swap like cards on a carousel
  const x = (1 - inT) * 700 - outT * 700;
  const rot = (1 - inT) * -28 + outT * 28;
  return (
    <AbsoluteFill>
      {/* the desktop version, tilted behind */}
      <div
        style={{
          position: "absolute",
          top: 350,
          left: 40 + x * 0.4,
          width: 1000,
          perspective: 1600,
          opacity: (inT - outT) * 0.85,
        }}
      >
        <div
          style={{
            transform: `rotateY(${22 - t * 8}deg) rotateX(8deg) translateX(${-120 + t * 60}px) scale(.92)`,
            borderRadius: 22,
            overflow: "hidden",
            border: "1.5px solid rgb(255 255 255 / .14)",
            boxShadow: `0 0 160px -20px ${p.glow}`,
            filter: "brightness(.55) saturate(1.1)",
          }}
        >
          <div style={{ height: 42, background: "#15171d", display: "flex", alignItems: "center", gap: 10, paddingLeft: 18 }}>
            {[0, 1, 2].map((k) => (
              <span key={k} style={{ width: 13, height: 13, borderRadius: 9, background: "rgb(255 255 255 / .25)" }} />
            ))}
          </div>
          <Img src={staticFile(p.desk)} style={{ width: "100%", display: "block" }} />
        </div>
      </div>
      {/* colour of the project glowing behind the phone */}
      <div
        style={{
          position: "absolute",
          left: 540 - 520,
          top: 900 - 600,
          width: 1040,
          height: 1200,
          background: `radial-gradient(50% 50% at 50% 50%, ${p.glow}, transparent 70%)`,
          opacity: inT - outT,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 230,
          left: 540 - 314,
          perspective: 2000,
          opacity: Math.min(inT * 1.4, 1) * (1 - outT),
        }}
      >
        <div style={{ transform: `translateX(${x}px) rotateY(${rot}deg) rotateZ(${(1 - inT) * 4 - outT * 4}deg)` }}>
          <Phone p={p} t={t} />
        </div>
      </div>
      <div style={{ position: "absolute", top: 1520, left: 70, right: 70 }}>
        <Rise at={s + 6} dur={18} out={i === PROJECTS.length - 1 ? undefined : s + PLEN - 10} outDur={12} y={40}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 108, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>{p.name}</h2>
            <span style={{ ...glass, display: "inline-flex", alignItems: "center", gap: 12, padding: "12px 24px", borderRadius: 99, fontFamily: MONO, fontSize: 24, letterSpacing: ".12em", textTransform: "uppercase", color: C.ink }}>
              <span style={{ width: 14, height: 14, borderRadius: 9, background: "#3ddc84", boxShadow: `0 0 ${10 + 10 * Math.sin(f / 4)}px 3px rgb(61 220 132 / .7)` }} />
              No ar
            </span>
          </div>
        </Rise>
        <Rise at={s + 12} dur={18} out={i === PROJECTS.length - 1 ? undefined : s + PLEN - 10} outDur={12} y={30}>
          <p style={{ fontFamily: MONO, fontSize: 28, letterSpacing: ".14em", textTransform: "uppercase", color: C.orange, margin: "18px 0 0" }}>{p.tag}</p>
          <p style={{ fontFamily: SANS, fontSize: 36, lineHeight: 1.4, color: C.ink, opacity: 0.85, margin: "14px 0 0" }}>{p.line}</p>
        </Rise>
      </div>
    </AbsoluteFill>
  );
}

function Projects() {
  const f = useCurrentFrame();
  const idx = Math.min(PROJECTS.length - 1, Math.max(0, Math.floor((f - P0 + 4) / PLEN)));
  const head = io(f, T.proj[0] + 8, T.proj[0] + 28);
  return (
    <AbsoluteFill>
      {PROJECTS.map((p, i) => (
        <Project key={p.name} p={p} i={i} />
      ))}
      <div style={{ position: "absolute", top: 120, left: 70, right: 70, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: head }}>
        <Eyebrow>Projetos no ar</Eyebrow>
        <span style={{ fontFamily: MONO, fontSize: 28, color: C.ink, opacity: 0.7 }}>0{idx + 1} / 0{PROJECTS.length}</span>
      </div>
      {/* progress rail */}
      <div style={{ position: "absolute", top: 180, left: 70, right: 70, height: 3, background: "rgb(255 255 255 / .1)", opacity: head }}>
        <div style={{ height: "100%", width: `${io(f, P0, T.proj[1], (x) => x) * 100}%`, background: C.orange, boxShadow: "0 0 14px rgb(255 164 99)" }} />
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------- services
const SERVICES = [
  ["react", "Sites e landing pages", "Rápidos, responsivos e com WhatsApp."],
  ["nodejs", "Sistemas e apps web", "Catálogos, painéis e APIs."],
  ["figma", "Design de interface", "Telas no Figma, aprovadas por você."],
  ["threejs", "Experiências em 3D", "Modelos interativos no navegador.", true],
];
function Services() {
  const f = useCurrentFrame();
  const a = T.serv[0];
  const end = T.serv[1];
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 230, left: 70, right: 70 }}>
        <Rise at={a + 4}>
          <Eyebrow>Serviços</Eyebrow>
        </Rise>
        <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 128, lineHeight: 1, letterSpacing: "-0.02em", color: "#fff", margin: "36px 0 0" }}>
          <Words text="Quatro serviços," at={a + 8} />
          <br />
          <Words text="um só" at={a + 20} />{" "}
          <Rise as="span" at={a + 30} style={{ display: "inline-block" }}>
            <Hot>responsável</Hot>.
          </Rise>
        </h2>
      </div>
      <div style={{ position: "absolute", top: 760, left: 70, right: 70, display: "flex", flexDirection: "column", gap: 28, perspective: 1800 }}>
        {SERVICES.map(([icon, title, line, invert], i) => {
          const t = io(f, a + 26 + i * 9, a + 52 + i * 9);
          const o = 0;
          const sweep = io(f, a + 40 + i * 9, a + 90 + i * 9, easeInOut);
          return (
            <div
              key={title}
              style={{
                ...glass,
                position: "relative",
                overflow: "hidden",
                borderRadius: 40,
                height: 196,
                display: "flex",
                alignItems: "center",
                gap: 40,
                padding: "0 44px",
                opacity: t * (1 - o),
                transform: `translateY(${(1 - t) * 160 - o * 120}px) rotateX(${(1 - t) * 40}deg)`,
                filter: `blur(${(1 - t) * 10 + o * 10}px)`,
              }}
            >
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(400px 260px at ${lerp(sweep, -20, 120)}% 50%, rgb(255 255 255 / .1), transparent 70%)` }} />
              <span style={{ width: 112, height: 112, borderRadius: 30, border: "1.5px solid rgb(255 255 255 / .12)", background: "rgb(255 255 255 / .06)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Img src={staticFile(`img/${icon}.svg`)} style={{ width: 58, height: 58, filter: invert ? "invert(1)" : undefined }} />
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: SANS, fontWeight: 500, fontSize: 46, color: "#fff", margin: 0 }}>{title}</p>
                <p style={{ fontFamily: SANS, fontSize: 31, color: C.ink, opacity: 0.72, margin: "8px 0 0" }}>{line}</p>
              </div>
              <span style={{ fontFamily: SERIF, fontSize: 70, color: "rgb(255 255 255 / .22)" }}>0{i + 1}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ----------------------------------------------------------------- process
const STEPS = [
  ["figma", "Layout", "As telas no Figma, aprovadas antes do código."],
  ["react", "Código", "React e Next.js, do celular ao monitor."],
  ["github", "Revisão", "Cada mudança registrada no GitHub.", true],
  ["vercel", "Publicação", "No ar, no domínio que você escolher.", true],
];
function Process() {
  const f = useCurrentFrame();
  const a = T.proc[0];
  const end = T.proc[1];
  const top = 820;
  const gap = 230;
  const travel = io(f, a + 22, a + 92, easeInOut);
  const out = 0;
  return (
    <AbsoluteFill style={{ opacity: 1 - out, filter: `blur(${out * 12}px)` }}>
      <div style={{ position: "absolute", top: 250, left: 70, right: 70 }}>
        <Rise at={a + 4}>
          <Eyebrow>Processo</Eyebrow>
        </Rise>
        <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 124, lineHeight: 1, letterSpacing: "-0.02em", color: "#fff", margin: "36px 0 0" }}>
          <Words text="Do primeiro traço" at={a + 8} />
          <br />
          <Words text="ao site" at={a + 22} />{" "}
          <Rise as="span" at={a + 32} style={{ display: "inline-block" }}>
            <Hot>no ar</Hot>.
          </Rise>
        </h2>
      </div>
      {/* the flowline: a rail with light running down it */}
      <div style={{ position: "absolute", left: 128, top: top + 50, width: 3, height: gap * 3, background: "rgb(255 255 255 / .1)" }}>
        <div style={{ width: "100%", height: `${travel * 100}%`, background: `linear-gradient(to bottom, ${C.blue}, ${C.orange})`, boxShadow: "0 0 18px rgb(255 164 99 / .8)" }} />
      </div>
      {STEPS.map(([icon, title, line, invert], i) => {
        const lit = io(f, a + 22 + i * 23, a + 32 + i * 23);
        return (
          <div key={title} style={{ position: "absolute", left: 70, right: 70, top: top + i * gap, display: "flex", alignItems: "center", gap: 46 }}>
            <span
              style={{
                width: 118,
                height: 118,
                borderRadius: 34,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                ...glass,
                background: `rgb(${lerp(lit, 20, 255)} ${lerp(lit, 22, 164)} ${lerp(lit, 30, 99)} / ${lerp(lit, 0.5, 0.14)})`,
                border: `1.5px solid rgb(255 164 99 / ${lit * 0.7})`,
                boxShadow: `0 0 ${lit * 60}px rgb(255 164 99 / .45)`,
                transform: `scale(${0.85 + 0.15 * lit})`,
              }}
            >
              <Img src={staticFile(`img/${icon}.svg`)} style={{ width: 56, height: 56, filter: invert ? "invert(1)" : undefined, opacity: 0.4 + 0.6 * lit }} />
            </span>
            <div style={{ opacity: 0.25 + 0.75 * lit, transform: `translateX(${(1 - lit) * 30}px)` }}>
              <p style={{ fontFamily: SANS, fontWeight: 500, fontSize: 52, color: "#fff", margin: 0 }}>
                <span style={{ fontFamily: MONO, fontSize: 28, color: C.orange, marginRight: 20 }}>0{i + 1}</span>
                {title}
              </p>
              <p style={{ fontFamily: SANS, fontSize: 32, color: C.ink, opacity: 0.75, margin: "8px 0 0" }}>{line}</p>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

// ------------------------------------------------------------------- stack
const STACK = [
  ["react"], ["nextjs"], ["typescript"], ["javascript"],
  ["threejs", true], ["tailwindcss"], ["nodejs"], ["figma"],
  ["github", true], ["vercel", true], ["python"], ["java"],
];
function Stack() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = T.stack[0];
  const end = T.stack[1];
  const out = 0;
  return (
    <AbsoluteFill style={{ opacity: 1 - out, transform: `scale(${1 + out * 0.2})`, filter: `blur(${out * 14}px)` }}>
      <div style={{ position: "absolute", top: 470, width: "100%", textAlign: "center" }}>
        <Rise at={a + 2}>
          <p style={{ fontFamily: SERIF, fontSize: 120, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>
            Feito com o <Hot>melhor</Hot>
          </p>
        </Rise>
      </div>
      <div style={{ position: "absolute", top: 760, left: 110, right: 110, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 34 }}>
        {STACK.map(([icon, invert], i) => {
          const r = Math.floor(i / 4);
          const c = i % 4;
          const d = Math.abs(c - 1.5) + Math.abs(r - 1);
          const s = spring({ frame: f - a - 6 - d * 4, fps, config: { damping: 12, stiffness: 170 } });
          return (
            <div key={icon} style={{ ...glass, aspectRatio: "1", borderRadius: 38, display: "grid", placeItems: "center", transform: `scale(${s})`, opacity: Math.min(1, s) }}>
              <Img src={staticFile(`img/${icon}.svg`)} style={{ width: 84, height: 84, filter: invert ? "invert(1)" : undefined }} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// --------------------------------------------------------------------- cta
function Orb({ press, dot = 1, glow = 0 }) {
  return (
    <div
      style={{
        width: 230,
        height: 230,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        backgroundImage:
          "radial-gradient(100% 55% at 50% 0%, rgb(255 255 255 / .56), transparent 62%), radial-gradient(70% 40% at 50% 100%, rgb(255 255 255 / .28), transparent 70%), radial-gradient(circle at 50% 50%, rgb(255 255 255 / .06), rgb(255 255 255 / .18) 100%)",
        backgroundColor: "rgb(255 255 255 / .1)",
        border: "2.5px solid rgb(255 255 255 / .7)",
        boxShadow: "inset 0 2px 5px rgb(255 255 255 / .9), inset 0 0 40px rgb(255 255 255 / .25), 0 0 70px rgb(255 255 255 / .25), 0 0 140px rgb(255 200 160 / .25)",
        backdropFilter: "blur(10px)",
        transform: `scale(${1 - press * 0.07})`,
        filter: glow ? `drop-shadow(0 0 ${glow * 60}px rgb(255 190 140 / ${glow * 0.8}))` : undefined,
      }}
    >
      <ZedMark size={110} dot={dot} />
    </div>
  );
}

function Cta() {
  const f = useCurrentFrame();
  const a = T.cta[0];
  const press = io(f, CLICK - 6, CLICK) - io(f, CLICK, CLICK + 10);
  const rip = io(f, CLICK, CLICK + 40);
  const rip2 = io(f, CLICK + 8, CLICK + 52);
  const { fps } = useVideoConfig();
  const fadeEnd = io(f, DURATION - 12, DURATION);
  // after the click everything clears and the orb becomes the profile picture
  const leave = io(f, END - 26, END - 8, easeIn);
  const grow = io(f, END - 22, END + 8, easeInOut);
  const pop = f < END + 4 ? 1 : Math.max(0, spring({ frame: f - END - 4, fps, config: { damping: 8, stiffness: 170 } }));
  const glow = io(f, END + 2, END + 10) * (1 - io(f, END + 10, END + 50));
  const leaving = { opacity: 1 - leave, filter: `blur(${leave * 16}px)`, transform: `translateY(${-leave * 80}px) scale(${1 - leave * 0.06})` };
  return (
    <AbsoluteFill style={{ opacity: 1 - fadeEnd }}>
      <div style={{ position: "absolute", top: 290, left: 60, right: 60, textAlign: "center", ...leaving }}>
        <Rise at={a + 6}>
          <Eyebrow style={{ justifyContent: "center" }}>BH e região</Eyebrow>
        </Rise>
        <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 164, lineHeight: 0.98, letterSpacing: "-0.02em", color: "#fff", margin: "44px 0 0" }}>
          <Words text="Conte o que" at={a + 12} step={6} />
          <br />
          <Words text="você" at={a + 26} />{" "}
          <Rise as="span" at={a + 32} dur={26} style={{ display: "inline-block" }}>
            <Hot>precisa</Hot>.
          </Rise>
        </h2>
        <Rise at={a + 46}>
          <p style={{ fontFamily: MONO, fontSize: 32, lineHeight: 1.7, color: C.ink, margin: "48px auto 0", maxWidth: 860, textShadow: "0 2px 24px rgb(11 13 18 / .95)" }}>
            Proposta com escopo, prazo e preço. Quem atende é quem constrói.
          </p>
        </Rise>
        <Rise at={a + 56}>
          <div style={{ ...btnPrimary, margin: "60px auto 0", width: 780, height: 120, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: SANS, fontWeight: 500, fontSize: 42, position: "relative", overflow: "hidden" }}>
            Pedir um orçamento <Arrow size={34} />
            <span style={{ position: "absolute", inset: 0, transform: `translateX(${lerp(io(f, a + 70, a + 100, easeInOut), -120, 120)}%)`, background: "linear-gradient(100deg, transparent 30%, rgb(255 255 255 / .4) 50%, transparent 70%)" }} />
          </div>
        </Rise>
      </div>
      <div style={{ position: "absolute", top: 1230, left: 540 - 115, transform: `translateY(${grow * (AVATAR_Y - 1345)}px) scale(${1 + grow * 1.45})` }}>
        <Rise at={a + 64} y={40}>
          <div style={{ position: "relative" }}>
            <Orb press={press} dot={pop} glow={glow} />
            {[rip, rip2].map((r, k) => (
              <div
                key={k}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: "3px solid rgb(255 255 255 / .8)",
                  transform: `scale(${1 + r * 2.4})`,
                  opacity: f >= CLICK + k * 8 ? (1 - r) * 0.8 : 0,
                }}
              />
            ))}
          </div>
        </Rise>
      </div>
      <div style={{ position: "absolute", top: 1660, width: "100%", textAlign: "center", ...leaving }}>
        <Rise at={CLICK + 6}>
          <p style={{ fontFamily: SANS, fontWeight: 500, fontSize: 58, color: "#fff", margin: 0, letterSpacing: "-0.02em", textShadow: "0 2px 30px rgb(11 13 18 / .9)" }}>
            zed-dev.vercel.app
          </p>
        </Rise>
        <Rise at={CLICK + 12}>
          <p style={{ fontFamily: MONO, fontSize: 26, letterSpacing: ".2em", textTransform: "uppercase", color: C.ink, opacity: 0.8, margin: "18px 0 0" }}>
            Link na bio · Belo Horizonte, MG
          </p>
        </Rise>
      </div>
      {/* end card: the profile picture, the name, the call */}
      <div style={{ position: "absolute", left: -60, right: -60, top: AVATAR_Y + 430, height: 520, opacity: io(f, END, END + 14), background: "radial-gradient(50% 50% at 50% 45%, rgb(11 13 18 / .82), rgb(11 13 18 / .45) 60%, transparent 85%)" }} />
      <div style={{ position: "absolute", top: AVATAR_Y + 470, width: "100%", textAlign: "center", textShadow: "0 4px 40px rgb(11 13 18 / .95)" }}>
        <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 132, letterSpacing: "-0.04em", color: "#fff" }}>
          {"zed.dev".split("").map((ch, i) => (
            <Rise key={i} as="span" at={END + 6 + i * 2} dur={16} y={46} style={{ display: "inline-block", color: i >= 3 ? C.muted : "#fff" }}>
              {ch}
            </Rise>
          ))}
        </div>
        <Rise at={END + 18}>
          <p style={{ fontFamily: SERIF, fontSize: 64, color: "#fff", margin: "18px 0 0" }}>
            Sites que trazem <Hot>clientes</Hot>.
          </p>
        </Rise>
        <Rise at={END + 28}>
          <p style={{ fontFamily: MONO, fontSize: 27, letterSpacing: ".2em", textTransform: "uppercase", color: C.ink, opacity: 0.85, margin: "34px 0 0" }}>
            Siga · Orçamento no link da bio
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
      {on(f, T.intro) && <Intro />}
      {on(f, T.head) && <Headline />}
      {on(f, T.logo) && <Logo />}
      <Shot range={T.proj} exit="zwipe"><Projects /></Shot>
      <Shot range={T.serv} enter="zwipe" exit="through"><Services /></Shot>
      <Shot range={T.proc} enter="through" exit="back"><Process /></Shot>
      <Shot range={T.stack} enter="back" exit="zwipe"><Stack /></Shot>
      <Shot range={T.cta} enter="zwipe"><Cta /></Shot>
      <AbsoluteFill style={{ background: "radial-gradient(130% 90% at 50% 45%, transparent 55%, rgb(5 6 10 / .7) 100%)" }} />
      <Grain />
      {music && <Audio src={staticFile("audio/score.wav")} />}
    </AbsoluteFill>
  );
}

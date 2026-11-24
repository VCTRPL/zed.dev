import { useEffect, useRef } from "react";
import { perf, onLite, goLite, prefersReducedMotion } from "../lib/perf";

/**
 * A curtain of light rising from a glowing horizon, combed into fine lines.
 *
 * A fragment shader paints one smooth field of colour (navy at the edges, a
 * blue glow with a pale beam in the middle, and a warm orange-to-coral cone
 * opening from the base) and lays thin, evenly spaced vertical lines over it,
 * like light behind ribbed glass. Pulses of light travel up the lines and the
 * glow breathes slowly. It covers the whole box, top to bottom.
 *
 * horizon  where the light source sits (0..1 of the height, or of the viewport)
 * anchor   "viewport" measures the horizon against the window, "element" against the box
 * spread   width of the glow (0..1, default depends on screen size)
 * sparks   kept for compatibility; the stars scale with it
 * density  how close together the lines are (multiplier)
 */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes;       // CSS px
uniform float uTime;
uniform float uBase;     // horizon, px from the top
uniform float uSpread;
uniform float uDensity;
uniform float uSparks;

float hash(float n) { return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
float hash2(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise1(float x) {
  float i = floor(x), f = fract(x);
  return mix(hash(i), hash(i + 1.0), f * f * (3.0 - 2.0 * f));
}

const vec3 NAVY  = vec3(0.016, 0.031, 0.110);
const vec3 DEEP  = vec3(0.050, 0.120, 0.420);
const vec3 BLUE  = vec3(0.110, 0.360, 0.980);
const vec3 SKY   = vec3(0.520, 0.760, 1.000);
const vec3 ORANGE= vec3(1.000, 0.520, 0.250);
const vec3 CORAL = vec3(0.980, 0.380, 0.360);
const vec3 PEACH = vec3(1.000, 0.860, 0.740);

void main() {
  vec2 px = vec2(vUv.x * uRes.x, (1.0 - vUv.y) * uRes.y); // y down, like the DOM
  float t = uTime;
  float x = (px.x - 0.5 * uRes.x) / (0.5 * uRes.x);  // -1 .. 1
  float v = px.y / max(uBase, 1.0);                     // 0 top, 1 horizon
  float ax = abs(x);
  float k = uSpread / 0.46;                             // 1 at the default width

  // ---- the smooth field ---------------------------------------------------
  float breathe = 1.0 + 0.05 * sin(t * 0.5);
  float after = v > 1.0 ? exp(-(v - 1.0) * 3.0) : 1.0;  // fade below the horizon

  // ambient blue that deepens toward the horizon, so the whole box is lit
  float ambient = (0.25 + 0.75 * smoothstep(0.0, 0.95, v)) * after;
  // the broad blue glow
  float sx = uSpread * 1.25;
  float glow = exp(-(x * x) / (2.0 * sx * sx)) * smoothstep(0.05, 0.75, v) * after * breathe;
  // a pale beam up the middle
  float bx = uSpread * 0.3;
  float beam = exp(-(x * x) / (2.0 * bx * bx)) * exp(-pow((v - 0.62) / 0.32, 2.0));
  // the warm cone: apex above the horizon, opening out to the full width
  float edge = (v - 0.6) - ax * 0.36 / k;
  float warm = smoothstep(-0.03, 0.3, edge) * (v > 1.0 ? exp(-(v - 1.0) * 2.2) : 1.0) * breathe;
  float apexGlow = exp(-(x * x) / (0.035 * k * k) - pow((v - 0.8) / 0.2, 2.0));
  float core = exp(-(x * x) / (0.006 * k * k) - pow((v - 0.93) / 0.07, 2.0));

  vec3 warmCol = mix(ORANGE, CORAL, smoothstep(0.1, 0.8, ax));
  vec3 cool = NAVY * 0.9
            + DEEP * ambient * 0.55
            + BLUE * glow * 0.75
            + SKY * beam * 0.55;
  // the warm light replaces the blue rather than mixing into purple
  float wmix = clamp(warm * 1.1 + apexGlow * 0.6, 0.0, 1.0);
  vec3 hot = warmCol * (0.75 + 0.35 * apexGlow) + PEACH * apexGlow * 0.35;
  vec3 L = mix(cool, hot, wmix);
  L += PEACH * core * 0.9;

  // ---- the lines ------------------------------------------------------------
  float pitch = 13.0 / uDensity;                       // px between lines
  float lx = px.x / pitch;
  float id = floor(lx + 0.5);
  float s = 0.5 + 0.5 * cos(6.2831853 * lx);
  float line = pow(s, 4.0);                            // thin bright line, dark gap
  // each line has its own strength, and pulses of light flow up it
  float own = 0.75 + 0.5 * hash(id);
  float flow = noise1(id * 0.73 + 40.0) * 0.6 + 0.4;
  float pulse = noise1(v * 2.6 - t * (0.35 + 0.35 * hash(id + 7.0)) + id * 1.37);
  float shimmer = own * (0.7 + 0.6 * pulse * flow);
  // a slow sideways swell
  shimmer *= 0.9 + 0.12 * sin(x * 5.0 - t * 0.6);
  float comb = 0.5 + 0.85 * line * shimmer;
  vec3 col = L * comb;

  // ---- stars in the dark top ----------------------------------------------
  vec2 g = px / 30.0;
  vec2 sid = floor(g);
  float sh = hash2(sid);
  if (sh > 0.94 && v < 0.55) {
    vec2 sp = fract(g) - 0.5 - (vec2(hash2(sid + 3.1), hash2(sid + 7.7)) - 0.5) * 0.6;
    float tw = 0.5 + 0.5 * sin(t * (0.6 + sh * 2.0) + sh * 50.0);
    float star = smoothstep(0.05, 0.0, length(sp)) * (0.3 + 0.6 * tw) * (1.0 - glow) * min(uSparks + 0.5, 1.0);
    col += vec3(star);
  }

  float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
  gl_FragColor = vec4(min(col, vec3(a)), a);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn(gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

export default function LightField({ horizon = 0.88, anchor = "viewport", spread, sparks = 1, density = 1, className = "" }) {
  const boxRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return;
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) {
      box.classList.add("lf-fallback");
      return;
    }
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      box.classList.add("lf-fallback");
      return;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const u = (n) => gl.getUniformLocation(prog, n);
    const uRes = u("uRes");
    const uTime = u("uTime");
    const uBase = u("uBase");
    const uSpread = u("uSpread");
    const uDensity = u("uDensity");
    const uSparks = u("uSparks");

    const still = prefersReducedMotion();
    let w = 1;
    let h = 1;
    let raf = 0;
    let visible = true;
    let prev = 0;
    let frames = 0;
    let spent = 0;
    const t0 = performance.now();

    const layout = () => {
      const r = box.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      // lines are 1–2px wide, so render at (up to 2x) device resolution
      const scale = perf.lite ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      const base = anchor === "viewport" ? Math.min(h - 40, window.innerHeight * horizon) : h * horizon;
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uBase, base);
      gl.uniform1f(uSpread, spread ?? (w < 640 ? 0.62 : 0.46));
      gl.uniform1f(uDensity, density);
      gl.uniform1f(uSparks, sparks * (perf.lite ? 0.5 : 1));
    };

    const draw = (now) => {
      gl.uniform1f(uTime, still ? 12 : (now - t0) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const tick = (now) => {
      raf = 0;
      if (!visible) return;
      if (perf.lite && now - prev < 32) {
        raf = requestAnimationFrame(tick); // ~30 fps on lite
        return;
      }
      if (!perf.lite && prev && frames < 120) {
        spent += now - prev;
        if (++frames === 120 && spent / 120 > 1000 / 35) goLite();
      }
      prev = now;
      draw(now);
      if (!still) raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf && visible) raf = requestAnimationFrame(tick);
    };

    layout();
    draw(performance.now());
    start();

    const ro = new ResizeObserver(() => {
      layout();
      draw(performance.now());
    });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => {
      visible = e ? e.isIntersecting : true;
      if (visible) start();
    });
    io.observe(box);
    const offLite = onLite(() => {
      layout();
      start();
    });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      offLite();
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [horizon, anchor, spread, sparks, density]);

  return (
    <div ref={boxRef} aria-hidden="true" className={"pointer-events-none absolute inset-0 " + className}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

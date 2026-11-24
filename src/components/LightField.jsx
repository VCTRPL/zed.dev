import { useEffect, useRef } from "react";
import { perf, onLite, goLite, prefersReducedMotion } from "../lib/perf";

/**
 * A curtain of fluid light rising from a glowing horizon.
 *
 * Not a set of bars: a fragment shader paints one continuous field of colour
 * (deep blue at the edges, warm white-orange at the core) and combs it into
 * fine vertical striations. The striations are noise that flows upward and
 * is bent by a slow, large-scale warp, so the whole surface moves like a
 * sheet of liquid light. It fills the entire box, top to bottom.
 *
 * horizon  where the light source sits (0..1 of the height, or of the viewport)
 * anchor   "viewport" measures the horizon against the window, "element" against the box
 * spread   width of the bright centre (0..1, default depends on screen size)
 * sparks   how many particles drift upward (multiplier)
 * density  how fine the striations are (multiplier)
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

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}

const vec3 NIGHT = vec3(0.020, 0.035, 0.110);
const vec3 DEEP  = vec3(0.075, 0.180, 0.560);
const vec3 BLUE  = vec3(0.184, 0.420, 1.000);
const vec3 SKY   = vec3(0.560, 0.700, 1.000);
const vec3 WARM  = vec3(1.000, 0.520, 0.300);
const vec3 HOT   = vec3(1.000, 0.945, 0.885);

// ---- colour ramps measured from the reference ------------------------------
// above the boundary, by distance d from it (0 = at the boundary)
vec3 coolRamp(float d) {
  vec3 c = vec3(235.0, 212.0, 206.0);
  c = mix(c, vec3(160.0, 195.0, 215.0), smoothstep(0.00, 0.04, d));
  c = mix(c, vec3( 90.0, 160.0, 205.0), smoothstep(0.04, 0.08, d));
  c = mix(c, vec3( 55.0, 115.0, 180.0), smoothstep(0.08, 0.14, d));
  c = mix(c, vec3( 35.0,  85.0, 155.0), smoothstep(0.14, 0.20, d));
  c = mix(c, vec3( 20.0,  52.0, 110.0), smoothstep(0.20, 0.28, d));
  c = mix(c, vec3(  8.0,  25.0,  65.0), smoothstep(0.28, 0.36, d));
  c = mix(c, vec3(  5.0,   8.0,  32.0), smoothstep(0.36, 0.48, d));
  c = mix(c, vec3(  6.0,   3.0,  22.0), smoothstep(0.48, 0.80, d));
  return c / 255.0;
}
// below the boundary, by depth e under it: peach, orange, deeper orange
vec3 warmRamp(float e) {
  vec3 c = vec3(235.0, 214.0, 208.0);
  c = mix(c, vec3(240.0, 200.0, 182.0), smoothstep(0.00, 0.05, e));
  c = mix(c, vec3(241.0, 188.0, 160.0), smoothstep(0.05, 0.10, e));
  c = mix(c, vec3(238.0, 165.0, 125.0), smoothstep(0.10, 0.15, e));
  c = mix(c, vec3(234.0, 142.0, 100.0), smoothstep(0.15, 0.20, e));
  c = mix(c, vec3(215.0, 112.0,  80.0), smoothstep(0.20, 0.30, e));
  c = mix(c, vec3(180.0,  85.0,  65.0), smoothstep(0.30, 0.45, e));
  return c / 255.0;
}
// the same depth at the far edges, where the warm light turns coral
vec3 coralRamp(float e) {
  vec3 c = vec3(140.0, 128.0, 150.0);
  c = mix(c, vec3(190.0, 136.0, 142.0), smoothstep(0.00, 0.08, e));
  c = mix(c, vec3(220.0, 136.0, 131.0), smoothstep(0.08, 0.14, e));
  c = mix(c, vec3(213.0, 113.0, 106.0), smoothstep(0.14, 0.20, e));
  c = mix(c, vec3(170.0,  75.0,  75.0), smoothstep(0.20, 0.35, e));
  return c / 255.0;
}

// Colour of the field at horizontal position ax (0 centre .. 1 edge) and
// height f (0 top .. 0.88 horizon, the reference's proportions).
float boundary(float ax) {
  return 0.55 + 0.29 * smoothstep(0.12, 0.55, ax) - 0.09 * smoothstep(0.85, 1.0, ax);
}

vec3 field(float ax, float f) {
  // the boundary: high in the middle, dropping toward the sides, rising again at the edges
  float b = boundary(ax);
  float d = b - f;
  vec3 cool = coolRamp(max(d, 0.0));
  // a brighter pale-blue column up the middle
  cool = mix(cool, coolRamp(max(d, 0.0) * 0.65), exp(-(ax * ax) / 0.02));
  // the blue darkens a little toward the sides
  cool *= mix(1.1, 0.95, smoothstep(0.1, 1.0, ax));
  // at the far edges the seam is a cool light blue, not white
  float edge = smoothstep(0.6, 1.0, ax);
  float seam = 1.0 - smoothstep(0.0, 0.1, d);
  cool = mix(cool, vec3(100.0, 125.0, 160.0) / 255.0, seam * edge * 0.8);
  float e = max(-d, 0.0);
  vec3 warm = mix(warmRamp(e), coralRamp(e), smoothstep(0.5, 0.95, ax));
  return mix(cool, warm, smoothstep(-0.015, 0.015, -d));
}

void main() {
  vec2 px = vec2(vUv.x * uRes.x, (1.0 - vUv.y) * uRes.y); // y down, like the DOM
  float t = uTime;
  float x = (px.x - 0.5 * uRes.x) / (0.5 * uRes.x);       // -1 .. 1
  float base = max(uBase, 1.0);
  float floorY = px.y - base;                              // > 0 below the horizon

  // ---- fine vertical lines that flow slowly upward and sway
  vec2 q = vec2(px.x / uRes.x * 2.6, px.y / uRes.y * 1.4);
  float w1 = fbm(q + vec2(0.0, t * 0.06)) - 0.5;
  float w2 = fbm(q * 1.7 + vec2(5.2, -t * 0.09)) - 0.5;
  float bend = w1 * 22.0 + w2 * 9.0;
  float cell = 10.0 / uDensity;                            // px per line
  float sx = (px.x + bend) / cell;
  float sy = px.y / uRes.y;
  float s1 = noise(vec2(sx * 0.35, sy * 1.6 + t * 0.22));
  float s2 = noise(vec2(sx * 0.8 + 17.0, sy * 3.0 + t * 0.35));
  // regular hairlines whose brightness drifts with the flow
  float comb = pow(0.5 + 0.5 * cos(6.2831853 * sx), 2.0);
  float streak = clamp(comb * (0.45 + 0.9 * (s1 * 0.6 + s2 * 0.4)), 0.0, 1.0);

  // the field is shaped by the horizon: f = 0.88 sits on it
  float f = px.y / base * 0.88;
  float ax = clamp(abs(x + bend / uRes.x * 0.6), 0.0, 1.0);
  // a slow breathing of the boundary keeps the light alive
  f += 0.012 * sin(t * 0.45 + x * 2.0);

  vec3 col;
  float lines;
  if (floorY <= 0.0) {
    col = field(ax, f);
    // lines read clearly in the blue and softly in the warm light
    float warmth = smoothstep(0.0, 0.08, f - boundary(ax));
    lines = mix(0.30, 0.14, warmth);
    col *= 1.0 - lines + lines * streak * 2.7; // the hairlines keep the average brightness
  } else {
    // ---- the floor mirrors the light, rippled and fading
    float my = base - floorY * 1.6;
    float rx = sin(floorY * 0.11 - t * 1.6) * (1.0 + floorY * 0.02) + sin(floorY * 0.035 + t * 0.7) * 3.0;
    float mx = clamp(abs((px.x + rx - 0.5 * uRes.x) / (0.5 * uRes.x)), 0.0, 1.0);
    col = field(mx, max(my, 0.0) / base * 0.88);
    col *= 0.8 + 0.4 * streak;
    col *= 0.5 * exp(-floorY / max((uRes.y - base) * 0.45, 1.0));
  }

  // ---- a soft seam of light along the horizon
  float dy = floorY / 18.0;
  col += vec3(1.0, 0.72, 0.52) * exp(-dy * dy) * exp(-(x * x) / 0.5) * 0.35;

  // ---- stars in the dark sky
  vec2 sg = px / 34.0;
  vec2 sid = floor(sg);
  float sh = hash(sid);
  if (sh > 0.93 && f < 0.3) {
    vec2 sp = fract(sg) - 0.5 - (vec2(hash(sid + 3.1), hash(sid + 7.7)) - 0.5) * 0.6;
    float tw = 0.5 + 0.5 * sin(t * (0.6 + sh * 2.0) + sh * 50.0);
    col += vec3(smoothstep(0.06, 0.0, length(sp)) * (0.25 + 0.55 * tw));
  }

  col = clamp(col, 0.0, 1.0);
  float a = max(col.r, max(col.g, col.b));
  gl_FragColor = vec4(col, a);
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
      // the hairlines are fine, so render at device resolution (lite: 3/4)
      const scale = perf.lite ? 0.75 : Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      const base = anchor === "viewport" ? Math.min(h - 40, window.innerHeight * horizon) : h * horizon;
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uBase, base);
      gl.uniform1f(uSpread, spread ?? (w < 640 ? 0.62 : 0.46));
      gl.uniform1f(uDensity, perf.lite ? Math.min(density, 1.6) : density);
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

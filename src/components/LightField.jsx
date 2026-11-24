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

void main() {
  vec2 px = vec2(vUv.x * uRes.x, (1.0 - vUv.y) * uRes.y); // y down, like the DOM
  float t = uTime;
  float x = (px.x - 0.5 * uRes.x) / (0.5 * uRes.x);       // -1 .. 1
  float above = (uBase - px.y) / max(uBase, 1.0);          // 0 at horizon, 1 at top
  float below = (px.y - uBase) / max(uRes.y - uBase, 1.0); // 0 at horizon, 1 at bottom

  // ---- the fluid: slow swirls bend the striations sideways
  vec2 q = vec2(px.x / uRes.x * 2.6, px.y / uRes.y * 1.4);
  float w1 = fbm(q + vec2(0.0, t * 0.06)) - 0.5;
  float w2 = fbm(q * 1.7 + vec2(5.2, -t * 0.09)) - 0.5;
  float bend = (w1 * 34.0 + w2 * 14.0);

  // ---- striations: noise stretched tall, flowing upward
  float cell = 11.0 / uDensity;                    // px per striation
  float sx = (px.x + bend) / cell;
  float sy = px.y / uRes.y;
  float s1 = noise(vec2(sx, sy * 1.6 + t * 0.22));
  float s2 = noise(vec2(sx * 2.3 + 17.0, sy * 3.0 + t * 0.35));
  float s3 = noise(vec2(sx * 0.45 + 3.0, sy * 0.8 + t * 0.12));
  float streak = s1 * 0.55 + s2 * 0.33 + s3 * 0.12;
  streak = smoothstep(0.15, 0.9, streak);

  // ---- shape of the light: a wide cone that rises from the horizon
  float env = exp(-(x * x) / (2.0 * uSpread * uSpread));
  float ragged = 0.75 + 0.5 * fbm(vec2(px.x / 140.0 + bend / 200.0, t * 0.08));
  float height = (0.4 + 0.75 * pow(env, 0.7)) * ragged;
  float rise = above > 0.0 ? exp(-above / max(height * 0.75, 0.05)) : 0.0;

  // a faint wash of striations over everything, so the field covers the page
  float wash = 0.34 * (1.0 - 0.4 * clamp(above, 0.0, 1.0)) * (0.6 + 0.4 * env);
  if (above < 0.0) wash *= exp(-below * 2.5);

  float body = rise * (0.35 + 0.65 * env);
  float I = (body + wash) * (0.55 + 0.7 * streak);
  float smoothI = body + wash;

  // ---- warm core: a soft flame-shaped glow just above the horizon
  float ay = max(above, 0.0);
  // a dome: wide at the horizon with a rounded top
  float flame = exp(-pow((x * x) / 0.09 + (ay * ay) / 0.14, 1.4)) * step(0.0, above);
  // a warm band hugging the horizon
  float band = exp(-ay / 0.07 - (x * x) / 0.4) * step(0.0, above);
  // warm shoulders: the glow spills out to the sides, tall in the middle and
  // sloping down toward the edges, hugging the horizon at the far ends
  float shoulder = 0.24 + 0.26 * exp(-(x * x) / 0.25);
  float skirt = exp(-pow(ay / shoulder, 1.3)) * (0.7 + 0.3 * exp(-(x * x) / 0.7)) * step(0.0, above);
  float coreHeat = clamp(flame * 1.0 + band * 0.75, 0.0, 1.0); // drives the white-hot centre
  float heat = clamp(coreHeat + skirt * 0.9, 0.0, 1.0);
  I += skirt * 0.22; // the warm shoulders glow on their own
  I += flame * 0.22 + band * 0.12;
  // the warm light is a soft glow, not striated
  I = mix(I, smoothI * 0.85 + flame * 0.18 + band * 0.1, heat * 0.6);

  // ---- reflection below the horizon
  if (above < 0.0) {
    float refl = exp(-below * 5.0) * (0.3 + 0.7 * env);
    I += refl * (0.45 + 0.5 * streak) * 0.85;
    heat = max(heat, exp(-below * 7.0) * (0.45 + 0.55 * exp(-(x * x) / 0.4)) * 0.75);
  }

  // ---- horizon glow: an ellipse of light, no hard line
  float dy = (px.y - uBase) / 22.0;
  float haze = exp(-dy * dy) * exp(-(x * x) / 0.18);
  I += haze * 0.55;
  heat = max(heat, haze);

  // ---- colour: blue body, warming toward the core
  vec3 cool = mix(NIGHT, DEEP, smoothstep(0.0, 0.25, I));
  cool = mix(cool, BLUE, smoothstep(0.2, 0.6, I));
  cool = mix(cool, SKY, smoothstep(0.8, 1.5, I));
  // orange in the middle, turning coral toward the edges
  vec3 edgeWarm = mix(WARM, vec3(0.98, 0.40, 0.38), smoothstep(0.25, 0.9, abs(x))) * 0.9;
  vec3 warm = mix(edgeWarm, HOT, smoothstep(1.05, 1.9, I * (0.5 + coreHeat)));
  // blue melts into warm through a soft lavender-rose, like a sunset gradient
  vec3 rose = mix(vec3(0.70, 0.72, 1.00), vec3(1.00, 0.72, 0.66), smoothstep(0.2, 0.6, heat));
  float roseAmt = smoothstep(0.0, 0.45, heat) * 0.6 * step(0.0, above);
  vec3 mid = mix(cool, max(cool, rose * (0.5 + 0.5 * clamp(I, 0.0, 1.0))), roseAmt);
  vec3 col = mix(mid, warm, smoothstep(0.3, 0.95, heat));
  float alpha = clamp(I * 1.15, 0.0, 1.0);

  // ---- stars in the dark sky
  vec2 sg = px / 34.0;
  vec2 sid = floor(sg);
  float sh = hash(sid);
  if (sh > 0.93 && above > 0.25) {
    vec2 sp = fract(sg) - 0.5 - (vec2(hash(sid + 3.1), hash(sid + 7.7)) - 0.5) * 0.6;
    float tw = 0.5 + 0.5 * sin(t * (0.6 + sh * 2.0) + sh * 50.0);
    float star = smoothstep(0.06, 0.0, length(sp)) * (0.25 + 0.55 * tw) * (1.0 - rise);
    col = mix(col, HOT, star);
    alpha = max(alpha, star);
  }

  // ---- sparks: motes of light drifting up out of the core
  if (uSparks > 0.0 && above > 0.0) {
    vec2 g = px / 26.0;
    float lane = floor(g.x);
    g.y += t * (0.5 + hash(vec2(lane, 1.0)) * 0.9);
    vec2 id = floor(g);
    float h = hash(id + vec2(0.0, 31.0));
    if (h > 1.0 - 0.06 * uSparks) {
      vec2 f = fract(g) - 0.5 - (vec2(hash(id + 1.3), hash(id + 5.9)) - 0.5) * 0.5;
      float m = smoothstep(0.09, 0.0, length(f)) * env * (1.0 - ay) * 0.9;
      col = mix(col, h > 1.0 - 0.03 * uSparks ? WARM : SKY, m);
      alpha = max(alpha, m);
    }
  }

  gl_FragColor = vec4(col * alpha, alpha);
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
      // the field is soft, so it renders below device resolution
      const scale = perf.lite ? 0.5 : Math.min(window.devicePixelRatio || 1, 2) * 0.6;
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

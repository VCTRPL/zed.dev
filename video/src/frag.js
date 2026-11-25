export const FRAG = `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes;       // CSS px
uniform float uTime;
uniform float uBase;     // horizon, px from the top
uniform float uSpread;
uniform float uDensity;
uniform float uSparks;
uniform float uPulse;
uniform float uGain;
uniform float uRise;

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
  // 3 octaves: the 4th added detail too fine to see at this resolution
  for (int i = 0; i < 3; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}

const vec3 NIGHT = vec3(0.020, 0.035, 0.110);
const vec3 DEEP  = vec3(0.075, 0.180, 0.560);
const vec3 BLUE  = vec3(0.184, 0.420, 1.000);
const vec3 SKY   = vec3(0.560, 0.700, 1.000);
const vec3 WARM  = vec3(1.000, 0.560, 0.330);
const vec3 HOT   = vec3(1.000, 0.945, 0.885);

void main() {
  vec2 screen = vec2(vUv.x * uRes.x, (1.0 - vUv.y) * uRes.y); // y down, like the DOM
  float t = uTime;
  float floorY = screen.y - uBase;                              // > 0 on the floor
  bool mirror = floorY > 0.0;

  // ---- the floor is a glossy surface: below the horizon we look up the
  // light at its mirrored position, squashed a little and rippled sideways
  vec2 px = screen;
  float reflection = 1.0;
  if (mirror) {
    px.y = max(uBase - floorY * 1.6, 0.0);
    px.x += sin(floorY * 0.11 - t * 1.6) * (1.0 + floorY * 0.02) + sin(floorY * 0.035 + t * 0.7) * 3.0;
    reflection = 0.62 * exp(-floorY / max((uRes.y - uBase) * 0.45, 1.0));
  }

  float x = (px.x - 0.5 * uRes.x) / (0.5 * uRes.x);       // -1 .. 1
  float above = (uBase - px.y) / max(uBase, 1.0);          // 0 at horizon, 1 at top

  // ---- the fluid: slow swirls bend the striations sideways
  vec2 q = vec2(px.x / uRes.x * 2.6, px.y / uRes.y * 1.4);
  float w1 = fbm(q + vec2(0.0, t * 0.06)) - 0.5;
  float w2 = fbm(q * 1.7 + vec2(5.2, -t * 0.09)) - 0.5;
  float bend = (w1 * 70.0 + w2 * 28.0);

  // ---- striations: noise stretched tall, flowing upward
  float cell = 15.0 / uDensity;                    // px per striation
  float sx = (px.x + bend) / cell;
  float sy = px.y / uRes.y;
  float s1 = noise(vec2(sx, sy * 1.6 + t * 0.22));
  float s2 = noise(vec2(sx * 2.3 + 17.0, sy * 3.0 + t * 0.35));
  float s3 = noise(vec2(sx * 0.45 + 3.0, sy * 0.8 + t * 0.12));
  float streak = s1 * 0.5 + s2 * 0.3 + s3 * 0.2;
  streak = smoothstep(0.18, 0.95, streak);
  streak = pow(streak, 1.35);

  // ---- shape of the light: a wide cone that rises from the horizon
  float env = exp(-(x * x) / (2.0 * uSpread * uSpread));
  float ragged = 0.75 + 0.5 * fbm(vec2(px.x / 140.0 + bend / 200.0, t * 0.08));
  float height = (0.28 + 0.72 * pow(env, 0.8)) * ragged * uRise;
  float rise = above > 0.0 ? exp(-above / max(height * 0.62, 0.05)) : 0.0;

  // a faint wash of striations over everything, so the field covers the page
  float wash = 0.26 * (1.0 - 0.45 * clamp(above, 0.0, 1.0)) * (0.55 + 0.45 * env);

  float body = rise * (0.35 + 0.65 * env);
  float I = (body + wash) * (0.25 + 1.05 * streak);

  // ---- warm core: a soft flame-shaped glow just above the horizon
  float ay = max(above, 0.0);
  float core = exp(-(x * x) / (0.1 + ay * 0.9) - ay * ay / 0.11) * step(0.0, above);
  // the warm light also spreads out to the sides, lower as it goes outward
  float wide = exp(-(x * x) / (2.0 * 0.62 * 0.62));
  float sideWarm = rise * smoothstep(1.0, 0.0, ay / (0.1 + 0.16 * wide)) * (1.0 - env * 0.85);
  float heat = clamp(core * 1.2 + body * env * env * 0.75 + sideWarm * 0.8, 0.0, 1.0);

  // the reflection is dimmer and fades with distance from the horizon
  I *= reflection;

  // ---- horizon glow: an ellipse of light, no hard line
  float sxh = (screen.x - 0.5 * uRes.x) / (0.5 * uRes.x);
  float dy = floorY / 22.0;
  float haze = exp(-dy * dy) * exp(-(sxh * sxh) / 0.24);
  I += haze * 0.55;
  heat = max(heat, haze);

  // a click on the orb sends a short surge through the warm core
  I *= 1.0 + uPulse * 0.45 * (core + env * 0.4);
  heat = clamp(heat + uPulse * core * 0.25, 0.0, 1.0);

  // ---- colour: blue body, warming toward the core
  vec3 cool = mix(NIGHT, DEEP, smoothstep(0.0, 0.25, I));
  cool = mix(cool, BLUE, smoothstep(0.2, 0.6, I));
  cool = mix(cool, SKY, smoothstep(0.65, 1.2, I));
  vec3 warm = mix(WARM, HOT, smoothstep(0.55, 1.3, I * (0.6 + heat)));
  vec3 col = mix(cool, warm, smoothstep(0.08, 0.7, heat));
  float alpha = clamp(I * 1.15, 0.0, 1.0);

  // ---- stars in the dark sky
  vec2 sg = px / 34.0;
  vec2 sid = floor(sg);
  float sh = hash(sid);
  if (sh > 0.93 && above > 0.25 && !mirror) {
    vec2 sp = fract(sg) - 0.5 - (vec2(hash(sid + 3.1), hash(sid + 7.7)) - 0.5) * 0.6;
    float tw = 0.5 + 0.5 * sin(t * (0.6 + sh * 2.0) + sh * 50.0);
    float star = smoothstep(0.06, 0.0, length(sp)) * (0.25 + 0.55 * tw) * (1.0 - rise);
    col = mix(col, HOT, star);
    alpha = max(alpha, star);
  }

  // ---- sparks: motes of light drifting up out of the core
  if (uSparks > 0.0 && above > 0.0 && !mirror) {
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

  alpha *= uGain;
  gl_FragColor = vec4(col * alpha, alpha);
}`;

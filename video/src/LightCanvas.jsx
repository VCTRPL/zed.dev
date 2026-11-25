import { useLayoutEffect, useRef } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { FRAG } from "./frag";

// The site's hero shader, driven by the video frame instead of the clock,
// so every render of a frame is identical.
const VERT = `attribute vec2 aPos; varying vec2 vUv;
void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.0,1.0); }`;

function setup(canvas) {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const a = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(a);
  gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
  const u = {};
  for (const n of ["uRes", "uTime", "uBase", "uSpread", "uDensity", "uSparks", "uPulse", "uGain", "uRise"])
    u[n] = gl.getUniformLocation(prog, n);
  return { gl, u };
}

export default function LightCanvas({ horizon, gain = 1, rise = 1, pulse = 0, spread = 0.62, density = 2.4, sparks = 1, scale = 0.5, timeOffset = 6 }) {
  const ref = useRef(null);
  const ctx = useRef(null);
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  // the shader thinks in CSS px of a phone-sized page; the video is 1080 wide
  const W = width / 2.4;
  const H = height / 2.4;

  useLayoutEffect(() => {
    const c = ref.current;
    if (!ctx.current) ctx.current = setup(c);
    const { gl, u } = ctx.current;
    c.width = Math.round(width * scale);
    c.height = Math.round(height * scale);
    gl.viewport(0, 0, c.width, c.height);
    gl.uniform2f(u.uRes, W, H);
    gl.uniform1f(u.uTime, timeOffset + frame / fps);
    gl.uniform1f(u.uBase, H * horizon);
    gl.uniform1f(u.uSpread, spread);
    gl.uniform1f(u.uDensity, density);
    gl.uniform1f(u.uSparks, sparks);
    gl.uniform1f(u.uPulse, pulse);
    gl.uniform1f(u.uGain, gain);
    gl.uniform1f(u.uRise, Math.max(rise, 0.001));
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  });

  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
}

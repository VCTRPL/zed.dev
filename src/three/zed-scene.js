import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Clock,
  Color,
  DirectionalLight,
  DoubleSide,
  EllipseCurve,
  ExtrudeGeometry,
  Group,
  LineBasicMaterial,
  LineLoop,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  Points,
  Scene,
  ShaderMaterial,
  Shape,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { perf } from "../lib/perf";

const BLUE = "#2f6bff";
const ORANGE = "#ffa463";

/**
 * The zed mark in chrome, orbited by a disc of glowing particles.
 * Drag to spin, click / Enter to send a shockwave through the disc.
 * Returns { dispose }.
 */
export default function createZedScene(canvas, host, still) {
  const renderer = new WebGLRenderer({ canvas, antialias: !perf.lite, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(perf.lite ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.6, 10);

  // a tiny studio of coloured light panels, baked into an environment map
  const pmrem = new PMREMGenerator(renderer);
  const studio = new Scene();
  studio.add(new Mesh(new SphereGeometry(30, 32, 16), new MeshBasicMaterial({ color: 0x05070b, side: BackSide })));
  const panel = (color, power, pw, ph, x, y, z) => {
    const m = new Mesh(new PlaneGeometry(pw, ph), new MeshBasicMaterial({ color: new Color(color).multiplyScalar(power), side: DoubleSide }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    studio.add(m);
  };
  panel(BLUE, 3.2, 16, 12, -13, 2, 5);
  panel(ORANGE, 4.5, 14, 6, 12, -5, 7);
  panel("#ffffff", 7, 20, 0.9, 0, 12, 3);
  panel("#80a6ff", 2.2, 10, 10, 5, 7, -13);
  panel(ORANGE, 2.5, 6, 14, -6, -2, -12);
  const env = pmrem.fromScene(studio, 0.035).texture;
  scene.environment = env;

  // anchor > hover tilt > drag spin
  const anchor = new Group();
  const hover = new Group();
  const spin = new Group();
  scene.add(anchor);
  anchor.add(hover);
  hover.add(spin);

  // the Z, extruded from the logo's outline
  const outline = [
    [103, 121], [381, 121], [381, 179], [187, 333], [381, 333],
    [381, 391], [110, 391], [110, 345], [300, 179], [103, 179],
  ];
  const shape = new Shape(outline.map(([x, y]) => new Vector2((x - 242) / 100, -(y - 256) / 100)));
  const zGeo = new ExtrudeGeometry(shape, {
    depth: 0.55,
    bevelEnabled: true,
    bevelThickness: 0.09,
    bevelSize: 0.065,
    bevelSegments: 8,
    curveSegments: 4,
  });
  zGeo.translate(0, 0, -0.275);
  const chrome = new MeshPhysicalMaterial({
    color: 0xeef1f6,
    metalness: 1,
    roughness: 0.16,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.35,
  });
  const mark = new Group();
  mark.add(new Mesh(zGeo, chrome));
  mark.position.x = -0.33;
  spin.add(mark);

  // the orange dot
  const dotAt = new Vector3(1.72, -0.77, 0);
  const dotMat = new MeshStandardMaterial({ color: ORANGE, emissive: new Color(ORANGE), emissiveIntensity: 2.2, roughness: 0.3 });
  const dot = new Mesh(new SphereGeometry(0.33, 48, 32), dotMat);
  dot.position.copy(dotAt);
  mark.add(dot);

  const glowTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(255,241,226,1)");
    grad.addColorStop(0.18, "rgba(255,164,99,.85)");
    grad.addColorStop(0.5, "rgba(255,164,99,.18)");
    grad.addColorStop(1, "rgba(255,164,99,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
  })();
  const halo = new Sprite(new SpriteMaterial({ map: glowTex, blending: AdditiveBlending, depthWrite: false, transparent: true }));
  halo.scale.setScalar(2.4);
  halo.position.copy(dotAt);
  mark.add(halo);

  const dotLight = new PointLight(ORANGE, 9, 7, 1.6);
  dotLight.position.copy(dotAt).add(new Vector3(0, 0, 0.6));
  mark.add(dotLight);

  const roamer = new PointLight(BLUE, 28, 14, 1.4);
  scene.add(roamer);
  const key = new DirectionalLight(0xffffff, 1.2);
  key.position.set(-3, 5, 4);
  scene.add(key, new AmbientLight(0x223355, 0.6));

  // particle disc
  const small = host.clientWidth < 520;
  const count = (small ? 1600 : 3200) / (perf.lite ? 2 : 1);
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const rnd = new Float32Array(count);
  const cBlue = new Color(BLUE);
  const cSky = new Color("#80a6ff");
  const cOrange = new Color(ORANGE);
  const c = new Color();
  for (let i = 0; i < count; i++) {
    const loose = Math.random() < 0.14;
    const r = loose ? 1.6 + Math.random() * 5.5 : 2.4 + Math.pow(Math.random(), 0.8) * 3.2;
    const a = Math.random() * Math.PI * 2;
    const y = (Math.random() + Math.random() + Math.random() - 1.5) * (loose ? 1.6 : 0.16 + r * 0.03);
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = Math.sin(a) * r;
    const t = Math.min(1, Math.max(0, (r - 2.4) / 3.2));
    c.copy(cOrange).lerp(cSky, t * 0.8).lerp(cBlue, Math.max(0, t - 0.5));
    if (Math.random() < 0.08) c.set("#fff1e2");
    col.set([c.r, c.g, c.b], i * 3);
    rnd[i] = Math.random();
  }
  const discGeo = new BufferGeometry();
  discGeo.setAttribute("position", new BufferAttribute(pos, 3));
  discGeo.setAttribute("color", new BufferAttribute(col, 3));
  discGeo.setAttribute("aRand", new BufferAttribute(rnd, 1));
  const uniforms = {
    uTime: { value: 0 },
    uWave: { value: 99 },
    uPixel: { value: renderer.getPixelRatio() * (small ? 3.4 : 4.2) },
  };
  const discMat = new ShaderMaterial({
    uniforms,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    vertexShader: `
      uniform float uTime; uniform float uWave; uniform float uPixel;
      attribute float aRand;
      varying vec3 vColor; varying float vA;
      void main() {
        vec3 p = position;
        float r = length(p.xz);
        float ang = atan(p.z, p.x) + uTime * (0.05 + 0.32 / r);
        // the shockwave: a ring that runs outward from the mark and fades
        float front = 1.2 + uWave * 6.0;
        float wave = exp(-pow((r - front) * 1.5, 2.0)) * exp(-uWave * 0.85);
        float rr = r + wave * 0.9;
        p.x = cos(ang) * rr;
        p.z = sin(ang) * rr;
        p.y += wave * (aRand - 0.5) * 1.6 + sin(uTime * 0.7 + aRand * 6.2831) * 0.05;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uPixel * (0.55 + aRand * 1.5) * (1.0 + wave * 2.4) * (7.0 / -mv.z);
        vColor = mix(color, vec3(1.0, 0.93, 0.85), clamp(wave * 1.4, 0.0, 1.0));
        vA = (0.6 + 0.4 * sin(uTime * 1.7 + aRand * 40.0)) * 1.25 + wave * 1.5;
      }`,
    fragmentShader: `
      varying vec3 vColor; varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vColor * a * vA, a * vA);
      }`,
  });
  const disc = new Group();
  disc.rotation.set(0.42, 0, -0.12);
  disc.add(new Points(discGeo, discMat));

  // two thin orbits, each with a little moon
  const orbit = (radius, color, opacity) => {
    const pts = new EllipseCurve(0, 0, radius, radius).getPoints(160).map((p) => new Vector3(p.x, 0, p.y));
    const line = new LineLoop(
      new BufferGeometry().setFromPoints(pts),
      new LineBasicMaterial({ color, transparent: true, opacity, blending: AdditiveBlending, depthWrite: false }),
    );
    const moon = new Mesh(new SphereGeometry(0.06, 16, 12), new MeshBasicMaterial({ color: "#fff1e2" }));
    const glow = new Sprite(new SpriteMaterial({ map: glowTex, blending: AdditiveBlending, depthWrite: false, transparent: true }));
    glow.scale.setScalar(0.7);
    moon.add(glow);
    disc.add(line, moon);
    return { moon, radius };
  };
  const orbits = [orbit(2.25, ORANGE, 0.45), orbit(3.1, "#80a6ff", 0.3)];
  anchor.add(disc);

  const resize = () => {
    const w = Math.max(1, host.clientWidth);
    const h = Math.max(1, host.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const halfH = camera.position.z * Math.tan(MathUtils.degToRad(camera.fov / 2));
    const halfW = halfH * camera.aspect;
    if (camera.aspect > 1.25) anchor.position.set(halfW * 0.38, -halfH * 0.2, 0);
    else anchor.position.set(0, -halfH * 0.32, 0);
    anchor.scale.setScalar(MathUtils.clamp(Math.min(1, (halfW * 2) / 9), 0.62, 0.82));
  };
  resize();

  const s = {
    rotY: -0.5, velY: 0, rotX: 0, velX: 0,
    dragging: false, lastX: 0, lastY: 0, downX: 0, downY: 0,
    hx: 0, hy: 0, tx: 0, ty: 0,
    pulseAt: -99, flash: 0, scale: 1, scaleVel: 0,
  };
  const clock = new Clock();
  let time = 0;

  const pulse = () => {
    s.pulseAt = clock.elapsedTime;
    s.flash = 1;
    s.scaleVel += 0.06;
  };
  const onDown = (e) => {
    s.dragging = true;
    s.lastX = s.downX = e.clientX;
    s.lastY = s.downY = e.clientY;
    host.setPointerCapture(e.pointerId);
    host.style.cursor = "grabbing";
  };
  const onMove = (e) => {
    const r = host.getBoundingClientRect();
    s.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    s.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    if (!s.dragging) return;
    const dx = e.clientX - s.lastX;
    const dy = e.clientY - s.lastY;
    s.lastX = e.clientX;
    s.lastY = e.clientY;
    s.velY = dx * 0.0085;
    s.velX = dy * 0.006;
    s.rotY += s.velY;
    s.rotX = MathUtils.clamp(s.rotX + s.velX, -0.7, 0.7);
  };
  const onUp = (e) => {
    if (!s.dragging) return;
    s.dragging = false;
    host.style.cursor = "grab";
    if (host.hasPointerCapture(e.pointerId)) host.releasePointerCapture(e.pointerId);
    if (Math.hypot(e.clientX - s.downX, e.clientY - s.downY) < 6) pulse();
  };
  const onLeave = () => {
    s.tx = 0;
    s.ty = 0;
  };
  const onKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pulse();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      s.velY -= 0.06;
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      s.velY += 0.06;
    }
  };
  host.addEventListener("pointerdown", onDown);
  host.addEventListener("pointermove", onMove);
  host.addEventListener("pointerup", onUp);
  host.addEventListener("pointercancel", onUp);
  host.addEventListener("pointerleave", onLeave);
  host.addEventListener("keydown", onKey);

  let raf = 0;
  let visible = true;
  const frame = () => {
    raf = 0;
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!still) time += dt;
    if (!s.dragging) {
      s.velY *= 0.94;
      s.rotY += s.velY + (still ? 0 : dt * 0.22 * (1 - Math.min(1, Math.abs(s.velY) * 30)));
      s.rotX += (0 - s.rotX) * 0.04;
    }
    s.hx += (s.tx - s.hx) * 0.06;
    s.hy += (s.ty - s.hy) * 0.06;
    spin.rotation.y = s.rotY;
    spin.rotation.x = s.rotX;
    hover.rotation.y = s.hx * 0.35;
    hover.rotation.x = s.hy * 0.22 + Math.sin(time * 0.8) * 0.04;
    hover.position.y = Math.sin(time * 1.1) * 0.08;

    s.flash *= 0.93;
    s.scaleVel += (1 - s.scale) * 0.14;
    s.scaleVel *= 0.8;
    s.scale += s.scaleVel;
    mark.scale.setScalar(s.scale);
    dotMat.emissiveIntensity = 2.2 + s.flash * 6;
    dotLight.intensity = 9 + s.flash * 30;
    halo.scale.setScalar(2.4 + s.flash * 2.2 + Math.sin(time * 2) * 0.12);
    roamer.position.set(Math.cos(time * 0.5) * 5, 2 + Math.sin(time * 0.7), Math.sin(time * 0.5) * 5);
    orbits.forEach((o, i) => {
      const a = time * (i ? -0.35 : 0.55) + i * 2;
      o.moon.position.set(Math.cos(a) * o.radius, 0, Math.sin(a) * o.radius);
    });

    camera.position.x += (s.hx * 0.5 - camera.position.x) * 0.05;
    camera.position.y += (0.6 - s.hy * 0.35 - camera.position.y) * 0.05;
    camera.lookAt(anchor.position.x * 0.4, anchor.position.y * 0.4, 0);
    uniforms.uTime.value = time;
    uniforms.uWave.value = clock.elapsedTime - s.pulseAt;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };
  const start = () => {
    if (!raf && visible) {
      clock.getDelta();
      raf = requestAnimationFrame(frame);
    }
  };
  start();

  const ro = new ResizeObserver(() => {
    resize();
    if (!raf) renderer.render(scene, camera);
  });
  ro.observe(host);
  const io = new IntersectionObserver(([e]) => {
    visible = e ? e.isIntersecting : true;
    if (visible) start();
  });
  io.observe(host);

  return {
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointercancel", onUp);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("keydown", onKey);
      scene.traverse((o) => {
        o.geometry?.dispose();
        const m = o.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m?.dispose();
      });
      glowTex.dispose();
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}

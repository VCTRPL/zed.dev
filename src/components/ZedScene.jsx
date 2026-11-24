import { useEffect, useRef, useState } from "react";

/**
 * The 3D zed mark. three.js is only downloaded when the card gets close to
 * the viewport; until then a glowing sphere stands in.
 */
export default function ZedScene({ className = "" }) {
  const boxRef = useRef(null);
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return;
    let scene;
    let cancelled = false;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        io.disconnect();
        import("../three/zed-scene.js")
          .then((mod) => {
            if (cancelled) return;
            scene = mod.default(canvas, box, still);
            setReady(true);
          })
          .catch(() => {});
      },
      { rootMargin: "300px" },
    );
    io.observe(box);
    return () => {
      cancelled = true;
      io.disconnect();
      scene?.dispose();
    };
  }, []);

  return (
    <div
      ref={boxRef}
      tabIndex={0}
      role="img"
      aria-label="Símbolo do zed.dev em 3D. Arraste para girar; Enter ou toque para pulsar."
      className={
        "cursor-grab touch-pan-y select-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--zed-orange)] " + className
      }
    >
      <canvas
        ref={canvasRef}
        className={"absolute inset-0 h-full w-full transition-opacity duration-700 " + (ready ? "opacity-100" : "opacity-0")}
      />
      <div
        aria-hidden="true"
        className={
          "pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-500 " +
          (ready ? "opacity-0" : "opacity-100")
        }
      >
        <div className="sphere" />
      </div>
    </div>
  );
}

import { useCallback, useEffect, useId, useRef, useState } from "react";
import "./glass-folder.css";
import { catchLight } from "../lib/light";

// Geometry of the folder, in its own 340 × 272 coordinate space.
const W = 340;
const H = 272;
const TOP_PAD = 54; // room above the folder for the lifted sheets
const FRONT_TOP = 74;
const FRONT_H = H - FRONT_TOP;
const SHEET_W = 272;
const SHEET_H = 184;
const MAX_SHEETS = 4;

const BACK_PATH =
  "M0 56A22 22 0 0 1 22 34L146 34C170 34 172 0 198 0L318 0A22 22 0 0 1 340 22L340 250A22 22 0 0 1 318 272L22 272A22 22 0 0 1 0 250Z";
const FRONT_PATH =
  "M0 22A22 22 0 0 1 22 0L118 0C144 0 146 32 172 32L318 32A22 22 0 0 1 340 54L340 " +
  (FRONT_H - 22) +
  "A22 22 0 0 1 318 " +
  FRONT_H +
  "L22 " +
  FRONT_H +
  "A22 22 0 0 1 0 " +
  (FRONT_H - 22) +
  "Z";

const countLabel = (n) => n + (n === 1 ? " arquivo" : " arquivos");

// Small deterministic PRNG so each sheet keeps the same jitter between renders.
function prng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}
// -1 … 1 across the visible sheets
const slotOf = (i, n) => (n <= 1 ? 0 : (i / (n - 1)) * 2 - 1);

/**
 * A smoked-glass folder. Hover lifts the sheets inside, click opens it and
 * fans them out; each sheet links to the project. The "···" key opens a menu.
 */
export default function GlassFolder({
  label = "Meus arquivos",
  meta,
  tone = "dark",
  image,
  cover,
  mark,
  status,
  live = false,
  files = [],
  action = "more",
  menu = [],
  labelPlacement = "bottom-left",
  width = 340,
  appear = true,
  appearDelay = 0,
  className,
}) {
  const uid = useId().replace(/:/g, "");
  const rootRef = useRef(null);
  const filesRef = useRef(null);
  const hitRef = useRef(null);
  const keyRef = useRef(null);
  const menuRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [entered, setEntered] = useState(!appear);
  const scale = width / W;

  // assemble the folder when it scrolls into view
  useEffect(() => {
    if (!appear) return;
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setEntered(true);
      return;
    }
    let timer = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          timer = window.setTimeout(() => setEntered(true), appearDelay);
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [appear, appearDelay]);

  // the rim catches the light (pointer on desktop, tilt on phones)
  useEffect(() => catchLight(rootRef.current), []);

  // tilt toward the pointer
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let raf = 0;
    let px = 0;
    let py = 0;
    const flush = () => {
      raf = 0;
      el.style.setProperty("--gf-px", px.toFixed(3));
      el.style.setProperty("--gf-py", py.toFixed(3));
    };
    const move = (e) => {
      if (e.pointerType === "touch") return;
      const r = el.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width) * 2 - 1;
      py = ((e.clientY - r.top) / r.height) * 2 - 1;
      raf ||= requestAnimationFrame(flush);
    };
    const leave = () => {
      px = 0;
      py = 0;
      raf ||= requestAnimationFrame(flush);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf);
    };
  }, []);

  // closed folder: sheets are not focusable
  useEffect(() => {
    filesRef.current?.toggleAttribute("inert", !open);
  }, [open]);

  const toggle = useCallback((next) => setOpen(next), []);

  // Escape and outside clicks close the menu first, then the folder
  useEffect(() => {
    if (!open && !menuOpen) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (menuOpen) {
        setMenuOpen(false);
        keyRef.current?.focus();
      } else {
        toggle(false);
        hitRef.current?.focus();
      }
    };
    const onDown = (e) => {
      const t = e.target;
      if (menuOpen && !menuRef.current?.contains(t) && !keyRef.current?.contains(t)) setMenuOpen(false);
      if (open && !menuOpen && !rootRef.current?.contains(t)) toggle(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, menuOpen, toggle]);

  useEffect(() => {
    if (menuOpen) menuRef.current?.querySelector("[role=menuitem]")?.focus();
  }, [menuOpen]);

  const items = [{ label: open ? "Fechar pasta" : "Abrir pasta", onSelect: () => toggle(!open) }, ...menu];

  const onMenuKey = (e) => {
    const all = Array.from(menuRef.current?.querySelectorAll("[role=menuitem]") ?? []);
    const at = all.indexOf(document.activeElement);
    const go = (i) => {
      e.preventDefault();
      all[(i + all.length) % all.length]?.focus();
    };
    if (e.key === "ArrowDown") go(at + 1);
    else if (e.key === "ArrowUp") go(at - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(all.length - 1);
    else if (e.key === "Tab") setMenuOpen(false);
  };

  const first = Math.max(0, files.length - MAX_SHEETS);
  const shown = files.slice(first);
  const metaText = meta ?? countLabel(files.length);

  return (
    <div
      ref={rootRef}
      className={"gf-root" + (className ? " " + className : "")}
      data-tone={tone}
      data-open={open || undefined}
      data-entered={entered || undefined}
      data-place={labelPlacement}
      data-light=""
      style={{ width, height: (H + TOP_PAD) * scale }}
    >
      <div className="gf-stage" style={{ transform: `translateY(${TOP_PAD * scale}px) scale(${scale})` }}>
        <div className="gf-tilt">
          <div className="gf-shadow" aria-hidden="true" />

          <div className="gf-back" style={{ clipPath: `path('${BACK_PATH}')` }} aria-hidden="true">
            {cover ? (
              <div
                className="gf-cover"
                style={{ "--c-base": cover.base, "--c-glow": cover.glow, "--c-accent": cover.accent }}
              >
                {cover.art && (
                  <img
                    className="gf-cover-art"
                    src={cover.art}
                    alt=""
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                    style={cover.artStyle}
                  />
                )}
              </div>
            ) : image && (
              <img
                className="gf-art"
                src={image}
                alt=""
                width={W + 24}
                height={H + 24}
                draggable={false}
                loading="lazy"
                decoding="async"
              />
            )}
            <div className="gf-back-sheen" />
            {mark && <span className="gf-mark">{mark}</span>}
            {status && (
              <span className="gf-status" data-live={live || undefined}>
                <i aria-hidden="true" />
                {status}
              </span>
            )}
          </div>
          <svg className="gf-rim gf-back-rim" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
            <path d={BACK_PATH} />
          </svg>

          <div className="gf-front" style={{ clipPath: `path('${FRONT_PATH}')` }}>
            <div className="gf-tint" aria-hidden="true" />
            <div className="gf-spec" aria-hidden="true" />
            <svg className="gf-rim gf-front-rim" viewBox={`0 0 ${W} ${FRONT_H}`} aria-hidden="true">
              <defs>
                <linearGradient id={"gf-rim-" + uid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
                  <stop offset="0.35" stopColor="#fff" stopOpacity="0.35" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0.12" />
                </linearGradient>
              </defs>
              <path d={FRONT_PATH} stroke={`url(#gf-rim-${uid})`} />
            </svg>
            {/* specular: the stretch of rim that faces the light lights up */}
            <svg className="gf-rim gf-front-spec" viewBox={`0 0 ${W} ${FRONT_H}`} aria-hidden="true">
              <path d={FRONT_PATH} />
            </svg>
            <button
              ref={hitRef}
              type="button"
              className="gf-hit"
              aria-expanded={open}
              aria-label={(open ? "Fechar " : "Abrir ") + label + (status ? ", " + status : "") + ", " + countLabel(files.length)}
              onClick={() => {
                setMenuOpen(false);
                toggle(!open);
              }}
            />
            <div className="gf-label">
              <span className="gf-title">{label}</span>
              <span className="gf-meta">{metaText}</span>
            </div>
          </div>

          <div ref={filesRef} className="gf-files" role="list" aria-label={"Conteúdo de " + label}>
            {shown.map((file, i) => {
              const rand = prng(hashString(file.name) + first + i);
              const style = {
                "--gf-slot": slotOf(i, shown.length),
                "--gf-depth": shown.length - 1 - i,
                "--gf-jx": ((rand() - 0.5) * 10).toFixed(2) + "px",
                "--gf-jr": ((rand() - 0.5) * 3.2).toFixed(2) + "deg",
                zIndex: i + 1,
              };
              return (
                <div role="listitem" className="gf-sheet-slot" key={file.name + i}>
                  <a className="gf-sheet gf-sheet--art" style={style} href={file.href} target="_blank" rel="noopener">
                    <img
                      className="gf-sheet-art"
                      src={file.image}
                      alt=""
                      width={SHEET_W}
                      height={SHEET_H}
                      draggable={false}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="gf-sheet-head">
                      <span className="gf-sheet-name">{file.name}</span>
                      {file.meta && <span className="gf-sheet-meta">{file.meta}</span>}
                    </span>
                  </a>
                </div>
              );
            })}
          </div>

          {action === "more" && (
            <>
              <button
                ref={keyRef}
                type="button"
                className="gf-key gf-key--more"
                aria-label={"Mais opções de " + label}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-controls={"gf-menu-" + uid}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <svg className="gf-glyph gf-glyph--more" viewBox="0 0 30 12" aria-hidden="true">
                  <rect x="1" y="1.5" width="8" height="9" rx="3.4" />
                  <rect x="11" y="1.5" width="8" height="9" rx="3.4" />
                  <rect x="21" y="1.5" width="8" height="9" rx="3.4" />
                </svg>
              </button>
              <div
                ref={menuRef}
                id={"gf-menu-" + uid}
                role="menu"
                aria-label={"Opções de " + label}
                className="gf-menu"
                data-open={menuOpen || undefined}
                onKeyDown={onMenuKey}
              >
                {items.map((item, i) => (
                  <button
                    key={item.label + i}
                    type="button"
                    role="menuitem"
                    tabIndex={menuOpen ? -1 : undefined}
                    disabled={!menuOpen}
                    className={"gf-menu-item" + (item.danger ? " gf-menu-item--danger" : "")}
                    onClick={() => {
                      setMenuOpen(false);
                      keyRef.current?.focus();
                      item.onSelect?.();
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

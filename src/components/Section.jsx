import { trackPointer } from "../data/site";

export function SectionTitle({ id, eyebrow, children, sub, className = "" }) {
  return (
    <div className={"reveal " + className}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 id={id} className="serif mt-6 max-w-[16ch] text-[46px] leading-[1] text-white md:text-[76px]">
        {children}
      </h2>
      {sub && <p className="mt-6 max-w-[54ch] text-[17px] leading-[1.65] text-[var(--zed-ink)]/80 md:text-[18px]">{sub}</p>}
    </div>
  );
}

const CORNERS = { tl: "0% 0%", tr: "100% 0%", bl: "0% 100%", br: "100% 100%" };

export function GlowCard({ className = "", corner = "tr", children }) {
  return (
    <div onPointerMove={trackPointer} className={"reveal glass card-lit flex flex-col overflow-hidden rounded-[28px] " + className}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(60% 70% at ${CORNERS[corner]}, rgb(255 164 99 / .18), rgb(47 107 255 / .12) 45%, transparent 75%)`,
        }}
      />
      {children}
    </div>
  );
}

export function CardText({ tool, title, line }) {
  return (
    <div className="p-7 md:p-8">
      <span className="mono text-[11px] uppercase tracking-[.16em] text-[var(--zed-orange)]">{tool}</span>
      <h3 className="mt-3 text-[24px] font-medium tracking-[-0.02em] text-white md:text-[26px]">{title}</h3>
      <p className="mt-2 max-w-[44ch] text-[15px] leading-[1.6] text-[var(--zed-ink)]/75">{line}</p>
    </div>
  );
}

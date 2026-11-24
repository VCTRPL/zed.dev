import { useEffect, useState } from "react";
import { ZedMark } from "./icons";
import { links, navItems } from "../data/site";

export default function Nav() {
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={
        "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-300 " +
        (scrolled || menu ? "border-white/[.07] bg-[#0b0d12]/70 backdrop-blur-xl" : "border-transparent")
      }
    >
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 px-5 md:h-20 md:px-8">
        <a href="#top" className="press flex items-center gap-2.5 text-[17px] font-medium tracking-tight" aria-label="zed.dev, início">
          <ZedMark className="h-6 w-6" />
          <span>
            zed<span className="text-[var(--zed-muted)]">.dev</span>
          </span>
        </a>

        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          {navItems.map(([label, href]) => (
            <a key={href} href={href} className="press rounded-full px-4 py-2 text-[14px] text-[var(--zed-ink)]/80 hover:text-white">
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={links.github}
            target="_blank"
            rel="noopener"
            className="press hidden h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-[14px] text-[var(--zed-ink)]/90 hover:border-white/30 hover:text-white lg:inline-flex"
          >
            <img src="/icons/github.svg" alt="" className="ic-ink h-4 w-4" />
            GitHub
          </a>
          <a
            href="#orcamento"
            className="press btn-white hidden h-10 items-center rounded-full px-5 text-[14px] font-medium sm:inline-flex"
          >
            Pedir um orçamento
          </a>
          <button
            type="button"
            aria-expanded={menu}
            aria-label="Menu"
            onClick={() => setMenu(!menu)}
            className="press glass grid h-11 w-11 place-items-center rounded-full md:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path
                d={menu ? "M4 4l10 10M14 4L4 14" : "M2 6h14M2 12h14"}
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {menu && (
        <div className="glass mx-4 mb-4 rounded-2xl p-2 md:hidden" onClick={() => setMenu(false)}>
          {navItems.map(([label, href]) => (
            <a key={href} href={href} className="block rounded-xl px-4 py-3.5 text-[17px] hover:bg-white/10">
              {label}
            </a>
          ))}
          <a href="#orcamento" className="btn-white mt-1 block rounded-xl px-4 py-3.5 text-[17px] font-medium">
            Pedir um orçamento
          </a>
        </div>
      )}
    </header>
  );
}

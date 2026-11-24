import { useEffect, useRef, useState } from "react";
import LightField from "./LightField";
import GlassFolder from "./GlassFolder";
import { Arrow, ZedMark } from "./icons";
import { delay, projects } from "../data/site";

function Stat({ n, label, align = "left", wait }) {
  return (
    <div className={"enter " + (align === "right" ? "text-right" : "")} style={delay(wait)}>
      <p className="serif text-[44px] leading-none text-white">{n}</p>
      <p className="mono mt-2.5 text-[11px] uppercase tracking-[.16em] text-[var(--zed-ink)]/70">{label}</p>
    </div>
  );
}

function RoundButton({ dir, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="press glass grid h-14 w-14 place-items-center rounded-full text-white hover:border-white/30"
    >
      <Arrow dir={dir} />
    </button>
  );
}

function ProjectSlot({ p, i, active, onActive }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.min(400, Math.floor(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={"reveal folder-slot w-full max-w-[400px] " + (active ? "is-on" : "")}
      onMouseEnter={onActive}
      onFocus={onActive}
    >
      <GlassFolder
        width={width}
        tone="dark"
        label={p.name}
        meta={(p.concept ? "Conceito · " : "") + p.tag}
        image={p.img}
        cover={p.cover}
        action="more"
        menu={[{ label: "Abrir o site", onSelect: () => window.open(p.href, "_blank", "noopener") }]}
        files={p.files.map(([name, meta, image]) => ({ name, meta, image, href: p.href }))}
        appearDelay={i * 120}
      />
      <p className="mt-1 px-1 text-[14px] leading-[1.5] text-[var(--zed-ink)]/80">{p.line}</p>
    </div>
  );
}

export default function Hero() {
  const [active, setActive] = useState(0);
  const step = (d) => setActive((v) => (v + d + projects.length) % projects.length);
  const current = projects[active];

  return (
    <section id="top" className="relative isolate overflow-hidden" aria-labelledby="hero-h">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[calc(100svh+340px)]">
        <LightField density={2.4} />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--zed-black)_0%,rgb(11_13_18/.55)_14%,transparent_32%,transparent_70%,var(--zed-black)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_40%,transparent_55%,rgb(11_13_18/.75)_100%)]" />
      </div>

      <div className="relative mx-auto max-w-[1320px] px-5 md:px-8">
        <div className="hero-out relative flex min-h-[86svh] flex-col items-center pt-[clamp(84px,13svh,112px)] text-center md:pt-[clamp(88px,13svh,144px)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[18%] -z-10 h-[52%] w-[min(900px,100%)] -translate-x-1/2 bg-[radial-gradient(50%_50%_at_50%_50%,rgb(11_13_18/.62),rgb(11_13_18/.3)_55%,transparent_80%)]"
          />
          <div className="absolute left-0 top-40 hidden flex-col gap-10 text-left xl:flex">
            <Stat n="4" label="projetos no ar" wait={420} />
            <Stat n="3D" label="em Three.js e WebGL" wait={500} />
          </div>
          <div className="absolute right-0 top-40 hidden flex-col gap-10 xl:flex">
            <Stat n="12" label="tecnologias" align="right" wait={460} />
            <Stat n="BH" label="Belo Horizonte, MG" align="right" wait={540} />
          </div>

          <div className="enter absolute left-0 top-[60svh] hidden md:block" style={delay(600)}>
            <RoundButton dir="left" onClick={() => step(-1)} label="Projeto anterior" />
          </div>
          <div className="enter absolute right-0 top-[60svh] hidden md:block" style={delay(600)}>
            <RoundButton dir="right" onClick={() => step(1)} label="Próximo projeto" />
          </div>

          <a
            href="#projetos"
            className="enter press glass inline-flex items-center gap-2.5 rounded-full py-1.5 pl-2 pr-4 text-[13px]"
            style={delay(0)}
          >
            <span className="mono rounded-full bg-[var(--zed-orange)] px-2 py-0.5 text-[11px] font-medium uppercase tracking-[.08em] text-[var(--zed-black)]">
              Novo
            </span>
            <span aria-live="polite">{current.name} no ar</span>
            <Arrow className="text-[var(--zed-ink)]/60" />
          </a>

          <h1
            id="hero-h"
            className="serif enter mt-[clamp(16px,3.4svh,32px)] max-w-[15ch] text-[54px] leading-[.98] text-white sm:text-[clamp(56px,9svh,76px)] lg:text-[clamp(64px,12svh,112px)]"
            style={delay(80)}
          >
            Sites e sistemas, do Figma ao <em className="hot italic">deploy</em>.
          </h1>

          <p
            className="mono enter mt-[clamp(14px,3svh,28px)] max-w-[54ch] text-[13px] leading-[1.8] text-[var(--zed-ink)] [text-shadow:0_1px_12px_rgb(11_13_18/.9)] md:text-[14px] lg:max-w-[66ch]"
            style={delay(160)}
          >
            Estúdio de desenvolvimento web em Belo Horizonte. React, Next.js e TypeScript, do primeiro layout ao site no ar.
          </p>

          <div
            className="enter mt-[clamp(18px,4svh,36px)] flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row"
            style={delay(240)}
          >
            <a
              href="#orcamento"
              className="press btn-primary inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-7 text-[15px] font-medium sm:w-auto"
            >
              Pedir um orçamento <Arrow />
            </a>
            <a
              href="#projetos"
              className="press glass inline-flex h-12 w-full items-center justify-center rounded-full !bg-[#0b0d12]/55 px-7 text-[15px] font-medium hover:border-white/30 sm:w-auto"
            >
              Ver os projetos
            </a>
          </div>

          <div className="enter mt-auto pb-6 pt-[clamp(14px,4.5svh,56px)]" style={delay(320)}>
            <a href="#projetos" aria-label="Ver os projetos" className="orb press">
              <ZedMark className="h-10 w-10 text-white" />
            </a>
          </div>
        </div>

        <div id="projetos" className="relative scroll-mt-24 pb-24 pt-10 md:pb-32">
          <div className="mb-6 flex items-end justify-between gap-4">
            <span className="eyebrow">Projetos recentes</span>
            <span className="mono text-[12px] text-[var(--zed-ink)]/60">
              0{active + 1} / 0{projects.length}
            </span>
          </div>
          <div className="desk relative rounded-[28px] border border-white/10 px-4 pb-8 pt-6 md:px-8">
            <div className="grid grid-cols-1 justify-items-center gap-x-6 gap-y-4 md:grid-cols-3">
              {projects.map((p, i) => (
                <ProjectSlot key={p.name} p={p} i={i} active={i === active} onActive={() => setActive(i)} />
              ))}
            </div>
            <p className="mono mt-2 text-center text-[11px] uppercase tracking-[.14em] text-[var(--zed-ink)]/55">
              <span className="hidden [@media(hover:hover)]:inline">Passe o mouse para espiar · clique para abrir</span>
              <span className="[@media(hover:hover)]:hidden">Toque para abrir · toque num arquivo para ver o site</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

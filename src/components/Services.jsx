import { CardText, GlowCard, SectionTitle } from "./Section";
import ZedScene from "./ZedScene";
import { stack } from "../data/site";

const k = "text-[#8fb0ff]";
const fn = "text-[var(--zed-orange)]";

function CodeSample() {
  return (
    <pre
      aria-hidden="true"
      className="mono mx-7 mb-7 mt-auto overflow-hidden rounded-[14px] border border-white/10 bg-black/40 p-4 text-[11px] leading-[1.75] sm:p-5 sm:text-[12.5px] text-[var(--zed-ink)]/80 md:mx-8 md:mb-8"
    >
      <span className="text-white/35">// api/estoque.ts</span>
      {"\n"}
      <span className={k}>export async function</span> <span className="text-white">GET</span>() {"{"}
      {"\n  "}
      <span className={k}>const</span> carros = <span className={k}>await</span> db.carro.<span className={fn}>findMany</span>({"{"}
      {"\n    "}where: {"{"} vendido: <span className={fn}>false</span> {"}"},{"\n  "}
      {"})"}
      {"\n  "}
      <span className={k}>return</span> Response.<span className={fn}>json</span>(carros){"\n"}
      {"}"}
    </pre>
  );
}

function FigmaSketch() {
  return (
    <div aria-hidden="true" className="relative mx-7 mb-7 mt-auto h-[200px] md:mx-8 md:mb-8">
      <div className="absolute left-0 top-2 w-[62%]">
        <p className="mono mb-1.5 text-[10px] text-[var(--zed-ink)]/50">Desktop · 1440</p>
        <div className="h-[150px] rounded-lg border border-white/15 bg-white/[.04] p-3">
          <div className="h-2 w-1/3 rounded bg-white/25" />
          <div className="mt-3 h-5 w-3/4 rounded bg-white/15" />
          <div className="mt-2 h-5 w-1/2 rounded bg-white/15" />
          <div className="mt-4 h-6 w-20 rounded-full bg-[var(--zed-blue)]" />
        </div>
      </div>
      <div className="absolute right-2 top-0 w-[30%]">
        <p className="mono mb-1.5 text-[10px] text-[var(--zed-ink)]/50">Mobile · 390</p>
        <div className="relative h-[180px] rounded-xl border border-[var(--zed-blue)] bg-white/[.06] p-2.5 shadow-[0_0_30px_-6px_rgb(47_107_255/.8)]">
          <div className="h-2 w-1/2 rounded bg-white/25" />
          <div className="mt-3 h-12 rounded bg-white/10" />
          <div className="mt-2 h-3 w-4/5 rounded bg-white/15" />
          <div className="mt-3 h-5 rounded-full bg-[var(--zed-blue)]" />
          {["-left-1 -top-1", "-right-1 -top-1", "-left-1 -bottom-1", "-right-1 -bottom-1"].map((pos) => (
            <span key={pos} className={"absolute h-2 w-2 border border-[var(--zed-blue)] bg-white " + pos} />
          ))}
          <span className="absolute -bottom-8 -left-10 flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M1 1l11 5-5 1.5L5.5 13z" fill="#ffa463" />
            </svg>
            <span className="mono rounded bg-[var(--zed-orange)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--zed-black)]">
              você
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Services() {
  return (
    <section id="servicos" className="relative isolate scroll-mt-20 pb-16 pt-24 md:pb-24 md:pt-36" aria-labelledby="servicos-h">
      <div className="horizon" />
      <div aria-hidden="true" className="bg-mesh" />
      <div aria-hidden="true" className="bg-grid" />
      <div className="mx-auto max-w-[1320px] px-5 md:px-8">
        <SectionTitle
          id="servicos-h"
          eyebrow="Serviços"
          sub="Do layout no Figma ao site publicado, feito pela mesma pessoa."
        >
          Quatro serviços, um só <em className="hot italic">responsável</em>.
        </SectionTitle>

        <div className="mt-14 grid grid-cols-1 gap-4 md:mt-20 md:grid-cols-12 md:gap-5">
          <GlowCard className="md:col-span-7" corner="tr">
            <CardText
              tool="Next.js"
              title="Sites e landing pages"
              line="Páginas rápidas e responsivas, com formulário ou WhatsApp para o cliente falar com você."
            />
            <div className="mt-auto px-7 md:px-8">
              <div className="overflow-hidden rounded-t-[14px] border border-b-0 border-white/15 bg-[#0e1117] shadow-[0_-20px_60px_-20px_rgb(47_107_255/.5)]">
                <div className="flex items-center gap-1.5 border-b border-white/10 px-3.5 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--zed-orange)]/80" />
                  <span className="mono mx-auto rounded-md bg-white/[.06] px-3 py-0.5 text-[11px] text-[var(--zed-ink)]/60">
                    seusite.com.br
                  </span>
                </div>
                <img src="/work/xcar.webp" alt="" className="aspect-[16/8] w-full object-cover object-top" loading="lazy" />
              </div>
            </div>
          </GlowCard>

          <GlowCard className="md:col-span-5" corner="tl">
            <CardText tool="Node.js" title="Sistemas e apps web" line="Catálogos, painéis e APIs REST ligados ao seu banco de dados." />
            <CodeSample />
          </GlowCard>

          <GlowCard className="md:col-span-5" corner="bl">
            <CardText
              tool="Figma"
              title="Design de interface"
              line="As telas desenhadas no Figma antes do código, para você aprovar."
            />
            <FigmaSketch />
          </GlowCard>

          <GlowCard className="min-h-[480px] md:col-span-7 md:min-h-[460px]" corner="br">
            <ZedScene className="absolute inset-0" />
            <div className="pointer-events-none relative z-10 max-w-[340px]">
              <CardText
                tool="Three.js"
                title="Experiências em 3D"
                line="Modelos interativos no navegador, como a logo girando da XCAR."
              />
            </div>
            <p className="mono pointer-events-none absolute bottom-6 left-7 z-10 flex items-center gap-2 text-[11px] uppercase tracking-[.14em] text-[var(--zed-ink)]/65 md:left-8">
              <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--zed-orange)]" />
              <span className="sm:hidden">Arraste · toque</span>
              <span className="hidden sm:inline">Arraste para girar · toque para pulsar</span>
            </p>
          </GlowCard>
        </div>

        <div className="mt-16 md:mt-24">
          <p className="mono text-center text-[12px] uppercase tracking-[.16em] text-[var(--zed-ink)]/60">As ferramentas de todo dia</p>
          <div
            className="marquee mt-6 overflow-hidden"
            role="img"
            aria-label="Tecnologias: React, Next.js, TypeScript, JavaScript, Three.js, Tailwind, Node.js, Java, Python, Figma, GitHub e Vercel"
          >
            <div className="marquee__track" aria-hidden="true">
              {[...stack, ...stack].map(([label, icon, ink], i) => (
                <span
                  key={i}
                  className="glass inline-flex items-center gap-3 rounded-full py-2.5 pl-3 pr-5 text-[15px] text-[var(--zed-ink)]/90"
                >
                  <img src={`/icons/${icon}.svg`} alt="" className={"h-6 w-6 object-contain " + (ink ? "ic-ink" : "")} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

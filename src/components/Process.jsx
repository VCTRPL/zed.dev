import LightField from "./LightField";
import { SectionTitle } from "./Section";
import { steps, trackPointer } from "../data/site";

export default function Process() {
  return (
    <section id="processo" className="relative isolate scroll-mt-20 overflow-clip py-24 md:py-36" aria-labelledby="processo-h">
      <div className="horizon" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-[78%]">
        <LightField anchor="element" horizon={0.9} spread={0.35} sparks={0.5} />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--zed-black)_0%,rgb(11_13_18/.4)_45%,rgb(11_13_18/.55)_100%)]" />
      </div>

      <div className="mx-auto max-w-[1320px] px-5 md:px-8">
        <SectionTitle
          id="processo-h"
          eyebrow="Processo"
          sub="Uma pessoa cuida do projeto inteiro. Você fala direto com quem desenha as telas e escreve o código."
          className="mx-auto max-w-[900px] text-center [&_h2]:mx-auto [&_p]:mx-auto"
        >
          Do primeiro traço ao site <em className="hot italic">no ar</em>.
        </SectionTitle>

        <div aria-hidden="true" className="relative mt-16 hidden h-px lg:mt-24 lg:block">
          <div className="flowline" />
          <div className="absolute inset-x-0 -top-[5px] grid grid-cols-4 gap-5">
            {steps.map((s) => (
              <span key={s.title} className="node mx-auto" />
            ))}
          </div>
        </div>

        <ol className="relative mt-16 grid gap-4 sm:grid-cols-2 md:mt-24 lg:mt-8 lg:grid-cols-4 lg:gap-5">
          {steps.map((s, i) => (
            <li
              key={s.title}
              onPointerMove={trackPointer}
              className="reveal stack-card glass card-lit lift relative rounded-[24px] p-6 md:p-7"
              style={{ "--i": i }}
            >
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[.06]">
                  <img src={`/icons/${s.icon}.svg`} alt="" className={"h-6 w-6 object-contain " + (s.ink ? "ic-ink" : "")} />
                </span>
                <span className="serif text-[40px] leading-none text-white/25">0{i + 1}</span>
              </div>
              <h3 className="mt-10 text-[21px] font-medium text-white">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-[1.55] text-[var(--zed-ink)]/75">{s.line}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

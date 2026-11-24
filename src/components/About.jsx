import LightField from "./LightField";
import { SectionTitle } from "./Section";
import { Arrow, ZedMark } from "./icons";
import { links, trackPointer } from "../data/site";

const facts = [
  ["Nome", "Victor Reis Silva de Paula"],
  ["Formação", "Engenharia de Software, PUC Minas"],
  ["Base", "Belo Horizonte, MG"],
  ["Idiomas", "Português e inglês fluente"],
];

const promises = [
  "Você aprova o layout antes de qualquer linha de código.",
  "Site responsivo, do celular ao monitor.",
  "O código fica com você, no seu GitHub.",
];

export default function About() {
  return (
    <section id="sobre" className="relative scroll-mt-20 py-24 md:py-36" aria-labelledby="sobre-h">
      <div className="horizon" />
      <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-5 md:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <SectionTitle id="sobre-h" eyebrow="Sobre">
            Quem faz o <em className="hot italic">zed.dev</em>.
          </SectionTitle>

          <div className="reveal mt-8 max-w-[58ch] space-y-5 text-[17px] leading-[1.7] text-[var(--zed-ink)]/85 md:text-[18px]">
            <p>
              Sou <strong className="font-medium text-white">Victor Reis Silva de Paula</strong>, desenvolvedor web em Belo
              Horizonte e o responsável pelo zed.dev. Curso Engenharia de Software na PUC Minas e levo o que aprendo para
              sites feitos para trazer clientes: páginas rápidas, sistemas sob medida e experiências em 3D que fazem a marca
              ser lembrada.
            </p>
            <p>
              No zed.dev você fala direto comigo, do primeiro esboço ao site no ar. Desenho as telas no Figma, programo em
              React, Next.js e TypeScript e publico no domínio que você escolher. Quem atende é quem constrói.
            </p>
            <p>
              Falo inglês fluente, então estudo direto na documentação original e acompanho as ferramentas novas assim que
              saem. O primeiro cliente foi a XCAR Veículos, em Betim.
            </p>
          </div>

          <dl className="reveal mt-10 grid gap-2.5 sm:grid-cols-2">
            {facts.map(([k, v]) => (
              <div key={k} onPointerMove={trackPointer} className="glass card-lit rounded-2xl px-5 py-4">
                <dt className="mono text-[11px] uppercase tracking-[.16em] text-[var(--zed-orange)]">{k}</dt>
                <dd className="mt-1.5 text-[15px] text-white">{v}</dd>
              </div>
            ))}
          </dl>

          <ul className="reveal mt-8 grid gap-3 text-[15px] text-[var(--zed-ink)]/85">
            {promises.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--zed-orange)] shadow-[0_0_10px_2px_rgb(255_164_99/.6)]"
                />
                {p}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap gap-3">
            {[
              ["LinkedIn", links.linkedin],
              ["GitHub", links.github],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener"
                className="press glass inline-flex h-11 items-center gap-2 rounded-full px-5 text-[14px] hover:border-white/30"
              >
                {label} <Arrow dir="up-right" />
              </a>
            ))}
          </div>
        </div>

        <div
          onPointerMove={trackPointer}
          className="glass card-lit relative mx-auto aspect-square w-full max-w-[540px] rounded-[32px] lg:mr-0"
        >
          <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden rounded-[32px]">
            <LightField anchor="element" horizon={0.74} spread={0.4} sparks={0.4} density={2.4} />
            <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_30%,transparent_40%,rgb(11_13_18/.7)_100%)]" />
          </div>
          <div className="absolute inset-x-0 top-[16%] flex justify-center">
            <ZedMark className="h-[44%] w-[44%] text-white drop-shadow-[0_0_40px_rgb(255_164_99/.45)]" />
          </div>
          <div className="absolute inset-x-6 bottom-6 flex items-center justify-between">
            <span className="mono text-[12px] uppercase tracking-[.16em] text-white/80">zed.dev</span>
            <span className="mono text-[12px] uppercase tracking-[.16em] text-white/80">Est. 2026 · BH</span>
          </div>
        </div>
      </div>
    </section>
  );
}

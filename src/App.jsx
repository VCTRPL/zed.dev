import { useEffect } from "react";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Process from "./components/Process";
import About from "./components/About";
import Quote from "./components/Quote";
import HalftoneFooter from "./components/HalftoneFooter";
import { links } from "./data/site";

// Reveal blocks as they enter the viewport. Time-based (not tied to the scroll
// position) so it reads on desktop too, where a wheel step jumps far; blocks
// that share a parent come in one after another.
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    els.forEach((el) => {
      const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
      el.style.setProperty("--rd", Math.min(siblings.indexOf(el), 4) * 90 + "ms");
    });
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -10% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

const footerColumns = [
  {
    title: "Projetos",
    links: [
      { label: "XCAR Veículos", href: "https://xcar-theta.vercel.app" },
      { label: "Oi Veículos", href: "https://oi-veiculos.vercel.app" },
      { label: "Portfólio 3D", href: "https://vctrpl.vercel.app" },
    ],
  },
  {
    title: "Estúdio",
    links: [
      { label: "Serviços", href: "#servicos" },
      { label: "Processo", href: "#processo" },
      { label: "Orçamento", href: "#orcamento" },
    ],
  },
  {
    title: "Contato",
    links: [
      { label: "WhatsApp", href: links.whatsapp },
      { label: "LinkedIn", href: links.linkedin },
      { label: "GitHub", href: links.github },
      { label: "Instagram", href: links.instagram },
    ],
  },
];

export default function App() {
  useReveal();

  return (
    <>
      <div className="scroll-progress" aria-hidden="true" />
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-black"
      >
        Pular para o conteúdo
      </a>
      <Nav />
      <main id="conteudo">
        <Hero />
        <Services />
        <Process />
        <About />
        <Quote />
      </main>
      <div className="relative">
        <div className="horizon z-10" />
        <div className="aurora" aria-hidden="true">
          <span className="a1" />
          <span className="a2" />
          <span className="a3" />
          <span className="a4" />
        </div>
        <HalftoneFooter
          wordmark="ZED"
          label="zed.dev · Victor Paula"
          meta="©2026 · Belo Horizonte, MG"
          columns={footerColumns}
          height="620px"
        />
      </div>
    </>
  );
}

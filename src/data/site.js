export const links = {
  whatsapp: "https://wa.me/5531997777135",
  linkedin: "https://www.linkedin.com/in/victor-paula-3b6a603b3/",
  github: "https://github.com/VCTRPL",
  instagram: "https://www.instagram.com/victor3rp/",
  email: "victorreis200813@gmail.com",
};

export const projects = [
  {
    name: "XCAR Veículos",
    tag: "Next.js 15 · 3D",
    line: "Site da loja em Betim com a logo em 3D, estoque com fotos e WhatsApp.",
    img: "/work/xcar.webp",
    files: [
      ["Início", "Home", "/work/xcar.webp"],
      ["Estoque", "Grade", "/work/xcar-2.webp"],
      ["Veículos", "Fichas", "/work/xcar-3.webp"],
    ],
    alt: "Página inicial da XCAR Veículos com a logo vermelha em 3D",
    cover: { base: "#1c0608", glow: "rgba(226, 36, 47, .85)", accent: "rgba(255, 120, 90, .35)" },
    href: "https://xcar-theta.vercel.app",
  },
  {
    name: "Oi Veículos",
    tag: "Next.js · TypeScript",
    line: "Proposta de vitrine para uma loja de seminovos, com um carro em 3D na abertura.",
    concept: true,
    img: "/work/oiveiculos-2.webp",
    files: [
      ["Abertura", "Conceito", "/work/oiveiculos.webp"],
      ["Destaque 3D", "WebGL", "/work/oiveiculos-2.webp"],
    ],
    alt: "Seção da Oi Veículos com um carro esportivo azul em 3D",
    cover: { base: "#050c22", glow: "rgba(47, 107, 255, .85)", accent: "rgba(128, 176, 255, .35)" },
    href: "https://oi-veiculos.vercel.app",
  },
  {
    name: "Portfólio 3D",
    tag: "Three.js · React",
    line: "Um escritório retrô: ligue o computador e o currículo abre na tela CRT.",
    img: "/work/portfolio3d.webp",
    files: [
      ["Escritório", "Cena 3D", "/work/portfolio3d.webp"],
      ["À noite", "Luz", "/work/portfolio3d-2.webp"],
      ["Currículo", "CRT", "/work/curriculo.webp"],
    ],
    alt: "Escritório 3D à noite com um computador dos anos 80 sobre a mesa",
    cover: { base: "#14081c", glow: "rgba(255, 122, 61, .8)", accent: "rgba(176, 75, 214, .45)" },
    href: "https://vctrpl.vercel.app",
  },
];

// [label, icon file in /public/icons, needs inverting on dark]
export const stack = [
  ["React", "react"],
  ["Next.js", "nextjs"],
  ["TypeScript", "typescript"],
  ["JavaScript", "javascript"],
  ["Three.js", "threejs", true],
  ["Tailwind", "tailwindcss"],
  ["Node.js", "nodejs"],
  ["Java", "java"],
  ["Python", "python"],
  ["Figma", "figma"],
  ["GitHub", "github", true],
  ["Vercel", "vercel", true],
];

export const steps = [
  { icon: "figma", title: "Layout", line: "As telas no Figma, aprovadas por você antes do código." },
  { icon: "react", title: "Código", line: "React e Next.js, responsivo do celular ao monitor." },
  { icon: "github", title: "Revisão", line: "Cada mudança fica registrada no GitHub do projeto.", ink: true },
  { icon: "vercel", title: "Publicação", line: "O site no ar pela Vercel, no domínio que você escolher.", ink: true },
];

export const navItems = [
  ["Projetos", "#projetos"],
  ["Serviços", "#servicos"],
  ["Processo", "#processo"],
  ["Sobre", "#sobre"],
];

// Stagger helper for the `.enter` animation.
export const delay = (ms) => ({ "--d": ms + "ms" });

// Moves the card-lit spotlight to the pointer.
export const trackPointer = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", e.clientX - r.left + "px");
  e.currentTarget.style.setProperty("--my", e.clientY - r.top + "px");
};

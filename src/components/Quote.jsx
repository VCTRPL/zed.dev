import { useState } from "react";
import { SectionTitle } from "./Section";
import { Arrow } from "./icons";
import { links, trackPointer } from "../data/site";

const MESSAGES = {
  nome: "Escreva seu nome.",
  email: "Escreva um e-mail com @, como nome@empresa.com.br.",
  tipo: "Escreva o tipo de projeto, como site, loja ou sistema.",
  mensagem: "Conte em uma frase o que o projeto precisa fazer.",
};

const channels = [
  ["WhatsApp", "Conversar agora", links.whatsapp],
  ["LinkedIn", "Ver o perfil", links.linkedin],
  ["GitHub", "Ver o código", links.github],
];

export default function Quote() {
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const next = {};
    if (!data.nome?.trim()) next.nome = MESSAGES.nome;
    if (!/^\S+@\S+\.\S+$/.test(data.email || "")) next.email = MESSAGES.email;
    if (!data.tipo?.trim()) next.tipo = MESSAGES.tipo;
    if (!data.mensagem?.trim()) next.mensagem = MESSAGES.mensagem;
    setErrors(next);

    const missing = Object.keys(next);
    if (missing.length) {
      setStatus(missing.length === 1 ? "Falta 1 campo." : `Faltam ${missing.length} campos.`);
      document.getElementById("f-" + missing[0])?.focus();
      return;
    }
    setStatus("Abrindo o seu aplicativo de e-mail com o pedido pronto.");
    const body = `Nome: ${data.nome}\nE-mail: ${data.email}\nTipo de projeto: ${data.tipo}\n\n${data.mensagem}`;
    window.location.href = `mailto:${links.email}?subject=${encodeURIComponent("Orçamento: " + data.tipo)}&body=${encodeURIComponent(body)}`;
  };

  const fieldClass = (name) =>
    "field w-full rounded-xl border bg-black/30 px-4 text-[16px] text-white " +
    (errors[name] ? "border-[var(--zed-orange)]" : "border-white/15");

  const fieldProps = (name) => ({
    id: "f-" + name,
    name,
    "aria-invalid": !!errors[name],
    "aria-describedby": errors[name] ? `f-${name}-err` : undefined,
  });

  const Field = (name, label, input) => (
    <div>
      <label htmlFor={"f-" + name} className="text-[14px] text-[var(--zed-ink)]/90">
        {label}
      </label>
      <div className="mt-2">{input}</div>
      {errors[name] && (
        <p id={`f-${name}-err`} className="mt-2 text-[14px] text-[var(--zed-orange)]">
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <section id="orcamento" className="relative isolate scroll-mt-20 overflow-hidden py-24 md:py-36" aria-labelledby="orcamento-h">
      <div aria-hidden="true" className="bg-mesh bg-mesh--warm" />
      <div className="horizon" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(45%_55%_at_78%_100%,rgb(255_164_99/.22),rgb(47_107_255/.14)_45%,transparent_75%),radial-gradient(30%_40%_at_0%_20%,rgb(47_107_255/.14),transparent_70%)]"
      />
      <div className="mx-auto grid max-w-[1320px] gap-12 px-5 md:px-8 lg:grid-cols-[5fr_1fr_6fr] lg:gap-0">
        <div>
          <SectionTitle
            id="orcamento-h"
            eyebrow="Orçamento"
            sub="Você recebe uma proposta com escopo, prazo e preço. Se preferir conversar antes, me chame em um destes canais."
          >
            Conte o que você <em className="hot italic">precisa</em>.
          </SectionTitle>
          <ul className="mt-10 grid gap-2.5">
            {channels.map(([name, action, href]) => (
              <li key={href}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener"
                  onPointerMove={trackPointer}
                  className="glass card-lit press group flex items-center justify-between rounded-2xl px-5 py-4 hover:border-white/30"
                >
                  <span>
                    <span className="mono block text-[11px] uppercase tracking-[.16em] text-[var(--zed-orange)]">{name}</span>
                    <span className="mt-1 block text-[16px] text-white">{action}</span>
                  </span>
                  <Arrow dir="up-right" className="text-[var(--zed-ink)]/60 transition-colors duration-200 group-hover:text-white" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <form
          noValidate
          onSubmit={submit}
          onPointerMove={trackPointer}
          className="glass card-lit grid gap-5 self-start rounded-[28px] p-6 md:p-9 lg:col-start-3"
        >
          <div className="flex items-center justify-between">
            <span className="eyebrow">Pedido de orçamento</span>
            <span className="mono text-[12px] text-[var(--zed-ink)]/60">4 campos</span>
          </div>
          {Field("nome", "Nome", <input {...fieldProps("nome")} autoComplete="name" className={fieldClass("nome") + " h-12"} />)}
          {Field(
            "email",
            "E-mail",
            <input {...fieldProps("email")} type="email" inputMode="email" autoComplete="email" className={fieldClass("email") + " h-12"} />,
          )}
          {Field(
            "tipo",
            "Tipo de projeto",
            <input
              {...fieldProps("tipo")}
              autoComplete="off"
              placeholder="Site, loja, sistema…"
              className={fieldClass("tipo") + " h-12 placeholder:text-white/30"}
            />,
          )}
          {Field("mensagem", "Sobre o projeto", <textarea {...fieldProps("mensagem")} rows={5} className={fieldClass("mensagem") + " resize-y py-3"} />)}
          <button
            type="submit"
            className="press btn-primary mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-medium"
          >
            Pedir um orçamento <Arrow />
          </button>
          <p role="status" className="min-h-[1.5em] text-[14px] text-[var(--zed-muted)]">
            {status}
          </p>
        </form>
      </div>
    </section>
  );
}

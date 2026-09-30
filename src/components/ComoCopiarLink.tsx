"use client";

import { ChevronDown, HelpCircle } from "lucide-react";

const GUIAS: { titulo: string; passos: string[] }[] = [
  {
    titulo: "No YouTube",
    passos: [
      "Abaixo do vídeo, toque em Compartilhar.",
      "Toque em Copiar link.",
      "Volte aqui e toque em Colar.",
    ],
  },
  {
    titulo: "No TikTok, Instagram ou Kwai",
    passos: [
      "Toque no botão de compartilhar (a setinha ou o aviãozinho de papel).",
      "Toque em Copiar link.",
      "Volte aqui e toque em Colar.",
    ],
  },
  {
    titulo: "No WhatsApp, se recebeu um link",
    passos: [
      "Toque e segure a mensagem com o link.",
      "Toque em Copiar.",
      "Volte aqui e toque em Colar. Pode colar a mensagem inteira: nós achamos o link.",
    ],
  },
  {
    titulo: "No WhatsApp, se o vídeo veio como arquivo (sem link)",
    passos: [
      "Abra o vídeo no WhatsApp.",
      "Toque em Compartilhar ou nos três pontinhos e escolha Salvar.",
      "Volte aqui, toque em Ou envie um vídeo do celular e escolha o vídeo.",
    ],
  },
];

export default function ComoCopiarLink() {
  return (
    <details className="group mx-auto mt-4 max-w-xl rounded-xl border-2 border-gray-300 bg-white text-left">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-4 py-2 text-base font-semibold text-blue-800 hover:bg-blue-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          <HelpCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          Não sabe copiar o link? Veja como
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>

      <div className="grid grid-cols-1 gap-4 border-t-2 border-gray-200 px-4 py-4">
        {GUIAS.map((guia) => (
          <section key={guia.titulo}>
            <h3 className="text-lg font-bold text-gray-900">{guia.titulo}</h3>
            <ol className="mt-2 space-y-2">
              {guia.passos.map((passo, i) => (
                <li key={i} className="flex items-start gap-3 text-base leading-relaxed text-gray-800">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <span>{passo}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </details>
  );
}

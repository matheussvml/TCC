"use client";

import { Volume2, Square } from "lucide-react";
import { falar, parar, useVoz } from "@/lib/voz";

interface BotaoOuvirProps {
  id: string;
  texto: string;
  rotulo?: string;
}

// Some sozinho em navegador sem voz. Enquanto lê, vira "Parar".
export default function BotaoOuvir({ id, texto, rotulo = "Ouvir" }: BotaoOuvirProps) {
  const { falando, suportada } = useVoz();
  if (!suportada) return null;

  const ativo = falando === id;
  return (
    <button
      type="button"
      onClick={() => (ativo ? parar() : falar(id, texto))}
      className={`inline-flex min-h-12 items-center gap-2 rounded-xl border-2 px-4 py-2 text-base font-bold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${
        ativo
          ? "border-blue-800 bg-blue-700 text-white hover:bg-blue-800"
          : "border-blue-700 bg-white text-blue-800 hover:bg-blue-50"
      }`}
    >
      {ativo ? (
        <>
          <Square className="h-5 w-5 fill-current" aria-hidden="true" />
          Parar de ler
        </>
      ) : (
        <>
          <Volume2 className="h-5 w-5" aria-hidden="true" />
          {rotulo}
        </>
      )}
    </button>
  );
}

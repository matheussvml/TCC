"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { Accessibility, ChevronDown, RotateCcw, X } from "lucide-react";
import {
  PREFERENCIAS_PADRAO,
  aplicarPreferencias,
  lerPreferencias,
  salvarPreferencias,
  type PreferenciasA11y,
  type TamanhoFonte,
} from "@/lib/a11y";
import { useVoz } from "@/lib/voz";

// Cada botão mostra a própria palavra no tamanho que a letra vai ficar. As
// amostras guardam a proporção 16 : 19 : 22 px da raiz (globals.css) e usam px
// fixos para não crescerem junto quando a letra grande já está ligada.
const OPCOES_FONTE: { valor: TamanhoFonte; rotulo: string; amostra: string }[] = [
  { valor: "normal", rotulo: "Normal", amostra: "text-[18px]" },
  { valor: "grande", rotulo: "Grande", amostra: "text-[21px]" },
  { valor: "muito-grande", rotulo: "Muito grande", amostra: "text-[25px]" },
];

// Interruptor grande, com o estado escrito ("Ligado"/"Desligado"): não depende
// de a pessoa entender a posição da bolinha.
function Interruptor({
  ligado,
  onChange,
  titulo,
  descricao,
}: {
  ligado: boolean;
  onChange: (v: boolean) => void;
  titulo: string;
  descricao: string;
}) {
  const id = useId();
  return (
    // flex-wrap: com letra muito grande o interruptor desce para baixo do título
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 rounded-xl border-2 border-gray-300 bg-white p-4">
      <div>
        <p id={`${id}-t`} className="text-lg font-bold text-gray-900">{titulo}</p>
        <p id={`${id}-d`} className="text-base text-gray-700">{descricao}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={ligado}
        aria-labelledby={`${id}-t`}
        aria-describedby={`${id}-d`}
        onClick={() => onChange(!ligado)}
        className={`flex min-h-12 shrink-0 items-center gap-3 rounded-full border-2 px-3 py-2 text-base font-bold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${
          ligado ? "border-blue-800 bg-blue-700 text-white" : "border-gray-500 bg-white text-gray-800"
        }`}
      >
        {/* currentColor: a bolinha continua visível no alto contraste */}
        <span
          aria-hidden="true"
          className={`relative h-6 w-11 rounded-full border-2 border-current ${ligado ? "bg-white/30" : ""}`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${
              ligado ? "left-5.5 bg-white" : "left-0.5 bg-current"
            }`}
          />
        </span>
        {ligado ? "Ligado" : "Desligado"}
      </button>
    </div>
  );
}

export default function AccessibilityBar() {
  const painelId = useId();
  const botaoRef = useRef<HTMLButtonElement>(null);
  const [aberto, setAberto] = useState(false);
  const { suportada: vozSuportada } = useVoz();
  // Inicializador preguiçoso lendo a mesma fonte do <script> do layout. Não gera
  // diferença de hidratação: com o painel fechado nada renderizado depende disso.
  const [prefs, setPrefs] = useState<PreferenciasA11y>(() =>
    typeof window === "undefined" ? PREFERENCIAS_PADRAO : lerPreferencias()
  );

  // Em produção o <script> do layout já aplicou os atributos. Em dev o React
  // limpa os atributos do <html> ao remontar (Strict Mode), então reaplica aqui.
  useLayoutEffect(() => {
    aplicarPreferencias(lerPreferencias());
  }, []);

  function atualizar(parcial: Partial<PreferenciasA11y>) {
    const novas = { ...prefs, ...parcial };
    setPrefs(novas);
    aplicarPreferencias(novas);
    salvarPreferencias(novas);
  }

  function fechar() {
    setAberto(false);
    botaoRef.current?.focus();
  }

  const alterado =
    prefs.fonte !== PREFERENCIAS_PADRAO.fonte ||
    prefs.altoContraste !== PREFERENCIAS_PADRAO.altoContraste ||
    prefs.menosMovimento !== PREFERENCIAS_PADRAO.menosMovimento ||
    prefs.vozDevagar !== PREFERENCIAS_PADRAO.vozDevagar;

  return (
    <div className="w-full bg-blue-900 text-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <button
          ref={botaoRef}
          type="button"
          aria-expanded={aberto}
          aria-controls={painelId}
          onClick={() => setAberto((v) => !v)}
          className="flex min-h-12 items-center gap-2 py-2 text-base font-bold focus:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
        >
          <Accessibility className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span>Acessibilidade</span>
          <span className="hidden font-normal sm:inline">— aumentar a letra e o contraste</span>
          <ChevronDown
            className={`h-5 w-5 shrink-0 transition-transform ${aberto ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {aberto && (
        <div
          id={painelId}
          role="region"
          aria-label="Opções de acessibilidade"
          onKeyDown={(e) => {
            if (e.key === "Escape") fechar();
          }}
          className="border-b-4 border-blue-900 bg-blue-50 text-gray-900"
        >
          {/* grid-cols-1 = minmax(0, 1fr): sem isso a coluna crescia até o item mais largo e vazava da tela */}
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-4 py-5 sm:px-6">
            {/* Tamanho da letra */}
            {/* min-w-0: fieldset não encolhe abaixo do conteúdo por padrão e vazava da tela com letra grande */}
            <fieldset className="min-w-0 rounded-xl border-2 border-gray-300 bg-white p-4">
              <legend className="px-1 text-lg font-bold text-gray-900">Tamanho da letra</legend>
              {/* Celular e tablet: um botão largo por linha. Telas grandes: três lado
                  a lado (antes de md, "Muito grande" a 25 px não cabe num terço) */}
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                {OPCOES_FONTE.map((op) => {
                  const ativo = prefs.fonte === op.valor;
                  return (
                    <button
                      key={op.valor}
                      type="button"
                      aria-pressed={ativo}
                      onClick={() => atualizar({ fonte: op.valor })}
                      className={`flex min-h-16 min-w-0 items-center justify-center rounded-xl border-2 px-3 py-2 text-center font-bold leading-tight transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${op.amostra} ${
                        ativo
                          ? "border-blue-800 bg-blue-700 text-white"
                          : "border-gray-400 bg-white text-gray-900 hover:border-blue-600"
                      }`}
                    >
                      {op.rotulo}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Interruptor
                titulo="Alto contraste"
                descricao="Letras pretas e bordas mais fortes."
                ligado={prefs.altoContraste}
                onChange={(v) => atualizar({ altoContraste: v })}
              />
              <Interruptor
                titulo="Menos movimento"
                descricao="Desliga as animações da tela."
                ligado={prefs.menosMovimento}
                onChange={(v) => atualizar({ menosMovimento: v })}
              />
              {vozSuportada && (
                <Interruptor
                  titulo="Voz mais devagar"
                  descricao="Para os botões de ouvir o resultado."
                  ligado={prefs.vozDevagar}
                  onChange={(v) => atualizar({ vozDevagar: v })}
                />
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-base text-gray-700">
                Suas escolhas ficam salvas neste aparelho.
              </p>
              <div className="flex flex-wrap gap-2">
                {alterado && (
                  <button
                    type="button"
                    onClick={() => atualizar(PREFERENCIAS_PADRAO)}
                    className="flex min-h-12 items-center gap-2 rounded-xl border-2 border-gray-400 bg-white px-4 text-base font-semibold text-gray-900 hover:bg-gray-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                  >
                    <RotateCcw className="shrink-0 h-5 w-5" aria-hidden="true" />
                    Voltar ao normal
                  </button>
                )}
                <button
                  type="button"
                  onClick={fechar}
                  className="flex min-h-12 items-center gap-2 rounded-xl bg-blue-700 px-5 text-base font-bold text-white hover:bg-blue-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

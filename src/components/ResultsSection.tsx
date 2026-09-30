"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  FileSpreadsheet,
  Download,
  Check,
  MessageCircle,
} from "lucide-react";
import type { AnalysisResult } from "@/data/mockData";
import { getResultSummary, getVerdictLabel, type SummaryTone } from "@/lib/scoring";
import { parar } from "@/lib/voz";
import { linkWhatsApp, montarMensagemWhatsApp } from "@/lib/whatsapp";
import BotaoOuvir from "./BotaoOuvir";
import {
  exportAnalysisAsJson,
  exportAnalysisAsMarkdown,
  exportAnalysisAsCsv,
} from "@/lib/history";
import ScoreBadge from "./ScoreBadge";
import TranscriptPanel from "./TranscriptPanel";
import ClaimCard from "./ClaimCard";

interface ResultsSectionProps {
  result: AnalysisResult;
  inputSource?: string;
  isSaved?: boolean;
}

const INITIAL_VISIBLE = 3;

// O resultado só aparece no navegador, mas não custa ter o endereço de produção de reserva
const SITE_URL = () =>
  typeof window !== "undefined" ? window.location.origin : "https://factcheckkai.vercel.app";

const summaryStyle: Record<SummaryTone, { box: string; icon: typeof XCircle; iconClass: string }> = {
  danger: { box: "border-red-700 bg-red-50 text-red-950", icon: XCircle, iconClass: "text-red-700" },
  warning: { box: "border-amber-500 bg-amber-50 text-amber-950", icon: AlertTriangle, iconClass: "text-amber-600" },
  ok: { box: "border-green-700 bg-green-50 text-green-950", icon: CheckCircle2, iconClass: "text-green-700" },
};

const exportButtonClass =
  "inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 hover:border-gray-400";

export default function ResultsSection({
  result,
  inputSource,
  isSaved = true,
}: ResultsSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const totalCount = result.claims.length;
  const falseCount = result.claims.filter((c) => c.veredicto === "FALSO").length;
  const hasMore = totalCount > INITIAL_VISIBLE;
  const visibleClaims = expanded ? result.claims : result.claims.slice(0, INITIAL_VISIBLE);

  const summary = getResultSummary(result.claims);
  const { box, icon: SummaryIcon, iconClass } = summaryStyle[summary.tone];

  // Resumo falado: frase geral + o veredicto de cada afirmação. A explicação
  // completa fica no "Ouvir explicação" de cada cartão, para não ficar longo.
  const textoParaOuvir = [
    summary.headline,
    summary.advice,
    ...result.claims.map(
      (c, i) => `Afirmação ${i + 1}: ${c.text?.trim() || "sem texto"}. ${getVerdictLabel(c.veredicto)}.`
    ),
  ].join(" ");

  // Para de ler ao trocar de resultado ou sair da tela
  useEffect(() => () => parar(), [result]);

  return (
    <section className="animate-fade-in mx-auto w-full max-w-5xl px-4 pb-16 pt-4 sm:px-6">
      {/* Resumo em linguagem simples: a primeira coisa que a pessoa lê */}
      <div className={`mb-6 flex items-start gap-3 rounded-2xl border-2 p-5 ${box}`}>
        <SummaryIcon className={`mt-0.5 h-8 w-8 shrink-0 ${iconClass}`} aria-hidden="true" />
        <div>
          {/* aria-live só no texto: o botão de ouvir muda de rótulo e não deve ser reanunciado */}
          <div role="status" aria-live="polite">
            <p className="text-xl font-bold leading-snug">{summary.headline}</p>
            <p className="mt-1 text-lg leading-snug">{summary.advice}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <BotaoOuvir id="resumo" rotulo="Ouvir o resultado" texto={textoParaOuvir} />
            {/* Verde escuro: o verde oficial do WhatsApp com texto branco dá ~2:1 de contraste */}
            <a
              href={linkWhatsApp(montarMensagemWhatsApp(result, SITE_URL()))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-green-800 bg-green-700 px-4 py-2 text-base font-bold text-white no-underline hover:bg-green-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-300"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              Enviar no WhatsApp
              <span className="sr-only"> (abre o WhatsApp)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Video info header */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Embedded video ou thumbnail */}
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-gray-900 lg:w-96 lg:shrink-0">
            {result.embedUrl ? (
              <iframe
                src={result.embedUrl}
                title={result.videoTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            ) : result.thumbnailUrl ? (
              <img
                src={result.thumbnailUrl}
                alt={`Imagem do vídeo: ${result.videoTitle}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-base text-white">
                Imagem do vídeo indisponível
              </div>
            )}
          </div>

          {/* Video metadata */}
          <div className="flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{result.videoTitle}</h2>
              {result.videoChannel && (
                <p className="mt-1 text-base text-gray-700">{result.videoChannel}</p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <ScoreBadge
                score={result.overallScore}
                color={
                  result.overallScore >= 70
                    ? "green"
                    : result.overallScore >= 40
                    ? "yellow"
                    : "red"
                }
              />

              {/* Contador com destaque de falsas */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base text-gray-700">
                  {totalCount} {totalCount === 1 ? "afirmação verificada" : "afirmações verificadas"}
                </span>
                {falseCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1 text-base font-semibold text-red-800">
                    <XCircle className="h-4 w-4" aria-hidden="true" />
                    {falseCount} {falseCount === 1 ? "falsa" : "falsas"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout. No celular os veredictos vêm antes da transcrição. */}
      <div className="grid gap-8 lg:grid-cols-5">
        {/* Transcript */}
        <div className="order-2 lg:order-1 lg:col-span-2">
          <TranscriptPanel transcript={result.transcript} />
        </div>

        {/* Validation claims */}
        <div className="order-1 lg:order-2 lg:col-span-3">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-700" aria-hidden="true" />
            <h3 className="text-xl font-bold text-gray-900">O que verificamos</h3>
          </div>

          {totalCount > 0 ? (
            <>
              <div className="grid gap-5 sm:grid-cols-1">
                {visibleClaims.map((claim, i) => (
                  <ClaimCard key={claim.id} claim={claim} index={i} />
                ))}
              </div>

              {hasMore && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-3 text-base font-semibold text-gray-800 transition-colors hover:bg-gray-50"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="h-5 w-5" aria-hidden="true" />
                      Mostrar menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-5 w-5" aria-hidden="true" />
                      Ver todas as {totalCount} afirmações
                    </>
                  )}
                </button>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-400 bg-gray-50 p-6 text-center text-base text-gray-700">
              Nenhuma afirmação foi encontrada neste vídeo.
            </div>
          )}
        </div>
      </div>

      {/* Exportação para a pesquisa do TCC: fica no fim, fora do caminho de quem só quer o resultado */}
      <div className="mt-10 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-700 text-white">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span>{isSaved ? "Resultado salvo no histórico deste aparelho" : "Análise concluída"}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportAnalysisAsMarkdown(result, inputSource)}
            className={exportButtonClass}
            title="Exportar Relatório em Markdown formatado para TCC"
          >
            <FileText className="h-4 w-4 text-blue-700" aria-hidden="true" />
            Relatório (.MD)
          </button>

          <button
            onClick={() => exportAnalysisAsCsv(result, inputSource)}
            className={exportButtonClass}
            title="Exportar Tabela de Alegações em CSV para Excel"
          >
            <FileSpreadsheet className="h-4 w-4 text-green-700" aria-hidden="true" />
            Planilha (.CSV)
          </button>

          <button
            onClick={() => exportAnalysisAsJson(result, inputSource)}
            className={exportButtonClass}
            title="Exportar Dados Brutos em JSON para scripts"
          >
            <Download className="h-4 w-4 text-purple-700" aria-hidden="true" />
            Dados (.JSON)
          </button>
        </div>
      </div>
    </section>
  );
}

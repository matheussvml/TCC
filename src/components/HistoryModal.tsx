"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  X,
  History,
  FileText,
  FileSpreadsheet,
  Download,
  Trash2,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Archive,
  ChevronDown,
} from "lucide-react";
import type { SavedAnalysis } from "@/lib/history";
import { getOverallColor } from "@/lib/scoring";
import {
  deleteAnalysis,
  clearAllAnalyses,
  exportAnalysisAsJson,
  exportAnalysisAsMarkdown,
  exportAnalysisAsCsv,
  exportAllAnalysesAsCsv,
  exportAllAnalysesAsJson,
} from "@/lib/history";
import ScoreBadge from "./ScoreBadge";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  analyses: SavedAnalysis[];
  onSelectAnalysis: (analysis: SavedAnalysis) => void;
  onRefresh: () => void;
}

// Botões com texto (não só ícone): no celular o `title` não aparece, e um
// ícone sozinho não diz o que faz. Todos com 48 px de altura, como os principais.
const botaoSecundario =
  "inline-flex min-h-12 items-center gap-2 rounded-xl border-2 px-3 py-2 text-base font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300";

export default function HistoryModal({
  isOpen,
  onClose,
  analyses,
  onSelectAnalysis,
  onRefresh,
}: HistoryModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const tituloId = useId();
  const buscaId = useId();
  const dialogoRef = useRef<HTMLDivElement>(null);
  const fecharRef = useRef<HTMLButtonElement>(null);
  // O page.tsx passa uma função nova a cada render; guardando numa ref, o
  // efeito abaixo roda só ao abrir e fechar, e o foco não pula ao digitar.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Ao abrir: foco no botão de fechar, página de trás sem rolar, Esc fecha e o
  // Tab fica preso dentro do histórico. Ao fechar: foco volta para quem abriu.
  useEffect(() => {
    if (!isOpen) return;
    const anterior = document.activeElement as HTMLElement | null;
    const overflowAntes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    fecharRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !dialogoRef.current) return;
      const focaveis = dialogoRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input, summary, a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (focaveis.length === 0) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflowAntes;
      anterior?.focus();
    };
  }, [isOpen]);

  const filteredAnalyses = useMemo(() => {
    if (!searchTerm.trim()) return analyses;
    const term = searchTerm.toLowerCase();
    return analyses.filter(
      (a) =>
        (a.videoTitle && a.videoTitle.toLowerCase().includes(term)) ||
        (a.inputSource && a.inputSource.toLowerCase().includes(term)) ||
        a.claims.some((c) => c.text && c.text.toLowerCase().includes(term))
    );
  }, [analyses, searchTerm]);

  if (!isOpen) return null;

  const handleDelete = (id: string) => {
    if (confirm("Deseja realmente excluir esta análise do histórico?")) {
      deleteAnalysis(id);
      onRefresh();
    }
  };

  const handleClearAll = () => {
    if (confirm("Atenção: todas as análises salvas neste aparelho serão apagadas. Continuar?")) {
      clearAllAnalyses();
      onRefresh();
    }
  };

  return (
    // Celular: ocupa a tela inteira (h-dvh acompanha a barra do navegador).
    // A partir de sm: janela centralizada. Tocar fora dela fecha.
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-gray-900/60 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={dialogoRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        className="relative flex h-dvh w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[90dvh] sm:max-w-4xl sm:rounded-2xl sm:border sm:border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 sm:flex">
              <History className="shrink-0 h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 id={tituloId} className="text-xl font-bold text-gray-900">
                Histórico
              </h2>
              <p className="text-base text-gray-700">
                {analyses.length} {analyses.length === 1 ? "análise salva" : "análises salvas"} neste aparelho
              </p>
            </div>
          </div>

          <button
            ref={fecharRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar o histórico"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-gray-300 bg-white text-gray-800 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Busca e ações em lote. Sempre empilhados: lado a lado, a busca ficava
            espremida pelos três botões e cortava o próprio texto de ajuda */}
        <div className="flex flex-col gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="relative min-w-0 flex-1">
            <label htmlFor={buscaId} className="sr-only">
              Pesquisar no histórico
            </label>
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" aria-hidden="true" />
            <input
              id={buscaId}
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar"
              className="min-h-12 w-full rounded-xl border-2 border-gray-300 bg-white py-2 pl-10 pr-3 text-base text-gray-900 placeholder:text-gray-600 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {/* Ações em lote servem à pesquisa da equipe, não ao uso diário: ficam
              recolhidas para a lista aparecer logo no celular com letra grande */}
          {analyses.length > 0 && (
            <details className="group rounded-xl border-2 border-gray-200">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-base font-semibold text-gray-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 [&::-webkit-details-marker]:hidden">
                Exportar ou apagar tudo
                <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="flex flex-wrap items-center gap-2 border-t-2 border-gray-200 p-2">
                <button
                  type="button"
                  onClick={() => exportAllAnalysesAsCsv(analyses)}
                  className={`${botaoSecundario} border-green-300 bg-green-50 text-green-800 hover:bg-green-100`}
                >
                  <FileSpreadsheet className="h-5 w-5 shrink-0" aria-hidden="true" />
                  Exportar tudo (.csv)
                </button>
                <button
                  type="button"
                  onClick={() => exportAllAnalysesAsJson(analyses)}
                  className={`${botaoSecundario} border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100`}
                >
                  <Download className="h-5 w-5 shrink-0" aria-hidden="true" />
                  Cópia de segurança (.json)
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className={`${botaoSecundario} border-red-300 bg-red-50 text-red-800 hover:bg-red-100`}
                >
                  <Trash2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                  Apagar tudo
                </button>
              </div>
            </details>
          )}
        </div>

        {/* Lista */}
        <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {filteredAnalyses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Archive className="shrink-0 mb-3 h-12 w-12 stroke-[1.5] text-gray-400" aria-hidden="true" />
              <p className="text-lg font-semibold text-gray-800">
                {searchTerm ? "Nenhuma análise encontrada para a busca." : "Nenhuma análise salva ainda."}
              </p>
              <p className="mt-1 max-w-sm text-base text-gray-700">
                Cada vídeo que você verificar fica guardado aqui, neste aparelho.
              </p>
            </div>
          ) : (
            filteredAnalyses.map((item) => {
              const formattedDate = new Date(item.createdAt).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <article
                  key={item.id}
                  className="flex flex-col gap-4 rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-300 md:flex-row md:items-start md:justify-between"
                >
                  {/* Informações da análise */}
                  <div className="min-w-0 flex-1">
                    <p className="text-base text-gray-700">{formattedDate}</p>
                    {/* Título e link inteiros, quebrando linha: cortar com "..." escondia o que diferencia um vídeo do outro */}
                    <h3 className="mt-1 text-lg font-bold leading-snug text-gray-900 [overflow-wrap:anywhere]">
                      {item.videoTitle || "Análise sem título"}
                    </h3>
                    <p className="mt-1 text-sm text-gray-700 [overflow-wrap:anywhere]">{item.inputSource}</p>

                    {/* Contagem por veredicto */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-base text-gray-800">
                      <span className="font-semibold">
                        {item.claims.length} {item.claims.length === 1 ? "afirmação" : "afirmações"}:
                      </span>
                      {item.summary.trueClaims > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-0.5 text-sm font-semibold text-green-800">
                          <CheckCircle2 className="shrink-0 h-4 w-4" aria-hidden="true" />
                          {item.summary.trueClaims} {item.summary.trueClaims === 1 ? "verdadeira" : "verdadeiras"}
                        </span>
                      )}
                      {item.summary.partialClaims > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-sm font-semibold text-amber-800">
                          <AlertTriangle className="shrink-0 h-4 w-4" aria-hidden="true" />
                          {item.summary.partialClaims} em parte
                        </span>
                      )}
                      {item.summary.falseClaims > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-sm font-semibold text-red-800">
                          <XCircle className="shrink-0 h-4 w-4" aria-hidden="true" />
                          {item.summary.falseClaims} {item.summary.falseClaims === 1 ? "falsa" : "falsas"}
                        </span>
                      )}
                      {item.summary.unsupportedClaims > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-sm font-semibold text-gray-800">
                          <HelpCircle className="shrink-0 h-4 w-4" aria-hidden="true" />
                          {item.summary.unsupportedClaims} sem provas
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Escore e ações */}
                  <div className="flex flex-col gap-3 md:w-64 md:shrink-0 md:items-stretch">
                    <ScoreBadge score={item.overallScore} color={getOverallColor(item.overallScore)} />

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectAnalysis(item);
                          onClose();
                        }}
                        className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-base font-bold text-white transition hover:bg-blue-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                        title="Abrir no painel principal"
                      >
                        <ExternalLink className="shrink-0 h-5 w-5" aria-hidden="true" />
                        Abrir
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className={`${botaoSecundario} min-h-12 border-gray-300 bg-white text-red-800 hover:bg-red-50`}
                      >
                        <Trash2 className="shrink-0 h-5 w-5" aria-hidden="true" />
                        Excluir
                      </button>
                    </div>

                    {/* Downloads são para a pesquisa, não para o uso diário: ficam recolhidos */}
                    <details className="group rounded-xl border-2 border-gray-200">
                      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-base font-semibold text-gray-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 [&::-webkit-details-marker]:hidden">
                        <span className="inline-flex items-center gap-2">
                          <Download className="shrink-0 h-5 w-5" aria-hidden="true" />
                          Baixar arquivo
                        </span>
                        <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                      </summary>
                      <div className="flex flex-col gap-2 border-t-2 border-gray-200 p-2">
                        <button
                          type="button"
                          onClick={() => exportAnalysisAsMarkdown(item)}
                          className={`${botaoSecundario} border-gray-300 bg-gray-50 text-gray-900 hover:bg-gray-100`}
                        >
                          <FileText className="h-5 w-5 shrink-0" aria-hidden="true" />
                          Relatório (.md)
                        </button>
                        <button
                          type="button"
                          onClick={() => exportAnalysisAsCsv(item)}
                          className={`${botaoSecundario} border-gray-300 bg-gray-50 text-gray-900 hover:bg-gray-100`}
                        >
                          <FileSpreadsheet className="h-5 w-5 shrink-0" aria-hidden="true" />
                          Planilha (.csv)
                        </button>
                        <button
                          type="button"
                          onClick={() => exportAnalysisAsJson(item)}
                          className={`${botaoSecundario} border-gray-300 bg-gray-50 text-gray-900 hover:bg-gray-100`}
                        >
                          <Download className="h-5 w-5 shrink-0" aria-hidden="true" />
                          Dados (.json)
                        </button>
                      </div>
                    </details>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Rodapé */}
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-400 bg-white px-5 text-base font-bold text-gray-900 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 sm:ml-auto sm:w-auto"
          >
            <X className="h-5 w-5" aria-hidden="true" />
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

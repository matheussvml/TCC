"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import type { SavedAnalysis } from "@/lib/history";
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

export default function HistoryModal({
  isOpen,
  onClose,
  analyses,
  onSelectAnalysis,
  onRefresh,
}: HistoryModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

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

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Deseja realmente excluir esta análise do histórico?")) {
      deleteAnalysis(id);
      onRefresh();
    }
  };

  const handleClearAll = () => {
    if (confirm("Atenção: todas as análises salvas localmente serão apagadas. Continuar?")) {
      clearAllAnalyses();
      setConfirmClear(false);
      onRefresh();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm animate-fade-in">
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Modal */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Histórico de Análises Salvas</h2>
              <p className="text-xs text-gray-500">
                {analyses.length} {analyses.length === 1 ? "análise armazenada" : "análises armazenadas"} localmente
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Barra de Ferramentas / Ações em Lote */}
        <div className="flex flex-col gap-3 border-b border-gray-200 bg-white px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por título, fonte ou alegação..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-xs text-gray-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {analyses.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => exportAllAnalysesAsCsv(analyses)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-100"
                title="Exportar todas as alegações de todos os testes para Excel"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Exportar Tudo (.CSV)
              </button>
              <button
                onClick={() => exportAllAnalysesAsJson(analyses)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                title="Backup completo de todos os dados em JSON"
              >
                <Download className="h-3.5 w-3.5" />
                Backup (.JSON)
              </button>
              <button
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                title="Limpar todas as análises salvas"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Limpar
              </button>
            </div>
          )}
        </div>

        {/* Lista de Análises */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredAnalyses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
              <Archive className="h-12 w-12 text-gray-300 stroke-[1.5] mb-3" />
              <p className="text-sm font-medium text-gray-600">
                {searchTerm ? "Nenhuma análise encontrada para a busca." : "Nenhuma análise salva no histórico."}
              </p>
              <p className="mt-1 text-xs text-gray-400 max-w-sm">
                As análises que você realizar através de link ou arquivo serão salvas automaticamente aqui.
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
                <div
                  key={item.id}
                  className="group relative flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md md:flex-row md:items-center gap-4"
                >
                  {/* Informações da análise */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-400">{formattedDate}</span>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 truncate max-w-[200px]">
                        {item.inputSource}
                      </span>
                    </div>

                    <h3 className="mt-1 text-sm font-bold text-gray-900 truncate">
                      {item.videoTitle || "Análise sem título"}
                    </h3>

                    {/* Breakdown de veredictos */}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                      <span className="font-semibold text-gray-700">
                        {item.claims.length} {item.claims.length === 1 ? "alegação" : "alegações"}:
                      </span>
                      {item.summary.trueClaims > 0 && (
                        <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-1.5 py-0.5 rounded font-medium text-[11px]">
                          <CheckCircle2 className="h-3 w-3" />
                          {item.summary.trueClaims} verdadeiras
                        </span>
                      )}
                      {item.summary.partialClaims > 0 && (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium text-[11px]">
                          <AlertTriangle className="h-3 w-3" />
                          {item.summary.partialClaims} parciais
                        </span>
                      )}
                      {item.summary.falseClaims > 0 && (
                        <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-1.5 py-0.5 rounded font-medium text-[11px]">
                          <XCircle className="h-3 w-3" />
                          {item.summary.falseClaims} falsas
                        </span>
                      )}
                      {item.summary.unsupportedClaims > 0 && (
                        <span className="inline-flex items-center gap-1 text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded font-medium text-[11px]">
                          <HelpCircle className="h-3 w-3" />
                          {item.summary.unsupportedClaims} sem embasamento
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score & Ações */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 md:flex-col md:items-end">
                    <ScoreBadge
                      score={item.overallScore}
                      color={
                        item.overallScore >= 70
                          ? "green"
                          : item.overallScore >= 40
                          ? "yellow"
                          : "red"
                      }
                    />

                    <div className="flex items-center gap-1.5 mt-1">
                      {/* Botão para carregar na tela principal */}
                      <button
                        onClick={() => {
                          onSelectAnalysis(item);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-blue-700"
                        title="Abrir no painel principal"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Abrir
                      </button>

                      {/* Exportar MD */}
                      <button
                        onClick={() => exportAnalysisAsMarkdown(item)}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-1 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                        title="Baixar Relatório em Markdown (.md)"
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </button>

                      {/* Exportar CSV */}
                      <button
                        onClick={() => exportAnalysisAsCsv(item)}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-1 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                        title="Baixar Planilha de Alegações (.csv)"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                      </button>

                      {/* Exportar JSON */}
                      <button
                        onClick={() => exportAnalysisAsJson(item)}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-1 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                        title="Baixar Dados Estruturados (.json)"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>

                      {/* Deletar */}
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-1 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                        title="Excluir do histórico"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer do Modal */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 text-right">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

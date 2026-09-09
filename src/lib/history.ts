import type { AnalysisResult } from "@/data/mockData";
import type { Claim } from "@/lib/scoring";
import { normalizeFontes } from "@/lib/scoring";

export interface AnalysisSummary {
  totalClaims: number;
  trueClaims: number;
  partialClaims: number;
  falseClaims: number;
  unsupportedClaims: number;
}

export interface SavedAnalysis extends AnalysisResult {
  id: string;
  createdAt: string; // ISO date string
  inputSource: string; // URL ou nome do arquivo
  summary: AnalysisSummary;
}

const STORAGE_KEY = "factcheck_kai_history_v1";
const MAX_SAVED_ITEMS = 50;

/**
 * Calcula o sumário estatístico dos veredictos de uma lista de alegações.
 */
export function calculateSummary(claims: Claim[]): AnalysisSummary {
  const summary: AnalysisSummary = {
    totalClaims: claims.length,
    trueClaims: 0,
    partialClaims: 0,
    falseClaims: 0,
    unsupportedClaims: 0,
  };

  claims.forEach((claim) => {
    const v = (claim.veredicto || "").toUpperCase();
    if (v.includes("VERDADEIRO") && !v.includes("PARCIAL")) {
      summary.trueClaims++;
    } else if (v.includes("PARCIAL")) {
      summary.partialClaims++;
    } else if (v.includes("FALSO")) {
      summary.falseClaims++;
    } else {
      summary.unsupportedClaims++;
    }
  });

  return summary;
}

/**
 * Salva uma nova análise no localStorage.
 */
export function saveAnalysis(result: AnalysisResult, inputSource: string): SavedAnalysis {
  if (typeof window === "undefined") {
    const fallbackId = `analysis_${Date.now()}`;
    return {
      ...result,
      id: fallbackId,
      createdAt: new Date().toISOString(),
      inputSource,
      summary: calculateSummary(result.claims),
    };
  }

  const existing = getSavedAnalyses();
  const id = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newEntry: SavedAnalysis = {
    ...result,
    id,
    createdAt: new Date().toISOString(),
    inputSource,
    summary: calculateSummary(result.claims),
  };

  try {
    const updated = [newEntry, ...existing.filter((item) => item.id !== id)].slice(0, MAX_SAVED_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Notifica outros componentes no mesmo browser
    window.dispatchEvent(new Event("factcheck_history_updated"));
  } catch (err) {
    console.error("Erro ao salvar análise no localStorage:", err);
  }

  return newEntry;
}

/**
 * Recupera todas as análises salvas ordenadas por data decrescente.
 */
export function getSavedAnalyses(): SavedAnalysis[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Erro ao ler histórico do localStorage:", err);
    return [];
  }
}

/**
 * Deleta uma análise pelo ID.
 */
export function deleteAnalysis(id: string): void {
  if (typeof window === "undefined") return;

  try {
    const current = getSavedAnalyses();
    const filtered = current.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event("factcheck_history_updated"));
  } catch (err) {
    console.error("Erro ao remover análise do histórico:", err);
  }
}

/**
 * Limpa todo o histórico de análises.
 */
export function clearAllAnalyses(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("factcheck_history_updated"));
  } catch (err) {
    console.error("Erro ao limpar histórico:", err);
  }
}

/**
 * Helper de download de arquivos no navegador.
 */
function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Sanitiza texto para uso em nome de arquivo.
 */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\d-_]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 40);
}

/**
 * Exporta uma análise individual em formato JSON.
 */
export function exportAnalysisAsJson(analysis: SavedAnalysis | AnalysisResult, inputSource?: string): void {
  const exportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      system: "FactChekk",
      version: "1.0.0",
      inputSource: "inputSource" in analysis ? analysis.inputSource : inputSource || "desconhecido",
    },
    ...analysis,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
  const filename = `analise_${sanitizeFilename(analysis.videoTitle || "factcheck")}_${Date.now()}.json`;
  triggerBrowserDownload(blob, filename);
}

/**
 * Exporta uma análise individual como relatório em Markdown formatado para TCC.
 */
export function exportAnalysisAsMarkdown(analysis: SavedAnalysis | AnalysisResult, inputSource?: string): void {
  const dateStr = "createdAt" in analysis 
    ? new Date(analysis.createdAt).toLocaleString("pt-BR")
    : new Date().toLocaleString("pt-BR");
  
  const source = "inputSource" in analysis ? analysis.inputSource : inputSource || "URL / Arquivo";
  const summary = calculateSummary(analysis.claims);

  let md = `# Relatório de Verificação de Fatos — FactChekk\n\n`;
  md += `> **Data de geração:** ${dateStr}  \n`;
  md += `> **Fonte do conteúdo:** \`${source}\`  \n`;
  md += `> **Título identificado:** ${analysis.videoTitle || "Sem título"}  \n`;
  md += `> **Escore Global de Confiabilidade:** **${analysis.overallScore}%**\n\n`;

  md += `## 1. Sumário Executivo\n\n`;
  md += `| Métrica | Valor |\n`;
  md += `|---------|-------|\n`;
  md += `| Total de alegações analisadas | ${summary.totalClaims} |\n`;
  md += `| Verdadeiras | ${summary.trueClaims} |\n`;
  md += `| Parcialmente Verdadeiras | ${summary.partialClaims} |\n`;
  md += `| Falsas | ${summary.falseClaims} |\n`;
  md += `| Sem embasamento suficiente | ${summary.unsupportedClaims} |\n`;
  md += `| **Confiabilidade Global** | **${analysis.overallScore}%** |\n\n`;

  md += `## 2. Alegações e Veredictos Detalhados\n\n`;

  analysis.claims.forEach((claim, idx) => {
    const normJorn = normalizeFontes(claim.fontes_jornalisticas);
    const normCient = normalizeFontes(claim.fontes_cientificas);

    md += `### Alegação ${idx + 1}: "${claim.text || "(Texto não identificado)"}"\n\n`;
    md += `- **Veredicto:** **${claim.veredicto || "NÃO IDENTIFICADO"}**\n`;
    md += `- **Nível de Confiança da IA:** ${(typeof claim.confianca === "number" ? claim.confianca * 100 : 0).toFixed(0)}%\n`;
    md += `- **Escore de Exibição:** ${claim.displayScore ?? "N/A"}%\n`;
    md += `- **Nível da Fonte:** ${claim.sourceLevel || "Geral"}\n\n`;

    md += `**Explicação e Diagnóstico:**  \n${claim.source || "Sem explicação fornecida."}\n\n`;

    md += `**Fontes Jornalísticas:**\n`;
    if (normJorn.items.length > 0) {
      normJorn.items.forEach((item) => {
        md += `- [${item.titulo || item.url}](${item.url})\n`;
      });
    } else if (normJorn.rawText) {
      md += `${normJorn.rawText}\n`;
    } else {
      md += `*Nenhuma checagem jornalística encontrada.*\n`;
    }
    md += `\n`;

    md += `**Fontes Científicas (OpenAlex / DOI):**\n`;
    if (normCient.items.length > 0) {
      normCient.items.forEach((item) => {
        md += `- [${item.titulo || item.url}](${item.url})\n`;
      });
    } else if (normCient.rawText) {
      md += `${normCient.rawText}\n`;
    } else {
      md += `*Nenhum artigo científico indexado encontrado.*\n`;
    }
    md += `\n---\n\n`;
  });

  md += `## 3. Transcrição Completa do Conteúdo\n\n`;
  md += `\`\`\`text\n${analysis.transcript || "(Transcrição vazia)"}\n\`\`\`\n\n`;
  md += `---\n*Documento gerado automaticamente pelo sistema FactChekk (TCC UNIFOR 2026).*\n`;

  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const filename = `relatorio_${sanitizeFilename(analysis.videoTitle || "factcheck")}_${Date.now()}.md`;
  triggerBrowserDownload(blob, filename);
}

/**
 * Escapa strings para formato CSV (RFC 4180).
 */
function escapeCsv(field: unknown): string {
  if (field === null || field === undefined) return '""';
  const str = String(field);
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Exporta uma análise individual em CSV para Excel / Google Sheets.
 */
export function exportAnalysisAsCsv(analysis: SavedAnalysis | AnalysisResult, inputSource?: string): void {
  const source = "inputSource" in analysis ? analysis.inputSource : inputSource || "";
  const title = analysis.videoTitle || "Vídeo";

  const headers = [
    "ID_Alegacao",
    "Titulo_Video",
    "Fonte_Origem",
    "Alegacao",
    "Veredicto",
    "Confianca_IA",
    "Display_Score",
    "Status",
    "Nivel_Fonte",
    "Explicacao",
    "Fontes_Cientificas",
    "Fontes_Jornalisticas",
  ];

  const rows = analysis.claims.map((claim, index) => {
    const cient = normalizeFontes(claim.fontes_cientificas)
      .items.map((f) => `${f.titulo} (${f.url})`)
      .join(" | ");
    const jorn = normalizeFontes(claim.fontes_jornalisticas)
      .items.map((f) => `${f.titulo} (${f.url})`)
      .join(" | ");

    return [
      escapeCsv(claim.id ?? index + 1),
      escapeCsv(title),
      escapeCsv(source),
      escapeCsv(claim.text),
      escapeCsv(claim.veredicto),
      escapeCsv(claim.confianca),
      escapeCsv(claim.displayScore),
      escapeCsv(claim.status),
      escapeCsv(claim.sourceLevel),
      escapeCsv(claim.source),
      escapeCsv(cient),
      escapeCsv(jorn),
    ].join(";");
  });

  // \uFEFF adiciona o UTF-8 BOM para garantir acentos corretos no Excel
  const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const filename = `tabela_alegacoes_${sanitizeFilename(title)}_${Date.now()}.csv`;
  triggerBrowserDownload(blob, filename);
}

/**
 * Exporta todas as análises salvas em um único arquivo CSV consolidado (ideal para o Capítulo 5 do TCC).
 */
export function exportAllAnalysesAsCsv(analyses: SavedAnalysis[]): void {
  if (analyses.length === 0) return;

  const headers = [
    "ID_Analise",
    "Data_Analise",
    "Titulo_Video",
    "Fonte_Origem",
    "Escore_Global",
    "ID_Alegacao",
    "Alegacao",
    "Veredicto",
    "Confianca_IA",
    "Display_Score",
    "Nivel_Fonte",
    "Explicacao",
    "Fontes_Cientificas",
    "Fontes_Jornalisticas",
  ];

  const rows: string[] = [];

  analyses.forEach((analysis) => {
    const formattedDate = new Date(analysis.createdAt).toLocaleString("pt-BR");
    analysis.claims.forEach((claim, index) => {
      const cient = normalizeFontes(claim.fontes_cientificas)
        .items.map((f) => `${f.titulo} (${f.url})`)
        .join(" | ");
      const jorn = normalizeFontes(claim.fontes_jornalisticas)
        .items.map((f) => `${f.titulo} (${f.url})`)
        .join(" | ");

      rows.push(
        [
          escapeCsv(analysis.id),
          escapeCsv(formattedDate),
          escapeCsv(analysis.videoTitle),
          escapeCsv(analysis.inputSource),
          escapeCsv(analysis.overallScore),
          escapeCsv(claim.id ?? index + 1),
          escapeCsv(claim.text),
          escapeCsv(claim.veredicto),
          escapeCsv(claim.confianca),
          escapeCsv(claim.displayScore),
          escapeCsv(claim.sourceLevel),
          escapeCsv(claim.source),
          escapeCsv(cient),
          escapeCsv(jorn),
        ].join(";")
      );
    });
  });

  const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const filename = `consolidado_factcheck_tcc_${Date.now()}.csv`;
  triggerBrowserDownload(blob, filename);
}

/**
 * Exporta todo o histórico como backup JSON consolidado.
 */
export function exportAllAnalysesAsJson(analyses: SavedAnalysis[]): void {
  const exportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      totalAnalyses: analyses.length,
      system: "FactChekk",
      version: "1.0.0",
    },
    analyses,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
  const filename = `backup_completo_factcheck_${Date.now()}.json`;
  triggerBrowserDownload(blob, filename);
}

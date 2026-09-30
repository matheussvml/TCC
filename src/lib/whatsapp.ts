// Mensagem pronta para o grupo da família: o resumo, cada afirmação com o
// veredicto e um link de checagem, e o convite para verificar antes de repassar.

import type { AnalysisResult } from "@/data/mockData";
import { getResultSummary, getVerdictLabel, normalizeFontes } from "@/lib/scoring";

const EMOJI: Record<string, string> = {
  FALSO: "❌",
  VERDADEIRO: "✅",
  "PARCIALMENTE VERDADEIRO": "⚠️",
  "SEM EMBASAMENTO SUFICIENTE": "❔",
};

export function montarMensagemWhatsApp(result: AnalysisResult, siteUrl: string): string {
  const resumo = getResultSummary(result.claims);

  const itens = result.claims.map((c) => {
    const emoji = EMOJI[c.veredicto ?? ""] ?? "❔";
    const texto = c.text?.trim() || "Afirmação sem texto";
    // Um link por afirmação: a checagem jornalística é a mais fácil de ler
    const fonte =
      normalizeFontes(c.fontes_jornalisticas).items[0] ?? normalizeFontes(c.fontes_cientificas).items[0];
    return [`${emoji} "${texto}"`, `   → ${getVerdictLabel(c.veredicto)}`, fonte ? `   Fonte: ${fonte.url}` : ""]
      .filter(Boolean)
      .join("\n");
  });

  return [
    "🔎 *Verifiquei um vídeo no FactChekk*",
    "",
    resumo.headline,
    "",
    ...itens,
    "",
    resumo.advice,
    "",
    `Antes de repassar um vídeo, verifique também: ${siteUrl}`,
  ].join("\n");
}

// wa.me abre o app no celular e o WhatsApp Web no computador
export function linkWhatsApp(mensagem: string): string {
  return `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
}

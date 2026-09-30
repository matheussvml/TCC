export type DisplayColor = "green" | "yellow" | "red" | "gray";

export interface FonteItem {
  titulo: string;
  url: string;
}

export interface FonteDetalhada {
  tipo: "jornalistica" | "cientifica";
  titulo: string;
  url: string;
}

export interface FontesDetalhadas {
  cientificas?: string;
  jornalisticas?: string;
}

export interface Claim {
  id: number;
  text: string;
  status: "validated" | "partial" | "invalid";
  veredicto?: string;
  confianca?: number;
  displayScore?: number;
  displayColor?: DisplayColor;
  source: string;
  sourceLevel: string;
  sourceUrl?: string;
  fontes_jornalisticas?: FonteItem[] | string;
  fontes_cientificas?: FonteItem[] | string;
  fontes?: FonteDetalhada[];
  fontes_detalhadas?: FontesDetalhadas;
}

export interface NormalizedFontes {
  items: FonteItem[];
  rawText: string;
  hasData: boolean;
}

export function normalizeFontes(fontes: FonteItem[] | string | undefined): NormalizedFontes {
  if (!fontes || (Array.isArray(fontes) && fontes.length === 0) || fontes === "") {
    return { items: [], rawText: "", hasData: false };
  }
  if (typeof fontes === "string") {
    return { items: [], rawText: fontes, hasData: true };
  }
  return { items: fontes, rawText: "", hasData: fontes.length > 0 };
}

export interface FactCheckResult {
  status: "success" | "error";
  claims: Claim[];
  overallScore: number;
}

export interface ScoreDisplay {
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

export function getScoreDisplay(displayScore?: number, displayColor?: DisplayColor): ScoreDisplay {
  const color: DisplayColor =
    displayColor ??
    (displayScore === undefined ? "gray" : displayScore >= 70 ? "green" : displayScore >= 40 ? "yellow" : "red");

  switch (color) {
    case "green":
      return {
        label: `${displayScore}% confiável`,
        colorClass: "text-green-700",
        bgClass: "bg-green-50",
        borderClass: "border-green-500",
      };
    case "yellow":
      return {
        label: "Parcialmente verificado",
        colorClass: "text-amber-700",
        bgClass: "bg-amber-50",
        borderClass: "border-amber-500",
      };
    case "red":
      return {
        label: typeof displayScore === "number" && displayScore <= 10 ? "Não confiável" : `${displayScore ?? 0}%`,
        colorClass: "text-red-700",
        bgClass: "bg-red-50",
        borderClass: "border-red-500",
      };
    default:
      return {
        label: "Sem embasamento",
        colorClass: "text-gray-700",
        bgClass: "bg-gray-50",
        borderClass: "border-gray-300",
      };
  }
}

export function getVerdictIcon(veredicto?: string): string {
  if (veredicto === "VERDADEIRO") return "CheckCircle2";
  if (veredicto === "PARCIALMENTE VERDADEIRO") return "AlertCircle";
  if (veredicto === "FALSO") return "XCircle";
  return "HelpCircle";
}

// Linguagem simples para o público idoso: "É falso" em vez de "Falso".
// Os relatórios exportados continuam usando o veredicto original do n8n.
export function getVerdictLabel(veredicto?: string): string {
  if (veredicto === "VERDADEIRO") return "É verdade";
  if (veredicto === "PARCIALMENTE VERDADEIRO") return "É verdade só em parte";
  if (veredicto === "FALSO") return "É falso";
  if (veredicto === "SEM EMBASAMENTO SUFICIENTE") return "Não há provas suficientes";
  return "Não verificado";
}

export type SummaryTone = "danger" | "warning" | "ok";

export interface ResultSummary {
  headline: string; // "Verificamos 3 afirmações deste vídeo: 3 são falsas."
  advice: string; // conselho curto, em linguagem simples
  tone: SummaryTone;
}

// Frase-resumo do resultado inteiro. Reaproveitada pelo leitor em voz alta e
// pelo compartilhamento no WhatsApp, então precisa fazer sentido sozinha.
export function getResultSummary(claims: Claim[]): ResultSummary {
  const count = (v: string) => claims.filter((c) => c.veredicto === v).length;
  const falsas = count("FALSO");
  const parciais = count("PARCIALMENTE VERDADEIRO");
  const verdadeiras = count("VERDADEIRO");
  const semProvas = claims.length - falsas - parciais - verdadeiras;

  const total = claims.length;
  if (total === 0) {
    return {
      headline: "Não encontramos afirmações para verificar neste vídeo.",
      advice: "Tente outro vídeo, de preferência um que fale sobre saúde ou notícias.",
      tone: "warning",
    };
  }

  const um = total === 1;
  const partes = [
    falsas && `${um ? "ela é falsa" : `${falsas} ${falsas === 1 ? "é falsa" : "são falsas"}`}`,
    parciais && `${um ? "ela é verdade só em parte" : `${parciais} ${parciais === 1 ? "é verdade só em parte" : "são verdade só em parte"}`}`,
    verdadeiras && `${um ? "ela é verdade" : `${verdadeiras} ${verdadeiras === 1 ? "é verdade" : "são verdade"}`}`,
    semProvas && `${um ? "não há provas suficientes sobre ela" : `${semProvas} ${semProvas === 1 ? "não tem provas suficientes" : "não têm provas suficientes"}`}`,
  ].filter(Boolean) as string[];

  const lista =
    partes.length > 1 ? `${partes.slice(0, -1).join(", ")} e ${partes[partes.length - 1]}` : partes[0];

  const headline = um
    ? `Verificamos 1 afirmação deste vídeo: ${lista}.`
    : `Verificamos ${total} afirmações deste vídeo: ${lista}.`;

  if (falsas > 0) {
    return {
      headline,
      advice: "Cuidado: este vídeo tem informações falsas. Pense bem antes de compartilhar.",
      tone: "danger",
    };
  }
  if (parciais > 0 || semProvas > 0) {
    return {
      headline,
      advice: "Algumas informações não estão totalmente certas. Veja os detalhes abaixo.",
      tone: "warning",
    };
  }
  return {
    headline,
    advice: "Não encontramos informações falsas neste vídeo.",
    tone: "ok",
  };
}

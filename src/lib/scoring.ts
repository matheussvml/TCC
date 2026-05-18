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
        colorClass: "text-gray-500",
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

export function getVerdictLabel(veredicto?: string): string {
  if (veredicto === "VERDADEIRO") return "Verdadeiro";
  if (veredicto === "PARCIALMENTE VERDADEIRO") return "Parcialmente Verdadeiro";
  if (veredicto === "FALSO") return "Falso";
  if (veredicto === "SEM EMBASAMENTO SUFICIENTE") return "Sem Embasamento";
  return "Não verificado";
}

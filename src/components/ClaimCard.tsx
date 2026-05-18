"use client";

import { CheckCircle2, XCircle, BookOpen, AlertTriangle, AlertCircle, HelpCircle, Gauge } from "lucide-react";
import type { Claim } from "@/data/mockData";

interface ClaimCardProps {
  claim: Claim;
  index: number;
}

type VerdictConfig = {
  badge: string;
  icon: React.ReactNode;
  label: string;
  sourceBg: string;
  sourceText: string;
  sourceIcon: React.ReactNode;
};

function getVerdictConfig(veredicto?: string, status?: Claim["status"]): VerdictConfig {
  if (veredicto === "VERDADEIRO") return {
    badge: "bg-green-50 text-green-700",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    label: "Verdadeiro",
    sourceBg: "bg-green-50",
    sourceText: "text-green-700",
    sourceIcon: <BookOpen className="h-3.5 w-3.5 text-green-500" />,
  };
  if (veredicto === "PARCIALMENTE VERDADEIRO") return {
    badge: "bg-yellow-50 text-yellow-700",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    label: "Parcialmente Verdadeiro",
    sourceBg: "bg-yellow-50",
    sourceText: "text-yellow-700",
    sourceIcon: <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />,
  };
  if (veredicto === "FALSO") return {
    badge: "bg-red-50 text-red-700",
    icon: <XCircle className="h-3.5 w-3.5" />,
    label: "Falso",
    sourceBg: "bg-red-50",
    sourceText: "text-red-700",
    sourceIcon: <XCircle className="h-3.5 w-3.5 text-red-500" />,
  };
  if (veredicto === "SEM EMBASAMENTO SUFICIENTE") return {
    badge: "bg-gray-100 text-gray-600",
    icon: <HelpCircle className="h-3.5 w-3.5" />,
    label: "Sem Embasamento",
    sourceBg: "bg-gray-50",
    sourceText: "text-gray-700",
    sourceIcon: <HelpCircle className="h-3.5 w-3.5 text-gray-500" />,
  };
  return status === "validated" ? {
    badge: "bg-green-50 text-green-700",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    label: "Validado",
    sourceBg: "bg-blue-50",
    sourceText: "text-blue-700",
    sourceIcon: <BookOpen className="h-3.5 w-3.5 text-blue-500" />,
  } : {
    badge: "bg-red-50 text-red-700",
    icon: <XCircle className="h-3.5 w-3.5" />,
    label: "Sem Evidências",
    sourceBg: "bg-amber-50",
    sourceText: "text-amber-700",
    sourceIcon: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
  };
}

const displayColorClasses: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700",
  yellow: "bg-amber-50 text-amber-700",
  red: "bg-rose-50 text-rose-700",
  gray: "bg-gray-100 text-gray-600",
};

function DisplayScoreBadge({ score, color }: { score?: number; color?: string }) {
  if (typeof score !== "number") return null;
  const cls = color
    ? (displayColorClasses[color] ?? displayColorClasses.gray)
    : score >= 75
    ? displayColorClasses.green
    : score >= 40
    ? displayColorClasses.yellow
    : displayColorClasses.red;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
      <Gauge className="h-3 w-3" />
      {score}% de confiança
    </span>
  );
}

export default function ClaimCard({ claim, index }: ClaimCardProps) {
  const cfg = getVerdictConfig(claim.veredicto, claim.status);
  const claimText = claim.text?.trim();
  const hasText = claimText && claimText.length > 0;

  return (
    <div
      className="animate-fade-in rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="p-5">
        {/* Veredicto + score */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg.badge}`}>
            {cfg.icon}
            {cfg.label}
          </span>
          <DisplayScoreBadge score={claim.displayScore} color={claim.displayColor} />
        </div>

        {/* Texto da alegação */}
        {hasText ? (
          <p className="text-sm font-medium leading-relaxed text-gray-800">
            &ldquo;{claimText}&rdquo;
          </p>
        ) : (
          <p className="text-sm italic leading-relaxed text-gray-400">
            Alegação não foi extraída pelo modelo. Veja a explicação abaixo.
          </p>
        )}

        {/* Bloco de fonte */}
        <div className={`mt-4 rounded-lg p-3 ${cfg.sourceBg}`}>
          <div className="mb-1 flex items-center gap-1.5">
            {cfg.sourceIcon}
            <span className={`text-xs font-semibold ${cfg.sourceText}`}>
              {claim.sourceLevel}
            </span>
          </div>
          <p className={`text-xs leading-relaxed ${cfg.sourceText}`}>
            {claim.source}
          </p>

          {Array.isArray(claim.fontes) && claim.fontes.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-current/10 pt-2">
              {claim.fontes.map((f, i) => (
                <li key={i} className={`text-xs ${cfg.sourceText}`}>
                  • {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

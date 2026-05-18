"use client";

import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Newspaper,
} from "lucide-react";
import type { Claim, FonteDetalhada } from "@/lib/scoring";
import { getScoreDisplay, getVerdictLabel } from "@/lib/scoring";

interface ClaimCardProps {
  claim: Claim;
  index: number;
}

const borderColorMap: Record<string, string> = {
  green: "#22c55e",
  yellow: "#f59e0b",
  red: "#ef4444",
  gray: "#d1d5db",
};

const verdictIconMap = {
  VERDADEIRO: CheckCircle2,
  "PARCIALMENTE VERDADEIRO": AlertCircle,
  FALSO: XCircle,
  "SEM EMBASAMENTO SUFICIENTE": HelpCircle,
};

const verdictIconColorMap: Record<string, string> = {
  VERDADEIRO: "text-green-600",
  "PARCIALMENTE VERDADEIRO": "text-amber-500",
  FALSO: "text-red-600",
  "SEM EMBASAMENTO SUFICIENTE": "text-gray-400",
};

function VerdictIcon({ veredicto }: { veredicto?: string }) {
  const key = veredicto as keyof typeof verdictIconMap;
  const Icon = verdictIconMap[key] ?? HelpCircle;
  const colorClass = verdictIconColorMap[veredicto ?? ""] ?? "text-gray-400";
  return <Icon className={colorClass} style={{ width: 24, height: 24 }} />;
}

function ScoreChip({ displayScore, displayColor }: { displayScore?: number; displayColor?: string }) {
  if (typeof displayScore !== "number") return null;
  const { label, colorClass, bgClass } = getScoreDisplay(
    displayScore,
    displayColor as "green" | "yellow" | "red" | "gray" | undefined
  );
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${bgClass} ${colorClass}`}>
      {label}
    </span>
  );
}

function FonteLink({ fonte }: { fonte: FonteDetalhada }) {
  const Icon = fonte.tipo === "jornalistica" ? Newspaper : BookOpen;
  return (
    <a
      href={fonte.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-2 text-xs text-blue-600 hover:underline"
    >
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
      <span>{fonte.titulo}</span>
    </a>
  );
}

export default function ClaimCard({ claim, index }: ClaimCardProps) {
  const borderColor = borderColorMap[claim.displayColor ?? "gray"] ?? borderColorMap.gray;
  const claimText = claim.text?.trim();
  const hasText = claimText && claimText.length > 0;

  const hasFontes = Array.isArray(claim.fontes) && claim.fontes.length > 0;
  const hasJornalistica = hasFontes && claim.fontes!.some((f) => f.tipo === "jornalistica");
  const hasCientifica = hasFontes && claim.fontes!.some((f) => f.tipo === "cientifica");
  const hasFontesDetalhadas =
    !hasFontes &&
    claim.fontes_detalhadas &&
    (claim.fontes_detalhadas.cientificas || claim.fontes_detalhadas.jornalisticas);

  return (
    <div
      className="animate-fade-in rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
      style={{
        animationDelay: `${index * 100}ms`,
        borderLeft: `4px solid ${borderColor}`,
      }}
    >
      <div className="p-5">
        {/* Veredicto + score */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <VerdictIcon veredicto={claim.veredicto} />
          <span className="text-sm font-bold text-gray-800">
            {getVerdictLabel(claim.veredicto)}
          </span>
          <ScoreChip displayScore={claim.displayScore} displayColor={claim.displayColor} />
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

        {/* Explicação */}
        {claim.source && (
          <p className="mt-3 text-xs leading-relaxed text-gray-600">{claim.source}</p>
        )}

        {/* Fontes como links clicáveis */}
        {hasFontes && (
          <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
            {claim.fontes!.map((f, i) => (
              <FonteLink key={i} fonte={f} />
            ))}
          </div>
        )}

        {/* Fallback: fontes_detalhadas em texto */}
        {hasFontesDetalhadas && (
          <div className="mt-3 space-y-3 border-t border-gray-100 pt-3 text-xs text-gray-600">
            {claim.fontes_detalhadas!.cientificas && (
              <div>
                <p className="mb-1 flex items-center gap-1 font-semibold text-gray-700">
                  <BookOpen className="h-3.5 w-3.5" /> Fontes científicas
                </p>
                <p className="whitespace-pre-wrap leading-relaxed">
                  {claim.fontes_detalhadas!.cientificas}
                </p>
              </div>
            )}
            {claim.fontes_detalhadas!.jornalisticas && (
              <div>
                <p className="mb-1 flex items-center gap-1 font-semibold text-gray-700">
                  <Newspaper className="h-3.5 w-3.5" /> Checagem jornalística
                </p>
                <p className="whitespace-pre-wrap leading-relaxed">
                  {claim.fontes_detalhadas!.jornalisticas}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Chips de tipo de fonte */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {hasCientifica && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700">
              <BookOpen className="h-3 w-3" /> Fonte científica
            </span>
          )}
          {hasJornalistica && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs text-purple-700">
              <Newspaper className="h-3 w-3" /> Checagem jornalística
            </span>
          )}
          {!hasFontes && !hasFontesDetalhadas && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs text-amber-700">
              ⚠ Verificação automática
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

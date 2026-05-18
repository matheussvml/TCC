"use client";

import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Newspaper,
  FlaskConical,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import type { Claim } from "@/lib/scoring";
import { getScoreDisplay, getVerdictLabel, normalizeFontes } from "@/lib/scoring";

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

function ScoreChip({
  displayScore,
  displayColor,
}: {
  displayScore?: number;
  displayColor?: string;
}) {
  if (typeof displayScore !== "number") return null;
  const { label, colorClass, bgClass } = getScoreDisplay(
    displayScore,
    displayColor as "green" | "yellow" | "red" | "gray" | undefined
  );
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${bgClass} ${colorClass}`}
    >
      {label}
    </span>
  );
}

function FontesList({ fontes }: { fontes: { titulo: string; url: string }[] }) {
  return (
    <ul className="space-y-1">
      {fontes.map((f, i) => (
        <li key={i}>
          <a
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-start gap-1 break-all text-sm hover:underline"
          >
            <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" />
            <span>{f.titulo}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function SourcesSection({ claim }: { claim: Claim }) {
  const journalistic = normalizeFontes(claim.fontes_jornalisticas);
  const scientific = normalizeFontes(claim.fontes_cientificas);

  // Fallback: if new fields absent, derive from legacy fontes array
  const legacyJournalistic =
    !journalistic.hasData && Array.isArray(claim.fontes)
      ? claim.fontes
          .filter((f) => f.tipo === "jornalistica")
          .map(({ titulo, url }) => ({ titulo, url }))
      : [];
  const legacyScientific =
    !scientific.hasData && Array.isArray(claim.fontes)
      ? claim.fontes
          .filter((f) => f.tipo === "cientifica")
          .map(({ titulo, url }) => ({ titulo, url }))
      : [];

  const journalisticItems = journalistic.items.length > 0 ? journalistic.items : legacyJournalistic;
  const scientificItems = scientific.items.length > 0 ? scientific.items : legacyScientific;

  const hasJournalistic = journalistic.hasData || journalisticItems.length > 0;
  const hasScientific = scientific.hasData || scientificItems.length > 0;

  return (
    <div className="mt-3 grid grid-cols-1 gap-3 border-t border-gray-100 pt-3 md:grid-cols-2">
      {/* Checagem jornalística */}
      <div className="rounded border border-blue-100 bg-blue-50 p-3">
        <p className="mb-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
          <Newspaper className="h-3.5 w-3.5" />
          Checagens jornalísticas
        </p>
        {hasJournalistic ? (
          <>
            {journalisticItems.length > 0 ? (
              <FontesList fontes={journalisticItems} />
            ) : (
              <p className="whitespace-pre-line text-sm text-blue-800">{journalistic.rawText}</p>
            )}
          </>
        ) : (
          <p className="text-xs text-gray-400">Nenhuma checagem jornalística encontrada</p>
        )}
      </div>

      {/* Artigos científicos */}
      <div className="rounded border border-purple-100 bg-purple-50 p-3">
        <p className="mb-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-purple-600">
          <FlaskConical className="h-3.5 w-3.5" />
          Artigos científicos
        </p>
        {hasScientific ? (
          <>
            {scientificItems.length > 0 ? (
              <FontesList fontes={scientificItems} />
            ) : (
              <p className="whitespace-pre-line text-sm text-purple-800">{scientific.rawText}</p>
            )}
          </>
        ) : (
          <p className="text-xs text-gray-400">Nenhum artigo científico encontrado</p>
        )}
      </div>
    </div>
  );
}

export default function ClaimCard({ claim, index }: ClaimCardProps) {
  const borderColor = borderColorMap[claim.displayColor ?? "gray"] ?? borderColorMap.gray;
  const claimText = claim.text?.trim();
  const hasText = claimText && claimText.length > 0;

  const journalistic = normalizeFontes(claim.fontes_jornalisticas);
  const scientific = normalizeFontes(claim.fontes_cientificas);
  const legacyHasJournalistic =
    !journalistic.hasData && Array.isArray(claim.fontes) && claim.fontes.some((f) => f.tipo === "jornalistica");
  const legacyHasScientific =
    !scientific.hasData && Array.isArray(claim.fontes) && claim.fontes.some((f) => f.tipo === "cientifica");

  const hasJournalistic = journalistic.hasData || legacyHasJournalistic;
  const hasScientific = scientific.hasData || legacyHasScientific;
  const hasAnySources = hasJournalistic || hasScientific;

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

        {/* Chips de tipo de fonte */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {hasJournalistic && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              <Newspaper className="h-3 w-3" /> Checagem jornalística
            </span>
          )}
          {hasScientific && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
              <FlaskConical className="h-3 w-3" /> Fonte científica
            </span>
          )}
          {!hasAnySources && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              <AlertTriangle className="h-3 w-3" /> Verificação automática
            </span>
          )}
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

        {/* Seção de fontes dividida em duas colunas */}
        <SourcesSection claim={claim} />
      </div>
    </div>
  );
}

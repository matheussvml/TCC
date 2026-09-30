"use client";

import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Newspaper,
  FlaskConical,
  ExternalLink,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import type { Claim } from "@/lib/scoring";
import { getScoreDisplay, getVerdictLabel, normalizeFontes } from "@/lib/scoring";
import BotaoOuvir from "./BotaoOuvir";

interface ClaimCardProps {
  claim: Claim;
  index: number;
}

const borderColorMap: Record<string, string> = {
  green: "#15803d",
  yellow: "#d97706",
  red: "#b91c1c",
  gray: "#6b7280",
};

const verdictIconMap = {
  VERDADEIRO: CheckCircle2,
  "PARCIALMENTE VERDADEIRO": AlertCircle,
  FALSO: XCircle,
  "SEM EMBASAMENTO SUFICIENTE": HelpCircle,
};

// Fundo sólido + texto com contraste acima de 4,5:1 (WCAG 1.4.3). O veredicto
// nunca depende só da cor: sempre vem com ícone e texto (WCAG 1.4.1).
const verdictStyleMap: Record<string, string> = {
  VERDADEIRO: "bg-green-700 text-white",
  "PARCIALMENTE VERDADEIRO": "bg-amber-400 text-gray-900",
  FALSO: "bg-red-700 text-white",
  "SEM EMBASAMENTO SUFICIENTE": "bg-gray-600 text-white",
};

function VerdictBadge({ veredicto }: { veredicto?: string }) {
  const key = veredicto as keyof typeof verdictIconMap;
  const Icon = verdictIconMap[key] ?? HelpCircle;
  const style = verdictStyleMap[veredicto ?? ""] ?? "bg-gray-600 text-white";
  return (
    <span className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-lg font-bold ${style}`}>
      <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
      {getVerdictLabel(veredicto)}
    </span>
  );
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
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${bgClass} ${colorClass}`}
    >
      {label}
    </span>
  );
}

function FontesList({ fontes, linkClass }: { fontes: { titulo: string; url: string }[]; linkClass: string }) {
  return (
    <ul className="space-y-2">
      {fontes.map((f, i) => (
        <li key={i}>
          <a
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-start gap-1.5 py-1 text-base leading-snug underline underline-offset-2 [overflow-wrap:anywhere] ${linkClass}`}
          >
            <ExternalLink className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {f.titulo}
              <span className="sr-only"> (abre em nova aba)</span>
            </span>
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

  const totalLinks = journalisticItems.length + scientificItems.length;
  const summaryLabel = !hasJournalistic && !hasScientific
    ? "Ver as fontes consultadas (nenhuma encontrada)"
    : totalLinks > 0
    ? `Ver as fontes consultadas (${totalLinks})`
    : "Ver as fontes consultadas";

  // Recolhido por padrão: a lista inteira de fontes deixava o cartão enorme no
  // celular. Continua a um toque de distância — a verificação segue auditável.
  return (
    <details className="group mt-4 border-t border-gray-200 pt-3">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-2 text-base font-semibold text-blue-800 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 [&::-webkit-details-marker]:hidden">
        <span>{summaryLabel}</span>
        <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Checagem jornalística */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-bold text-blue-900">
            <Newspaper className="h-4 w-4" aria-hidden="true" />
            Checagens de jornalistas
          </p>
          {hasJournalistic ? (
            <>
              {journalisticItems.length > 0 ? (
                <FontesList fontes={journalisticItems} linkClass="text-blue-900" />
              ) : (
                <p className="whitespace-pre-line text-base text-blue-900">{journalistic.rawText}</p>
              )}
            </>
          ) : (
            <p className="text-base text-gray-700">Nenhuma checagem jornalística encontrada.</p>
          )}
        </div>

        {/* Artigos científicos */}
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
          <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-bold text-purple-900">
            <FlaskConical className="h-4 w-4" aria-hidden="true" />
            Artigos científicos
          </p>
          {hasScientific ? (
            <>
              {scientificItems.length > 0 ? (
                <FontesList fontes={scientificItems} linkClass="text-purple-900" />
              ) : (
                <p className="whitespace-pre-line text-base text-purple-900">{scientific.rawText}</p>
              )}
            </>
          ) : (
            <p className="text-base text-gray-700">Nenhum artigo científico encontrado.</p>
          )}
        </div>
      </div>
    </details>
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
    <article
      className="animate-fade-in rounded-xl border border-gray-200 bg-white shadow-sm"
      style={{
        animationDelay: `${index * 100}ms`,
        borderLeft: `6px solid ${borderColor}`,
      }}
      aria-label={`Afirmação ${index + 1}: ${getVerdictLabel(claim.veredicto)}`}
    >
      <div className="p-5">
        {/* Veredicto + score */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <VerdictBadge veredicto={claim.veredicto} />
          <ScoreChip displayScore={claim.displayScore} displayColor={claim.displayColor} />
        </div>

        {/* Ler em voz alta: afirmação, veredicto e explicação */}
        <div className="mb-3">
          <BotaoOuvir
            id={`afirmacao-${claim.id}`}
            rotulo="Ouvir explicação"
            texto={[
              hasText ? `O vídeo diz: ${claimText}.` : "",
              `Resultado: ${getVerdictLabel(claim.veredicto)}.`,
              claim.source ? `Por quê: ${claim.source}` : "",
            ].join(" ")}
          />
        </div>

        {/* Chips de tipo de fonte */}
        <div className="mb-4 flex flex-wrap gap-2">
          {hasJournalistic && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-900">
              <Newspaper className="h-4 w-4" aria-hidden="true" /> Checado por jornalistas
            </span>
          )}
          {hasScientific && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-sm font-medium text-purple-900">
              <FlaskConical className="h-4 w-4" aria-hidden="true" /> Com base científica
            </span>
          )}
          {!hasAnySources && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-900">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Verificação automática, sem fontes
            </span>
          )}
        </div>

        {/* Texto da alegação */}
        <p className="text-sm font-bold uppercase tracking-wide text-gray-600">O vídeo diz</p>
        {hasText ? (
          <p className="mt-1 text-lg font-semibold leading-relaxed text-gray-900">
            &ldquo;{claimText}&rdquo;
          </p>
        ) : (
          <p className="mt-1 text-base italic leading-relaxed text-gray-700">
            Não conseguimos separar esta afirmação. Veja a explicação abaixo.
          </p>
        )}

        {/* Explicação */}
        {claim.source && (
          <>
            <p className="mt-4 text-sm font-bold uppercase tracking-wide text-gray-600">Por quê</p>
            <p className="mt-1 text-base leading-relaxed text-gray-800">{claim.source}</p>
          </>
        )}

        {/* Fontes, recolhidas */}
        <SourcesSection claim={claim} />
      </div>
    </article>
  );
}

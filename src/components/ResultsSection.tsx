"use client";

import { useState } from "react";
import { ShieldCheck, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { AnalysisResult } from "@/data/mockData";
import ScoreBadge from "./ScoreBadge";
import TranscriptPanel from "./TranscriptPanel";
import ClaimCard from "./ClaimCard";

interface ResultsSectionProps {
  result: AnalysisResult;
}

const INITIAL_VISIBLE = 3;

export default function ResultsSection({ result }: ResultsSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const totalCount = result.claims.length;
  const falseCount = result.claims.filter((c) => c.veredicto === "FALSO").length;
  const hasMore = totalCount > INITIAL_VISIBLE;
  const visibleClaims = expanded ? result.claims : result.claims.slice(0, INITIAL_VISIBLE);

  return (
    <section className="animate-fade-in mx-auto w-full max-w-5xl px-6 pb-16 pt-4">
      {/* Video info header */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Embedded video ou thumbnail */}
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-gray-900 lg:w-96 lg:shrink-0">
            {result.embedUrl ? (
              <iframe
                src={result.embedUrl}
                title={result.videoTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            ) : result.thumbnailUrl ? (
              <img
                src={result.thumbnailUrl}
                alt={result.videoTitle}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                Preview indisponível
              </div>
            )}
          </div>

          {/* Video metadata */}
          <div className="flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{result.videoTitle}</h2>
              {result.videoChannel && (
                <p className="mt-1 text-sm text-gray-500">{result.videoChannel}</p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <ScoreBadge
                score={result.overallScore}
                color={
                  result.overallScore >= 70
                    ? "green"
                    : result.overallScore >= 40
                    ? "yellow"
                    : "red"
                }
              />

              {/* Contador com destaque de falsas */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-500">
                  {totalCount} {totalCount === 1 ? "alegação analisada" : "alegações analisadas"}
                </span>
                {falseCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                    <XCircle className="h-3.5 w-3.5" />
                    {falseCount} {falseCount === 1 ? "falsa" : "falsas"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-8 lg:grid-cols-5">
        {/* Transcript */}
        <div className="lg:col-span-2">
          <TranscriptPanel transcript={result.transcript} />
        </div>

        {/* Validation claims */}
        <div className="lg:col-span-3">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-bold text-gray-900">Painel de Validação</h3>
          </div>

          {totalCount > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-1">
                {visibleClaims.map((claim, i) => (
                  <ClaimCard key={claim.id} claim={claim} index={i} />
                ))}
              </div>

              {hasMore && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Mostrar menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Ver todas as {totalCount} alegações
                    </>
                  )}
                </button>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
              Nenhuma alegação foi extraída desta transcrição.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

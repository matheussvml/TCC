"use client";

import { ShieldCheck } from "lucide-react";
import type { AnalysisResult } from "@/data/mockData";
import ScoreBadge from "./ScoreBadge";
import TranscriptPanel from "./TranscriptPanel";
import ClaimCard from "./ClaimCard";

interface ResultsSectionProps {
  result: AnalysisResult;
}

export default function ResultsSection({ result }: ResultsSectionProps) {
  const validCount = result.claims.filter(
    (c) => c.status === "validated"
  ).length;
  const totalCount = result.claims.length;

  return (
    <section className="animate-fade-in mx-auto w-full max-w-5xl px-6 pb-16 pt-4">
      {/* Video info header */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Embedded video */}
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-gray-900 lg:w-96 lg:shrink-0">
            <iframe
              src={result.embedUrl}
              title={result.videoTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>

          {/* Video metadata */}
          <div className="flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {result.videoTitle}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {result.videoChannel}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <ScoreBadge score={result.overallScore} />
              <span className="text-sm text-gray-500">
                {validCount} de {totalCount} afirmações validadas
              </span>
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
            <h3 className="text-base font-bold text-gray-900">
              Painel de Validação
            </h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-1">
            {result.claims.map((claim, i) => (
              <ClaimCard key={claim.id} claim={claim} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

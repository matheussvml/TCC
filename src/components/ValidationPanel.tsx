"use client";

import { ShieldCheck, Info } from "lucide-react";
import type { Claim } from "@/data/mockData";
import ScoreBadge from "./ScoreBadge";
import ClaimCard from "./ClaimCard";

interface ValidationPanelProps {
  claims: Claim[];
  overallScore: number;
}

export default function ValidationPanel({
  claims,
  overallScore,
}: ValidationPanelProps) {
  const validCount = claims.filter((c) => c.status === "validated").length;

  return (
    <section className="animate-fade-in mx-auto w-full max-w-5xl px-6 pb-16">
      {/* Header do painel */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Painel de Validação
            </h3>
            <p className="text-xs text-gray-500">
              {validCount} de {claims.length} afirmações validadas
            </p>
          </div>
        </div>
        <ScoreBadge score={overallScore} />
      </div>

      {/* Aviso de placeholder */}
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
        <Info className="h-4 w-4 shrink-0 text-amber-500" />
        <p className="text-xs text-amber-700">
          Dados de validação simulados (placeholder). A integração real com
          fontes científicas será feita via n8n.
        </p>
      </div>

      {/* Cards de afirmações */}
      <div className="grid gap-4">
        {claims.map((claim, i) => (
          <ClaimCard key={claim.id} claim={claim} index={i} />
        ))}
      </div>
    </section>
  );
}

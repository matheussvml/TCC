"use client";

import { CheckCircle2, XCircle, BookOpen, AlertTriangle, Gauge } from "lucide-react";
import type { Claim } from "@/data/mockData";

interface ClaimCardProps {
  claim: Claim;
  index: number;
}

function VeredictoBadge({ veredicto, status }: { veredicto?: string; status: Claim["status"] }) {
  if (veredicto === "VERDADEIRO") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Verdadeiro
      </span>
    );
  }
  if (veredicto === "PARCIALMENTE VERDADEIRO") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
        <AlertTriangle className="h-3.5 w-3.5" />
        Parcialmente Verdadeiro
      </span>
    );
  }
  if (veredicto === "FALSO") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
        <XCircle className="h-3.5 w-3.5" />
        Falso
      </span>
    );
  }
  if (veredicto === "SEM EMBASAMENTO SUFICIENTE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
        <AlertTriangle className="h-3.5 w-3.5" />
        Sem Embasamento
      </span>
    );
  }
  return status === "validated" ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Validado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
      <XCircle className="h-3.5 w-3.5" />
      Sem Evidências
    </span>
  );
}

function ConfiancaBadge({ confianca }: { confianca?: number }) {
  if (typeof confianca !== "number") return null;
  const pct = Math.round(confianca * 100);
  const color =
    pct >= 75
      ? "bg-emerald-50 text-emerald-700"
      : pct >= 40
      ? "bg-amber-50 text-amber-700"
      : "bg-rose-50 text-rose-700";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${color}`}
    >
      <Gauge className="h-3 w-3" />
      {pct}% de confiança
    </span>
  );
}

export default function ClaimCard({ claim, index }: ClaimCardProps) {
  const isValid = claim.status === "validated";
  const claimText = claim.text?.trim();
  const hasText = claimText && claimText.length > 0;

  return (
    <div
      className="animate-fade-in rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="p-5">
        {/* Status + confiança */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <VeredictoBadge veredicto={claim.veredicto} status={claim.status} />
          <ConfiancaBadge confianca={claim.confianca} />
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

        {/* Explicação / fonte */}
        <div
          className={`mt-4 rounded-lg p-3 ${
            isValid ? "bg-blue-50" : "bg-amber-50"
          }`}
        >
          <div className="mb-1 flex items-center gap-1.5">
            {isValid ? (
              <BookOpen className="h-3.5 w-3.5 text-blue-500" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            )}
            <span
              className={`text-xs font-semibold ${
                isValid ? "text-blue-600" : "text-amber-600"
              }`}
            >
              {claim.sourceLevel}
            </span>
          </div>
          <p
            className={`text-xs leading-relaxed ${
              isValid ? "text-blue-700" : "text-amber-700"
            }`}
          >
            {claim.source}
          </p>

          {/* Lista de fontes, se houver */}
          {Array.isArray(claim.fontes) && claim.fontes.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-current/10 pt-2">
              {claim.fontes.map((f, i) => (
                <li
                  key={i}
                  className={`text-xs ${
                    isValid ? "text-blue-700" : "text-amber-700"
                  }`}
                >
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

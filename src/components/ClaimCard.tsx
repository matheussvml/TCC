"use client";

import { CheckCircle2, XCircle, BookOpen, AlertTriangle } from "lucide-react";
import type { Claim } from "@/data/mockData";

interface ClaimCardProps {
  claim: Claim;
  index: number;
}

export default function ClaimCard({ claim, index }: ClaimCardProps) {
  const isValid = claim.status === "validated";

  return (
    <div
      className="animate-fade-in rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="p-5">
        {/* Status badge */}
        <div className="mb-3 flex items-center gap-2">
          {isValid ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Validado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
              <XCircle className="h-3.5 w-3.5" />
              Sem Evidências
            </span>
          )}
        </div>

        {/* Claim text */}
        <p className="text-sm font-medium leading-relaxed text-gray-800">
          &ldquo;{claim.text}&rdquo;
        </p>

        {/* Source info */}
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
        </div>
      </div>
    </div>
  );
}

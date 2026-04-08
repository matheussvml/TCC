"use client";

import { CheckCircle2, Loader2 } from "lucide-react";

interface LoadingStepsProps {
  currentStep: number;
  steps: { label: string; duration: number }[];
}

export default function LoadingSteps({
  currentStep,
  steps,
}: LoadingStepsProps) {
  return (
    <section className="mx-auto w-full max-w-xl px-6 py-10">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-center text-sm font-semibold uppercase tracking-wider text-gray-500">
          Processando vídeo
        </h3>
        <ol className="space-y-3">
          {steps.map((step, i) => {
            const isDone = i < currentStep;
            const isActive = i === currentStep;

            return (
              <li
                key={i}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-all ${
                  isDone
                    ? "bg-green-50 text-green-700"
                    : isActive
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-400"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                ) : isActive ? (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-blue-500" />
                ) : (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-400">
                    {i + 1}
                  </span>
                )}
                {step.label}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

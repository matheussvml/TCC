"use client";

import { CheckCircle2, Loader2, Clock } from "lucide-react";

interface LoadingStepsProps {
  currentStep: number;
  steps: { label: string; duration: number }[];
}

export default function LoadingSteps({
  currentStep,
  steps,
}: LoadingStepsProps) {
  const active = steps[currentStep];

  return (
    <section className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-center text-xl font-bold text-gray-900">
          Verificando o vídeo...
        </h3>

        {/* Tempo honesto: sem isso, quem espera acha que travou e fecha a página */}
        <p className="mt-3 flex items-start justify-center gap-2 text-center text-base leading-relaxed text-gray-700">
          <Clock className="mt-1 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
          <span>
            Isso pode levar até 1 minuto. Deixe esta página aberta: o resultado
            aparece aqui.
          </span>
        </p>

        {/* Anuncia a etapa atual para leitores de tela */}
        <p className="sr-only" aria-live="polite">
          {active ? active.label : ""}
        </p>

        <ol className="mt-5 space-y-2">
          {steps.map((step, i) => {
            const isDone = i < currentStep;
            const isActive = i === currentStep;

            return (
              <li
                key={i}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base transition-all ${
                  isDone
                    ? "bg-green-50 text-green-900"
                    : isActive
                    ? "bg-blue-50 font-semibold text-blue-900"
                    : "text-gray-600"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-green-700" aria-hidden="true" />
                ) : isActive ? (
                  <Loader2 className="h-6 w-6 shrink-0 animate-spin text-blue-700" aria-hidden="true" />
                ) : (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-gray-400 text-sm text-gray-600" aria-hidden="true">
                    {i + 1}
                  </span>
                )}
                <span>
                  {step.label}
                  {isDone && <span className="sr-only"> (concluído)</span>}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

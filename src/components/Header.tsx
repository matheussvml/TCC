"use client";

import { ShieldCheck, History } from "lucide-react";

interface HeaderProps {
  savedCount?: number;
  onOpenHistory?: () => void;
}

export default function Header({ savedCount = 0, onOpenHistory }: HeaderProps) {
  return (
    <header className="w-full border-b border-gray-200 bg-white">
      {/* flex-wrap: com letra muito grande o Histórico desce em vez de cobrir o nome */}
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-9 w-9 text-blue-700 shrink-0" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              FactChekk
            </h1>
            <p className="hidden text-base text-gray-700 sm:block">
              Verificador científico de fatos em vídeos
            </p>
          </div>
        </div>

        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-3.5 py-2 text-base font-semibold text-gray-800 transition hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
            title="Abrir histórico de análises salvas"
          >
            <History className="h-5 w-5 text-blue-700" aria-hidden="true" />
            <span>Histórico</span>
            {savedCount > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-700 px-1.5 text-sm font-bold text-white">
                <span className="sr-only">, </span>
                {savedCount}
                <span className="sr-only"> salvos</span>
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
}


"use client";

import { ShieldCheck, History } from "lucide-react";

interface HeaderProps {
  savedCount?: number;
  onOpenHistory?: () => void;
}

export default function Header({ savedCount = 0, onOpenHistory }: HeaderProps) {
  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-blue-600 shrink-0" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              FactCheck KAI
            </h1>
            <p className="text-sm text-gray-500">
              Verificador científico de fatos em vídeos com Inteligência Artificial
            </p>
          </div>
        </div>

        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
            title="Abrir histórico de análises salvas"
          >
            <History className="h-4 w-4 text-blue-600" />
            <span className="hidden sm:inline">Histórico</span>
            {savedCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white">
                {savedCount}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
}


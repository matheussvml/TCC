"use client";

import { Search, Loader2 } from "lucide-react";

interface VideoInputProps {
  url: string;
  onUrlChange: (url: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export default function VideoInput({
  url,
  onUrlChange,
  onSubmit,
  isLoading,
}: VideoInputProps) {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 pt-12 pb-8 text-center">
      <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
        Verifique os fatos de qualquer vídeo
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-base text-gray-500">
        Cole o link de um vídeo e nossa IA irá transcrever, identificar as
        afirmações e validá-las com fontes científicas e jornalísticas.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="mt-8 flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="Cole aqui o link do vídeo (YouTube, TikTok, etc)..."
            className="w-full rounded-xl border border-gray-300 bg-white py-4 pl-12 pr-4 text-base text-gray-900 shadow-sm outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || url.trim() === ""}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Search className="h-5 w-5" />
              Analisar Vídeo
            </>
          )}
        </button>
      </form>
    </section>
  );
}

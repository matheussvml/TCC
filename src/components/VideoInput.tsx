"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { Search, Loader2, Upload, X, ClipboardPaste } from "lucide-react";
import { extrairLink } from "@/lib/links";
import ComoCopiarLink from "./ComoCopiarLink";

interface VideoInputProps {
  url: string;
  onUrlChange: (url: string) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const semAssinatura = () => () => {};
const clipboardLegivel = () => typeof navigator !== "undefined" && !!navigator.clipboard?.readText;

export default function VideoInput({
  url,
  onUrlChange,
  file,
  onFileChange,
  onSubmit,
  isLoading,
}: VideoInputProps) {
  const verificarRef = useRef<HTMLButtonElement>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  // Falso no servidor e na hidratação; o botão Colar só aparece no navegador que suporta
  const podeColar = useSyncExternalStore(semAssinatura, clipboardLegivel, () => false);
  const bloqueado = isLoading || file !== null;

  async function colarLink() {
    setAviso(null);
    try {
      const texto = await navigator.clipboard.readText();
      const link = extrairLink(texto);
      if (link) {
        // flushSync: o botão Verificar só deixa de estar desabilitado depois do
        // re-render, e botão desabilitado não recebe foco
        flushSync(() => onUrlChange(link));
        // Próximo passo óbvio: o botão Verificar já fica selecionado
        verificarRef.current?.focus();
      } else {
        setAviso("O que está copiado não parece um link de vídeo. Copie o link e toque em Colar de novo.");
      }
    } catch {
      setAviso("Não conseguimos colar sozinhos. Toque e segure dentro do campo e escolha Colar.");
    }
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 pt-10 pb-8 text-center sm:px-6 sm:pt-12">
      <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
        Verifique os fatos de qualquer vídeo
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-lg leading-relaxed text-gray-700">
        Cole o link de um vídeo ou envie o arquivo. Vamos ouvir o vídeo,
        separar o que ele afirma e conferir com fontes científicas e
        jornalísticas.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="mt-8 flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <label htmlFor="video-url" className="sr-only">
            Link do vídeo
          </label>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-500" aria-hidden="true" />
          <input
            id="video-url"
            type="text"
            inputMode="url"
            autoComplete="off"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            onPaste={(e) => {
              // Colou a mensagem inteira do WhatsApp? Fica só o link.
              const texto = e.clipboardData.getData("text");
              const link = extrairLink(texto);
              if (link && link !== texto.trim()) {
                e.preventDefault();
                onUrlChange(link);
              }
            }}
            placeholder="Cole o link aqui"
            className={`min-h-14 w-full rounded-xl border-2 border-gray-400 bg-white py-4 pl-13 text-lg text-gray-900 shadow-sm outline-none transition-all placeholder:text-gray-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-200 disabled:bg-gray-100 ${
              podeColar ? "pr-30" : "pr-4"
            }`}
            disabled={bloqueado}
          />
          {podeColar && !bloqueado && (
            <button
              type="button"
              onClick={colarLink}
              className="absolute right-2 top-1/2 flex min-h-11 -translate-y-1/2 items-center gap-1.5 rounded-lg border-2 border-blue-700 bg-blue-50 px-3 text-base font-bold text-blue-800 hover:bg-blue-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            >
              <ClipboardPaste className="h-5 w-5" aria-hidden="true" />
              Colar
            </button>
          )}
        </div>
        <button
          ref={verificarRef}
          type="submit"
          disabled={isLoading || (url.trim().length === 0 && !file)}
          className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-blue-700 px-7 py-4 text-lg font-bold text-white shadow-sm transition-colors hover:bg-blue-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
              Verificando...
            </>
          ) : (
            <>
              <Search className="h-6 w-6" aria-hidden="true" />
              Verificar vídeo
            </>
          )}
        </button>
      </form>

      {/* Aviso do botão Colar (clipboard vazio, texto sem link ou permissão negada) */}
      <p aria-live="polite" className={aviso ? "mt-3 rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-base text-amber-950" : "sr-only"}>
        {aviso ?? ""}
      </p>

      {file ? (
        <div className="mt-4 flex items-center justify-center gap-3 rounded-xl border-2 border-blue-300 bg-blue-50 px-4 py-3 text-base text-blue-900">
          <Upload className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="truncate">{file.name}</span>
          <button
            type="button"
            onClick={() => onFileChange(null)}
            disabled={isLoading}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-blue-800 transition-colors hover:bg-blue-100 disabled:opacity-50"
            aria-label="Remover arquivo"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <label className="mt-4 inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-5 py-2.5 text-base font-semibold text-gray-800 transition-colors hover:border-blue-400 hover:text-blue-800 focus-within:ring-4 focus-within:ring-blue-200">
          <Upload className="h-5 w-5" aria-hidden="true" />
          Ou envie um vídeo do celular ou computador
          <input
            type="file"
            accept="video/*,audio/*"
            className="sr-only"
            disabled={isLoading}
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />
        </label>
      )}

      {!isLoading && <ComoCopiarLink />}
    </section>
  );
}

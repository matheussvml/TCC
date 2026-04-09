"use client";

import { FileText, Copy, CheckCircle2, Video } from "lucide-react";
import { useState } from "react";

interface TranscriptResultProps {
  transcript: string;
  videoUrl: string;
  videoTitle?: string;
  videoThumbnail?: string;
}

export default function TranscriptResult({
  transcript,
  videoUrl,
  videoTitle,
  videoThumbnail,
}: TranscriptResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Tenta extrair embed do YouTube
  const youtubeMatch = videoUrl.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/
  );
  const embedUrl = youtubeMatch
    ? `https://www.youtube.com/embed/${youtubeMatch[1]}`
    : null;

  return (
    <section className="animate-fade-in mx-auto w-full max-w-5xl px-6 pb-16 pt-4">
      {/* Título do vídeo */}
      {videoTitle && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <Video className="h-5 w-5 shrink-0 text-blue-600" />
          <h2 className="text-base font-bold text-gray-900">{videoTitle}</h2>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Coluna do vídeo / thumbnail */}
        <div className="lg:col-span-2">
          {embedUrl ? (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="aspect-video w-full bg-gray-900">
                <iframe
                  src={embedUrl}
                  title={videoTitle || "Vídeo analisado"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            </div>
          ) : videoThumbnail ? (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <img
                src={videoThumbnail}
                alt={videoTitle || "Thumbnail do vídeo"}
                className="aspect-video w-full object-cover"
              />
              <div className="px-4 py-2 text-center text-xs text-blue-600 hover:underline">
                Abrir vídeo original
              </div>
            </a>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-2xl border border-gray-200 bg-white text-sm text-gray-400 shadow-sm">
              Preview indisponível
            </div>
          )}
        </div>

        {/* Coluna da transcrição */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-700">
                  Transcrição
                </h3>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copiar
                  </>
                )}
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto px-5 py-4">
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {transcript}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

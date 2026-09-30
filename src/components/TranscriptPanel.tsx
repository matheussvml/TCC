"use client";

import { FileText } from "lucide-react";

interface TranscriptPanelProps {
  transcript: string;
}

export default function TranscriptPanel({ transcript }: TranscriptPanelProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-3">
        <FileText className="h-5 w-5 text-gray-600" aria-hidden="true" />
        <h3 className="text-base font-bold text-gray-900">
          O que foi dito no vídeo
        </h3>
      </div>
      <div className="max-h-80 overflow-y-auto px-5 py-4" tabIndex={0} aria-label="Transcrição do vídeo">
        <p className="whitespace-pre-line text-base leading-relaxed text-gray-800">
          {transcript}
        </p>
      </div>
    </div>
  );
}

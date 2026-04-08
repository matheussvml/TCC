"use client";

import { FileText } from "lucide-react";

interface TranscriptPanelProps {
  transcript: string;
}

export default function TranscriptPanel({ transcript }: TranscriptPanelProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3">
        <FileText className="h-4 w-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700">
          Transcrição do Vídeo
        </h3>
      </div>
      <div className="max-h-72 overflow-y-auto px-5 py-4">
        <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
          {transcript}
        </p>
      </div>
    </div>
  );
}

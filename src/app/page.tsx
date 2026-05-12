"use client";

import { useState, useCallback } from "react";
import Header from "@/components/Header";
import VideoInput from "@/components/VideoInput";
import LoadingSteps from "@/components/LoadingSteps";
import ResultsSection from "@/components/ResultsSection";
import { loadingSteps } from "@/data/mockData";
import type { AnalysisResult } from "@/data/mockData";

const API_URL = "/api/transcribe";
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "";

export default function Home() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const simulateSteps = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      let step = 0;
      const advance = () => {
        if (step < loadingSteps.length) {
          setCurrentStep(step);
          step++;
          setTimeout(advance, loadingSteps[step - 1].duration);
        } else {
          resolve();
        }
      };
      advance();
    });
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!url.trim() || isLoading) return;

    setResult(null);
    setError(null);
    setIsLoading(true);
    setCurrentStep(0);

    simulateSteps();

    const transcribeData = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim() }),
    })
      .then((res) => res.json())
      .catch((err) => ({ status: "error", message: err.message }));

    if (transcribeData.status !== "success") {
      setIsLoading(false);
      setError(transcribeData.message || "Erro ao transcrever o vídeo.");
      return;
    }

    const n8nData = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcricao: transcribeData.text,
        videoTitle: transcribeData.title || "",
        videoUrl: url.trim(),
      }),
    })
      .then((res) => res.json())
      .catch((err) => ({ status: "error", message: err.message }));

    setIsLoading(false);

    if (n8nData.status !== "success") {
      setError(n8nData.message || "Erro ao validar alegações.");
      return;
    }

    const youtubeMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/
    );
    const embedUrl = youtubeMatch
      ? `https://www.youtube.com/embed/${youtubeMatch[1]}`
      : "";

    setResult({
      videoTitle: transcribeData.title || "Vídeo analisado",
      videoChannel: "",
      thumbnailUrl: transcribeData.thumbnail || "",
      embedUrl,
      transcript: transcribeData.text,
      claims: n8nData.claims,
      overallScore: n8nData.overallScore,
    });
  }, [url, isLoading, simulateSteps]);

  return (
    <>
      <Header />

      <main className="flex-1">
        <VideoInput
          url={url}
          onUrlChange={setUrl}
          onSubmit={handleAnalyze}
          isLoading={isLoading}
        />

        {isLoading && (
          <LoadingSteps currentStep={currentStep} steps={loadingSteps} />
        )}

        {error && (
          <div className="mx-auto max-w-3xl px-6 py-6">
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-700">
              {error}
            </div>
          </div>
        )}

        {result && <ResultsSection result={result} />}
      </main>

      <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-400">
        TCC &mdash; Sistema de Letramento Digital e Validação de Fatos com IA
      </footer>
    </>
  );
}

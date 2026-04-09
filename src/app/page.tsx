"use client";

import { useState, useCallback } from "react";
import Header from "@/components/Header";
import VideoInput from "@/components/VideoInput";
import LoadingSteps from "@/components/LoadingSteps";
import TranscriptResult from "@/components/TranscriptResult";
import { loadingSteps } from "@/data/mockData";

// API route local (proxy para o n8n, sem problema de CORS)
const API_URL = "/api/transcribe";

export default function Home() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<{
    text: string;
    title?: string;
    thumbnail?: string;
  } | null>(null);
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

    // Inicia animação de loading E a requisição ao n8n em paralelo
    const [, response] = await Promise.all([
      simulateSteps(),
      fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      }).then(async (res) => {
        const data = await res.json();
        return data;
      }).catch((err) => {
        return { status: "error", message: err.message };
      }),
    ]);

    setIsLoading(false);

    if (response.status === "success") {
      setResult({
        text: response.text,
        title: response.title,
        thumbnail: response.thumbnail,
      });
    } else {
      setError(response.message || "Erro desconhecido ao processar o vídeo.");
    }
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

        {result && (
          <TranscriptResult
            transcript={result.text}
            videoUrl={url}
            videoTitle={result.title}
            videoThumbnail={result.thumbnail}
          />
        )}
      </main>

      <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-400">
        TCC &mdash; Sistema de Letramento Digital e Validação de Fatos com IA
      </footer>
    </>
  );
}

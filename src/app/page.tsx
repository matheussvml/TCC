"use client";

import { useState, useCallback } from "react";
import Header from "@/components/Header";
import VideoInput from "@/components/VideoInput";
import LoadingSteps from "@/components/LoadingSteps";
import ResultsSection from "@/components/ResultsSection";
import { mockAnalysisResult, loadingSteps } from "@/data/mockData";
import type { AnalysisResult } from "@/data/mockData";

export default function Home() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = useCallback(() => {
    if (!url.trim() || isLoading) return;

    setResult(null);
    setIsLoading(true);
    setCurrentStep(0);

    let step = 0;

    const advanceStep = () => {
      if (step < loadingSteps.length) {
        setCurrentStep(step);
        const duration = loadingSteps[step].duration;
        step++;
        setTimeout(advanceStep, duration);
      } else {
        setIsLoading(false);
        setResult(mockAnalysisResult);
      }
    };

    advanceStep();
  }, [url, isLoading]);

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

        {result && <ResultsSection result={result} />}
      </main>

      <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-400">
        TCC &mdash; Sistema de Letramento Digital e Validação de Fatos com IA
      </footer>
    </>
  );
}

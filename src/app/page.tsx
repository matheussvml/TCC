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
// Se configurado, o upload vai direto pro Flask do Render — pula o limite de 4.5 MB da Vercel
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";
const MAX_UPLOAD_MB = 25; // limite do Whisper no Groq

// Tolera resposta vazia ou não-JSON (webhook inativo, erro do n8n, timeout)
async function postJson(
  input: string,
  init: RequestInit
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<string, any>> {
  try {
    const res = await fetch(input, init);
    const body = await res.text();

    try {
      return JSON.parse(body);
    } catch {
      return {
        status: "error",
        message: body.trim()
          ? `Resposta inesperada do servidor (HTTP ${res.status}): ${body.slice(0, 200)}`
          : `O servidor respondeu vazio (HTTP ${res.status}). Verifique a execução no n8n.`,
      };
    }
  } catch (err) {
    return { status: "error", message: (err as Error).message };
  }
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
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
    if ((!url.trim() && !file) || isLoading) return;

    if (file && file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setError(
        `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). O limite é ${MAX_UPLOAD_MB} MB — envie só o áudio ou um trecho do vídeo.`
      );
      return;
    }

    setResult(null);
    setError(null);
    setIsLoading(true);
    setCurrentStep(0);

    simulateSteps();

    const transcribeData = file
      ? await postJson(
          BACKEND_URL ? `${BACKEND_URL}/api/transcribe/upload` : API_URL,
          {
            method: "POST",
            body: (() => {
              const form = new FormData();
              form.append("file", file);
              return form;
            })(),
          }
        )
      : await postJson(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });

    if (transcribeData.status !== "success") {
      setIsLoading(false);
      setError(transcribeData.message || "Erro ao transcrever o vídeo.");
      return;
    }

    const n8nData = await postJson(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcricao: transcribeData.text,
        videoTitle: transcribeData.title || "",
        videoUrl: file ? `arquivo:${file.name}` : url.trim(),
      }),
    });

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

    // Recalcula overallScore com base na média de confianca das claims
    // se o n8n retornar 0 ou indefinido (workaround pro bug do nó Consolidar)
    const claims = Array.isArray(n8nData.claims) ? n8nData.claims : [];
    let overallScore = n8nData.overallScore;
    if (!overallScore && claims.length > 0) {
      const totalConfianca = claims.reduce(
        (acc: number, c: { confianca?: number }) =>
          acc + (typeof c.confianca === "number" ? c.confianca : 0),
        0
      );
      overallScore = Math.round((totalConfianca / claims.length) * 100);
    }

    setResult({
      videoTitle: transcribeData.title || "Vídeo analisado",
      videoChannel: "",
      thumbnailUrl: transcribeData.thumbnail || "",
      embedUrl,
      transcript: transcribeData.text,
      claims,
      overallScore: overallScore || 0,
    });
  }, [url, file, isLoading, simulateSteps]);

  return (
    <>
      <Header />

      <main className="flex-1">
        <VideoInput
          url={url}
          onUrlChange={setUrl}
          file={file}
          onFileChange={setFile}
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

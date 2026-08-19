import { execFile } from "child_process";
import path from "path";

// Em produção (Vercel), chama o backend no Render
// Em dev local, roda o Python direto
const BACKEND_URL = process.env.BACKEND_URL || "";

export async function POST(request: Request) {
  // Upload de arquivo: manda direto pro Whisper do Groq, sem yt-dlp
  // ponytail: na Vercel o body de uma route handler é limitado a 4.5 MB.
  // Para arquivos maiores, configure NEXT_PUBLIC_BACKEND_URL e o browser
  // posta direto no Flask do Render (ver page.tsx), sem passar por aqui.
  if ((request.headers.get("content-type") || "").startsWith("multipart/form-data")) {
    const file = (await request.formData()).get("file");

    if (!(file instanceof File)) {
      return Response.json(
        { status: "error", message: "Arquivo não enviado." },
        { status: 400 }
      );
    }

    const form = new FormData();
    form.append("file", file);
    form.append("model", "whisper-large-v3");
    form.append("language", "pt");
    form.append("response_format", "text");

    const res = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: form,
      }
    );
    const text = await res.text();

    if (!res.ok) {
      return Response.json(
        { status: "error", message: `Falha na transcrição: ${text}` },
        { status: res.status }
      );
    }

    return Response.json({
      status: "success",
      title: file.name,
      thumbnail: "",
      text: text.trim(),
    });
  }

  const body = await request.json();
  const { url } = body;

  if (!url || typeof url !== "string") {
    return Response.json(
      { status: "error", message: "URL não fornecida." },
      { status: 400 }
    );
  }

  // Se tem BACKEND_URL configurado (Vercel), faz proxy pro Render
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      return Response.json(data, { status: res.status });
    } catch {
      return Response.json(
        { status: "error", message: "Não foi possível conectar ao servidor de transcrição." },
        { status: 502 }
      );
    }
  }

  // Modo local: roda Python direto
  const scriptPath = path.resolve("extrator_universal.py");

  try {
    const result = await new Promise<string>((resolve, reject) => {
      execFile(
        "python",
        ["-X", "utf8", scriptPath, url],
        { timeout: 120000, env: { ...process.env, PYTHONIOENCODING: "utf-8" } },
        (error, stdout, stderr) => {
          if (error) {
            reject(new Error(stderr || error.message));
            return;
          }
          resolve(stdout.trim());
        }
      );
    });

    const data = JSON.parse(result);
    return Response.json(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao processar o vídeo.";
    return Response.json({ status: "error", message }, { status: 500 });
  }
}

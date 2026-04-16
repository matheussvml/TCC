import ytdl from "@distube/ytdl-core";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

export const maxDuration = 60;

export async function POST(request: Request) {
  const { url } = await request.json();

  if (!url || typeof url !== "string") {
    return Response.json(
      { status: "error", message: "URL não fornecida." },
      { status: 400 }
    );
  }

  if (!GROQ_API_KEY) {
    return Response.json(
      { status: "error", message: "GROQ_API_KEY não configurada." },
      { status: 500 }
    );
  }

  try {
    // --- ETAPA 1: Extrair info e áudio do YouTube ---
    if (!ytdl.validateURL(url)) {
      return Response.json(
        {
          status: "error",
          message:
            "URL inválida. No momento, apenas links do YouTube são suportados na versão online.",
        },
        { status: 400 }
      );
    }

    const info = await ytdl.getInfo(url);
    const videoTitle = info.videoDetails.title;
    const thumbnail =
      info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]
        ?.url || "";

    // Baixa o áudio como buffer (stream de áudio apenas)
    const audioStream = ytdl(url, {
      filter: "audioonly",
      quality: "lowestaudio",
    });

    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.from(chunk));
    }
    const audioBuffer = Buffer.concat(chunks);

    // --- ETAPA 2: Transcrever com Groq (Whisper) ---
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([audioBuffer], { type: "audio/webm" }),
      "audio.webm"
    );
    formData.append("model", "whisper-large-v3");
    formData.append("language", "pt");
    formData.append("response_format", "text");

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
        body: formData,
      }
    );

    if (!groqResponse.ok) {
      const err = await groqResponse.text();
      throw new Error(`Groq API error: ${err}`);
    }

    const transcription = await groqResponse.text();

    return Response.json({
      status: "success",
      title: videoTitle,
      thumbnail,
      text: transcription.trim(),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao processar o vídeo.";
    return Response.json({ status: "error", message }, { status: 500 });
  }
}

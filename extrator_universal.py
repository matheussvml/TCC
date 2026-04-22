"""
Extrator Universal de Transcrição de Vídeos
Baixa o áudio de qualquer plataforma (YouTube, TikTok, Instagram, X, etc.)
e transcreve usando Whisper via API do Groq.

Uso: python extrator_universal.py "https://url-do-video"
"""

import sys
import os
import json
import tempfile
import uuid

def main():
    # ==========================================
    # Coloque sua API key do Groq aqui ou
    # defina a variável de ambiente GROQ_API_KEY
    GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

    if not GROQ_API_KEY:
        print(json.dumps({
            "status": "error",
            "message": "GROQ_API_KEY não configurada. Defina a variável de ambiente."
        }))
        sys.exit(1)
    # ==========================================

    if len(sys.argv) < 2:
        print(json.dumps({
            "status": "error",
            "message": "Nenhuma URL fornecida. Uso: python extrator_universal.py <URL>"
        }))
        sys.exit(1)

    video_url = sys.argv[1]

    # Caminho temporário único para o áudio
    temp_dir = tempfile.gettempdir()
    audio_filename = f"tcc_audio_{uuid.uuid4().hex[:8]}"
    audio_path = os.path.join(temp_dir, audio_filename)

    try:
        # --- ETAPA 1: Baixar áudio com yt-dlp ---
        import yt_dlp

        # Logger customizado que manda tudo para stderr, mantendo stdout limpo
        class StderrLogger:
            def debug(self, msg): pass
            def warning(self, msg): pass
            def error(self, msg):
                import sys as _sys
                print(msg, file=_sys.stderr)

        ydl_opts = {
            "format": "worstaudio/worst",
            "outtmpl": audio_path + ".%(ext)s",
            "quiet": True,
            "no_warnings": True,
            "noprogress": True,
            "logger": StderrLogger(),
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "32",
            }],
        }

        video_title = ""
        video_thumbnail = ""

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=True)
            if info:
                video_title = info.get("title", "")
                video_thumbnail = info.get("thumbnail", "")

        # Localiza o arquivo final (sempre .mp3 após pós-processamento)
        final_audio = audio_path + ".mp3"

        if not os.path.exists(final_audio):
            print(json.dumps({
                "status": "error",
                "message": "Falha ao baixar o áudio. Verifique se a URL é válida e o vídeo é público."
            }))
            sys.exit(1)

        # --- ETAPA 2: Transcrever com Groq (Whisper) ---
        from groq import Groq

        client = Groq(api_key=GROQ_API_KEY)

        with open(final_audio, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                file=(os.path.basename(final_audio), audio_file),
                model="whisper-large-v3",
                language="pt",
                response_format="text",
            )

        # --- ETAPA 3: Limpeza ---
        os.remove(final_audio)

        # --- ETAPA 4: Output JSON ---
        print(json.dumps({
            "status": "success",
            "title": video_title,
            "thumbnail": video_thumbnail,
            "text": transcription.strip()
        }, ensure_ascii=False))

    except Exception as e:
        # Limpa o arquivo de áudio se existir, mesmo em caso de erro
        for ext in [".mp3", ".m4a", ".webm", ".opus"]:
            path = audio_path + ext
            if os.path.exists(path):
                os.remove(path)

        print(json.dumps({
            "status": "error",
            "message": str(e)
        }, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()

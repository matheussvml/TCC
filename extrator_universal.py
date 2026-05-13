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

        # --- Resolução de cookies para contornar bloqueio de bot do YouTube ---
        # Prioridade:
        #   1. Variável COOKIES_FILE apontando para um cookies.txt exportado
        #   2. cookies.txt na mesma pasta deste script
        #   3. Cookies extraídos diretamente do browser (edge → chrome → firefox)
        # Para exportar o cookies.txt corretamente:
        #   - Abra uma aba anônima, faça login no YouTube
        #   - Acesse youtube.com/robots.txt na mesma aba
        #   - Exporte os cookies com a extensão "Get cookies.txt LOCALLY" (Chrome)
        #     ou "cookies.txt" (Firefox), salve como cookies.txt nesta pasta
        #   - Feche a aba anônima imediatamente

        script_dir = os.path.dirname(os.path.abspath(__file__))

        # Suporte a COOKIES_CONTENT (base64) para Vercel/ambientes sem sistema de arquivos persistente
        cookies_file = None
        cookies_content_b64 = os.environ.get("COOKIES_CONTENT")
        if cookies_content_b64:
            import base64
            _tmp_cookies = os.path.join(tempfile.gettempdir(), f"yt_cookies_{uuid.uuid4().hex[:8]}.txt")
            with open(_tmp_cookies, "wb") as _f:
                _f.write(base64.b64decode(cookies_content_b64))
            cookies_file = _tmp_cookies
        else:
            _candidate = os.environ.get("COOKIES_FILE") or os.path.join(script_dir, "cookies.txt")
            if os.path.exists(_candidate):
                cookies_file = _candidate

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

        if cookies_file:
            ydl_opts["cookiefile"] = cookies_file
        else:
            # Fallback: tenta ler cookies diretamente do browser instalado
            BROWSERS = ["edge", "chrome", "firefox", "brave", "chromium"]
            for browser in BROWSERS:
                try:
                    with yt_dlp.YoutubeDL({
                        "quiet": True,
                        "no_warnings": True,
                        "cookiesfrombrowser": (browser,),
                        "logger": StderrLogger(),
                    }) as _ydl:
                        list(_ydl.cookiejar)  # força leitura do jar; falha se browser ausente
                    ydl_opts["cookiesfrombrowser"] = (browser,)
                    break
                except Exception:
                    continue

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
        if cookies_content_b64 and cookies_file and os.path.exists(cookies_file):
            os.remove(cookies_file)

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

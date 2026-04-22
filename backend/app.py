"""
API de transcrição de vídeos - Backend para deploy no Render.
Recebe URL de vídeo, baixa áudio com yt-dlp, transcreve com Groq Whisper.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import tempfile
import uuid

app = Flask(__name__)
CORS(app)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")


@app.route("/api/transcribe", methods=["POST"])
def transcribe():
    data = request.get_json()
    video_url = data.get("url", "")

    if not video_url:
        return jsonify({"status": "error", "message": "URL não fornecida."}), 400

    if not GROQ_API_KEY:
        return jsonify({"status": "error", "message": "GROQ_API_KEY não configurada."}), 500

    temp_dir = tempfile.gettempdir()
    audio_filename = f"tcc_audio_{uuid.uuid4().hex[:8]}"
    audio_path = os.path.join(temp_dir, audio_filename)

    try:
        import yt_dlp

        class SilentLogger:
            def debug(self, msg): pass
            def warning(self, msg): pass
            def error(self, msg): pass

        ydl_opts = {
            "format": "worstaudio/worst",
            "outtmpl": audio_path + ".%(ext)s",
            "quiet": True,
            "no_warnings": True,
            "noprogress": True,
            "logger": SilentLogger(),
            # Usa clientes mobile/tv que geralmente burlam a checagem de bot
            "extractor_args": {
                "youtube": {
                    "player_client": ["tv", "ios", "android", "web"],
                }
            },
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "32",
            }],
        }

        # Suporte opcional a cookies via variável de ambiente (conteúdo do cookies.txt)
        cookies_content = os.environ.get("YT_COOKIES", "")
        if cookies_content:
            cookies_path = os.path.join(temp_dir, f"cookies_{uuid.uuid4().hex[:8]}.txt")
            with open(cookies_path, "w", encoding="utf-8") as f:
                f.write(cookies_content)
            ydl_opts["cookiefile"] = cookies_path

        video_title = ""
        video_thumbnail = ""

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=True)
            if info:
                video_title = info.get("title", "")
                video_thumbnail = info.get("thumbnail", "")

        final_audio = audio_path + ".mp3"

        if not os.path.exists(final_audio):
            return jsonify({
                "status": "error",
                "message": "Falha ao baixar o áudio. Verifique se a URL é válida e o vídeo é público."
            }), 400

        from groq import Groq

        client = Groq(api_key=GROQ_API_KEY)

        with open(final_audio, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                file=(os.path.basename(final_audio), audio_file),
                model="whisper-large-v3",
                language="pt",
                response_format="text",
            )

        os.remove(final_audio)

        return jsonify({
            "status": "success",
            "title": video_title,
            "thumbnail": video_thumbnail,
            "text": transcription.strip()
        })

    except Exception as e:
        for ext in [".mp3", ".m4a", ".webm", ".opus"]:
            path = audio_path + ext
            if os.path.exists(path):
                os.remove(path)

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

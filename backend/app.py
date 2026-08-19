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


def resolver_cookies(video_url):
    """Escolhe o cookie da plataforma do link.

    COOKIES_YOUTUBE / COOKIES_INSTAGRAM / COOKIES_TIKTOK (base64) têm prioridade
    sobre o COOKIES_CONTENT genérico e sobre o YT_COOKIES em texto puro. Cookie
    separado por plataforma evita mandar sessão do Instagram pro YouTube, o que
    só aumenta a chance de bloqueio.
    """
    import base64

    url = (video_url or "").lower()
    if "instagram." in url:
        plataforma = "INSTAGRAM"
    elif "tiktok." in url:
        plataforma = "TIKTOK"
    else:
        plataforma = "YOUTUBE"

    for var in (f"COOKIES_{plataforma}", "COOKIES_CONTENT"):
        conteudo = os.environ.get(var)
        if conteudo:
            destino = os.path.join(
                tempfile.gettempdir(), f"cookies_{uuid.uuid4().hex[:8]}.txt"
            )
            with open(destino, "wb") as f:
                f.write(base64.b64decode(conteudo))
            return destino

    # Compatibilidade: YT_COOKIES guardava o conteúdo em texto puro
    texto = os.environ.get("YT_COOKIES", "")
    if texto:
        destino = os.path.join(
            tempfile.gettempdir(), f"cookies_{uuid.uuid4().hex[:8]}.txt"
        )
        with open(destino, "w", encoding="utf-8") as f:
            f.write(texto)
        return destino

    return None


def explicar_erro(erro, video_url):
    """Traduz falhas conhecidas do yt-dlp em instrução acionável."""
    e = str(erro).lower()

    if "sign in to confirm" in e or "not a bot" in e or "confirm you" in e:
        return ("O YouTube exigiu verificação de que não é um robô. O servidor está "
                "sem cookies válidos. Configure COOKIES_YOUTUBE ou envie o arquivo "
                "do vídeo pelo botão de upload.")
    if "login required" in e or "login_required" in e or "requires authentication" in e:
        return ("O Instagram exigiu login para este conteúdo. Configure "
                "COOKIES_INSTAGRAM com uma sessão ativa ou envie o arquivo por upload.")
    if "rate-limit" in e or "rate limit" in e or "429" in e:
        return ("A plataforma limitou temporariamente os acessos deste servidor. "
                "Tente de novo em alguns minutos ou envie o arquivo por upload.")
    if "403" in e or "forbidden" in e:
        return ("A plataforma recusou o download (403): conteúdo protegido ou "
                "cookies vencidos. O upload do arquivo contorna isso.")
    if "private" in e or "unavailable" in e:
        return "Vídeo indisponível, privado ou removido. Confira o link."
    return str(erro)


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
                    # android_vr e web_safari não exigem PO token; ios/android puros passaram a exigir
                    "player_client": ["android_vr", "tv", "web_safari", "web"],
                }
            },
            # Sem postprocessor de ffmpeg: o Whisper aceita m4a, webm e mp4 direto.
            # Converter pra mp3 32kbps só gastava tempo e degradava o áudio.
        }

        cookies_path = resolver_cookies(video_url)

        # Cookie fica para a segunda tentativa: sessão vencida faz a plataforma
        # recusar downloads que passariam sem cookie nenhum.
        tentativas = [("sem cookies", {})]
        if cookies_path:
            tentativas.append(("cookies de arquivo", {"cookiefile": cookies_path}))

        video_title = ""
        video_thumbnail = ""
        final_audio = None
        info = None
        ultimo_erro = None

        for descricao, extra in tentativas:
            try:
                with yt_dlp.YoutubeDL({**ydl_opts, **extra}) as ydl:
                    info = ydl.extract_info(video_url, download=True)
                    if info:
                        video_title = info.get("title", "")
                        video_thumbnail = info.get("thumbnail", "")
                        final_audio = ydl.prepare_filename(info)
                app.logger.info("transcribe: sucesso com %s", descricao)
                break
            except Exception as err:
                ultimo_erro = err
                app.logger.warning("transcribe: falhou com %s -> %s", descricao, str(err)[:150])

        if info is None:
            raise ultimo_erro or Exception("Não foi possível baixar o áudio.")

        # A extensão depende do formato servido pela plataforma (m4a, webm, opus…)
        if not final_audio or not os.path.exists(final_audio):
            candidatos = [os.path.join(temp_dir, f)
                          for f in os.listdir(temp_dir) if f.startswith(audio_filename)]
            final_audio = candidatos[0] if candidatos else None

        if not final_audio or not os.path.exists(final_audio):
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
        for f in os.listdir(temp_dir):
            if f.startswith(audio_filename):
                try:
                    os.remove(os.path.join(temp_dir, f))
                except OSError:
                    pass

        return jsonify({
            "status": "error",
            "message": explicar_erro(e, video_url)
        }), 500


@app.route("/api/transcribe/upload", methods=["POST"])
def transcribe_upload():
    """Recebe o arquivo de áudio/vídeo do browser e transcreve direto — sem yt-dlp."""
    f = request.files.get("file")

    if not f:
        return jsonify({"status": "error", "message": "Arquivo não enviado."}), 400

    if not GROQ_API_KEY:
        return jsonify({"status": "error", "message": "GROQ_API_KEY não configurada."}), 500

    try:
        from groq import Groq

        transcription = Groq(api_key=GROQ_API_KEY).audio.transcriptions.create(
            file=(f.filename, f.stream.read()),
            model="whisper-large-v3",
            language="pt",
            response_format="text",
        )

        return jsonify({
            "status": "success",
            "title": f.filename,
            "thumbnail": "",
            "text": transcription.strip(),
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

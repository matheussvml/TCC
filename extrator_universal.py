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


def resolver_cookies(video_url, script_dir):
    """Escolhe o arquivo de cookies adequado à plataforma do link.

    Ordem de busca, da mais específica para a mais genérica:
      1. COOKIES_YOUTUBE / COOKIES_INSTAGRAM / COOKIES_TIKTOK (base64) — por plataforma
      2. COOKIES_CONTENT (base64) — genérico, mantido por compatibilidade
      3. COOKIES_FILE apontando para um arquivo
      4. cookies_youtube.txt / cookies_instagram.txt / cookies.txt na pasta do script

    Retorna (caminho, eh_temporario). Cookie por plataforma existe porque uma
    sessão do Instagram não serve pro YouTube e vice-versa: misturar os dois num
    arquivo só faz o yt-dlp mandar cookie de mais e aumentar a chance de bloqueio.
    """
    import base64

    url = (video_url or "").lower()
    if "instagram." in url:
        plataforma = "instagram"
    elif "tiktok." in url:
        plataforma = "tiktok"
    elif "youtube." in url or "youtu.be" in url:
        plataforma = "youtube"
    else:
        plataforma = ""

    for var in ([f"COOKIES_{plataforma.upper()}"] if plataforma else []) + ["COOKIES_CONTENT"]:
        conteudo = os.environ.get(var)
        if conteudo:
            destino = os.path.join(
                tempfile.gettempdir(), f"cookies_{uuid.uuid4().hex[:8]}.txt"
            )
            with open(destino, "wb") as f:
                f.write(base64.b64decode(conteudo))
            return destino, True

    candidatos = [os.environ.get("COOKIES_FILE")]
    if plataforma:
        candidatos.append(os.path.join(script_dir, f"cookies_{plataforma}.txt"))
    candidatos.append(os.path.join(script_dir, "cookies.txt"))

    for caminho in candidatos:
        if caminho and os.path.exists(caminho):
            return caminho, False

    return None, False


def explicar_erro(erro, video_url):
    """Traduz falhas conhecidas do yt-dlp em instrução acionável.

    Sem isso o usuário recebe o traceback cru e não sabe que o problema é
    cookie vencido — que é a causa da maioria absoluta das falhas por link.
    """
    e = str(erro).lower()
    url = (video_url or "").lower()
    eh_instagram = "instagram." in url

    if "sign in to confirm" in e or "not a bot" in e or "confirm you" in e:
        return (
            "O YouTube exigiu verificação de que não é um robô. Isso acontece "
            "quando o servidor não tem cookies válidos. Exporte um cookies.txt "
            "logado e configure COOKIES_YOUTUBE, ou envie o arquivo do vídeo "
            "diretamente pelo botão de upload."
        )
    if "login required" in e or "login_required" in e or "requires authentication" in e:
        return (
            "O Instagram exigiu login para acessar este conteúdo. Configure "
            "COOKIES_INSTAGRAM com um cookies.txt de sessão ativa, ou envie o "
            "arquivo do vídeo diretamente pelo botão de upload."
        )
    if "rate-limit" in e or "rate limit" in e or "429" in e:
        return (
            "A plataforma limitou temporariamente os acessos deste servidor. "
            "Tente novamente em alguns minutos ou envie o arquivo por upload."
        )
    if "403" in e or "forbidden" in e:
        return (
            "A plataforma recusou o download deste vídeo (403). Conteúdo "
            "protegido ou cookies vencidos. O upload do arquivo contorna isso."
        )
    if "private" in e or "unavailable" in e:
        return "Vídeo indisponível, privado ou removido. Confira o link."
    if eh_instagram:
        return (
            f"Não foi possível baixar do Instagram: {erro}. O upload do arquivo "
            "é o caminho mais confiável para esta plataforma."
        )
    return str(erro)


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

        cookies_file, cookies_temporario = resolver_cookies(video_url, script_dir)

        ydl_opts = {
            "format": "worstaudio/worst",
            "outtmpl": audio_path + ".%(ext)s",
            "quiet": True,
            "no_warnings": True,
            "noprogress": True,
            "logger": StderrLogger(),
            # Clients que não exigem PO token — contornam parte da checagem de bot do YouTube
            "extractor_args": {
                "youtube": {"player_client": ["android_vr", "tv", "web_safari", "web"]}
            },
            # Sem postprocessor de ffmpeg: o Whisper do Groq aceita m4a, webm e mp4
            # direto. Converter pra mp3 32kbps só gastava tempo e degradava o áudio.
        }

        # Tentativas em cascata, da menos intrusiva para a mais.
        # Cookie NÃO vai na primeira tentativa de propósito: sessão deslogada ou
        # banco do navegador travado faz a plataforma recusar um download que
        # funcionaria sem cookie nenhum. Só entra como resgate.
        tentativas = [("sem cookies", {})]
        if cookies_file:
            tentativas.append(("cookies de arquivo", {"cookiefile": cookies_file}))
        tentativas += [
            (f"cookies do {b}", {"cookiesfrombrowser": (b,)})
            for b in ("edge", "chrome", "firefox", "brave", "chromium")
        ]

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
                print(f"[extrator] sucesso: {descricao}", file=sys.stderr)
                break
            except Exception as err:
                ultimo_erro = err
                print(f"[extrator] falhou: {descricao} -> {str(err)[:120]}", file=sys.stderr)

        if info is None:
            raise ultimo_erro or Exception("Não foi possível baixar o áudio.")

        # A extensão depende do formato que a plataforma serviu (m4a, webm, opus…)
        if not final_audio or not os.path.exists(final_audio):
            candidatos = [
                os.path.join(temp_dir, f)
                for f in os.listdir(temp_dir)
                if f.startswith(audio_filename)
            ]
            final_audio = candidatos[0] if candidatos else None

        if not final_audio or not os.path.exists(final_audio):
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
        if cookies_temporario and cookies_file and os.path.exists(cookies_file):
            os.remove(cookies_file)

        # --- ETAPA 4: Output JSON ---
        print(json.dumps({
            "status": "success",
            "title": video_title,
            "thumbnail": video_thumbnail,
            "text": transcription.strip()
        }, ensure_ascii=False))

    except Exception as e:
        # Limpa qualquer arquivo parcial deixado pelo download
        for f in os.listdir(temp_dir):
            if f.startswith(audio_filename):
                try:
                    os.remove(os.path.join(temp_dir, f))
                except OSError:
                    pass

        print(json.dumps({
            "status": "error",
            "message": explicar_erro(e, video_url)
        }, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()

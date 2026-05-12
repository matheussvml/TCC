# FactCheck KAI

Sistema de verificação científica para conteúdos digitais voltado ao público idoso.

**TCC — UNIFOR, Ciência da Computação, 2026**
Autores: Erich Lima Schlaepfer, Matheus Vasconcelos de Macena Lima, Pedro Diógenes de Holanda
Orientador: Prof. Me. Ronaldo Gonçalves Junior

---

## Como funciona

1. Usuário cola a URL de um vídeo (YouTube, TikTok, Instagram etc.)
2. O áudio é baixado e transcrito com Whisper via Groq
3. Um workflow no n8n extrai até 5 alegações do texto
4. Cada alegação é buscada no OpenAlex (base científica) e validada pelo Groq
5. O frontend exibe as alegações com veredicto, confiança e fontes

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS — Vercel |
| Transcrição | Python, yt-dlp, Groq Whisper (whisper-large-v3) — Render |
| Orquestração | n8n Cloud |
| LLM | Groq API — llama-3.3-70b-versatile |
| Fontes científicas | OpenAlex API |

---

## Rodando localmente

### Pré-requisitos

- Node.js 18+
- Python 3.10+
- Conta Groq com chave de API
- yt-dlp instalado (`pip install yt-dlp`)

### Instalação

```bash
npm install
pip install -r requirements.txt  # se existir, ou: pip install yt-dlp groq
```

### Variáveis de ambiente

Crie um `.env.local` na raiz:

```
GROQ_API_KEY=sua_chave_groq
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://matheusvml.app.n8n.cloud/webhook/validar-alegacoes
# BACKEND_URL= deixar vazio em dev local
```

Em produção (Vercel), adicione também:

```
BACKEND_URL=https://seu-backend.onrender.com
```

### Iniciar

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Produção

- **Frontend:** https://factcheckkai.vercel.app
- **Repositório:** https://github.com/matheussvml/TCC

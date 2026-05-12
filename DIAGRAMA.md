# Diagrama do Projeto — FactCheck KAI

## Arquitetura Atual (Integração Completa)

```mermaid
graph TD
    classDef frontend fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff;
    classDef vercel fill:#0ea5e9,stroke:#0369a1,stroke-width:2px,color:#fff;
    classDef python fill:#facc15,stroke:#ca8a04,stroke-width:2px,color:#000;
    classDef api fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff;
    classDef n8n fill:#ff6d5a,stroke:#e04835,stroke-width:2px,color:#fff;
    classDef search fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff;
    classDef result fill:#e5e7eb,stroke:#6b7280,stroke-width:1px,color:#111;

    User((Usuário))

    subgraph FrontEnd["Front-End — Vercel"]
        UI["Interface Visual\n(Next.js + React)"]
        APIRoute["API Route\n/api/transcribe"]
    end

    subgraph BackEnd["Back-End de Transcrição — Render"]
        Flask["Flask App\napp.py"]
        PyScript["yt-dlp\nbaixa áudio"]
        Whisper["Groq API\nWhisper-large-v3"]
    end

    subgraph N8N["n8n Cloud — Validação de Fatos"]
        Webhook["Webhook Node\nPOST /validar-alegacoes"]
        PrepData["Preparar dados"]
        ExtractGroq["Groq HTTP\nextrai alegações"]
        ParseClaims["Parsear alegações\n(Code)"]

        subgraph ValidacaoCascata["Validação em Cascata — por alegação"]
            OpenAlex["OpenAlex HTTP GET\nbusca artigos científicos"]
            ValidaGroq["Groq HTTP\nvalida com evidências"]
            FormatClaim["Formatar Claim\n(Code)"]
        end

        Consolidar["Consolidar resultado final\n(Code — agrupa claims)"]
        Resposta["Respond to Webhook\nretorna JSON final"]
    end

    User -->|"1. Cola URL do vídeo"| UI
    UI -->|"2. POST { url }"| APIRoute
    APIRoute -->|"3. Encaminha para Render"| Flask
    Flask -->|"4. Baixa áudio"| PyScript
    PyScript -->|"5. Envia áudio"| Whisper
    Whisper -->|"6. Texto transcrito"| Flask
    Flask -->|"7. { status, title, thumbnail, text }"| APIRoute
    APIRoute -->|"8. Transcrição para o frontend"| UI

    UI -->|"9. POST { transcricao, videoTitle, videoUrl }"| Webhook
    Webhook --> PrepData
    PrepData --> ExtractGroq
    ExtractGroq --> ParseClaims
    ParseClaims --> OpenAlex
    OpenAlex --> ValidaGroq
    ValidaGroq --> FormatClaim
    FormatClaim --> Consolidar
    Consolidar --> Resposta
    Resposta -->|"10. { status, claims, overallScore }"| UI

    class UI frontend
    class APIRoute vercel
    class Flask,PyScript python
    class Whisper api
    class Webhook,PrepData,ExtractGroq,ParseClaims,FormatClaim,Consolidar,Resposta n8n
    class OpenAlex search
    class ValidaGroq api
```

> Todas as linhas são sólidas — transcrição **e** validação via n8n estão integradas e funcionando.

---

## Fluxo de dados resumido

| Etapa | Entrada | Saída |
|-------|---------|-------|
| Frontend → `/api/transcribe` | `{ url }` | `{ status, title, thumbnail, text }` |
| Frontend → n8n webhook | `{ transcricao, videoTitle, videoUrl }` | `{ status, claims[], overallScore }` |
| Claim (n8n → frontend) | alegação + artigos OpenAlex | `{ id, text, status, veredicto, confianca, source, sourceLevel, fontes[] }` |

---

## Veredictos possíveis

| Veredicto | Status | Cor no frontend |
|-----------|--------|----------------|
| VERDADEIRO | validated | Verde |
| PARCIALMENTE VERDADEIRO | validated | Amarelo |
| FALSO | invalid | Vermelho |
| SEM EMBASAMENTO SUFICIENTE | invalid | Cinza |

---

## Legenda de Cores

| Cor | Significado |
|-----|-------------|
| Azul | Front-end (Next.js / React) |
| Azul claro | API Route da Vercel |
| Amarelo | Back-end Python (Render) |
| Verde | APIs externas (Groq / Whisper / Groq LLM) |
| Vermelho-coral | n8n (nós de orquestração) |
| Roxo | OpenAlex (busca científica) |

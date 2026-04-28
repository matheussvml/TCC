# Diagrama do Projeto — FactCheck AI

## 1. Arquitetura Geral

```mermaid
flowchart TB
    User([👤 Usuário])

    subgraph Frontend["🎨 FRONT-END (Vercel)"]
        UI["Next.js + React + Tailwind"]
        Components["Componentes:<br/>Header, VideoInput,<br/>LoadingSteps, ResultsSection"]
    end

    subgraph API["🔌 API ROUTE (Vercel)"]
        Proxy["api/transcribe<br/>route.ts"]
    end

    subgraph Backend["⚙️ BACK-END (Render)"]
        Flask["Flask App<br/>app.py"]
        YTDLP["yt-dlp<br/>baixa áudio"]
        FFMPEG["FFmpeg<br/>converte mp3"]
    end

    subgraph External["🌐 SERVIÇOS EXTERNOS"]
        Video["YouTube, TikTok,<br/>Instagram, X"]
        Groq["Groq API<br/>Whisper-large-v3"]
    end

    User -->|1. Cola link do vídeo| UI
    UI -->|2. POST para API| Proxy
    Proxy -->|3. Encaminha para Render| Flask
    Flask -->|4. yt-dlp baixa áudio| YTDLP
    YTDLP -->|5. Acessa o vídeo| Video
    Video -->|6. Áudio bruto| YTDLP
    YTDLP -->|7. Converte| FFMPEG
    FFMPEG -->|8. Áudio mp3| Flask
    Flask -->|9. Envia áudio| Groq
    Groq -->|10. Texto transcrito| Flask
    Flask -->|11. JSON com transcrição| Proxy
    Proxy -->|12. Resposta| UI
    UI -->|13. Exibe resultado| User

    style User fill:#e3f2fd
    style Frontend fill:#fce4ec
    style API fill:#fff3e0
    style Backend fill:#e8f5e9
    style External fill:#f3e5f5
```

---

## 2. Fluxo de Dados (Sequência)

```mermaid
sequenceDiagram
    actor U as Usuário
    participant F as Front-end<br/>(Next.js / Vercel)
    participant A as API Route<br/>(api/transcribe)
    participant R as Render<br/>(Python + Flask)
    participant Y as YouTube/TikTok/IG
    participant G as Groq AI<br/>(Whisper)

    U->>F: Cola link e clica "Analisar"
    F->>F: Mostra loading animado
    F->>A: POST com a URL
    A->>R: Encaminha para o Render
    R->>Y: Solicita áudio do vídeo
    Y-->>R: Stream de áudio
    R->>R: Converte para MP3 (FFmpeg)
    R->>G: Upload do áudio + Whisper
    G-->>R: Texto transcrito
    R-->>A: JSON com status, title, thumbnail, text
    A-->>F: JSON com resultado
    F->>U: Renderiza vídeo + transcrição<br/>+ painel de validação (mock)
```

---

## 3. Estrutura de Arquivos

```mermaid
flowchart LR
    Root["TCC"] --> Front["src"]
    Root --> Back["backend"]
    Root --> Script["extrator_universal.py"]
    Root --> Env[".env.local"]

    Front --> AppDir["app"]
    Front --> Comp["components"]
    Front --> Data["data"]

    AppDir --> Page["page.tsx"]
    AppDir --> Layout["layout.tsx"]
    AppDir --> APIDir["api/transcribe"]
    APIDir --> Route["route.ts"]

    Comp --> Header["Header.tsx"]
    Comp --> VInput["VideoInput.tsx"]
    Comp --> Loading["LoadingSteps.tsx"]
    Comp --> Results["ResultsSection.tsx"]
    Comp --> Claim["ClaimCard.tsx"]
    Comp --> Score["ScoreBadge.tsx"]
    Comp --> Trans["TranscriptPanel.tsx"]

    Data --> Mock["mockData.ts"]

    Back --> AppPy["app.py"]
    Back --> Req["requirements.txt"]
    Back --> Render["render.yaml"]

    style Root fill:#fff8e1
    style Front fill:#fce4ec
    style Back fill:#e8f5e9
    style AppDir fill:#fff3e0
    style Comp fill:#f3e5f5
```

---

## 4. Componentes do Front-end

```mermaid
flowchart TB
    Layout["layout.tsx<br/>Layout raiz HTML"]
    Page["page.tsx<br/>Estado e orquestração"]

    Layout --> Page

    Page --> H["Header.tsx<br/>Logo + título"]
    Page --> VI["VideoInput.tsx<br/>Campo URL + botão"]
    Page --> LS["LoadingSteps.tsx<br/>Stepper animado"]
    Page --> RS["ResultsSection.tsx<br/>Container de resultados"]

    RS --> TP["TranscriptPanel.tsx<br/>Texto rolável"]
    RS --> SB["ScoreBadge.tsx<br/>% confiabilidade"]
    RS --> CC["ClaimCard.tsx<br/>Cards de afirmações"]

    Page -.lê.-> Mock[("mockData.ts<br/>Dados simulados<br/>de validação")]

    style Layout fill:#e1f5fe
    style Page fill:#fff3e0
    style RS fill:#f3e5f5
```

---

## 5. Pipeline do Back-end (Python)

```mermaid
flowchart LR
    Start(["Recebe URL"]) --> Validate{"URL válida?"}
    Validate -->|Não| Err1["Erro 400"]
    Validate -->|Sim| Key{"API Key<br/>configurada?"}
    Key -->|Não| Err2["Erro 500"]
    Key -->|Sim| Download["yt-dlp<br/>baixa áudio"]
    Download --> Convert["FFmpeg<br/>converte para MP3 32kbps"]
    Convert --> Send["Envia para Groq API"]
    Send --> Whisper["Whisper-large-v3<br/>transcreve PT-BR"]
    Whisper --> Cleanup["Remove arquivo<br/>temporário"]
    Cleanup --> Response(["Retorna JSON com<br/>title, thumbnail, text"])

    Download -.erro.-> Err3["Vídeo privado<br/>ou bloqueado"]
    Send -.erro.-> Err4["Falha na API"]

    style Start fill:#c8e6c9
    style Response fill:#c8e6c9
    style Err1 fill:#ffcdd2
    style Err2 fill:#ffcdd2
    style Err3 fill:#ffcdd2
    style Err4 fill:#ffcdd2
```

---

## 6. Stack Técnica

```mermaid
mindmap
  root((FactCheck AI))
    Front-end
      Next.js 16
      React 19
      TypeScript
      Tailwind CSS 4
      Lucide React
    Back-end
      Python
      Flask
      Flask-CORS
      yt-dlp
      Groq SDK
      Gunicorn
    Hospedagem
      Vercel
        Front-end
        API proxy
      Render
        Python backend
        Free tier
    IA e APIs
      Groq Cloud
      Whisper-large-v3
    Próxima etapa
      n8n
        Validação de fatos
        Fontes científicas
        Fact-checkers
```

---

## 7. Estados do Front-end

```mermaid
stateDiagram-v2
    [*] --> Inicial
    Inicial --> Carregando: Clica Analisar Vídeo
    Carregando --> Sucesso: API retorna OK
    Carregando --> Erro: Falha na API
    Sucesso --> Inicial: Nova análise
    Erro --> Inicial: Tenta de novo

    Inicial: Apenas o input visível
    Carregando: Stepper animado com 6 etapas simuladas
    Sucesso: Vídeo + Transcrição + Painel mockado
    Erro: Mensagem em vermelho
```

---

## Legenda de Cores

| Cor | Significado |
|-----|-------------|
| Rosa | Front-end (Vercel) |
| Verde | Back-end (Render) |
| Laranja | API/Proxy |
| Roxo | Serviços externos |
| Amarelo | Estrutura de arquivos |

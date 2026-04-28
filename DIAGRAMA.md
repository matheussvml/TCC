# Diagrama do Projeto — FactCheck AI

## Arquitetura Atual + Próxima Etapa (Validação via n8n)

```mermaid
graph TD
    %% Cores e Estilos
    classDef frontend fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff;
    classDef vercel fill:#0ea5e9,stroke:#0369a1,stroke-width:2px,color:#fff;
    classDef python fill:#facc15,stroke:#ca8a04,stroke-width:2px,color:#000;
    classDef api fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff;
    classDef n8n fill:#ff6d5a,stroke:#e04835,stroke-width:2px,color:#fff;
    classDef search fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff;
    classDef result fill:#e5e7eb,stroke:#6b7280,stroke-width:1px,color:#111;

    %% Ator
    User((Usuário))

    %% Bloco 1: Front-end
    subgraph FrontEnd["Front-End — Vercel"]
        UI["Interface Visual<br/>(Next.js + React)"]
        APIRoute["API Route<br/>/api/transcribe"]
    end

    %% Bloco 2: Back-end (já implementado)
    subgraph BackEnd["Back-End de Transcrição — Render (já funcional)"]
        Flask["Flask App<br/>app.py"]
        PyScript["yt-dlp<br/>baixa áudio"]
        Groq["Groq API<br/>Whisper-large-v3"]
    end

    %% Bloco 3: n8n (próxima etapa)
    subgraph N8N["n8n — Validação de Fatos (próxima etapa)"]
        Webhook["Webhook Node"]
        Extractor["AI Agent<br/>extrai afirmações"]

        subgraph Validacao["Validação em Cascata"]
            Cascata{"Nível 1<br/>Bases Científicas"}
            ValCientifica["Validado:<br/>Fonte Científica"]
            Nivel2{"Nível 2<br/>Mídia Jornalística"}
            ValJornal["Validado:<br/>Fonte Jornalística"]
            Nivel3{"Nível 3<br/>Fóruns e Redes"}
            ValRumor["Alerta:<br/>Rumor Digital"]
            ValInvalido["Inválido —<br/>Sem Evidências"]
        end

        Compilador["Compila Resultados"]
        Resposta["Respond to Webhook"]
    end

    %% Fluxo atual (transcrição)
    User -->|1. Cola o link do vídeo| UI
    UI -->|2. POST com URL| APIRoute
    APIRoute -->|3. Encaminha para o Render| Flask
    Flask -->|4. Baixa áudio| PyScript
    PyScript -->|5. Envia áudio| Groq
    Groq -->|6. Texto transcrito| Flask
    Flask -->|7. Retorna TXT da transcrição| APIRoute
    APIRoute -->|8. Mostra texto na tela| UI

    %% Fluxo futuro (validação)
    APIRoute -.->|9. Envia TXT para validar| Webhook
    Webhook --> Extractor
    Extractor --> Cascata
    Cascata -->|Evidência| ValCientifica
    Cascata -->|Sem Evidência| Nivel2
    Nivel2 -->|Evidência| ValJornal
    Nivel2 -->|Sem Evidência| Nivel3
    Nivel3 -->|Mencionado| ValRumor
    Nivel3 -->|Nenhuma Menção| ValInvalido

    ValCientifica --> Compilador
    ValJornal --> Compilador
    ValRumor --> Compilador
    ValInvalido --> Compilador
    Compilador --> Resposta
    Resposta -.->|10. Retorna validação| UI

    %% Aplicação dos estilos
    class UI frontend
    class APIRoute vercel
    class Flask,PyScript python
    class Groq api
    class Webhook,Extractor,Compilador,Resposta n8n
    class Cascata,Nivel2,Nivel3 search
    class ValCientifica,ValJornal,ValRumor,ValInvalido result
```

> **Linhas sólidas** = fluxo atual de transcrição (já funcionando).
> **Linhas tracejadas** = fluxo planejado de validação via n8n (próxima etapa).

---

## Legenda de Cores

| Cor | Significado |
|-----|-------------|
| 🔵 Azul | Front-end (Next.js / React) |
| 🩵 Azul claro | API Route da Vercel |
| 🟡 Amarelo | Back-end Python (Render) |
| 🟢 Verde | API externa Groq / Whisper |
| 🔴 Vermelho-coral | n8n (futuro: validação) |
| 🟣 Roxo | Módulos de busca em cascata |
| ⚪ Cinza | Resultados finais de validação |

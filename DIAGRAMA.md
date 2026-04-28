# Diagrama do Projeto — FactCheck AI

## Arquitetura Completa com Validação em Cascata

```mermaid
graph TD
    %% Cores e Estilos
    classDef frontend fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff;
    classDef n8n fill:#ff6d5a,stroke:#e04835,stroke-width:2px,color:#fff;
    classDef python fill:#facc15,stroke:#ca8a04,stroke-width:2px,color:#000;
    classDef api fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff;
    classDef search fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff;
    classDef result fill:#e5e7eb,stroke:#6b7280,stroke-width:1px,color:#111;

    %% Ator Principal
    User((Usuário))

    %% Bloco 1: Interface
    subgraph FrontEnd["Front-End (React / Next.js)"]
        UI["Interface Visual"]
    end

    %% Bloco 2: Orquestração com n8n
    subgraph N8N["n8n — Motor Principal"]
        Webhook["n8n: Webhook Node"]
        ExecCmd["n8n: Execute Command Node"]

        %% Bloco 3: Extração e Transcrição
        subgraph Midia["Processamento de Mídia"]
            PyScript["Python: extrator_universal.py"]
            Audio["Baixa Áudio mp3 ou m4a"]
            Groq["Groq API: Whisper"]
        end

        Extractor["n8n: AI Agent / OpenAI Node"]

        %% Bloco 4: Validação em Cascata
        subgraph Validacao["Módulo de Validação em Cascata"]
            Cascata{"Nível 1: Bases Científicas"}
            ValCientifica["Validado: Fonte Científica"]
            Nivel2{"Nível 2: Mídia Jornalística"}
            ValJornal["Validado: Fonte Jornalística"]
            Nivel3{"Nível 3: Fóruns e Redes"}
            ValRumor["Alerta: Rumor Digital Identificado"]
            ValInvalido["Inválido — Sem Evidências"]
        end

        Compilador["n8n: Compila Resultados"]
        Resposta["n8n: Respond to Webhook"]
    end

    %% Conexões
    User -->|Cola o link do vídeo| UI
    UI -->|POST com URL do Vídeo| Webhook
    Webhook --> ExecCmd
    ExecCmd -->|Executa| PyScript
    PyScript -->|yt-dlp| Audio
    Audio -->|API Request| Groq
    Groq -->|Retorna Texto| PyScript
    PyScript -->|Retorna JSON via stdout| ExecCmd
    ExecCmd --> Extractor
    Extractor -->|Transforma texto em afirmações| Cascata

    Cascata -->|Evidência Encontrada| ValCientifica
    Cascata -->|Sem Evidência| Nivel2
    Nivel2 -->|Evidência Encontrada| ValJornal
    Nivel2 -->|Sem Evidência| Nivel3
    Nivel3 -->|Mencionado| ValRumor
    Nivel3 -->|Nenhuma Menção| ValInvalido

    ValCientifica --> Compilador
    ValJornal --> Compilador
    ValRumor --> Compilador
    ValInvalido --> Compilador
    Compilador --> Resposta
    Resposta -->|Retorna JSON com Status e Fontes| UI

    %% Aplicação dos estilos
    class UI frontend
    class Webhook,ExecCmd,Extractor,Compilador,Resposta n8n
    class PyScript,Audio python
    class Groq api
    class Cascata,Nivel2,Nivel3 search
    class ValCientifica,ValJornal,ValRumor,ValInvalido result
```

---

## Legenda de Cores

| Cor | Significado |
|-----|-------------|
| 🔵 Azul | Front-end (React / Next.js) |
| 🔴 Vermelho-coral | n8n (orquestração) |
| 🟡 Amarelo | Python (extrator universal) |
| 🟢 Verde | APIs externas (Groq / Whisper) |
| 🟣 Roxo | Módulos de busca em cascata |
| ⚪ Cinza | Resultados finais de validação |

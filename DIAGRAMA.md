graph TD
    %% Cores e Estilos
    classDef frontend fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff;
    classDef n8n fill:#ff6d5a,stroke:#e04835,stroke-width:2px,color:#fff;
    classDef python fill:#facc15,stroke:#ca8a04,stroke-width:2px,color:#000;
    classDef api fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff;
    classDef search fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff;

    %% Atores Principais
    User((Usuário)) -->|Cola o link do vídeo| UI

    %% Bloco 1: Interface
    subgraph "Front-End (React/Next.js)"
        UI[Interface Visual]:::frontend
    end

    %% Bloco 2: Orquestração
    UI -->|POST: URL do Vídeo| Webhook(n8n: Webhook Node):::n8n

    subgraph "n8n - Motor Principal"
        Webhook --> ExecCmd[n8n: Execute Command Node]:::n8n
        
        %% Bloco 3: Extração e Transcrição
        subgraph "Processamento de Mídia"
            ExecCmd -->|Executa| PyScript(Python: extrator_universal.py):::python
            PyScript -->|yt-dlp| Audio[Baixa Áudio mp3/m4a]:::python
            Audio -->|API Request| Groq(Groq API: Whisper):::api
            Groq -->|Retorna Texto| PyScript
            PyScript -->|Retorna JSON (stdout)| ExecCmd
        end

        ExecCmd --> Extractor[n8n: AI Agent / OpenAI Node]:::n8n
        Extractor -->|Transforma texto em afirmações| Cascata
        
        %% Bloco 4: A Lógica do TCC (Busca em Cascata)
        subgraph "Módulo de Validação em Cascata"
            Cascata{Nível 1: Bases Científicas}:::search
            Cascata -->|Evidência Encontrada| ValCientifica[Validado: Fonte Científica]
            
            Cascata -->|Sem Evidência| Nivel2{Nível 2: Mídia Jornalística}:::search
            Nivel2 -->|Evidência Encontrada| ValJornal[Validado: Fonte Jornalística]
            
            Nivel2 -->|Sem Evidência| Nivel3{Nível 3: Fóruns e Redes}:::search
            Nivel3 -->|Mencionado| ValRumor[Alerta: Rumor Digital Identificado]
            Nivel3 -->|Nenhuma Menção| ValInvalido[Inválido / Sem Evidências]
        end
        
        ValCientifica --> Compilador[n8n: Compila Resultados]:::n8n
        ValJornal --> Compilador
        ValRumor --> Compilador
        ValInvalido --> Compilador
        
        Compilador --> Resposta(n8n: Respond to Webhook):::n8n
    end

    %% Bloco 5: Retorno
    Resposta -->|Retorna JSON com Status e Fontes| UI
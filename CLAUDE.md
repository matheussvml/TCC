# CLAUDE.md — Contexto do Projeto TCC FactCheck KAI

> Arquivo de continuidade para o Claude Code (CLI/VSCode).
> Última atualização: 11/05/2026

---

## 1. Identidade do projeto

**Título:** Sistema de Verificação Científica para Conteúdos Digitais Voltado ao Público Idoso
**Nome do produto:** FactCheck KAI
**Repositório:** https://github.com/matheussvml/TCC
**Frontend em produção:** https://factcheckkai.vercel.app

**Autores:** Erich Lima Schlaepfer, Matheus Vasconcelos de Macena Lima, Pedro Diógenes de Holanda
**Orientador:** Prof. Me. Ronaldo Gonçalves Junior
**Instituição:** UNIFOR — Universidade de Fortaleza, Curso de Ciência da Computação, 2026

---

## 2. Resumo técnico em uma frase

> Recebe vídeo → transcreve com Whisper/Groq → extrai alegações com LLM → valida com OpenAlex + Groq → retorna diagnóstico com veredicto e fontes.

---

## 3. Arquitetura atual

```
[Usuário cola URL de vídeo]
        ↓
[Frontend — Next.js na Vercel]
  src/app/page.tsx — orquestra tudo
        ↓
[/api/transcribe — route.ts]
  - Local: roda extrator_universal.py diretamente
  - Produção: proxy para backend no Render (BACKEND_URL)
        ↓
[extrator_universal.py]
  - yt-dlp: baixa áudio de YouTube, TikTok, Instagram, etc.
  - Groq Whisper (whisper-large-v3): transcreve em português
  - Retorna JSON: { status, title, thumbnail, text }
        ↓
[n8n Cloud — webhook POST /validar-alegacoes]
  URL: https://matheusvml.app.n8n.cloud/webhook/validar-alegacoes
  Workflow: "FactCheck KAI — Validação em Cascata (Groq)"
        ↓
  Nó 1 — Preparar dados
  Nó 2 — Code in JavaScript (monta body Groq para extração)
  Nó 3 — Groq HTTP Request: extrai até 5 alegações → JSON
  Nó 4 — Parsear alegações (Code): explode em N itens
  Nó 5 — OpenAlex HTTP GET: busca artigos científicos por alegação
  Nó 6 — Code (Consolidar + monta body Groq para validação)
  Nó 7 — Groq HTTP Request: valida alegação com evidências → JSON
  Nó 8 — Formatar Claim (Code): mapeia para formato do frontend
  Nó 9 — Consolidar resultado final (Code): agrupa claims + overallScore
  Nó 10 — Respond to Webhook: retorna JSON final
        ↓
[Frontend exibe ResultsSection com claims reais]
```

---

## 4. Stack tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Vercel |
| Transcrição | Python, yt-dlp, Groq API (whisper-large-v3) |
| Backend de transcrição | Render (variável BACKEND_URL) |
| Orquestração | n8n Cloud |
| LLM de validação | Groq API — llama-3.3-70b-versatile |
| Fontes científicas | OpenAlex API (gratuito, sem chave) |
| Checagem jornalística | Lupa (desconectada temporariamente, a reconectar) |

---

## 5. Variáveis de ambiente

### `.env.local` (desenvolvimento local)
```
GROQ_API_KEY=sua_chave_groq
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://matheusvml.app.n8n.cloud/webhook/validar-alegacoes
# BACKEND_URL= (deixar vazio em dev local — roda Python direto)
```

### Vercel (produção)
```
BACKEND_URL=https://seu-backend.onrender.com
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://matheusvml.app.n8n.cloud/webhook/validar-alegacoes
```

### n8n Cloud
- `GROQ_API_KEY` não disponível no plano gratuito via Environment Variables
- Chave está hardcoded nos headers dos dois nós HTTP Request do Groq
- Modelo usado: `llama-3.3-70b-versatile`

---

## 6. Estrutura de arquivos relevantes

```
/
├── extrator_universal.py          # Baixa áudio + transcreve com Groq Whisper
├── src/
│   ├── app/
│   │   ├── page.tsx               # Página principal — orquestra transcrição + n8n
│   │   ├── api/transcribe/
│   │   │   └── route.ts           # API route: proxy Render ou executa Python local
│   │   └── globals.css
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── VideoInput.tsx         # Input de URL + botão Analisar
│   │   ├── LoadingSteps.tsx       # Animação de steps durante processamento
│   │   ├── ResultsSection.tsx     # Exibe resultado: vídeo + transcrição + claims
│   │   ├── ClaimCard.tsx          # Card individual de cada alegação validada
│   │   ├── ScoreBadge.tsx         # Badge com % de confiabilidade
│   │   └── TranscriptPanel.tsx    # Painel lateral com transcrição
│   └── data/
│       └── mockData.ts            # Tipos Claim e AnalysisResult + loadingSteps
```

---

## 7. Formato de dados entre componentes

### Transcrição (extrator_universal.py → route.ts → page.tsx)
```json
{
  "status": "success",
  "title": "Título do vídeo",
  "thumbnail": "https://...",
  "text": "transcrição completa aqui"
}
```

### Chamada ao n8n (page.tsx → webhook)
```json
{
  "transcricao": "texto transcrito",
  "videoTitle": "título",
  "videoUrl": "https://..."
}
```

### Resposta do n8n (webhook → page.tsx)
```json
{
  "status": "success",
  "claims": [
    {
      "id": 1,
      "text": "alegação extraída",
      "status": "validated" | "invalid",
      "veredicto": "VERDADEIRO | FALSO | PARCIALMENTE VERDADEIRO | SEM EMBASAMENTO SUFICIENTE",
      "confianca": 0.9,
      "source": "explicação em linguagem simples para idosos",
      "sourceLevel": "fonte1 | fonte2",
      "fontes": ["fonte1", "fonte2"]
    }
  ],
  "overallScore": 75
}
```

### AnalysisResult (estado do React em page.tsx)
```typescript
{
  videoTitle: string;
  videoChannel: string;
  thumbnailUrl: string;
  embedUrl: string;
  transcript: string;
  claims: Claim[];
  overallScore: number;
}
```

---

## 8. Estado atual do desenvolvimento (11/05/2026)

### ✅ Funcionando
- Frontend Next.js com input de URL e exibição de resultados
- Transcrição real com Whisper via Groq (local e via Render)
- Workflow n8n completo rodando em produção
- Extração de alegações com Groq (llama-3.3-70b-versatile)
- Busca de artigos científicos via OpenAlex
- Validação com veredicto e explicação pelo Groq
- Frontend conectado ao n8n (mock substituído por dados reais)
- Relatório científico versão 0.2 com recorte de público idoso

### 🔧 Pendente / próximos passos
- Nó da Lupa (checagem jornalística) desconectado — reconectar após estabilizar fluxo principal
- `claims` retorna apenas 1 item — Consolidar resultado final precisa ser ajustado para agregar todos os itens do loop
- Capítulo 4 do relatório (Desenvolvimento) a ser escrito após testes com vídeos reais
- Capítulo 5 (Resultados) após testes com vídeos de desinformação voltados ao público idoso
- Capítulo 6 (Conclusão) ao final

### ⚠️ Problema conhecido no n8n
O nó **Consolidar resultado final** usa `$input.all()` mas o loop de alegações gera N execuções paralelas — por isso só retorna 1 claim. Solução: usar um nó **Merge** antes do Consolidar para juntar todos os items, ou reestruturar o fluxo para processar em batch.

---

## 9. Público-alvo do sistema

**Pessoas idosas (65+)**. Decisão definitiva tomada em 11/05/2026.

Justificativas:
- Idosos de 65+ compartilham fake news 7x mais que jovens de 18-29 (Guess, Nagler e Tucker, 2019)
- Posse de celular entre idosos subiu de 66,6% para 78,1% entre 2019-2024 (IBGE, 2024)
- Interface deve ser simples, linguagem acessível, futuro canal via WhatsApp

---

## 10. Regras de escrita acadêmica (para quando retomar o relatório)

- Todo fato afirmado precisa de citação ABNT imediata
- Nunca inventar referência — pesquisar e verificar autor, título, periódico, ano e volume
- Não alterar referências já existentes — apenas acrescentar novas
- Relatório atual: versão 0.2 (`Relatorio_Cientifico_0_2.docx`)

---

## 11. Instrução para o próximo agente ou sessão

Ao retomar:
1. Verificar se houve avanço nos testes com vídeos reais
2. Se sim: escrever Capítulo 4 (Desenvolvimento) e 5 (Resultados)
3. Corrigir o bug do Consolidar resultado final no n8n (retorna só 1 claim)
4. Reconectar nó da Lupa no workflow do n8n
5. O relatório acadêmico e o código devem evoluir em paralelo

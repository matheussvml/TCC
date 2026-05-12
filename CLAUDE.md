# CLAUDE.md — Contexto do Projeto TCC FactCheck KAI

> Arquivo de continuidade para o Claude Code (CLI/VSCode) e para novos chats.
> Última atualização: 12/05/2026 — sessão de implementação prática

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

## 3. Arquitetura atual (versão final 12/05/2026)

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
  Nó 1  — Webhook
  Nó 2  — Preparar dados (Code)
  Nó 3  — Code in JavaScript (monta groq_body para extração)
  Nó 4  — Groq — Extrair alegações (HTTP Request)
  Nó 5  — Parsear alegações (Code): explode em N itens
  Nó 6  — OpenAlex — Artigos científicos (HTTP GET)
  Nó 7  — Consolidar fontes (Code, Run Once for Each Item):
             - recebe item do OpenAlex
             - recupera alegação original via $('Parsear alegações').item.json
             - monta groq_body_validar com id e alegacao_original embutidos no prompt
  Nó 8  — Groq — Validar alegação (HTTP Request)
  Nó 9  — Formatar Claim (Code, Run Once for All Items):
             - lê choices[0].message.content do Groq
             - parseia JSON com id, alegacao_original, veredicto, confianca, explicacao, fontes
             - mapeia veredicto → status (validated/invalid)
             - retorna array claims completo
  Nó 10 — Consolidar resultado final (Code):
             - recebe { claims } do Formatar Claim
             - calcula overallScore
             - retorna { status: 'success', claims, overallScore }
  Nó 11 — Respond to Webhook
        ↓
[Frontend exibe ResultsSection com claims reais]
```

---

## 4. Detalhe crítico do workflow n8n

### Por que o Groq precisa devolver id e alegacao_original

O nó HTTP Request do Groq devolve apenas a resposta da API — os campos originais da alegação (texto, id) se perdem após o nó. A solução adotada foi embutir `id` e `alegacao_original` no próprio prompt pedindo ao Groq para incluí-los no JSON de resposta:

```json
{
  "id": 1,
  "alegacao_original": "texto da alegação",
  "veredicto": "...",
  "confianca": 0.85,
  "explicacao": "...",
  "fontes": ["..."]
}
```

Assim o Formatar Claim lê tudo de um lugar só sem precisar referenciar nós anteriores.

---

## 5. Stack tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Vercel |
| Transcrição | Python, yt-dlp, Groq API (whisper-large-v3) |
| Backend de transcrição | Render (variável BACKEND_URL) |
| Orquestração | n8n Cloud (plano gratuito, 1000 exec/mês) |
| LLM de validação | Groq API — llama-3.3-70b-versatile |
| Fontes científicas | OpenAlex API (gratuito, sem chave) |
| Checagem jornalística | Lupa (desconectada temporariamente, a reconectar) |

---

## 6. Variáveis de ambiente

### `.env.local` (desenvolvimento local)
```
GROQ_API_KEY=sua_chave_groq
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://matheusvml.app.n8n.cloud/webhook/validar-alegacoes
# BACKEND_URL= (vazio em dev local — roda Python direto)
```

### Vercel (produção)
```
BACKEND_URL=https://seu-backend.onrender.com
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://matheusvml.app.n8n.cloud/webhook/validar-alegacoes
```

### n8n Cloud
- Plano gratuito não tem Environment Variables
- GROQ_API_KEY está hardcoded nos headers dos nós HTTP Request do Groq
- Modelo: `llama-3.3-70b-versatile`

---

## 7. Estrutura de arquivos relevantes

```
/
├── extrator_universal.py          # Baixa áudio + transcreve com Groq Whisper
├── CLAUDE.md                      # Este arquivo
├── .env.local                     # Variáveis de ambiente locais (não comitar)
├── src/
│   ├── app/
│   │   ├── page.tsx               # Orquestra transcrição + chamada n8n (sem mock)
│   │   ├── api/transcribe/
│   │   │   └── route.ts           # Proxy Render ou executa Python local
│   │   └── globals.css
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── VideoInput.tsx         # Input de URL + botão Analisar
│   │   ├── LoadingSteps.tsx       # Animação de steps durante processamento
│   │   ├── ResultsSection.tsx     # Sem aviso de placeholder — dados reais
│   │   ├── ClaimCard.tsx          # Card individual — 4 estados de veredicto
│   │   ├── ScoreBadge.tsx         # Badge com % de confiabilidade
│   │   └── TranscriptPanel.tsx    # Painel lateral com transcrição
│   └── data/
│       └── mockData.ts            # Tipos Claim e AnalysisResult + loadingSteps
```

---

## 8. Formato de dados entre componentes

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
      "status": "validated | invalid",
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

### Interface Claim (mockData.ts)
```typescript
{
  id: number;
  text: string;
  status: "validated" | "invalid";
  veredicto?: string;
  confianca?: number;
  source: string;
  sourceLevel: string;
  sourceUrl?: string;
  fontes?: string[];
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

## 9. Arquitetura futura das camadas de validação (DECISÃO REGISTRADA)

O fluxo de validação deve seguir uma cascata hierárquica com nós IF no n8n. A regra é: só desce para a próxima camada se a anterior não encontrar evidências.

```
Alegação extraída
        ↓
OpenAlex (Camada 1 — Científica)
        ↓
[IF: results.length > 0?]
    ├── SIM → Groq valida com artigos científicos (confiança ~0.9)
    └── NÃO → Lupa / Aos Fatos (Camada 2 — Jornalística)
                    ↓
              [IF: achou checagem?]
                  ├── SIM → Groq valida com fonte jornalística (confiança ~0.7)
                  └── NÃO → Reddit / Fóruns (Camada 3 — Comunidades)
                                    ↓
                              Groq valida com o que tiver (confiança ~0.4)
                              ou classifica como SEM EMBASAMENTO SUFICIENTE
```

**Por que essa arquitetura é correta:**
- Reflete a hierarquia de confiabilidade defendida no relatório (Ciência → Jornalismo → Comunidades)
- O Groq recebe junto qual camada foi usada e calibra a confiança corretamente
- O card de cada alegação mostra ao usuário qual fonte foi utilizada — auditável
- O nó IF no n8n verifica simplesmente `results.length > 0` antes de decidir o caminho

**Status de implementação:**
- Camada 1 (OpenAlex) ✅ implementada
- Camada 2 (Lupa) ⏳ nó criado mas desconectado — reconectar com lógica IF
- Camada 3 (Fóruns/Reddit) ❌ não implementada — trabalho futuro

---

## 10. Estado atual (12/05/2026)

### ✅ Funcionando
- Frontend Next.js completo e em produção na Vercel
- Transcrição real com Whisper via Groq (local e Render)
- Workflow n8n completo e funcional em produção
- Extração de até 5 alegações com Groq
- Busca de artigos científicos via OpenAlex
- Validação com veredicto, confiança e explicação pelo Groq
- Integração frontend ↔ n8n completa — fluxo real sem mock
- ClaimCard exibe veredicto com 4 estados e cores
- Interface Claim atualizada com `veredicto`, `confianca` e `fontes`
- overallScore calculado dinamicamente
- Aviso de "dados simulados" removido da UI
- Relatório científico versão 0.2 com recorte de público idoso

### 🔧 Pendente
- Reconectar Lupa com lógica IF (Camada 2)
- Implementar Camada 3 (fóruns/Reddit)
- YouTube bloqueia na Vercel/Render — adicionar upload direto de arquivo como alternativa para a banca
- Testar com vídeos reais de desinformação em saúde voltados ao público idoso
- Capítulo 4 do relatório (Desenvolvimento) — escrever após testes
- Capítulo 5 (Resultados) — após testes com vídeos reais
- Capítulo 6 (Conclusão) — ao final

### 💡 Ideia para a banca
Adicionar upload direto de arquivo de áudio/vídeo no frontend além da URL. Garante demonstração sem depender de plataformas externas que podem bloquear.

### ❌ Descartado
- Detecção de deepfake/voz sintética por IA — complexo demais para o TCC. Fica como trabalho futuro no Capítulo 6.

---

## 11. Público-alvo

**Pessoas idosas (65+)** — decisão definitiva tomada em 11/05/2026.

- Idosos de 65+ compartilham fake news 7x mais que jovens de 18-29 (Guess, Nagler e Tucker, 2019)
- Posse de celular entre idosos subiu de 66,6% para 78,1% entre 2019-2024 (IBGE, 2024)
- Interface deve ser simples, linguagem acessível, futuro canal via WhatsApp

---

## 12. Regras de escrita acadêmica

- Todo fato afirmado precisa de citação ABNT imediata
- Nunca inventar referência — pesquisar e verificar autor, título, periódico, ano e volume
- Não alterar referências já existentes — apenas acrescentar novas
- Relatório atual: versão 0.2 (`Relatorio_Cientifico_0_2.docx`)
- Usar `agentlog.md` e `agentlog_update_11052026.md` como base de contexto acadêmico

---

## 13. Instrução para o próximo agente ou sessão

Ao retomar sessão de código:
1. Reconectar nó da Lupa com lógica IF (Camada 2)
2. Testar fluxo completo com vídeos reais de desinformação voltados a idosos
3. Implementar upload direto de arquivo no frontend (alternativa ao URL para a banca)

Ao retomar sessão de documentação acadêmica:
1. Escrever Capítulo 4 (Desenvolvimento) com base na arquitetura implementada
2. Escrever Capítulo 5 (Resultados) após testes com vídeos reais
3. Escrever Capítulo 6 (Conclusão) com trabalhos futuros: deepfake, WhatsApp, Camada 3

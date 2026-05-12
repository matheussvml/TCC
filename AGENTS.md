<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Contexto do Projeto para Agentes — FactCheck KAI

## O que é este projeto

Sistema de verificação científica de conteúdos em vídeo, voltado ao público idoso (65+).
O usuário cola uma URL de vídeo e recebe um relatório com alegações verificadas contra artigos científicos.

## Fluxo completo (já integrado)

```
URL do vídeo
  → /api/transcribe (Next.js route)
    → extrator_universal.py (yt-dlp + Groq Whisper)
      → transcrição em texto
  → n8n webhook POST /validar-alegacoes
    → Groq extrai alegações
    → OpenAlex busca artigos por alegação
    → Groq valida cada alegação com as evidências
      → veredicto: VERDADEIRO | FALSO | PARCIALMENTE VERDADEIRO | SEM EMBASAMENTO SUFICIENTE
  → frontend exibe ResultsSection com claims reais
```

## Arquivos-chave

| Arquivo | Papel |
|---------|-------|
| `src/app/page.tsx` | Orquestra transcrição + chamada n8n. Recalcula overallScore se n8n retornar 0 |
| `src/app/api/transcribe/route.ts` | Proxy para Render ou executa Python local |
| `extrator_universal.py` | Baixa áudio e transcreve com Groq Whisper |
| `src/components/ClaimCard.tsx` | Exibe veredicto + % de confiança + fontes. Tolerante a `text` vazio |
| `src/components/ResultsSection.tsx` | Layout com vídeo, transcrição e chips de breakdown por veredicto |
| `src/data/mockData.ts` | Tipos `Claim` e `AnalysisResult` — NÃO são mais mock |
| `CLAUDE.md` | Contexto detalhado do projeto |
| `DIAGNOSTICO_VALIDACAO.md` | Plano pendente para corrigir extração/busca científica |

## Variáveis de ambiente necessárias

```
GROQ_API_KEY=...
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://matheusvml.app.n8n.cloud/webhook/validar-alegacoes
BACKEND_URL=...  # apenas em produção (Vercel → Render)
```

## Problemas em aberto no n8n

**Ver [DIAGNOSTICO_VALIDACAO.md](./DIAGNOSTICO_VALIDACAO.md) para o plano detalhado.**

1. **Extração só pega 1 alegação em vez de 5** — prompt do nó "Groq — Extrair alegações" precisa ser reforçado
2. **Alegação coloquial vai bruta para o OpenAlex** — adicionar campo `query_busca` em inglês técnico e usar como parâmetro de busca no nó OpenAlex
3. **Lupa (Camada 2 jornalística)** desconectada — reconectar com nó IF de fallback quando OpenAlex retornar vazio

### Já corrigido em 13/05/2026
- Formatar Claim agora lê `alegacao` do nó **Mesclar dados** (antes lia de Consolidar fontes e vinha vazio)
- Frontend recalcula `overallScore` quando n8n retorna 0
- ClaimCard mostra placeholder quando `text` está vazio

## Regras para agentes

- Nunca substituir chamadas reais (transcrição e n8n) por mocks — a integração está completa
- A interface `Claim` em `mockData.ts` é o contrato de dados — qualquer mudança no n8n deve refletir aqui
- `NEXT_PUBLIC_` vars são expostas no bundle do browser — não colocar secrets com esse prefixo
- O público-alvo são idosos: linguagem nos veredictos e explicações deve ser simples e direta
- Ao tocar no workflow do n8n, sempre confirmar **de qual nó anterior** os dados estão sendo lidos (`$('Nome do nó').all()[index]`) — referências erradas geram campos vazios silenciosamente

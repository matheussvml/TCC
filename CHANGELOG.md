# Changelog

## [0.1.0] - 2026-04-07

### Contexto do Projeto

**FactCheck AI** é o projeto de TCC (Trabalho de Conclusão de Curso) que consiste em um sistema de **letramento digital e validação de fatos** em vídeos utilizando Inteligência Artificial.

**Objetivo:** Permitir que o usuário cole o link de um vídeo (YouTube, TikTok, etc.) e receba uma análise automatizada que:
1. Transcreve o áudio do vídeo
2. Identifica as afirmações-chave feitas no conteúdo
3. Cruza essas afirmações com fontes científicas e jornalísticas
4. Gera um relatório de validação com status (Validado / Sem Evidências) e nível da fonte

**Stack técnica:**
- **Framework:** Next.js 16 (App Router) com TypeScript
- **Estilização:** Tailwind CSS
- **Ícones:** Lucide React
- **Fase atual:** Front-end com dados mockados (sem integração de backend)

### Adicionado

- Estrutura inicial do projeto Next.js com Tailwind CSS
- Componente `Header` com identidade visual do projeto
- Componente `VideoInput` com campo de URL e botão de ação
- Componente `LoadingSteps` com stepper animado simulando as etapas da IA (transcrição, busca de artigos, cruzamento de dados)
- Componente `ResultsSection` com vídeo embed, score de confiabilidade e layout responsivo
- Componente `TranscriptPanel` com painel de transcrição rolável
- Componente `ClaimCard` com cards de afirmações e status de validação (verde/vermelho)
- Componente `ScoreBadge` com indicador visual de porcentagem de confiabilidade
- Arquivo `mockData.ts` com dados simulados de uma análise completa (5 afirmações, transcrição, metadados do vídeo)
- Animações de fade-in para transições suaves na interface

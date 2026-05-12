# Diagnóstico — Problemas na Extração e Validação de Alegações

> Data: 13/05/2026
> Status: diagnosticado, alterações pendentes
> Arquivo a ser executado posteriormente para corrigir o pipeline de validação no n8n

---

## Contexto

Após corrigir o **Formatar Claim** (que passou a ler do nó **Mesclar dados** em vez do **Consolidar fontes**), o campo `text` das alegações começou a aparecer corretamente no frontend.

Porém, dois novos problemas ficaram evidentes ao testar com vídeos reais:

1. As alegações extraídas são **coloquiais** e quando enviadas ao **OpenAlex** retornam "Nenhum artigo encontrado"
2. O sistema está extraindo **apenas 1 alegação** quando o prompt original pedia 5

---

## Problema 1 — Alegação coloquial vai bruta para o OpenAlex

### Sintoma

O nó **"Groq — Extrair alegações"** captura trechos quase literais da transcrição, mantendo a linguagem coloquial.

**Exemplo real** (vídeo sobre laboratório caseiro):
- `alegacao`: `"não houve contaminação, mesmo eu encostando vinhete no êmbolo"`
- `contexto`: `"E agora o bendito resultado dessas placas. Depois de 48 horas de incubação..."`

Esse texto vai direto para o nó **OpenAlex — Artigos científicos** como query de busca.

### Por que falha

- OpenAlex indexa papers em inglês com **terminologia técnica**
- A query atual contém:
  - Primeira pessoa (`eu`)
  - Gírias e referências de cena (`vinhete`, `êmbolo`)
  - Conjunções coloquiais (`mesmo eu encostando`)
- Não há nenhuma chance de match com um paper científico

### Consequência

Todas as alegações acabam classificadas como **"SEM EMBASAMENTO SUFICIENTE"** com `confianca: 0.5`, não porque o tema seja realmente sem embasamento, mas porque **a busca falhou na fonte**.

---

## Problema 2 — Sistema extrai apenas 1 alegação em vez de 5

### Sintoma

O fluxo deveria gerar até 5 alegações por vídeo, mas só está produzindo 1 no output do Formatar Claim.

### Possíveis causas (em ordem de probabilidade)

1. **Prompt fraco do "Groq — Extrair alegações"**
   O prompt provavelmente diz "extraia até 5 alegações" sem reforçar busca ativa.
   O LLM, na dúvida, devolve só a mais óbvia e para.

2. **Vídeo curto / pouco conteúdo factual**
   Pode ser resultado válido em alguns casos, mas pela transcrição do teste dava pra extrair pelo menos 3–4 alegações distintas.

3. **JSON malformado**
   Se o LLM gera JSON com erro no item 2+, o `JSON.parse` pode estar recuperando só o primeiro.

4. **Filtro silencioso no "Parsear alegações"**
   O JS pode estar derrubando itens sem campos obrigatórios sem avisar.

5. **Limite de tokens** (pouco provável)
   Transcrição muito longa cortando antes da listagem completa.

---

## Plano consolidado de correção

### O que **vai ser feito** (na próxima sessão de código)

| # | Nó | Mudança |
|---|----|---------|
| 1 | **Groq — Extrair alegações** | Novo prompt que **exige 5 alegações** e devolve estrutura com 4 campos: `alegacao` (original), `contexto` (trecho ampliado), `query_busca` (termos científicos em inglês), `tema` |
| 2 | **Parsear alegações** | JS atualizado expõe `query_busca` para o próximo nó. Sem filtros silenciosos. Adicionar log de itens recebidos vs. emitidos |
| 3 | **OpenAlex — Artigos científicos** | Trocar parâmetro de busca de `{{ $json.alegacao }}` para `{{ $json.query_busca }}` |
| 4 | **Formatar Claim** | Mantém o que já está (já corrigido para ler de **Mesclar dados**) |

### Estrutura nova do JSON de cada alegação

```json
{
  "id": 1,
  "alegacao": "texto original, como dito no vídeo (preservar para exibir ao usuário)",
  "contexto": "trecho ampliado da fala",
  "query_busca": "termos científicos em inglês otimizados para OpenAlex",
  "tema": "ciencia | saude | nutricao | educacao | politica | tecnologia | outro"
}
```

**Exemplo aplicado** ao caso real:
- `alegacao`: `"não houve contaminação ao encostar a agulha no êmbolo da vacina"`
- `contexto`: `"experimento caseiro com placa de cultura por 48 horas"`
- `query_busca`: `"needle contamination aseptic technique vial puncture sterility"`
- `tema`: `"saude"`

Assim:
- O **usuário** continua vendo a alegação em português, como foi dita
- O **OpenAlex** recebe uma busca otimizada que retorna papers relevantes
- A taxa de "Nenhum artigo encontrado" cai drasticamente

### Estratégia opcional (Plano B — só se Plano A não bastar)

Se mesmo com `query_busca` o OpenAlex não retornar artigos, adicionar **busca em cascata** dentro do mesmo nó:
1. Tenta `query_busca` completa
2. Se vazio, tenta só os 2–3 termos principais
3. Se vazio, tenta só o `tema` traduzido

---

## O que **você** (Erich) precisa fazer

### Antes das alterações
1. **Confirmar** que o Plano consolidado faz sentido
2. **Abrir o output bruto do nó "Groq — Extrair alegações"** e mandar uma screenshot do conteúdo do `choices[0].message.content`. Isso vai confirmar se ele:
   - Já gera 5 e algo está filtrando depois, OU
   - Genuinamente só gerou 1 (e o problema é o prompt)

### Durante as alterações
3. **Substituir** o prompt do "Groq — Extrair alegações" pelo novo
4. **Substituir** o JS do "Parsear alegações"
5. **Trocar** o parâmetro do nó OpenAlex
6. **Salvar** o workflow

### Validação
7. **Rodar 2 vídeos de teste**:
   - Um curto (1 alegação clara) — esperado: 1 a 2 claims
   - Um longo/denso sobre saúde ou ciência — esperado: 5 claims
8. **Verificar** se o OpenAlex agora retorna artigos para a maioria das alegações
9. **Confirmar** que o frontend mostra todas as claims com texto preenchido

---

## Observações importantes

### Sobre "SEM EMBASAMENTO" depois da correção

Mesmo com a busca otimizada, **vídeos com conteúdo muito nicho ou anedótico** podem genuinamente não ter paper científico que valide ou refute. Nesse caso, o veredicto "SEM EMBASAMENTO SUFICIENTE" é o resultado correto, não um bug.

A diferença:
- **Hoje**: dá "sem embasamento" porque a query é ruim ❌
- **Depois**: dá "sem embasamento" só quando o tema é nicho demais ✅

### Sobre a Camada 2 (Lupa)

Esse diagnóstico **não inclui** a reconexão da Lupa (jornalística) — está em outra fila de pendências do CLAUDE.md.
Quando o Plano A estiver funcionando, fica natural conectar a Lupa como fallback para alegações que o OpenAlex não cobre (ex: política, fofocas, atualidades).

### Sobre o frontend

O frontend **já está preparado** para receber 5+ claims (mostra breakdown por veredicto, calcula score por média de confiança, lista fontes). Nenhuma mudança no React é necessária para esta etapa.

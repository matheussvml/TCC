// Nó "Mesclar dados" — n8n (Code, Run Once for Each Item)
// Monta o prompt de validação e as listas de fontes COM LINK REAL.
// As URLs vêm direto do OpenAlex e da Tavily — o LLM nunca inventa link.

const alegacao = $('Parsear alegações').item.json;

// ---- Camada 1: OpenAlex → artigos científicos (título + DOI) ----
let fontes_cientificas = [];
try {
  const resultados = $('OpenAlex — Artigos científicos').item.json.results || [];
  fontes_cientificas = resultados
    .map((r) => ({
      titulo: `${r.title || 'Sem título'} (${r.publication_year || 's.d.'})`,
      url: r.doi || r.primary_location?.landing_page_url || '',
    }))
    .filter((f) => f.url);
} catch (e) {}

// ---- Camada 2: Tavily/Lupa → checagens jornalísticas (título + URL) ----
let fontes_jornalisticas = [];
let resumoTavily = '';
try {
  const lupaData = $('Lupa — Checagem jornalística').item.json;

  fontes_jornalisticas = (lupaData.results || [])
    .map((r) => {
      let dominio = 'fonte desconhecida';
      try {
        if (r.url) dominio = new URL(r.url).hostname.replace('www.', '');
      } catch (_) {}

      return {
        titulo: r.title || 'Sem título',
        url: r.url || '',
        dominio,
        resumo: (r.content || r.snippet || '').substring(0, 300),
      };
    })
    .filter((f) => f.url);

  if (lupaData.answer) {
    resumoTavily = `\n\nResumo automático das checagens: ${lupaData.answer}`;
  }
} catch (e) {}

// ---- Blocos de texto do prompt — agora com as URLs, para o Groq citá-las ----
const artigos = fontes_cientificas.length
  ? fontes_cientificas.map((f) => `- ${f.titulo}\n  Fonte: ${f.url}`).join('\n')
  : 'Nenhum artigo científico encontrado.';

const checagens = fontes_jornalisticas.length
  ? fontes_jornalisticas
      .map((f) => `- [${f.dominio}] ${f.titulo}\n  ${f.resumo}...\n  Fonte: ${f.url}`)
      .join('\n\n') + resumoTavily
  : 'Nenhuma checagem jornalística encontrada.' + resumoTavily;

const prompt_validar = `Analise a alegação considerando MÚLTIPLAS FONTES de verificação:

ALEGAÇÃO: ${alegacao.texto}
CONTEXTO: ${alegacao.contexto || 'N/A'}
TEMA: ${alegacao.tema || 'geral'}

━━━ FONTES CIENTÍFICAS (OpenAlex) ━━━
${artigos}

━━━ CHECAGENS JORNALÍSTICAS (Lupa, G1 Fato ou Fake, Aos Fatos, etc) ━━━
${checagens}

INSTRUÇÕES:
- Dê peso ALTO a checagens jornalísticas diretamente sobre essa alegação.
- Use fontes científicas pra fundamentar tecnicamente.
- Cite as fontes pelo nome na explicação, usando APENAS as listadas acima.
- NUNCA invente URL, título ou autor que não esteja nas listas acima.
Classifique a alegação usando estes critérios exatos:
- VERDADEIRO: a afirmação central é suportada por evidências científicas, mesmo que tenha nuances menores
- PARCIALMENTE VERDADEIRO: parte central da afirmação é correta mas contém erros factuais significativos ou contexto enganoso
- FALSO: a afirmação principal contradiz evidências científicas
- SEM EMBASAMENTO SUFICIENTE: não há evidências suficientes para julgar

IMPORTANTE: afirmações gerais e corretas como "beber água faz bem" devem ser VERDADEIRO, não PARCIALMENTE VERDADEIRO. Reserve PARCIALMENTE VERDADEIRO para quando há um erro factual real, não apenas falta de precisão.

Responda APENAS com JSON válido, sem markdown:
{
  "veredicto": "VERDADEIRO | FALSO | PARCIALMENTE VERDADEIRO | SEM EMBASAMENTO SUFICIENTE",
  "confianca": 0.0,
  "explicacao": "explicação em 2-3 frases citando as fontes pelo nome"
}`;

const groq_body_validar = JSON.stringify({
  model: 'openai/gpt-oss-120b',
  temperature: 0,
  response_format: { type: 'json_object' },
  messages: [
    {
      role: 'system',
      content:
        'Você é um agente especializado em verificação de fatos. Use evidências científicas e checagens jornalísticas. Retorne APENAS JSON válido, sem markdown.',
    },
    { role: 'user', content: prompt_validar },
  ],
});

return {
  json: {
    alegacao: alegacao.texto,
    contexto: alegacao.contexto,
    tema: alegacao.tema,
    id: alegacao.id,
    artigos_cientificos: artigos,
    checagens_jornalisticas: checagens,
    // Listas prontas pro frontend — { titulo, url }, sempre com link real
    fontes_cientificas,
    fontes_jornalisticas: fontes_jornalisticas.map((f) => ({
      titulo: f.titulo,
      url: f.url,
    })),
    groq_body_validar,
  },
};

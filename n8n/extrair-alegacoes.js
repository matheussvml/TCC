// Nó "usar so referencias simples" — n8n (Code)
// Monta o groq_body da extração de alegações. O nó HTTP "Groq — Extrair
// alegações" só repassa {{ $json.groq_body }}: model e prompt ficam aqui.

// Cada alegação custa uma busca na OpenAlex (orçamento diário gratuito por
// chave/IP — é esse o gargalo) e uma validação no Groq (Dev Tier, pago por
// token). 3 por vídeo esticam o orçamento da OpenAlex e encurtam a análise.
// O "Parsear alegações" corta no mesmo número, caso o modelo passe do limite.
const MAX_ALEGACOES = 3;

const transcricao = $input.first().json.transcricao;

// Regras que vieram do teste com 56 vídeos reais (18/10/2026):
// - perguntas e frases triviais ("esse processo dura 20 segundos") viravam
//   alegação, saíam SEM EMBASAMENTO e puxavam para baixo vídeos verdadeiros;
// - em vídeo que DESMENTE um mito, o mito era extraído como se fosse a tese;
// - a busca na OpenAlex pela frase em português trazia artigos sem relação
//   ("chiclete no estômago" → crítica literária), por isso cada alegação vem
//   com palavras-chave em inglês em busca_cientifica.
const instrucoes = `Leia o TEXTO abaixo, transcrito de um vídeo, e extraia as afirmações factuais verificáveis mais relevantes (mínimo 1, máximo ${MAX_ALEGACOES}).

REGRAS:
1. Extraia só afirmações sobre o mundo que possam ser checadas contra evidências (ex.: 'X causa Y', 'X cura Y', 'X% das pessoas Z').
2. NÃO extraia perguntas, opiniões, conselhos genéricos, pedidos para curtir ou seguir, nem detalhes triviais ou de procedimento (ex.: 'esse processo dura 20 segundos', 'pegue uma colher de mel').
3. Escreva cada afirmação do jeito que o VÍDEO A DEFENDE. Se o vídeo cita um mito para desmenti-lo, a afirmação é a correção, não o mito. Ex.: o vídeo diz 'dizem que o chiclete engolido fica 7 anos no estômago, mas isso é mito' → afirmação: 'Chiclete engolido não fica 7 anos no estômago'.
4. Cada afirmação deve ser uma frase completa, que se entenda sozinha, sem 'isso', 'ele' ou 'esse'.
5. Se houver mais de ${MAX_ALEGACOES}, escolha as de maior risco de desinformação, priorizando saúde.
6. Em 'busca_cientifica', escreva de 3 a 6 palavras-chave EM INGLÊS para buscar artigos científicos sobre o assunto da afirmação, sem pontuação (ex.: 'chewing gum swallowed digestion').

TEXTO:
`;

const formato = `

Responda APENAS com este JSON (no máximo ${MAX_ALEGACOES} itens no array):
{"alegacoes": [{"id": 1, "texto": "afirmação como o vídeo a defende", "contexto": "frase completa do texto", "tema": "saude|politica|ciencia|economia|outro", "busca_cientifica": "english keywords"}]}`;

const body = {
  model: "openai/gpt-oss-120b",
  temperature: 0,
  response_format: { type: "json_object" },
  messages: [
    {
      role: "system",
      content: "Você é um extrator de alegações factuais. Sua tarefa é identificar as afirmações verificáveis mais relevantes de um texto. Retorne APENAS JSON válido, sem markdown."
    },
    {
      role: "user",
      content: instrucoes + transcricao + formato
    }
  ]
};

return [{
  json: {
    transcricao,
    videoTitle: $input.first().json.videoTitle,
    videoUrl: $input.first().json.videoUrl,
    groq_body: JSON.stringify(body)
  }
}];

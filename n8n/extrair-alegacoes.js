// Nó "usar so referencias simples" — n8n (Code)
// Monta o groq_body da extração de alegações. O nó HTTP "Groq — Extrair
// alegações" só repassa {{ $json.groq_body }}: model e prompt ficam aqui.

// Cada alegação custa uma busca na OpenAlex (orçamento diário gratuito por
// chave/IP — é esse o gargalo) e uma validação no Groq (Dev Tier, pago por
// token). 3 por vídeo esticam o orçamento da OpenAlex e encurtam a análise.
// O "Parsear alegações" corta no mesmo número, caso o modelo passe do limite.
const MAX_ALEGACOES = 3;

const transcricao = $input.first().json.transcricao;

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
      content: `Leia o TEXTO abaixo e extraia as afirmações factuais verificáveis mais relevantes (mínimo 1, máximo ${MAX_ALEGACOES}). Uma afirmação verificável é qualquer declaração que possa ser checada contra evidências (ex: 'beber água faz bem', 'X causa Y', 'X% das pessoas Z'). Opiniões e perguntas NÃO contam. Se houver mais de ${MAX_ALEGACOES}, escolha as que têm maior risco de desinformação, priorizando saúde.\n\nTEXTO:\n` + transcricao + `\n\nResponda APENAS com este JSON (no máximo ${MAX_ALEGACOES} itens no array):\n{"alegacoes": [{"id": 1, "texto": "afirmação exata", "contexto": "frase completa do texto", "tema": "saude|politica|ciencia|economia|outro"}]}`
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

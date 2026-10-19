// Nó "Parsear alegações" — n8n (Code)
// Explode a resposta do Groq em um item por alegação.

// Teto garantido: o prompt pede no máximo 3, mas o modelo nem sempre obedece.
// Manter igual ao MAX_ALEGACOES do nó "usar so referencias simples".
const MAX_ALEGACOES = 3;

const raw = $input.first().json.choices?.[0]?.message?.content || '';

let parsed;
try {
  const clean = raw.replace(/```json|```/g, '').trim();
  parsed = JSON.parse(clean);
} catch(e) {
  throw new Error('Groq não retornou JSON válido: ' + raw.substring(0, 200));
}

// A Tavily recebe a alegação dentro de um JSON montado como texto
// ("query": "{{ $json.alegacao }}"): aspas duplas, barra invertida ou quebra
// de linha no meio quebram o corpo da requisição.
const paraTavily = (s) => String(s || '').replace(/"/g, "'").replace(/[\\\r\n]+/g, ' ').trim();

// A OpenAlex trata ? e * como curinga e responde 400, o que derrubava a
// execução inteira (2 dos 56 vídeos reais em 18/10/2026).
const paraOpenAlex = (s) => String(s || '').replace(/[?*"\\]/g, ' ').replace(/\s+/g, ' ').trim();

const alegacoes = (parsed.alegacoes || []).filter((a) => paraTavily(a.texto));
if (alegacoes.length === 0) {
  throw new Error('Nenhuma alegação encontrada na transcrição.');
}

// Quem lê cada campo:
// - alegacao: texto em português. A Tavily busca por ele, e o "Mesclar dados"
//   o usa no prompt de validação e no card.
// - texto: o que a OpenAlex busca (o nó HTTP lê $json.texto). São as
//   palavras-chave em inglês; se o modelo não mandar, vai a própria alegação.
return alegacoes.slice(0, MAX_ALEGACOES).map((a, i) => {
  const alegacao = paraTavily(a.texto);
  return {
    json: {
      id: a.id ?? i + 1,
      alegacao,
      texto: paraOpenAlex(a.busca_cientifica) || paraOpenAlex(alegacao),
      contexto: a.contexto || '',
      tema: a.tema || 'outro',
    },
  };
});

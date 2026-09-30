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

const alegacoes = parsed.alegacoes || [];
if (alegacoes.length === 0) {
  throw new Error('Nenhuma alegação encontrada na transcrição.');
}

return alegacoes.slice(0, MAX_ALEGACOES).map(a => ({ json: a }));

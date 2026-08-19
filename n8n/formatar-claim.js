// Nó "Formatar Claim" — n8n (Code, Run Once for All Items)
// Lê a resposta do Groq e anexa as fontes REAIS vindas do "Mesclar dados".

const allItems = $input.all();

const statusMap = {
  VERDADEIRO: 'validated',
  'PARCIALMENTE VERDADEIRO': 'partial',
  FALSO: 'invalid',
  'SEM EMBASAMENTO SUFICIENTE': 'invalid',
};

const claims = allItems.map((item, index) => {
  const raw = item.json.choices?.[0]?.message?.content || '';
  const original = $('Mesclar dados').all()[index]?.json || {};

  let resultado;
  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    resultado = JSON.parse(clean);
  } catch (e) {
    resultado = {
      veredicto: 'SEM EMBASAMENTO SUFICIENTE',
      confianca: 0,
      explicacao: 'Não foi possível verificar esta afirmação.',
    };
  }

  const veredicto = resultado.veredicto || 'SEM EMBASAMENTO SUFICIENTE';
  const confianca = Number(resultado.confianca) || 0;
  const status = statusMap[veredicto] || 'invalid';

  let displayScore;
  if (veredicto === 'VERDADEIRO') {
    displayScore = Math.round(confianca * 100);
  } else if (veredicto === 'PARCIALMENTE VERDADEIRO') {
    displayScore = Math.round(confianca * 70);
  } else if (veredicto === 'FALSO') {
    displayScore = Math.round((1 - confianca) * 100);
  } else {
    displayScore = 0;
  }

  const displayColor =
    status === 'validated' ? 'green' : status === 'partial' ? 'yellow' : 'red';

  // Fontes vêm do OpenAlex/Tavily via "Mesclar dados" — nunca do LLM,
  // que poderia alucinar títulos e URLs inexistentes.
  const fontes_cientificas = original.fontes_cientificas || [];
  const fontes_jornalisticas = original.fontes_jornalisticas || [];

  return {
    id: index + 1,
    text: original.alegacao || '',
    status,
    veredicto,
    confianca,
    displayScore,
    displayColor,
    source: resultado.explicacao || '',
    sourceLevel: 'Verificação multi-fonte',
    fontes_cientificas,
    fontes_jornalisticas,
    fontes: [
      ...fontes_jornalisticas.map((f) => ({ tipo: 'jornalistica', ...f })),
      ...fontes_cientificas.map((f) => ({ tipo: 'cientifica', ...f })),
    ],
  };
});

return [{ json: { claims } }];

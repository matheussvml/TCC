// Nó "Consolidar resultado final" — n8n (Code, Run Once for All Items)
// Monta a resposta do webhook e calcula o escore geral do vídeo.

const allItems = $input.all();

// Pega todas as claims processadas
const claims = allItems.flatMap(item => item.json.claims || [item.json]);

// SEM EMBASAMENTO fica fora da média (18/10/2026). "Não achamos prova" não é
// "é falso": valendo 0, derrubava vídeos verdadeiros cujo assunto não tem
// checagem jornalística. Se nenhuma afirmação teve veredicto, não há escore:
// null, e o site mostra "sem conclusão" em vez de um número.
const avaliadas = claims.filter(c => c.veredicto !== 'SEM EMBASAMENTO SUFICIENTE');
const overallScore = avaliadas.length > 0
  ? Math.round(avaliadas.reduce((sum, c) => sum + (c.displayScore || 0), 0) / avaliadas.length)
  : null;

return [{
  json: {
    status: 'success',
    claims: claims.map(c => ({
      id: c.id,
      text: c.text,
      status: c.status,
      veredicto: c.veredicto,
      confianca: c.confianca,
      displayScore: c.displayScore,
      displayColor: c.displayColor,
      source: c.source,
      sourceLevel: c.sourceLevel,
      // Garante que as duas fontes chegam no webhook
      fontes_jornalisticas: c.fontes_jornalisticas || [],
      fontes_cientificas: c.fontes_cientificas || [],
      fontes: c.fontes || []
    })),
    overallScore
  }
}];

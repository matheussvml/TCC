// Tira o link de um texto colado. Quem copia do WhatsApp costuma levar a
// mensagem inteira ("olha esse vídeo https://youtu.be/...!"), e o yt-dlp só
// entende o link puro.

const PLATAFORMAS =
  /(?:www\.|m\.|vm\.)?(?:youtube\.com|youtu\.be|tiktok\.com|instagram\.com|kwai\.com|facebook\.com|fb\.watch|x\.com|twitter\.com)\/[^\s<>"']+/i;

// Pontuação colada no fim do link ("...abc)." ou "...abc!") não faz parte dele
const limparFim = (s: string) => s.replace(/[).,;!?]+$/, "");

export function extrairLink(texto: string): string | null {
  const t = texto.trim();
  if (!t) return null;

  const comProtocolo = t.match(/https?:\/\/[^\s<>"']+/i);
  if (comProtocolo) return limparFim(comProtocolo[0]);

  // Link digitado ou copiado sem o "https://"
  const semProtocolo = t.match(PLATAFORMAS);
  if (semProtocolo) return `https://${limparFim(semProtocolo[0])}`;

  return null;
}

// Leitor em voz alta com a voz do próprio navegador (Web Speech API).
// Sem servidor e sem custo. Um estado só para a página inteira: tocar em outro
// "Ouvir" interrompe a leitura anterior, e todos os botões sabem quem está falando.

import { useSyncExternalStore } from "react";
import { lerPreferencias } from "@/lib/a11y";

let falandoId: string | null = null;
const ouvintes = new Set<() => void>();

function emitir() {
  ouvintes.forEach((f) => f());
}

function assinar(f: () => void) {
  ouvintes.add(f);
  return () => {
    ouvintes.delete(f);
  };
}

export function vozSuportada(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

// O Chrome carrega a lista de vozes de forma assíncrona: pede cedo para ela já
// estar pronta no primeiro toque.
if (vozSuportada()) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", () => window.speechSynthesis.getVoices());
}

function escolherVoz(): SpeechSynthesisVoice | null {
  const vozes = window.speechSynthesis.getVoices();
  const pt = vozes.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith("pt"));
  const br = pt.filter((v) => /br/i.test(v.lang));
  const lista = br.length ? br : pt;
  // Vozes "naturais"/online soam bem melhor que as antigas do sistema
  return lista.find((v) => /natural|online|google/i.test(v.name)) ?? lista[0] ?? null;
}

// O Chrome interrompe falas longas (~15 s). Lê frase por frase e quebra as
// frases muito compridas nas vírgulas.
export function dividirEmTrechos(texto: string): string[] {
  const frases = texto.replace(/\s+/g, " ").match(/[^.!?]+[.!?]*/g) ?? [];
  const trechos: string[] = [];
  for (const frase of frases) {
    const f = frase.trim();
    if (!f) continue;
    if (f.length <= 180) {
      trechos.push(f);
      continue;
    }
    // Sem lookbehind no regex: iPhones antes do iOS 16.4 não suportam e o
    // erro de sintaxe derrubaria a página inteira
    const partes = f.split(",").map((p, i, arr) => (i < arr.length - 1 ? `${p.trim()},` : p.trim()));
    let atual = "";
    for (const parte of partes) {
      if (atual && (atual + " " + parte).length > 180) {
        trechos.push(atual.trim());
        atual = parte;
      } else {
        atual = atual ? `${atual} ${parte}` : parte;
      }
    }
    if (atual.trim()) trechos.push(atual.trim());
  }
  return trechos;
}

export function falar(id: string, texto: string) {
  if (!vozSuportada()) return;
  const synth = window.speechSynthesis;
  const trechos = dividirEmTrechos(texto);
  if (trechos.length === 0) return;

  synth.cancel();
  falandoId = id;
  emitir();

  const voz = escolherVoz();
  const rate = lerPreferencias().vozDevagar ? 0.8 : 0.95;
  const terminou = () => {
    if (falandoId === id) {
      falandoId = null;
      emitir();
    }
  };

  // O Chrome às vezes descarta um speak() chamado logo depois de cancel()
  setTimeout(() => {
    if (falandoId !== id) return; // outro botão foi tocado nesse meio-tempo
    trechos.forEach((trecho, i) => {
      const u = new SpeechSynthesisUtterance(trecho);
      u.lang = voz?.lang ?? "pt-BR";
      if (voz) u.voice = voz;
      u.rate = rate;
      if (i === trechos.length - 1) u.onend = terminou;
      u.onerror = terminou;
      synth.speak(u);
    });
  }, 60);
}

export function parar() {
  if (!vozSuportada()) return;
  falandoId = null;
  emitir();
  window.speechSynthesis.cancel();
}

const semAssinatura = () => () => {};

// No servidor e na hidratação: "sem suporte" e "ninguém falando". O botão só
// aparece depois, no navegador, sem diferença entre servidor e cliente.
export function useVoz() {
  const falando = useSyncExternalStore(assinar, () => falandoId, () => null);
  const suportada = useSyncExternalStore(semAssinatura, vozSuportada, () => false);
  return { falando, suportada };
}

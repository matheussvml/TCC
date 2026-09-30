// Preferências de acessibilidade, salvas no aparelho (localStorage).
// Viram atributos no <html>, e o globals.css reage a eles:
//   data-fonte="grande" | "muito-grande"  → aumenta a letra da página inteira
//   data-contraste="alto"                 → escurece textos e bordas
//   data-movimento="reduzido"             → desliga animações

export type TamanhoFonte = "normal" | "grande" | "muito-grande";

export interface PreferenciasA11y {
  fonte: TamanhoFonte;
  altoContraste: boolean;
  menosMovimento: boolean;
  vozDevagar: boolean; // lida pelo leitor em voz alta (lib/voz.ts), não vira atributo
}

export const A11Y_STORAGE_KEY = "factchekk_a11y";

export const PREFERENCIAS_PADRAO: PreferenciasA11y = {
  fonte: "normal",
  altoContraste: false,
  menosMovimento: false,
  vozDevagar: false,
};

const FONTES_VALIDAS: TamanhoFonte[] = ["normal", "grande", "muito-grande"];

export function lerPreferencias(): PreferenciasA11y {
  try {
    const raw = localStorage.getItem(A11Y_STORAGE_KEY);
    if (!raw) return PREFERENCIAS_PADRAO;
    const p = JSON.parse(raw);
    return {
      fonte: FONTES_VALIDAS.includes(p.fonte) ? p.fonte : "normal",
      altoContraste: p.altoContraste === true,
      menosMovimento: p.menosMovimento === true,
      vozDevagar: p.vozDevagar === true,
    };
  } catch {
    return PREFERENCIAS_PADRAO;
  }
}

export function salvarPreferencias(p: PreferenciasA11y) {
  try {
    localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(p));
  } catch {
    // Navegador bloqueando armazenamento: vale só nesta visita
  }
}

export function aplicarPreferencias(p: PreferenciasA11y) {
  const html = document.documentElement;
  if (p.fonte === "normal") html.removeAttribute("data-fonte");
  else html.setAttribute("data-fonte", p.fonte);
  if (p.altoContraste) html.setAttribute("data-contraste", "alto");
  else html.removeAttribute("data-contraste");
  if (p.menosMovimento) html.setAttribute("data-movimento", "reduzido");
  else html.removeAttribute("data-movimento");
}

// Mesma lógica de aplicarPreferencias, em JS puro, para o <script> inline do
// layout. Roda durante a leitura do HTML, antes da primeira pintura: sem ele a
// página abriria com letra pequena e "pularia" depois de carregar.
export const SCRIPT_APLICAR_A11Y = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(
  A11Y_STORAGE_KEY
)})||"{}");var h=document.documentElement;if(p.fonte==="grande"||p.fonte==="muito-grande")h.setAttribute("data-fonte",p.fonte);if(p.altoContraste===true)h.setAttribute("data-contraste","alto");if(p.menosMovimento===true)h.setAttribute("data-movimento","reduzido")}catch(e){}})()`;

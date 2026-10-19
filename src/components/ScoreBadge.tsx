"use client";

type ColorProp = "green" | "yellow" | "red" | "gray";

interface ScoreBadgeProps {
  score: number | null; // null = nenhuma afirmação teve veredicto
  color?: ColorProp;
}

// Tons 800 sobre fundo 50: o red-600 dava 4,36:1, abaixo dos 4,5:1 da WCAG (axe-core)
const colorClasses: Record<ColorProp, string> = {
  green: "text-green-800 border-green-300 bg-green-50",
  yellow: "text-yellow-800 border-yellow-300 bg-yellow-50",
  red: "text-red-800 border-red-300 bg-red-50",
  gray: "text-gray-800 border-gray-300 bg-gray-50",
};

export default function ScoreBadge({ score, color }: ScoreBadgeProps) {
  const resolved = color
    ? colorClasses[color]
    : score === null
    ? colorClasses.gray
    : score >= 80
    ? colorClasses.green
    : score >= 50
    ? colorClasses.yellow
    : colorClasses.red;

  return (
    <div
      // flex-wrap + max-w-full: com letra muito grande numa tela de 320 px,
      // "41% de confiabilidade" vazava 14 px; agora o texto desce de linha
      className={`inline-flex max-w-full flex-wrap items-center gap-x-2 rounded-xl border-2 px-4 py-2 text-base font-semibold ${resolved}`}
    >
      {score === null ? (
        <span>
          <span className="font-extrabold">Sem conclusão</span>: faltam provas
        </span>
      ) : score < 10 ? (
        <span className="font-extrabold">Informação não confiável</span>
      ) : (
        // Um texto corrido só: ao quebrar linha sai "41% de / confiabilidade",
        // e não o "de" sozinho numa linha, como acontecia com dois blocos
        <span className="leading-snug">
          <span className="text-2xl font-extrabold">{score}%</span> de confiabilidade
        </span>
      )}
    </div>
  );
}

"use client";

type ColorProp = "green" | "yellow" | "red" | "gray";

interface ScoreBadgeProps {
  score: number;
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
    : score >= 80
    ? colorClasses.green
    : score >= 50
    ? colorClasses.yellow
    : colorClasses.red;

  const isVeryLow = score < 10;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-base font-semibold ${resolved}`}
    >
      {isVeryLow ? (
        <span className="font-extrabold">Informação não confiável</span>
      ) : (
        <>
          <span className="text-2xl font-extrabold">{score}%</span>
          <span>de confiabilidade</span>
        </>
      )}
    </div>
  );
}

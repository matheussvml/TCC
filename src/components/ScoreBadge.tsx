"use client";

type ColorProp = "green" | "yellow" | "red" | "gray";

interface ScoreBadgeProps {
  score: number;
  color?: ColorProp;
}

const colorClasses: Record<ColorProp, string> = {
  green: "text-green-600 border-green-200 bg-green-50",
  yellow: "text-yellow-600 border-yellow-200 bg-yellow-50",
  red: "text-red-600 border-red-200 bg-red-50",
  gray: "text-gray-600 border-gray-200 bg-gray-50",
};

export default function ScoreBadge({ score, color }: ScoreBadgeProps) {
  const resolved = color
    ? colorClasses[color]
    : score >= 80
    ? colorClasses.green
    : score >= 50
    ? colorClasses.yellow
    : colorClasses.red;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${resolved}`}
    >
      <span className="text-2xl font-extrabold">{score}%</span>
      <span>de confiabilidade</span>
    </div>
  );
}

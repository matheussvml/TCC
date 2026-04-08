"use client";

interface ScoreBadgeProps {
  score: number;
}

export default function ScoreBadge({ score }: ScoreBadgeProps) {
  const color =
    score >= 80
      ? "text-green-600 border-green-200 bg-green-50"
      : score >= 50
      ? "text-yellow-600 border-yellow-200 bg-yellow-50"
      : "text-red-600 border-red-200 bg-red-50";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${color}`}
    >
      <span className="text-2xl font-extrabold">{score}%</span>
      <span>de confiabilidade</span>
    </div>
  );
}

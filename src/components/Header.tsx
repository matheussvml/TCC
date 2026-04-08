"use client";

import { ShieldCheck } from "lucide-react";

export default function Header() {
  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-5">
        <ShieldCheck className="h-8 w-8 text-blue-600 shrink-0" />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            FactCheck AI
          </h1>
          <p className="text-sm text-gray-500">
            Verificador de fatos em vídeos com Inteligência Artificial
          </p>
        </div>
      </div>
    </header>
  );
}

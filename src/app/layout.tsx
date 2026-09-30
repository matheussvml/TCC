import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SCRIPT_APLICAR_A11Y } from "@/lib/a11y";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FactChekk - Verificador de Fatos em Vídeos",
  description:
    "Sistema de letramento digital e validação de fatos em vídeos com Inteligência Artificial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Aplica letra/contraste salvos antes da primeira pintura (ver lib/a11y.ts) */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_APLICAR_A11Y }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

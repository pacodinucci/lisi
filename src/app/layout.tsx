import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({ subsets: ["latin"], variable: "--font-syne", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Lisi González | Lisi & Co",
  description:
    "Consultoría creativa que une arte, desarrollo organizacional y gestión humana. Experiencias a medida para personas y equipos.",
  openGraph: {
    title: "Lisi González | Lisi & Co",
    description: "Personas, cultura y creatividad en movimiento.",
    images: ["/references/page-01.png"],
    locale: "es_AR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR" className={`${syne.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}

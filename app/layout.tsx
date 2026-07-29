import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DUSK EVE × BASALTE — Billetterie Officielle | Montréal",
  description:
    "Soirée électronique underground à Montréal. DUSK EVE Sounds × BASALTE présentent une nuit de house, techno & afro electronic music. Billets disponibles maintenant.",
  keywords: ["electronic music", "afro house", "techno", "Montreal", "Tiohtiàke", "club night", "DUSK EVE", "BASALTE", "underground"],
  openGraph: {
    title: "DUSK EVE × BASALTE — Soirée Collaboration",
    description: "Deux univers. Une nuit électrique. House, Afro Electronic & Techno à Montréal.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${playfair.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="bg-noir text-white font-sans antialiased" suppressHydrationWarning>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

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
    "Soirée électronique underground à Montréal. DUSK EVE Sounds × BASALTE présentent une nuit de house, afro house & afro tech. Billets disponibles maintenant.",
  keywords: ["electronic music", "afro house", "afro tech", "Montreal", "CHI Restaurant Bar", "DUSK EVE", "BASALTE", "underground"],
  metadataBase: new URL("https://duskbasaltix.netlify.app"),
  openGraph: {
    title: "DUSK EVE × BASALTE — Soirée Collaboration",
    description: "Deux univers. Une nuit électrique. Afro House & Afro Tech au CHI Restaurant Bar.",
    type: "website",
    url: "https://duskbasaltix.netlify.app",
    images: [
      {
        url: "https://duskbasaltix.netlify.app/assets/poster.jpeg?v=3",
        width: 1200,
        height: 1500,
        alt: "DUSK EVE x BASALTE Official Poster",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DUSK EVE × BASALTE — Soirée Collaboration",
    description: "Deux univers. Une nuit électrique. Afro House & Afro Tech au CHI Restaurant Bar.",
    images: ["https://duskbasaltix.netlify.app/assets/poster.jpeg?v=3"],
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

"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function ConditionsPage() {
  const { lang } = useLanguage();
  const isEn = lang === "en";

  return (
    <main className="min-h-screen relative overflow-hidden bg-noir text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-24 sm:py-32 relative z-10">
        <Link href="/" className="text-xs text-bordeaux-light font-bold tracking-widest uppercase mb-6 inline-block hover:underline">
          ← {isEn ? "Back to Event" : "Retour à la billetterie"}
        </Link>
        <h1 className="font-serif font-black text-3xl sm:text-5xl text-white mb-6">
          {isEn ? "Terms of Service" : "Conditions Générales d'Utilisation"}
        </h1>
        <div className="glow-line-fusion mb-8" />

        <div className="space-y-6 text-sm text-gray-300 font-sans leading-relaxed">
          <section className="glass-card-fusion p-6 rounded-2xl border border-white/10 space-y-3">
            <h2 className="font-serif text-xl font-bold text-white">1. Accès à l'Événement</h2>
            <p>
              L'accès à la soirée DUSK EVE × BASALTE est réservé aux personnes munies d'un billet valide et d'une pièce d'identité officielle avec photo (âge légal requis).
            </p>
          </section>

          <section className="glass-card-fusion p-6 rounded-2xl border border-white/15 space-y-3">
            <h2 className="font-serif text-xl font-bold text-white">2. Code de Conduite</h2>
            <p>
              L'organisation prône un espace inclusif et respectueux. Tout comportement harcelant, discriminatoire ou violent entraînera l'expulsion immédiate sans remboursement.
            </p>
          </section>

          <section className="glass-card-fusion p-6 rounded-2xl border border-white/15 space-y-3">
            <h2 className="font-serif text-xl font-bold text-white">3. Droit à l'Image</h2>
            <p>
              En participant à cet événement, vous acceptez de pouvoir apparaître sur les photos et vidéos récapitulatives produites à des fins d'archivage et de promotion des collectifs DUSK EVE Sounds et BASALTE.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

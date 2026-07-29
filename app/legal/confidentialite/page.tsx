"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function ConfidentialitePage() {
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
          {isEn ? "Privacy Policy" : "Politique de Confidentialité"}
        </h1>
        <div className="glow-line-fusion mb-8" />

        <div className="space-y-6 text-sm text-gray-300 font-sans leading-relaxed">
          <section className="glass-card-fusion p-6 rounded-2xl border border-white/10 space-y-3">
            <h2 className="font-serif text-xl font-bold text-white">1. Collecte des Données (Loi 25 Québec)</h2>
            <p>
              {isEn
                ? "We collect only the personal information strictly necessary to process your ticket reservation: full name and email address."
                : "Conformément à la Loi 25 du Québec, nous collectons uniquement les informations personnelles strictement nécessaires au traitement de votre réservation de billet : nom complet et adresse email."}
            </p>
          </section>

          <section className="glass-card-fusion p-6 rounded-2xl border border-white/10 space-y-3">
            <h2 className="font-serif text-xl font-bold text-white">2. Traitement des Paiements</h2>
            <p>
              {isEn
                ? "All payment details are handled securely by Stripe (256-bit SSL encryption). We never store credit card numbers on our servers."
                : "Les données de paiement sont traitées de manière sécurisée par notre prestataire Stripe (cryptage SSL 256-bit). Aucune donnée bancaire n'est conservée sur nos serveurs."}
            </p>
          </section>

          <section className="glass-card-fusion p-6 rounded-2xl border border-white/10 space-y-3">
            <h2 className="font-serif text-xl font-bold text-white">3. Utilisation de vos Données</h2>
            <p>
              Vos données sont utilisées exclusivement pour vous transmettre votre billet électronique et vous informer des consignes relatives à l'événement DUSK EVE × BASALTE.
            </p>
          </section>

          <section className="glass-card-fusion p-6 rounded-2xl border border-white/10 space-y-3">
            <h2 className="font-serif text-xl font-bold text-white">4. Vos Droits</h2>
            <p>
              Vous pouvez demander la consultation ou la suppression de vos données personnelles en envoyant un message à{" "}
              <strong className="text-ember-light">confidentialite@duskeve-basalte.com</strong>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

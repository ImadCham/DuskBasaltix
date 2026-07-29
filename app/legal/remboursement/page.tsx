"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function RemboursementPage() {
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
          {isEn ? "Refund & Transfer Policy" : "Politique de Remboursement et Transferts"}
        </h1>
        <div className="glow-line-fusion mb-8" />

        <div className="space-y-6 text-sm text-gray-300 font-sans leading-relaxed">
          <section className="glass-card-fusion p-6 rounded-2xl border border-white/10 space-y-3">
            <h2 className="font-serif text-xl font-bold text-white">1. Vente Finale</h2>
            <p>
              {isEn
                ? "All ticket sales for DUSK EVE × BASALTE are final and non-refundable, except in the event of full event cancellation by the organizers."
                : "Toutes les ventes de billets pour DUSK EVE × BASALTE sont finales et non remboursables, sauf en cas d'annulation complète de l'événement par l'organisation."}
            </p>
          </section>

          <section className="glass-card-fusion p-6 rounded-2xl border border-white/10 space-y-3">
            <h2 className="font-serif text-xl font-bold text-white">2. Transfert de Billet</h2>
            <p>
              {isEn
                ? "Tickets are transferable to another person. The QR code provided in the email acts as the unique entry pass. Simply share the QR code with the recipient."
                : "Les billets sont transférables à une autre personne. Le QR code transmis par email fait foi de passe d'entrée unique. Il suffit de transmettre le QR code au destinataire."}
            </p>
          </section>

          <section className="glass-card-fusion p-6 rounded-2xl border border-white/10 space-y-3">
            <h2 className="font-serif text-xl font-bold text-white">3. Report de l'Événement</h2>
            <p>
              {isEn
                ? "If the event date is rescheduled due to unforeseen circumstances, purchased tickets remain valid for the new date."
                : "En cas de report de l'événement à une date ultérieure pour cas de force majeure, les billets achetés restent valides pour la nouvelle date."}
            </p>
          </section>

          <section className="glass-card-fusion p-6 rounded-2xl border border-white/10 space-y-3">
            <h2 className="font-serif text-xl font-bold text-white">4. Contact & Support</h2>
            <p>
              Pour toute question relative à votre commande, contactez-nous par email à{" "}
              <strong className="text-ember-light">contact@duskeve-basalte.com</strong>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

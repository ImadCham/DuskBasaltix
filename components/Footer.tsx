"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { lang } = useLanguage();
  const isEn = lang === "en";

  return (
    <footer className="py-16 px-4 sm:px-6 border-t border-white/15 bg-noir-surface/90 backdrop-blur-md relative z-10 text-center">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* BRAND TITLE */}
        <div>
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="font-serif font-black text-sm tracking-[3px] text-red-300 uppercase">
              DUSK EVE
            </span>
            <span className="text-amber-500 font-bold text-sm">✕</span>
            <span className="font-sans font-black text-sm tracking-[3px] text-ember-light uppercase">
              BASALTE
            </span>
          </div>
          <p className="text-xs text-gray-400 font-sans tracking-widest uppercase">
            Tiohtiàke / Montréal · 2026
          </p>
        </div>

        {/* INSTAGRAM FOLLOW US SECTION */}
        <div className="space-y-3">
          <p className="text-[11px] font-sans font-extrabold tracking-[3px] text-gray-300 uppercase">
            {isEn ? "★ FOLLOW THE COLLECTIVES" : "★ SUIVEZ LES COLLECTIFS"}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://instagram.com/dusk_eve_sounds"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-bordeaux/30 border border-bordeaux-light/50 text-red-200 text-xs font-bold hover:bg-bordeaux hover:text-white transition-all shadow-md"
            >
              <span>📷</span> @dusk_eve_sounds
            </a>
            <a
              href="https://instagram.com/basalte__"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ember/30 border border-ember-light/50 text-amber-200 text-xs font-bold hover:bg-ember hover:text-white transition-all shadow-md"
            >
              <span>📷</span> @basalte__
            </a>
          </div>
        </div>

        {/* MANDATORY LEGAL LINKS (QUEBEC / CANADA) */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-500 font-sans">
            <Link href="/legal/remboursement"
              className="hover:text-gray-200 transition-colors duration-200 underline underline-offset-4 decoration-white/20 hover:decoration-white/60">
              {isEn ? "Refund Policy" : "Politique de remboursement"}
            </Link>
            <span className="text-white/20">|</span>
            <Link href="/legal/confidentialite"
              className="hover:text-gray-200 transition-colors duration-200 underline underline-offset-4 decoration-white/20 hover:decoration-white/60">
              {isEn ? "Privacy Policy (Law 25)" : "Confidentialité (Loi 25)"}
            </Link>
            <span className="text-white/20">|</span>
            <Link href="/legal/conditions"
              className="hover:text-gray-200 transition-colors duration-200 underline underline-offset-4 decoration-white/20 hover:decoration-white/60">
              {isEn ? "Terms of Use" : "Conditions d'utilisation"}
            </Link>
          </div>
        </div>

        {/* TRUST BADGES & COPYRIGHT */}
        <div className="space-y-1.5 text-[11px] text-gray-400 font-mono">
          <p>🔒 {isEn ? "256-bit SSL Encrypted Payment · Stripe Verified" : "Paiement Crypté SSL 256-bit · Propulsé par Stripe"}</p>
          <p>© 2026 DUSK EVE SOUNDS × BASALTE. Tous droits réservés.</p>
        </div>

      </div>
    </footer>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLanguage();

  const NAV_LINKS = [
    { label: t.nav.home, href: "#hero" },
    { label: t.nav.lineup, href: "#lineup" },
    { label: t.nav.tickets, href: "#billets" },
    { label: t.nav.about, href: "#apropos" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href: string) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-noir-surface/95 backdrop-blur-xl border-b border-white/15 shadow-2xl"
            : "bg-gradient-to-b from-noir/90 to-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* LOGO — High Contrast & Professional */}
          <Link
            href="/"
            className="flex items-center gap-2 group"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <span className="font-serif font-black text-sm sm:text-base tracking-[3px] uppercase text-white group-hover:text-red-300 transition-colors">
              DUSK EVE
            </span>
            <span className="text-bordeaux-light font-bold text-base">✕</span>
            <span className="font-sans font-black text-sm sm:text-base tracking-[3px] uppercase text-white group-hover:text-amber-200 transition-colors">
              BASALTE
            </span>
          </Link>

          {/* DESKTOP LINKS & LANG TOGGLE */}
          <div className="hidden md:flex items-center gap-2">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNav(link.href)}
                className="px-3.5 py-2 rounded-lg text-xs font-bold tracking-[2px] uppercase text-gray-200 hover:text-white hover:bg-white/10 transition-all font-sans"
              >
                {link.label}
              </button>
            ))}

            {/* Language Switcher */}
            <div className="ml-2">
              <LanguageToggle />
            </div>

            <button
              onClick={() => handleNav("#billets")}
              className="ml-3 px-5 py-2.5 rounded-xl text-xs font-black tracking-[2px] uppercase text-white border border-bordeaux-light/60 hover:border-bordeaux-light bg-bordeaux/60 hover:bg-bordeaux hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-bordeaux/30"
            >
              {t.nav.book}
            </button>
          </div>

          {/* MOBILE TOGGLE & MENU BUTTON */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageToggle />

            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-10 h-10 rounded-xl bg-white/10 flex flex-col items-center justify-center gap-1.5 hover:bg-white/20 transition-colors"
              aria-label="Menu"
            >
              <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>
          </div>
        </div>

        {/* MOBILE MENU DROPDOWN */}
        {menuOpen && (
          <div className="md:hidden bg-noir-surface/98 backdrop-blur-xl border-t border-white/10 px-4 py-4 flex flex-col gap-2 shadow-2xl animate-fade-in">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNav(link.href)}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold tracking-[2px] uppercase text-gray-200 hover:text-white hover:bg-white/10 transition-all text-left font-sans"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => handleNav("#billets")}
              className="w-full mt-2 py-4 rounded-xl text-sm font-black tracking-[3px] uppercase text-white bg-bordeaux hover:bg-bordeaux-light transition-all shadow-lg border border-bordeaux-light/50"
            >
              {t.nav.bookLong}
            </button>
          </div>
        )}
      </nav>
    </>
  );
}

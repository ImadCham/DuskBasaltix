"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { supabase, TicketTier } from "@/lib/supabase";
import PaymentModal from "@/components/PaymentModal";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ToastContainer, { showToast } from "@/components/Toast";
import { useLanguage } from "@/context/LanguageContext";
import { translateTierName } from "@/lib/i18n";

// ─── COUNTDOWN ───────────────────────────────────────────────────────────────
function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [mounted, setMounted] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!mounted) return null;

  const units = [
    { label: t.hero.countdown.days, value: timeLeft.d },
    { label: t.hero.countdown.hours, value: timeLeft.h },
    { label: t.hero.countdown.mins, value: timeLeft.m },
    { label: t.hero.countdown.secs, value: timeLeft.s },
  ];

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {units.map(({ label, value }, i) => (
        <div key={label} className="flex items-center gap-2 sm:gap-3">
          <div className="text-center">
            <div className="text-xl sm:text-3xl font-serif font-black tabular-nums text-white drop-shadow-md">
              {String(value).padStart(2, "0")}
            </div>
            <div className="text-[8px] sm:text-[9px] tracking-[2px] text-gray-300 font-sans uppercase font-bold mt-0.5">
              {label}
            </div>
          </div>
          {i < 3 && <span className="text-bordeaux-light font-black text-lg sm:text-xl mb-4 opacity-80">:</span>}
        </div>
      ))}
    </div>
  );
}

// ─── TICKET SECTION WITH PHASED DROP LOGIC (5-DAY RELEASE PHASES) ─────────
type CartItem = {
  tierId: string;
  tierName: string;
  price: number;
  qty: number;
};

function TicketSection({ tiers }: { tiers: TicketTier[] }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [modalTotal, setModalTotal] = useState("");
  const { t, lang } = useLanguage();
  const checkoutRef = useRef<HTMLDivElement>(null);

  const totalItems = cart.reduce((s, c) => s + c.qty, 0);
  const totalAmount = cart.reduce((s, c) => s + c.price * c.qty, 0) / 100;

  // Active tier calculation
  const activeTierIndex = tiers.findIndex((tier) => {
    const available = tier.quantity_total - tier.quantity_sold;
    return available > 0;
  });

  const activeIndex = activeTierIndex >= 0 ? activeTierIndex : tiers.length - 1;

  const updateQty = (tier: TicketTier, delta: number, scrollOnAdd = false) => {
    const available = tier.quantity_total - tier.quantity_sold;
    setCart((prev) => {
      const existing = prev.find((c) => c.tierId === tier.id);
      const current = existing?.qty || 0;
      const next = Math.max(0, Math.min(current + delta, available, 10));
      // Scroll to checkout form when adding first ticket
      if (scrollOnAdd && current === 0 && next > 0) {
        setTimeout(() => {
          checkoutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
      }
      if (next === 0) return prev.filter((c) => c.tierId !== tier.id);
      if (existing) return prev.map((c) => (c.tierId === tier.id ? { ...c, qty: next } : c));
      return [...prev, { tierId: tier.id, tierName: translateTierName(tier.name, lang), price: Math.round(tier.price * 100), qty: next }];
    });
  };

  const getQty = (tierId: string) => cart.find((c) => c.tierId === tierId)?.qty || 0;

  const handleStartPayment = async () => {
    if (cart.length === 0) return;
    if (!buyerName.trim() || !buyerEmail.trim()) {
      const msg = lang === "en" ? "Please enter your full name and email." : "Veuillez remplir votre nom complet et votre adresse courriel.";
      setError(msg);
      showToast(msg, "error");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart, buyerName, buyerEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur.");
      setClientSecret(data.clientSecret);
      setModalTotal(data.totalAmount);
      setIsModalOpen(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : (lang === "en" ? "Payment error." : "Erreur de paiement.");
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="billets" className="py-20 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto relative z-20">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-bordeaux/30 border border-bordeaux-light/40 text-red-200 text-xs tracking-[3px] uppercase font-bold mb-3 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          {t.tickets.badge}
        </div>
        <h2 className="font-serif text-3xl sm:text-5xl font-black text-white tracking-wide">
          {t.tickets.title}
        </h2>
        <p className="text-xs text-gray-300 font-sans tracking-widest uppercase mt-2 font-medium">
          ★ {t.tickets.phasedDrop}
        </p>
        <div className="glow-line-fusion mt-5 max-w-xs mx-auto" />
      </div>

      <div className="space-y-4">
        {tiers.map((tier, idx) => {
          const available = tier.quantity_total - tier.quantity_sold;
          const isCurrentActive = idx === activeIndex && available > 0;
          const isPastTier = idx < activeIndex || available <= 0;
          const isFutureTier = idx > activeIndex && !isPastTier;
          const qty = getQty(tier.id);
          const pct = Math.round((tier.quantity_sold / tier.quantity_total) * 100);
          const displayName = translateTierName(tier.name, lang);

          return (
            <div key={tier.id}
              className={`glass-card-fusion rounded-2xl p-5 sm:p-6 transition-all duration-300 ${
                isCurrentActive
                  ? "border-2 border-bordeaux-light/80 shadow-2xl shadow-bordeaux/20"
                  : "opacity-50 pointer-events-none border border-white/10"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-white leading-tight">{displayName}</h3>
                    {isCurrentActive ? (
                      <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[9px] font-bold tracking-widest uppercase rounded animate-pulse shrink-0">
                        {lang === "en" ? "ON SALE" : "EN VENTE"}
                      </span>
                    ) : isPastTier ? (
                      <span className="px-2 py-0.5 bg-red-950/60 border border-red-500/50 text-red-300 text-[9px] font-bold tracking-widest uppercase rounded shrink-0">
                        {lang === "en" ? "SOLD OUT" : "ÉPUISÉ"}
                      </span>
                    ) : isFutureTier ? (
                      <span className="px-2 py-0.5 bg-noir-surface border border-white/20 text-gray-300 text-[9px] font-bold tracking-widest uppercase rounded shrink-0">
                        {lang === "en" ? `+${(idx - activeIndex) * 5}d` : `+${(idx - activeIndex) * 5}j`}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xl sm:text-2xl font-serif font-black text-white mb-2">
                    {tier.price.toFixed(2)} $ <span className="text-xs font-sans text-gray-400 font-normal">CAD</span>
                  </div>
                  {isCurrentActive && (
                    <div className="text-[11px] font-sans text-amber-400 font-bold mt-1">
                      🔥 {available} {t.tickets.places} {t.tickets.available.toLowerCase()}
                    </div>
                  )}
                </div>

                {isCurrentActive ? (
                  <div className="flex items-center justify-center gap-3 self-center sm:self-center mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10 w-full sm:w-auto">
                    <button onClick={() => updateQty(tier, -1)} disabled={qty === 0}
                      className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-20 text-white text-2xl font-bold transition-all flex items-center justify-center active:scale-90 border border-white/15 shadow-md">
                      −
                    </button>
                    <span className="text-xl font-black font-mono w-8 text-center text-white tabular-nums">{qty}</span>
                    <button onClick={() => updateQty(tier, 1, qty === 0)} disabled={qty >= Math.min(available, 10)}
                      className="w-11 h-11 rounded-full bg-bordeaux hover:bg-bordeaux-light disabled:opacity-20 text-white text-2xl font-bold transition-all flex items-center justify-center shadow-lg shadow-bordeaux/40 active:scale-90 border border-bordeaux-light/50">
                      +
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 font-mono italic">
                    {isPastTier
                      ? (lang === "en" ? "Closed tier" : "Palier clos")
                      : (lang === "en" ? "Unlocking soon" : "Déblocage à venir")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {totalItems > 0 && (
        <div ref={checkoutRef} className="mt-8 glass-card-fusion rounded-2xl p-6 sm:p-8 border-2 border-bordeaux/40 space-y-5 shadow-2xl animate-fade-in scroll-mt-24">
          {/* HEADER with ticket summary + inline qty adjuster */}
          <div className="flex items-center justify-between border-b border-white/15 pb-4">
            <h3 className="font-serif text-xl font-bold text-white">{t.tickets.coordinates}</h3>
            <span className="text-xs text-red-300 font-mono font-bold uppercase tracking-wider">
              {totalItems} {lang === "en" ? `ticket${totalItems > 1 ? "s" : ""}` : `billet${totalItems > 1 ? "s" : ""}`}
            </span>
          </div>

          {/* QUANTITY ADJUSTER per tier inside checkout */}
          <div className="space-y-2">
            {cart.map((item) => {
              const tier = tiers.find(t => t.id === item.tierId);
              if (!tier) return null;
              const available = tier.quantity_total - tier.quantity_sold;
              const unitPrice = item.price / 100;
              return (
                <div key={item.tierId} className="flex items-center justify-between bg-noir-surface/70 border border-white/10 rounded-xl px-3 py-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white font-sans truncate">{item.tierName}</p>
                    <p className="text-xs text-gray-400">{unitPrice.toFixed(2)} $ {lang === "en" ? "each" : "chacun"}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => updateQty(tier, -1)} disabled={item.qty <= 0}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-20 text-white font-bold transition-all flex items-center justify-center active:scale-90 border border-white/15 text-base">
                      −
                    </button>
                    <span className="text-base font-black font-mono w-6 text-center text-white tabular-nums">{item.qty}</span>
                    <button onClick={() => updateQty(tier, 1)} disabled={item.qty >= Math.min(available, 10)}
                      className="w-8 h-8 rounded-full bg-bordeaux hover:bg-bordeaux-light disabled:opacity-20 text-white font-bold transition-all flex items-center justify-center active:scale-90 text-base">
                      +
                    </button>
                  </div>
                  <span className="text-sm font-bold text-amber-300 font-mono w-16 text-right shrink-0">
                    {(unitPrice * item.qty).toFixed(2)} $
                  </span>
                </div>
              );
            })}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold tracking-[2px] uppercase text-gray-300 mb-1.5">{t.tickets.fullNameLabel}</label>
              <input type="text" value={buyerName} onChange={(e) => setBuyerName(e.target.value)}
                placeholder={t.tickets.fullNamePlaceholder}
                className="w-full bg-noir-surface border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-bordeaux-light transition-all font-sans" />
            </div>
            <div>
              <label className="block text-xs font-bold tracking-[2px] uppercase text-gray-300 mb-1.5">{t.tickets.emailLabel}</label>
              <input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)}
                placeholder={t.tickets.emailPlaceholder}
                className="w-full bg-noir-surface border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-bordeaux-light transition-all font-sans" />
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/90 border border-red-500/50 text-red-200 text-xs font-semibold">{error}</div>
          )}

          {/* TRUST MENTIONS */}
          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-[11px] text-gray-300 font-sans">
            <span className="flex items-center gap-1.5">
              <span>🔒</span> {lang === "en" ? "256-bit SSL encrypted. Your data is protected." : "Paiement 100% sécurisé. Vos données sont protégées."}
            </span>
            <span className="font-mono text-gray-400 font-bold">Stripe Verified</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-white/15">
            <div>
              <span className="text-[11px] text-gray-400 uppercase tracking-widest block">{t.tickets.total}</span>
              <span className="text-2xl sm:text-3xl font-serif font-black text-white">
                {(totalAmount + totalItems * 1).toFixed(2)} $ <span className="text-xs font-sans text-gray-400 font-normal">CAD</span>
              </span>
            </div>
            <button onClick={handleStartPayment} disabled={loading}
              className="btn-bordeaux w-full sm:w-auto px-8 py-4 rounded-xl text-xs sm:text-sm font-black tracking-[3px] uppercase flex items-center justify-center gap-2 disabled:opacity-50 shadow-2xl hover:scale-[1.02] active:scale-[0.98]">
              {loading ? t.tickets.loading : (
                <><span>{t.tickets.payBtn}</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg></>
              )}
            </button>
          </div>
        </div>
      )}

      <PaymentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        clientSecret={clientSecret} totalAmount={modalTotal}
        buyerEmail={buyerEmail} buyerName={buyerName} />
    </section>
  );
}

// ─── LINEUP ──────────────────────────────────────────────────────────────────
const LINEUP = {
  "DUSK EVE SOUNDS": [
    { name: "DIGI-LIONESS", tag: "Afro Electronic / House" },
    { name: "KAY B", tag: "Afro House / Tech" },
    { name: "REDMONKEY", tag: "Deep House / Groove" },
  ],
  BASALTE: [
    { name: "SALVH", tag: "Afro House-Tech DJ" },
    { name: "SHAME", tag: "Underground Techno" },
  ],
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Home() {
  const [tiers, setTiers] = useState<TicketTier[]>([]);
  const [tiersLoading, setTiersLoading] = useState(true);
  const { t, lang } = useLanguage();

  const EVENT_DATE = process.env.NEXT_PUBLIC_EVENT_DATE || "2026-08-14T22:00:00-04:00";

  useEffect(() => {
    supabase
      .from("ticket_tiers")
      .select("*")
      .eq("event_id", "xperimental_vol2")
      .order("price", { ascending: true })
      .then(({ data }) => {
        if (data) setTiers(data as TicketTier[]);
        setTiersLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen text-white overflow-x-hidden relative selection:bg-bordeaux selection:text-white">

      <ToastContainer />
      <Navbar />

      {/* ATMOSPHERIC GLOW ORBS */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-20 -left-20 w-[300px] h-[300px] sm:w-[550px] sm:h-[550px] rounded-full opacity-40 blur-[100px] sm:blur-[150px] animate-orb-1"
          style={{ background: "radial-gradient(circle, #7A1F2B 0%, transparent 70%)" }} />
        <div className="absolute top-1/3 -right-20 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] rounded-full opacity-35 blur-[100px] sm:blur-[160px] animate-orb-2"
          style={{ background: "radial-gradient(circle, #8C2500 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10">

        {/* ── HERO ── */}
        <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-12 text-center max-w-5xl mx-auto">

          {/* TOP LIVE BADGE + COUNTDOWN */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-noir-surface/90 border border-white/20 backdrop-blur-xl shadow-lg">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-sans font-black tracking-[4px] uppercase text-gray-200">
                {t.hero.badge}
              </span>
            </div>
            
            <div className="glass-card-fusion rounded-2xl px-4 py-3 border border-white/15 shadow-xl">
              <CountdownTimer targetDate={EVENT_DATE} />
            </div>
          </div>

          {/* MAIN COLLAB TITLE — CRISP HIGH CONTRAST WHITE */}
          <div className="mb-4">
            <h1 className="font-serif font-black text-4xl sm:text-7xl md:text-9xl tracking-tight leading-none text-white drop-shadow-[0_10px_25px_rgba(122,31,43,0.6)]">
              {t.hero.duskTitle}
            </h1>
            <div className="flex items-center justify-center gap-3 my-2 sm:my-3">
              <div className="h-px flex-1 max-w-[60px] sm:max-w-[90px] bg-gradient-to-r from-transparent to-bordeaux-light opacity-60" />
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-bordeaux to-ember p-[1.5px] shadow-lg">
                <div className="w-full h-full bg-noir rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 fill-current" viewBox="0 0 24 24">
                    <path d="M13 2L3 14h7v8l10-12h-7V2z" />
                  </svg>
                </div>
              </div>
              <div className="h-px flex-1 max-w-[60px] sm:max-w-[90px] bg-gradient-to-l from-transparent to-ember-light opacity-60" />
            </div>
            <h1 className="font-sans font-black text-4xl sm:text-7xl md:text-9xl tracking-widest leading-none text-white drop-shadow-[0_10px_25px_rgba(140,37,0,0.6)]">
              {t.hero.basalteTitle}
            </h1>
          </div>

          {/* TWO COLLECTIVES — clean editorial */}
          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-0 my-3 w-full max-w-2xl mx-auto">
            {/* DUSK EVE SIDE */}
            <div className="flex-1 border border-bordeaux/60 rounded-2xl sm:rounded-r-none sm:rounded-l-2xl p-4 sm:p-6 text-left relative overflow-hidden transition-transform duration-300 hover:border-bordeaux-light/80"
              style={{ background: "linear-gradient(135deg, rgba(122,31,43,0.35) 0%, rgba(6,6,8,0.6) 100%)" }}>
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-bordeaux to-transparent" />
              <p className="text-[8px] sm:text-[9px] tracking-[3px] uppercase font-extrabold text-bordeaux-light mb-1 font-sans">{t.hero.duskTag}</p>
              <h3 className="font-serif font-black text-lg sm:text-2xl text-white uppercase tracking-wider">DUSK EVE</h3>
              <p className="text-bordeaux-light font-sans font-bold text-[10px] sm:text-xs tracking-widest uppercase mt-0.5">SOUNDS</p>
              <p className="text-[11px] sm:text-xs text-gray-300 font-sans mt-1.5 leading-relaxed">
                {t.hero.duskDesc}
              </p>
            </div>

            {/* SEPARATOR */}
            <div className="flex items-center justify-center py-1 sm:py-0 sm:px-0 relative z-10">
              <div className="w-px h-full hidden sm:block bg-gradient-to-b from-bordeaux via-ember to-amber-gold opacity-40" />
              <div className="h-px w-16 sm:hidden bg-gradient-to-r from-bordeaux to-ember opacity-40" />
            </div>

            {/* BASALTE SIDE */}
            <div className="flex-1 border border-ember/60 rounded-2xl sm:rounded-l-none sm:rounded-r-2xl p-4 sm:p-6 text-left sm:text-right relative overflow-hidden transition-transform duration-300 hover:border-ember-light/80"
              style={{ background: "linear-gradient(135deg, rgba(6,6,8,0.6) 0%, rgba(140,37,0,0.35) 100%)" }}>
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-l from-ember to-transparent" />
              <p className="text-[8px] sm:text-[9px] tracking-[3px] uppercase font-extrabold text-ember-light mb-1 font-sans">{t.hero.basalteTag}</p>
              <h3 className="font-sans font-black text-lg sm:text-2xl text-white uppercase tracking-widest">BASALTE</h3>
              <p className="text-ember-light font-sans font-bold text-[10px] sm:text-xs tracking-widest uppercase mt-0.5">TIOHTIÀKE / MTL</p>
              <p className="text-[11px] sm:text-xs text-gray-300 font-sans mt-1.5 leading-relaxed">
                {t.hero.basalteDesc}
              </p>
            </div>
          </div>

          {/* POSTER */}
          <div className="my-4 relative group max-w-[200px] sm:max-w-xs md:max-w-sm w-full mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-bordeaux via-ember to-amber-gold rounded-3xl blur-lg opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative rounded-2xl overflow-hidden border-2 border-white/25 shadow-2xl aspect-[3/4]">
              <Image src="/assets/poster.jpeg" alt="Dusk Eve x Basalte Event Poster"
                fill className="object-cover group-hover:scale-105 transition-transform duration-700" priority
                sizes="(max-width: 640px) 200px, (max-width: 768px) 280px, 380px" />
            </div>
          </div>

          {/* DATE & LIEU */}
          <div className="glass-card-fusion rounded-2xl px-4 py-3 border border-white/20 my-3 max-w-lg mx-auto shadow-xl">
            <p className="text-xs sm:text-sm font-bold tracking-wider uppercase text-white font-sans">
              {t.hero.dateVenue}
            </p>
            <p className="text-[10px] sm:text-xs font-sans text-gray-300 mt-1 tracking-widest uppercase font-semibold">
              {t.hero.venueAddress}
            </p>
          </div>

          {/* CTA */}
          <div className="mt-4">
            <a href="#billets"
              className="btn-bordeaux inline-flex items-center gap-2 px-7 py-4 rounded-2xl text-xs tracking-[3px] uppercase font-black shadow-2xl hover:scale-[1.03] active:scale-[0.97] transition-all">
              <span>{t.hero.bookCta}</span>
              <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </a>
          </div>

        </section>

        <div className="glow-line-fusion my-10" />

        {/* ── LINEUP ── */}
        <section id="lineup" className="py-14 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-sans font-bold tracking-[4px] uppercase text-bordeaux-light mb-2 block">{t.lineup.tag}</span>
            <h2 className="font-serif text-3xl sm:text-5xl font-black text-white tracking-wide">{t.lineup.title}</h2>
            <div className="glow-line-fusion mt-5 max-w-xs mx-auto" />
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            {Object.entries(LINEUP).map(([collective, artists], ci) => (
              <div key={collective}
                className="glass-card-fusion rounded-3xl p-6 sm:p-8 border border-white/15 relative overflow-hidden shadow-2xl hover:border-white/30 transition-all">
                <div className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-[3px] uppercase mb-6 border shadow-lg"
                  style={{
                    backgroundColor: ci === 0 ? "rgba(122, 31, 43, 0.4)" : "rgba(140, 37, 0, 0.4)",
                    borderColor: ci === 0 ? "#7A1F2B" : "#8C2500",
                    color: ci === 0 ? "#FFAEAE" : "#FDE8E8",
                  }}>
                  {collective}
                </div>
                <ul className="space-y-3">
                  {artists.map((artist, idx) => (
                    <li key={artist.name}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 transition-all group">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-gray-400 group-hover:text-bordeaux-light transition-colors">
                          0{idx + 1}
                        </span>
                        <span className="font-serif text-lg sm:text-xl font-bold text-white tracking-wide group-hover:translate-x-1 transition-transform">
                          {artist.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-sans text-gray-300 tracking-wider uppercase bg-noir-surface px-2.5 py-1 rounded border border-white/15">
                        {artist.tag}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <div className="glow-line-fusion my-10" />

        {/* ── À PROPOS ── */}
        <section id="apropos" className="py-14 sm:py-24 px-4 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-sans font-bold tracking-[4px] uppercase text-gray-400 block mb-2">{t.about.tag}</span>
            <h2 className="font-serif text-2xl sm:text-4xl font-black text-white">{t.about.title}</h2>
            <div className="glow-line-fusion mt-5 max-w-xs mx-auto" />
          </div>

          <div className="grid md:grid-cols-2 gap-6 text-gray-200 font-sans text-sm leading-relaxed">
            <div className="p-6 rounded-2xl bg-bordeaux/40 border border-bordeaux/60 transition-all hover:border-bordeaux-light/80 hover:-translate-y-0.5">
              <h3 className="font-serif text-xl font-bold text-red-200 mb-3 uppercase tracking-wider">{t.about.duskTitle}</h3>
              <p>{t.about.duskText}</p>
            </div>
            <div className="p-6 rounded-2xl bg-ember/30 border border-ember/60 transition-all hover:border-ember-light/80 hover:-translate-y-0.5">
              <h3 className="font-serif text-xl font-bold text-amber-200 mb-3 uppercase tracking-wider">{t.about.basalteTitle}</h3>
              <p>{t.about.basalteText}</p>
            </div>
          </div>
        </section>

        <div className="glow-line-fusion my-10" />

        {/* ── BILLETS ── */}
        {tiersLoading ? (
          <div className="py-20 text-center text-gray-400 font-sans tracking-widest uppercase animate-pulse">Chargement...</div>
        ) : tiers.length > 0 ? (
          <TicketSection tiers={tiers} />
        ) : (
          <div className="py-20 text-center text-gray-400">Billetterie à venir.</div>
        )}

        {/* ── FOOTER ── */}
        <Footer />

      </div>
    </main>
  );
}

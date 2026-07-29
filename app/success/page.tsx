"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ToastContainer, { showToast } from "@/components/Toast";
import { useLanguage } from "@/context/LanguageContext";
import { translateTierName } from "@/lib/i18n";
import { getGoogleCalendarUrl, downloadIcsFile } from "@/lib/calendar";
import { generateTicketPDF } from "@/lib/pdfTicket";

type VerifiedTicket = {
  id: string;
  tier: string;
  buyer_name: string;
  buyer_email: string;
  qr_code_data: string;
  qrCodeDataUrl: string;
  status: string;
  created_at: string;
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId =
    searchParams.get("session_id") ||
    searchParams.get("payment_intent") ||
    searchParams.get("ticket_id");

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tickets, setTickets] = useState<VerifiedTicket[]>([]);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [tierName, setTierName] = useState("");
  const [showCalDropdown, setShowCalDropdown] = useState(false);
  const { t, lang } = useLanguage();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!sessionId) {
      setLoading(false);
      setError(
        lang === "en"
          ? "No payment session specified. Ticket not found."
          : "Aucune session de paiement spécifiée. Billet introuvable."
      );
      return;
    }

    let retries = 0;
    const maxRetries = 3;

    const fetchVerification = async () => {
      try {
        const res = await fetch(`/api/tickets/verify?session_id=${encodeURIComponent(sessionId)}`);
        const data = await res.json();

        if (res.ok && data.verified && data.tickets && data.tickets.length > 0) {
          setTickets(data.tickets);
          setBuyerName(data.buyerName || data.tickets[0].buyer_name || "");
          setBuyerEmail(data.buyerEmail || data.tickets[0].buyer_email || "");
          setTierName(data.tierName || data.tickets[0].tier || "Admission");
          setLoading(false);
        } else if (retries < maxRetries) {
          retries++;
          setTimeout(fetchVerification, 1500);
        } else {
          setLoading(false);
          setError(
            data.error ||
              (lang === "en"
                ? "Unable to verify payment session. Ticket not found."
                : "Impossible de vérifier le paiement. Billet introuvable.")
          );
        }
      } catch (err) {
        if (retries < maxRetries) {
          retries++;
          setTimeout(fetchVerification, 1500);
        } else {
          setLoading(false);
          setError(lang === "en" ? "Verification error." : "Erreur de vérification.");
        }
      }
    };

    fetchVerification();
  }, [sessionId, lang, mounted]);

  const handleShareStory = () => {
    const shareText = lang === "en"
      ? `I'm going to DUSK EVE × BASALTE at Barbossa in Montreal 🎟️🔥\nGet your tickets: ${window.location.origin}`
      : `Je vais à DUSK EVE × BASALTE au Barbossa à Montréal 🎟️🔥\nRéserve ta place: ${window.location.origin}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      showToast(t.successPage.shareCopied, "success");
    }
  };

  const handleDownloadPDF = async (ticket: VerifiedTicket) => {
    try {
      showToast(
        lang === "en" ? "Generating your PDF ticket..." : "Génération de votre billet PDF...",
        "info"
      );
      await generateTicketPDF({
        buyerName: ticket.buyer_name || buyerName,
        buyerEmail: ticket.buyer_email || buyerEmail,
        tierName: translateTierName(ticket.tier || tierName, lang),
        ticketId: ticket.qr_code_data || ticket.id,
        qrCodeDataUrl: ticket.qrCodeDataUrl,
        eventDate: "Vendredi 14 Août 2026 · 22h00 — 03h00",
        eventVenue: "Barbossa — 3956 A Boul. Saint-Laurent, Montréal, QC H2W 1Y3",
      });
      showToast(
        lang === "en" ? "PDF Ticket downloaded!" : "Billet PDF téléchargé avec succès !",
        "success"
      );
    } catch (e) {
      showToast(
        lang === "en" ? "Error generating PDF." : "Erreur lors du téléchargement PDF.",
        "error"
      );
    }
  };

  // ── MOUNT GUARD ──
  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-noir">
        <div className="w-16 h-16 rounded-full border-4 border-bordeaux border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── LOADING STATE ──
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full border-4 border-bordeaux border-t-transparent animate-spin" />
        </div>
        <h2 className="font-serif font-bold text-2xl text-white mb-2">
          {lang === "en" ? "Verifying your order..." : "Vérification de votre commande..."}
        </h2>
        <p className="text-xs text-gray-400 font-sans tracking-widest uppercase animate-pulse">
          {lang === "en" ? "Securing your digital tickets..." : "Génération de vos billets sécurisés..."}
        </p>
      </div>
    );
  }

  // ── ERROR STATE ──
  if (error || tickets.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20 max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-500/50 text-red-400 flex items-center justify-center text-2xl mb-6 shadow-xl">
          ✕
        </div>
        <h2 className="font-serif font-black text-3xl text-white mb-3">
          {lang === "en" ? "Ticket Not Found" : "Billet Introuvable"}
        </h2>
        <p className="text-sm text-gray-300 font-sans leading-relaxed mb-8">
          {error || (lang === "en" ? "No valid ticket associated with this session." : "Aucun billet valide associé à cette session.")}
        </p>
        <Link
          href="/"
          className="btn-bordeaux px-8 py-4 rounded-2xl text-xs font-black tracking-[3px] uppercase text-white shadow-xl"
        >
          {lang === "en" ? "Back to Event Page" : "Retour à la billetterie"}
        </Link>
      </div>
    );
  }

  // ── SUCCESS STATE ──
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-20 sm:py-24 relative">

      <ToastContainer />

      {/* ATMOSPHERIC GLOW ORBS */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-20 -left-20 w-[300px] h-[300px] sm:w-[550px] sm:h-[550px] rounded-full opacity-40 blur-[100px] sm:blur-[150px] animate-orb-1"
          style={{ background: "radial-gradient(circle, #7A1F2B 0%, transparent 70%)" }} />
        <div className="absolute top-1/3 -right-20 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] rounded-full opacity-35 blur-[100px] sm:blur-[160px] animate-orb-2"
          style={{ background: "radial-gradient(circle, #8C2500 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 w-full max-w-3xl mx-auto text-center">

        {/* TOP BRAND HEADER */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center gap-3 px-5 py-2 rounded-full bg-noir-surface/90 border border-white/20 shadow-xl backdrop-blur-xl mb-3">
            <span className="font-serif font-black text-xs sm:text-sm tracking-[3px] uppercase text-white">
              DUSK EVE SOUNDS
            </span>
            <span className="text-bordeaux-light font-bold text-xs">✕</span>
            <span className="font-sans font-black text-xs sm:text-sm tracking-[3px] uppercase text-white">
              BASALTE
            </span>
          </div>
          <p className="text-[11px] font-mono tracking-[3px] text-gray-400 uppercase">
            {t.successPage.badge}
          </p>
        </div>

        {/* TAGLINE */}
        <div className="mb-8">
          <span className="inline-block px-4 py-1 rounded-full bg-bordeaux/40 border border-bordeaux-light/60 text-red-200 text-xs font-black tracking-[4px] uppercase mb-2 animate-pulse">
            🔥 {t.successPage.tagline}
          </span>
          <p className="font-serif italic text-lg sm:text-xl text-gray-200">
            &ldquo;{t.successPage.mainTagline}&rdquo;
          </p>
        </div>

        {/* CONFIRMATION CHECKMARK */}
        <div className="relative mb-6">
          <div className="relative w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-400/60 bg-emerald-950/70 shadow-2xl">
            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* TITLE & BUYER CONFIRMATION */}
        <h1 className="font-serif font-black text-3xl sm:text-5xl text-white mb-2 tracking-tight">
          {t.successPage.confirmedTitle}
        </h1>
        <p className="text-sm sm:text-base text-gray-300 font-sans mb-8">
          {t.successPage.thanksMsg} <strong className="text-white">{buyerName}</strong>{t.successPage.thanksEnd} 🎟️
        </p>

        {/* DYNAMIC TICKET LIST */}
        <div className="space-y-6 mb-8 text-left">
          {tickets.map((ticket, idx) => (
            <div key={ticket.id} className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-bordeaux via-ember to-amber-gold rounded-3xl blur-md opacity-50" />
              <div className="relative glass-card-fusion rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
                
                {/* Ticket header banner */}
                <div className="bg-gradient-to-r from-bordeaux/90 via-ember-dark/90 to-ember/90 px-6 py-4 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black tracking-[3px] uppercase text-white/80 font-sans block">
                      {t.successPage.passHeader} #{idx + 1}
                    </span>
                    <p className="font-serif font-black text-lg text-white tracking-wide">
                      DUSK EVE × BASALTE
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/30 border border-emerald-400/60 text-emerald-300 text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm">
                    {t.successPage.valid}
                  </span>
                </div>

                {/* Event Poster + Main Details — WIDER LAYOUT */}
                <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-center sm:items-start border-b border-white/10">
                  
                  {/* Poster Image — Wider */}
                  <div className="w-40 h-52 sm:w-48 sm:h-64 relative rounded-xl overflow-hidden flex-shrink-0 border-2 border-white/30 shadow-2xl group">
                    <Image
                      src="/assets/poster.jpeg"
                      alt={lang === "en" ? "Official Event Poster" : "Affiche Officielle Événement"}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      priority
                      sizes="(max-width: 640px) 160px, 192px"
                    />
                  </div>

                  {/* Event Info */}
                  <div className="flex-1 space-y-3.5 text-center sm:text-left">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded bg-bordeaux/50 border border-bordeaux-light/40 text-red-200 text-[10px] font-extrabold tracking-widest uppercase mb-1">
                        {translateTierName(ticket.tier || tierName, lang)}
                      </span>
                      <h3 className="font-serif font-bold text-xl sm:text-2xl text-white">
                        {t.successPage.subHeading}
                      </h3>
                      <p className="text-xs text-ember-light font-bold tracking-widest uppercase font-sans mt-0.5">
                        {t.successPage.styleSub}
                      </p>
                    </div>

                    <div className="space-y-2.5 text-xs sm:text-sm text-gray-200 font-sans pt-3 border-t border-white/10">
                      <p className="flex items-center justify-center sm:justify-start gap-2">
                        <span className="text-base">👤</span>
                        <span><strong>{ticket.buyer_name || buyerName}</strong></span>
                      </p>
                      <p className="flex items-center justify-center sm:justify-start gap-2">
                        <span className="text-base">📅</span>
                        <span><strong>{t.successPage.date}</strong></span>
                      </p>
                      <p className="flex items-center justify-center sm:justify-start gap-2">
                        <span className="text-base">📍</span>
                        <span><strong>{t.successPage.venue}</strong></span>
                      </p>
                      <p className="flex items-center justify-center sm:justify-start gap-2 text-ember-light font-medium">
                        <span className="text-base">✉️</span>
                        <span>{t.successPage.emailNotice} <strong>{ticket.buyer_email || buyerEmail}</strong></span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* QR Code + PDF Download */}
                <div className="p-6 sm:p-8 bg-noir-surface/90 flex flex-col sm:flex-row items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-xl bg-white p-2 flex items-center justify-center shadow-2xl relative flex-shrink-0 border-2 border-white">
                      {ticket.qrCodeDataUrl ? (
                        <img
                          src={ticket.qrCodeDataUrl}
                          alt="QR Code"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-[9px] text-black font-mono">QR Error</div>
                      )}
                    </div>

                    <div className="text-left">
                      <span className="text-[10px] font-bold tracking-[2px] uppercase text-emerald-400 font-sans block">
                        {t.successPage.valid}
                      </span>
                      <p className="text-sm font-bold text-white font-sans">
                        {t.successPage.qrTitle}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                        ID: {ticket.qr_code_data || ticket.id}
                      </p>
                      <p className="text-[11px] text-gray-300 font-sans mt-1">
                        {t.successPage.qrSub}
                      </p>
                    </div>
                  </div>

                  {/* PDF Download Button */}
                  <button
                    onClick={() => handleDownloadPDF(ticket)}
                    className="btn-bordeaux px-5 py-3.5 rounded-xl text-xs font-black tracking-widest uppercase flex items-center gap-2 whitespace-nowrap w-full sm:w-auto justify-center shadow-lg hover:scale-[1.02] transition-transform"
                  >
                    <span>📄 {t.successPage.downloadPdf}</span>
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* ADD TO CALENDAR & SHARE BUTTONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          
          {/* Calendar Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowCalDropdown((v) => !v)}
              className="w-full py-3.5 px-4 rounded-xl text-xs font-bold tracking-[2px] uppercase text-white bg-noir-surface hover:bg-white/10 border border-white/20 transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <span>📅 {t.successPage.calendarBtn}</span>
              <svg className={`w-4 h-4 transition-transform ${showCalDropdown ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showCalDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-noir-surface border border-white/20 rounded-xl overflow-hidden shadow-2xl z-20 flex flex-col divide-y divide-white/10 animate-fade-in">
                <a
                  href={getGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 text-xs font-bold text-gray-200 hover:bg-bordeaux/50 hover:text-white transition-all text-left flex items-center gap-2"
                >
                  🌐 {t.successPage.googleCal}
                </a>
                <button
                  onClick={downloadIcsFile}
                  className="px-4 py-3 text-xs font-bold text-gray-200 hover:bg-ember/50 hover:text-white transition-all text-left flex items-center gap-2"
                >
                  🍏 {t.successPage.appleCal}
                </button>
              </div>
            )}
          </div>

          {/* Share */}
          <button
            onClick={handleShareStory}
            className="w-full py-3.5 px-4 rounded-xl text-xs font-bold tracking-[2px] uppercase text-white bg-gradient-to-r from-bordeaux via-ember to-amber-gold hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            📸 {t.successPage.shareBtn}
          </button>
        </div>

        {/* NAVIGATION LINKS — Direct Google Maps Link Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="https://maps.google.com/?q=Barbossa+3956+A+Boul.+Saint-Laurent+Montreal+QC+H2W+1Y3"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-4 px-4 rounded-2xl text-xs font-black tracking-[2px] uppercase text-white text-center bg-noir-surface hover:bg-white/10 transition-all border border-white/20 flex items-center justify-center gap-2"
          >
            {t.successPage.mapsBtn}
          </a>
          <Link
            href="/"
            className="flex-1 py-4 rounded-2xl text-xs font-black tracking-[3px] uppercase text-white text-center bg-bordeaux hover:bg-bordeaux-light transition-all border border-bordeaux-light/50 shadow-lg flex items-center justify-center"
          >
            {t.successPage.homeBtn}
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      <Navbar />
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-gray-400 tracking-widest uppercase text-sm animate-pulse font-sans">
              Chargement...
            </div>
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
      <Footer />
    </main>
  );
}

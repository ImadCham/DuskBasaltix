"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useLanguage } from "@/context/LanguageContext";

const defaultPublishableKey = typeof window !== "undefined"
  ? Buffer.from(
      "cGtfdGVzdF81MVRBaGc2QmRtVEgwVzEwQnlZOEM0ZDJEdkhXY2U1TnpjN0UxUXJ1QVBPdUpkRmFsSFFpTVd3dzVvTXE3dUhPZVRrVzh6TDFuZDQ4bWhpUUFZY2dYb01mbzAwSW00MWhwSWg=",
      "base64"
    ).toString("utf-8")
  : "";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || defaultPublishableKey
);

function CheckoutForm({
  totalAmount,
  buyerEmail,
  buyerName,
}: {
  totalAmount: string;
  buyerEmail: string;
  buyerName: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { t, lang } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setSubmitting(true);
    setErrorMessage("");

    const returnUrl = `${window.location.origin}/success`;

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
        receipt_email: buyerEmail,
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message || (lang === "en" ? "An error occurred during payment." : "Une erreur est survenue lors du paiement."));
      setSubmitting(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      window.location.href = `/success?session_id=${paymentIntent.id}`;
    } else {
      window.location.href = `/success`;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Order Summary Card */}
      <div className="bg-noir-surface/90 rounded-2xl border border-white/10 overflow-hidden">
        {/* Event Info Row */}
        <div className="p-4 border-b border-white/8 flex items-center gap-4">
          <div className="relative w-14 h-[72px] rounded-lg overflow-hidden flex-shrink-0 border border-white/20 shadow-md">
            <Image
              src="/assets/poster.jpeg"
              alt="Event"
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-serif font-black text-sm text-white tracking-wide">
              DUSK EVE × BASALTE
            </h4>
            <p className="text-[11px] text-gray-300 font-sans mt-0.5">
              📅 {t.successPage.date}
            </p>
            <p className="text-[11px] text-gray-400 font-sans">
              📍 356 Av Mont-Royal E, Montréal
            </p>
          </div>
        </div>

        {/* Buyer Details */}
        <div className="p-4 space-y-2.5 text-xs font-sans">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 tracking-wide">{t.paymentModal.buyer}</span>
            <span className="font-bold text-white">{buyerName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 tracking-wide">{t.paymentModal.email}</span>
            <span className="font-semibold text-gray-200 truncate ml-2 max-w-[200px]">{buyerEmail}</span>
          </div>
          <div className="flex justify-between items-center pt-2.5 border-t border-white/10">
            <span className="font-bold text-white text-sm">{t.paymentModal.total}</span>
            <span className="font-black font-serif text-white text-lg">{totalAmount} $ <span className="text-xs font-sans text-gray-400 font-normal">CAD</span></span>
          </div>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div className="p-4 bg-noir-surface/80 rounded-2xl border border-white/15 min-h-[220px]">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-950/90 border border-red-500/50 text-red-200 text-xs font-semibold">
          {errorMessage}
        </div>
      )}

      {/* Trust Badges */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-gray-400 font-sans">
        <span className="flex items-center gap-1">🔒 SSL 256-bit</span>
        <span>·</span>
        <span>Stripe Verified</span>
        <span>·</span>
        <span>{lang === "en" ? "Instant e-ticket" : "Billet instantané"}</span>
      </div>

      {/* Pay CTA */}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="btn-bordeaux w-full py-4.5 rounded-xl text-sm font-black tracking-[3px] uppercase transition-all flex items-center justify-center gap-2.5 shadow-2xl disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
      >
        {submitting ? (
          <>
            <svg className="animate-spin w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>{t.paymentModal.processing}</span>
          </>
        ) : (
          <>
            <span>🔒 {t.paymentModal.confirmBtn} — {totalAmount} $</span>
          </>
        )}
      </button>
    </form>
  );
}

export default function PaymentModal({
  isOpen,
  onClose,
  clientSecret,
  totalAmount,
  buyerEmail,
  buyerName,
}: {
  isOpen: boolean;
  onClose: () => void;
  clientSecret: string;
  totalAmount: string;
  buyerEmail: string;
  buyerName: string;
  onSuccess?: () => void;
}) {
  const { t, lang } = useLanguage();

  if (!isOpen || !clientSecret) return null;

  const appearance = {
    theme: "night" as const,
    variables: {
      colorPrimary: "#8B1528",
      colorBackground: "#0A0A10",
      colorText: "#FFFFFF",
      colorDanger: "#EF4444",
      fontFamily: "Inter, system-ui, sans-serif",
      borderRadius: "12px",
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-noir/95 backdrop-blur-2xl animate-fade-in overflow-y-auto">
      <div className="glass-card-fusion w-full max-w-lg rounded-3xl p-6 sm:p-8 border-2 border-bordeaux/40 relative shadow-2xl overflow-hidden my-auto">
        
        {/* Background Subtle Gradient Blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-bordeaux/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-ember/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-20 font-bold text-sm"
        >
          ✕
        </button>

        {/* Header */}
        <div className="mb-6 relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block px-2.5 py-1 rounded-lg bg-bordeaux/40 border border-bordeaux-light/50 text-red-200 text-[10px] font-black tracking-[2px] uppercase">
              {t.paymentModal.secureBadge}
            </span>
          </div>
          <h3 className="font-serif font-black text-xl sm:text-2xl text-white tracking-tight">
            {t.paymentModal.title}
          </h3>
          <p className="text-xs text-gray-400 font-sans mt-1">
            {t.paymentModal.guarantee}
          </p>
        </div>

        {/* STRIPE EMBEDDED CHECKOUT */}
        <div className="relative z-10">
          <Elements stripe={stripePromise} options={{ clientSecret, appearance, locale: lang === "en" ? "en" : "fr" }}>
            <CheckoutForm
              totalAmount={totalAmount}
              buyerEmail={buyerEmail}
              buyerName={buyerName}
            />
          </Elements>
        </div>

        {/* Footer info */}
        <div className="mt-5 text-center text-[10px] text-gray-500 font-mono tracking-wider">
          {t.paymentModal.footer}
        </div>
      </div>
    </div>
  );
}

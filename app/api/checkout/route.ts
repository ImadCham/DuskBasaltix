import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase";
import crypto from "crypto";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

type CartItem = {
  tierId: string;
  tierName: string;
  price: number; // in cents
  qty: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, buyerName, buyerEmail } = body as {
      items: CartItem[];
      buyerName: string;
      buyerEmail: string;
    };

    // --- Validation ---
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Aucun billet sélectionné." }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!buyerEmail || !emailRegex.test(buyerEmail)) {
      return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
    }
    if (!buyerName || buyerName.trim().length < 2) {
      return NextResponse.json({ error: "Nom complet requis." }, { status: 400 });
    }

    const supabase = createServiceClient();

    // --- Verify stock for each tier ---
    const { data: tiers, error: tiersError } = await supabase
      .from("ticket_tiers")
      .select("*")
      .eq("event_id", "xperimental_vol2");

    if (tiersError) throw new Error("Impossible de vérifier le stock.");

    // Check each item
    for (const item of items) {
      const tier = tiers?.find((t) => t.id === item.tierId);
      if (!tier) {
        return NextResponse.json({ error: `Palier de billet introuvable.` }, { status: 400 });
      }
      const available = tier.quantity_total - tier.quantity_sold;
      if (item.qty > available) {
        return NextResponse.json(
          { error: `Seulement ${available} billet(s) disponible(s) pour ${tier.name}.` },
          { status: 400 }
        );
      }
    }

    // --- Build line items for Stripe ---
    const totalQty = items.reduce((s, i) => s + i.qty, 0);

    const lineItems = items.map((item) => ({
      price_data: {
        currency: "cad",
        product_data: {
          name: `${item.tierName} — XPERIMENTAL VOL.2`,
          description: `DUSK EVE × BASALTE | ${process.env.NEXT_PUBLIC_EVENT_DATE ? new Date(process.env.NEXT_PUBLIC_EVENT_DATE).toLocaleDateString("fr-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : ""}`,
          // Metadata visible on Stripe Dashboard
          metadata: { event: "xperimental_vol2", tier: item.tierName },
        },
        unit_amount: item.price, // already in cents — NO tax_behavior needed without Stripe Tax
      },
      quantity: item.qty,
    }));

    // Pre-generate ticket UUIDs (one per ticket)
    const ticketIds = Array.from({ length: totalQty }, () => crypto.randomUUID());
    const mainTierName = items[0]?.tierName || "Admission";

    // --- Create Stripe Checkout Session ---
    // NOTE: Works identically with test and live keys.
    // To go live: just swap STRIPE_SECRET_KEY + NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env.local
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Stripe automatically shows Apple Pay / Google Pay when available
      // No explicit listing needed — Stripe detects from browser + device
      line_items: lineItems,
      // Pre-fill buyer email
      customer_email: buyerEmail,
      // Only collect billing address if needed for receipts
      billing_address_collection: "auto",
      // Phone number optional (useful for door contact)
      phone_number_collection: { enabled: false },
      // Success/Cancel URLs
      success_url: `${APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/#billets`,
      // Custom fields: collect buyer name
      custom_fields: [
        {
          key: "full_name",
          label: { type: "custom", custom: "Nom complet" },
          type: "text",
          text: { minimum_length: 2, maximum_length: 80 },
        },
      ],
      // Metadata passed to webhook
      metadata: {
        buyer_name: buyerName.trim(),
        buyer_email: buyerEmail.trim(),
        ticket_ids: JSON.stringify(ticketIds),
        tier: mainTierName,
        total_qty: String(totalQty),
        tier_items: JSON.stringify(
          items.map((i) => ({ tierId: i.tierId, qty: i.qty }))
        ),
      },
      // Quebec taxes: add them manually to price, OR enable Stripe Tax in dashboard
      // automatic_tax: { enabled: true }, // Uncomment if Stripe Tax is enabled
      locale: "fr",
      // Session expires in 30 min
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      // Show event branding on Stripe Checkout page
      submit_type: "pay",
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    console.error("[/api/checkout] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

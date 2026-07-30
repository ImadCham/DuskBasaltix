import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase";
import crypto from "crypto";

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

    // Verify stock
    const { data: tiers, error: tiersError } = await supabase
      .from("ticket_tiers")
      .select("*")
      .eq("event_id", "xperimental_vol2");

    if (tiersError) throw new Error("Impossible de vérifier le stock.");

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

    const totalQty = items.reduce((s, i) => s + i.qty, 0);
    const subtotalCents = items.reduce((s, i) => s + i.price * i.qty, 0);
    const mainTierName = items[0]?.tierName || "Admission";

    // Service fee flat $2.00 in cents
    const serviceFeeCents = 200;
    const taxableAmountCents = subtotalCents + serviceFeeCents;
    const tpsCents = Math.round(taxableAmountCents * 0.05);
    const tvqCents = Math.round(taxableAmountCents * 0.09975);
    const totalAmountCents = taxableAmountCents + tpsCents + tvqCents;

    const ticketIds = Array.from({ length: totalQty }, () => crypto.randomUUID());

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmountCents,
      currency: "cad",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        buyer_name: buyerName.trim(),
        buyer_email: buyerEmail.trim(),
        ticket_ids: JSON.stringify(ticketIds),
        tier: mainTierName,
        total_qty: String(totalQty),
        tier_items: JSON.stringify(
          items.map((i) => ({ tierId: i.tierId, qty: i.qty, name: i.tierName, price: i.price }))
        ),
        subtotal: String(subtotalCents),
        service_fee: String(serviceFeeCents),
        tps: String(tpsCents),
        tvq: String(tvqCents),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      ticketIds,
      totalAmount: (totalAmountCents / 100).toFixed(2),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    console.error("[/api/create-intent] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

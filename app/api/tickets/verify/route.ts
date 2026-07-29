import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase";
import { generateQRCodeDataUrl } from "@/lib/qrcode";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId =
      searchParams.get("session_id") ||
      searchParams.get("payment_intent") ||
      searchParams.get("ticket_id");

    if (!sessionId || sessionId.trim().length < 5) {
      return NextResponse.json(
        { error: "Identifiant de session invalide." },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // 1. Check if ticket(s) already exist in Supabase by stripe_session_id or id
    const { data: existingTickets, error: dbError } = await supabase
      .from("tickets")
      .select("*")
      .or(`stripe_session_id.eq.${sessionId},id.eq.${sessionId}`);

    if (existingTickets && existingTickets.length > 0) {
      // Tickets found in database! Generate QR code data URLs
      const ticketsWithQR = await Promise.all(
        existingTickets.map(async (t) => ({
          ...t,
          qrCodeDataUrl: await generateQRCodeDataUrl(t.qr_code_data || t.id),
        }))
      );

      return NextResponse.json({
        verified: true,
        tickets: ticketsWithQR,
        buyerName: existingTickets[0].buyer_name || "Acheteur",
        buyerEmail: existingTickets[0].buyer_email,
        tierName: existingTickets[0].tier,
        status: existingTickets[0].status,
        eventDate: process.env.NEXT_PUBLIC_EVENT_DATE || "2026-10-17T22:00:00-04:00",
        eventVenue: process.env.NEXT_PUBLIC_EVENT_VENUE || "356 Av Mont-Royal E, Montréal",
      });
    }

    // 2. If not found in DB yet, verify directly with Stripe API
    let paymentConfirmed = false;
    let buyerName = "";
    let buyerEmail = "";
    let tierName = "Admission";
    let totalQty = 1;
    let ticketIds: string[] = [];

    if (sessionId.startsWith("pi_")) {
      // Payment Intent
      const pi = await stripe.paymentIntents.retrieve(sessionId);
      if (pi && pi.status === "succeeded") {
        paymentConfirmed = true;
        buyerName = pi.metadata?.buyer_name || "Acheteur";
        buyerEmail = pi.metadata?.buyer_email || pi.receipt_email || "";
        tierName = pi.metadata?.tier || "Admission";
        totalQty = parseInt(pi.metadata?.total_qty || "1");
        ticketIds = JSON.parse(pi.metadata?.ticket_ids || "[]");
      }
    } else if (sessionId.startsWith("cs_")) {
      // Checkout Session
      const cs = await stripe.checkout.sessions.retrieve(sessionId);
      if (cs && cs.payment_status === "paid") {
        paymentConfirmed = true;
        buyerName = cs.metadata?.buyer_name || "Acheteur";
        buyerEmail = cs.metadata?.buyer_email || cs.customer_email || "";
        tierName = cs.metadata?.tier || "Admission";
        totalQty = parseInt(cs.metadata?.total_qty || "1");
        ticketIds = JSON.parse(cs.metadata?.ticket_ids || "[]");
      }
    }

    if (!paymentConfirmed) {
      return NextResponse.json(
        { error: "Paiement non confirmé ou session invalide." },
        { status: 400 }
      );
    }

    if (ticketIds.length === 0) {
      ticketIds = Array.from({ length: totalQty }, () => crypto.randomUUID());
    }

    // 3. Insert tickets into Supabase directly if webhook had a delay
    const ticketRows = ticketIds.map((id) => ({
      id,
      event_id: "xperimental_vol2",
      tier: tierName,
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      stripe_session_id: sessionId,
      qr_code_data: id,
      status: "paid" as const,
    }));

    await supabase
      .from("tickets")
      .upsert(ticketRows, { onConflict: "qr_code_data", ignoreDuplicates: true });

    const ticketsWithQR = await Promise.all(
      ticketRows.map(async (t) => ({
        ...t,
        qrCodeDataUrl: await generateQRCodeDataUrl(t.qr_code_data),
      }))
    );

    return NextResponse.json({
      verified: true,
      tickets: ticketsWithQR,
      buyerName,
      buyerEmail,
      tierName,
      status: "paid",
      eventDate: process.env.NEXT_PUBLIC_EVENT_DATE || "2026-10-17T22:00:00-04:00",
      eventVenue: process.env.NEXT_PUBLIC_EVENT_VENUE || "356 Av Mont-Royal E, Montréal",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur de vérification.";
    console.error("[/api/tickets/verify] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

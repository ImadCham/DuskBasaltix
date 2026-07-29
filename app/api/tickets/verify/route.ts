import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase";
import { generateQRCodeDataUrl } from "@/lib/qrcode";
import { resend, FROM_EMAIL, buildTicketEmailHtml } from "@/lib/resend";
import { generateTicketPDF } from "@/lib/pdfTicket";

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

    // 1. Check if ticket(s) already exist in Supabase
    const { data: existingTickets } = await supabase
      .from("tickets")
      .select("*")
      .or(`stripe_session_id.eq.${sessionId},id.eq.${sessionId}`);

    let ticketsToProcess = existingTickets || [];
    let buyerName = existingTickets?.[0]?.buyer_name || "";
    let buyerEmail = existingTickets?.[0]?.buyer_email || "";
    let tierName = existingTickets?.[0]?.tier || "Admission";
    let totalQty = existingTickets?.length || 1;

    // 2. If not found in DB yet, verify directly with Stripe API
    if (ticketsToProcess.length === 0) {
      let paymentConfirmed = false;
      let ticketIds: string[] = [];

      if (sessionId.startsWith("pi_")) {
        const pi = await stripe.paymentIntents.retrieve(sessionId);
        if (pi && (pi.status === "succeeded" || pi.status === "processing")) {
          paymentConfirmed = true;
          buyerName = pi.metadata?.buyer_name || "Acheteur";
          buyerEmail = pi.metadata?.buyer_email || pi.receipt_email || "";
          tierName = pi.metadata?.tier || "Admission";
          totalQty = parseInt(pi.metadata?.total_qty || "1");
          ticketIds = JSON.parse(pi.metadata?.ticket_ids || "[]");
        }
      } else if (sessionId.startsWith("cs_")) {
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

      // Insert tickets into Supabase
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

      ticketsToProcess = ticketRows;
    }

    // 3. Send Email directly if not sent yet (Ensures email is ALWAYS delivered on localhost + production)
    const primaryTicket = ticketsToProcess[0];
    const primaryTicketId = primaryTicket.id || primaryTicket.qr_code_data;
    const qrDataUrl = await generateQRCodeDataUrl(primaryTicketId);

    const eventName = "DUSK EVE × BASALTE";
    const eventDate = "Vendredi 14 Août 2026 · 22h00 — 03h00";
    const eventVenue = "Barbossa — 3956 A Boul. Saint-Laurent, Montréal, QC H2W 1Y3";

    if (buyerEmail) {
      console.log(`[/api/tickets/verify] Sending ticket email to ${buyerEmail}...`);
      try {
        let pdfBuffer: Buffer | null = null;
        try {
          const pdfUint8 = await generateTicketPDF({
            buyerName,
            buyerEmail,
            tierName,
            ticketId: primaryTicketId,
            qrCodeDataUrl: qrDataUrl,
            eventDate,
            eventVenue,
          });
          pdfBuffer = Buffer.from(pdfUint8);
        } catch (pdfErr) {
          console.error("[/api/tickets/verify] PDF generation error:", pdfErr);
        }

        const emailHtml = buildTicketEmailHtml({
          buyerName,
          tier: tierName,
          eventName,
          eventDate,
          eventVenue,
          qrImageDataUrl: qrDataUrl,
          ticketId: primaryTicketId,
          quantity: totalQty,
        });

        const attachments = pdfBuffer
          ? [
              {
                filename: `billet-dusk-eve-basalte-${primaryTicketId.substring(0, 8)}.pdf`,
                content: pdfBuffer,
              },
            ]
          : undefined;

        await resend.emails.send({
          from: FROM_EMAIL,
          to: buyerEmail,
          subject: `Vos billets pour ${eventName}`,
          html: emailHtml,
          attachments,
        });

        console.log(`[/api/tickets/verify] ✅ Email successfully sent to ${buyerEmail}!`);
      } catch (emailErr) {
        console.error("[/api/tickets/verify] Email sending failed:", emailErr);
      }
    }

    const ticketsWithQR = await Promise.all(
      ticketsToProcess.map(async (t) => ({
        ...t,
        qrCodeDataUrl: await generateQRCodeDataUrl(t.qr_code_data || t.id),
      }))
    );

    return NextResponse.json({
      verified: true,
      tickets: ticketsWithQR,
      buyerName: buyerName || "Acheteur",
      buyerEmail,
      tierName,
      status: "paid",
      eventDate,
      eventVenue,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur de vérification.";
    console.error("[/api/tickets/verify] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

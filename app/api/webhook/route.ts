import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase";
import { generateQRCodeDataUrl } from "@/lib/qrcode";
import { resend, FROM_EMAIL, buildTicketEmailHtml } from "@/lib/resend";
import { generateTicketPDF } from "@/lib/pdfTicket";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return new NextResponse("Missing stripe-signature header", { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new NextResponse("STRIPE_WEBHOOK_SECRET not configured", { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Webhook signature error";
    console.error("[webhook] Signature error:", msg);
    return new NextResponse(`Webhook Error: ${msg}`, { status: 400 });
  }

  console.log(`[webhook] Received event: ${event.type}`);

  if (
    event.type !== "payment_intent.succeeded" &&
    event.type !== "checkout.session.completed"
  ) {
    return new NextResponse("OK (Ignored Event)", { status: 200 });
  }

  let metadata: Record<string, string> = {};
  let stripeSessionId = "";
  let customerEmail = "";

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      metadata?: Record<string, string>;
      customer_email?: string;
    };
    metadata = session.metadata || {};
    stripeSessionId = session.id;
    customerEmail = session.customer_email || "";
  } else if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as {
      id: string;
      metadata?: Record<string, string>;
      receipt_email?: string;
    };
    metadata = paymentIntent.metadata || {};
    stripeSessionId = paymentIntent.id;
    customerEmail = paymentIntent.receipt_email || "";
  }

  const buyerName = metadata.buyer_name || "Acheteur";
  const buyerEmail = metadata.buyer_email || customerEmail;

  if (!buyerEmail) {
    console.error("[webhook] Missing buyer email in metadata/session");
    return new NextResponse("Missing email", { status: 200 });
  }

  const ticketIds: string[] = JSON.parse(metadata.ticket_ids || "[]");
  const tierName = metadata.tier || "Admission";
  const totalQty = parseInt(metadata.total_qty || "1");
  const tierItems: { tierId: string; qty: number }[] = JSON.parse(
    metadata.tier_items || "[]"
  );

  if (ticketIds.length === 0) {
    console.warn("[webhook] No ticket IDs found in metadata");
    return new NextResponse("OK", { status: 200 });
  }

  console.log(
    `[webhook] Processing ${totalQty} ticket(s) for ${buyerEmail}. Ticket IDs: ${ticketIds.join(", ")}`
  );

  const supabase = createServiceClient();

  try {
    // 1. Insert tickets into Supabase (Idempotent)
    const ticketRows = ticketIds.map((id) => ({
      id,
      event_id: "xperimental_vol2",
      tier: tierName,
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      stripe_session_id: stripeSessionId,
      qr_code_data: id,
      status: "paid" as const,
    }));

    const { error: insertError } = await supabase
      .from("tickets")
      .upsert(ticketRows, { onConflict: "qr_code_data", ignoreDuplicates: true });

    if (insertError) {
      console.error("[webhook] Supabase insert error:", insertError.message);
    } else {
      console.log(`[webhook] ✅ ${ticketIds.length} ticket(s) saved in database`);
    }

    // 2. Update stock / quantity_sold
    for (const item of tierItems) {
      try {
        const { data: tierData } = await supabase
          .from("ticket_tiers")
          .select("quantity_sold")
          .eq("id", item.tierId)
          .single();
        if (tierData) {
          await supabase
            .from("ticket_tiers")
            .update({ quantity_sold: (tierData.quantity_sold || 0) + item.qty })
            .eq("id", item.tierId);
        }
      } catch (tierErr) {
        console.warn("[webhook] Failed to update tier stock:", tierErr);
      }
    }

    // 3. Generate QR code Data URL for the ticket
    const primaryTicketId = ticketIds[0];
    const qrDataUrl = await generateQRCodeDataUrl(primaryTicketId);

    const eventName = "DUSK EVE × BASALTE";
    const eventDate = "Vendredi 14 Août 2026 · 22h00 — 03h00";
    const eventVenue = "Barbossa — 3956 A Boul. Saint-Laurent, Montréal, QC H2W 1Y3";

    // 4. Generate PDF Ticket Attachment Buffer
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
      console.error("[webhook] Could not generate PDF attachment:", pdfErr);
    }

    // 5. Send Confirmation Email via Resend with PDF Attachment
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

    console.log(`[webhook] Sending email with PDF attachment to ${buyerEmail} via Resend (${FROM_EMAIL})...`);

    const attachments = pdfBuffer
      ? [
          {
            filename: `billet-dusk-eve-basalte-${primaryTicketId.substring(0, 8)}.pdf`,
            content: pdfBuffer,
          },
        ]
      : undefined;

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: buyerEmail,
      subject: `Vos billets pour ${eventName}`,
      html: emailHtml,
      attachments,
    });

    if (emailError) {
      console.error("[webhook] ❌ Resend Email Failed:", JSON.stringify(emailError));
    } else {
      console.log(`[webhook] ✅ Email with PDF ticket successfully sent to ${buyerEmail}! Resend ID: ${emailData?.id}`);
    }

  } catch (err) {
    console.error("[webhook] Exception during execution:", err);
  }

  return new NextResponse("OK", { status: 200 });
}

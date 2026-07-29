import { NextRequest, NextResponse } from "next/server";
import { resend, FROM_EMAIL, buildTicketEmailHtml } from "@/lib/resend";
import { generateQRCodeDataUrl } from "@/lib/qrcode";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { toEmail, buyerName = "Testeur VIP" } = body as {
      toEmail?: string;
      buyerName?: string;
    };

    const targetEmail = toEmail || process.env.RESEND_TO_TEST_EMAIL || "onboarding@resend.dev";

    const testTicketId = "TEST-" + Math.random().toString(36).substring(2, 9).toUpperCase();
    const qrDataUrl = await generateQRCodeDataUrl(testTicketId);

    const eventDate = new Date(
      process.env.NEXT_PUBLIC_EVENT_DATE || "2026-10-17T22:00:00-04:00"
    ).toLocaleDateString("fr-CA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Toronto",
    });

    const emailHtml = buildTicketEmailHtml({
      buyerName,
      tier: "Admission Générale (Test)",
      eventName: "DUSK EVE × BASALTE",
      eventDate,
      eventVenue: process.env.NEXT_PUBLIC_EVENT_VENUE || "356 Av Mont-Royal E, Montréal",
      qrImageDataUrl: qrDataUrl,
      ticketId: testTicketId,
      quantity: 1,
    });

    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: targetEmail,
      subject: "🎟️ [TEST] Ton billet pour DUSK EVE × BASALTE",
      html: emailHtml,
    });

    if (response.error) {
      return NextResponse.json(
        {
          success: false,
          error: response.error,
          fromEmail: FROM_EMAIL,
          targetEmail,
          note: "Si vous utilisez onboarding@resend.dev sans domaine vérifié, Resend livre uniquement à l'adresse email de votre compte Resend.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      emailId: response.data?.id,
      fromEmail: FROM_EMAIL,
      targetEmail,
      message: `Email de test envoyé avec succès à ${targetEmail}!`,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { qr_code_data } = await request.json();

    if (!qr_code_data || typeof qr_code_data !== "string") {
      return NextResponse.json({ error: "QR code invalide." }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Fetch the ticket
    const { data: ticket, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("qr_code_data", qr_code_data.trim())
      .single();

    if (error || !ticket) {
      return NextResponse.json(
        { valid: false, reason: "INVALID", message: "Billet introuvable ou invalide." },
        { status: 200 }
      );
    }

    if (ticket.status === "scanned") {
      return NextResponse.json(
        {
          valid: false,
          reason: "ALREADY_SCANNED",
          message: "Ce billet a déjà été scanné.",
          name: ticket.buyer_name || ticket.buyer_email,
          tier: ticket.tier,
          scanned_at: ticket.scanned_at,
        },
        { status: 200 }
      );
    }

    if (ticket.status === "cancelled") {
      return NextResponse.json(
        { valid: false, reason: "CANCELLED", message: "Ce billet a été annulé." },
        { status: 200 }
      );
    }

    // Mark as scanned
    const { error: updateError } = await supabase
      .from("tickets")
      .update({ status: "scanned", scanned_at: new Date().toISOString() })
      .eq("qr_code_data", qr_code_data.trim());

    if (updateError) {
      console.error("[validate] Update error:", updateError.message);
      return NextResponse.json(
        { error: "Erreur lors de la validation." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      valid: true,
      reason: "OK",
      message: "Billet valide ✓",
      name: ticket.buyer_name || ticket.buyer_email,
      tier: ticket.tier,
    });
  } catch (err) {
    console.error("[validate] Error:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

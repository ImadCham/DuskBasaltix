import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "duskBasalte2026!";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const password = searchParams.get("p");

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();

    // Launch date: July 31, 2026 (official launch)
    const LAUNCH_DATE = "2026-07-31T00:00:00+00:00";

    const [{ data: tickets, count }, { data: tiers }] = await Promise.all([
      supabase
        .from("tickets")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false }),
      supabase
        .from("ticket_tiers")
        .select("*")
        .eq("event_id", "xperimental_vol2"),
    ]);

    const allTickets = tickets || [];
    const totalSold = count || 0;
    const scannedCount = allTickets.filter((t) => t.status === "scanned").length;

    // Tickets since official launch (July 31 2026)
    const ticketsSinceLaunch = allTickets.filter((t) =>
      t.created_at && new Date(t.created_at) >= new Date(LAUNCH_DATE)
    );

    // Per-tier breakdown
    const tierBreakdown: Record<string, { count: number; revenue: number; name: string; price: number; since_launch: number }> = {};
    for (const tier of tiers || []) {
      const tierTickets = allTickets.filter(
        (t) => t.tier.toLowerCase().includes(tier.name.toLowerCase().split(" ")[0].toLowerCase())
      );
      const tierSinceLaunch = ticketsSinceLaunch.filter(
        (t) => t.tier.toLowerCase().includes(tier.name.toLowerCase().split(" ")[0].toLowerCase())
      );
      tierBreakdown[tier.id] = {
        name: tier.name,
        price: tier.price,
        count: tierTickets.length,
        revenue: tierTickets.length * tier.price,
        since_launch: tierSinceLaunch.length,
      };
    }

    const totalRevenue = Object.values(tierBreakdown).reduce((s, t) => s + t.revenue, 0);

    // Revenue with taxes & fees (per ticket since launch)
    const revenueSinceLaunch = ticketsSinceLaunch.reduce((sum, t) => {
      const tier = (tiers || []).find((tier) =>
        t.tier.toLowerCase().includes(tier.name.toLowerCase().split(" ")[0].toLowerCase())
      );
      return sum + (tier?.price || 0);
    }, 0);
    const serviceFeesTotal = ticketsSinceLaunch.length * 2; // $2 per ticket
    const taxableBase = revenueSinceLaunch + serviceFeesTotal;
    const tpsTotal = taxableBase * 0.05;
    const tvqTotal = taxableBase * 0.09975;
    const totalWithTaxes = taxableBase + tpsTotal + tvqTotal;

    // Daily sales breakdown (since launch)
    const dailySales: Record<string, { date: string; count: number; revenue: number }> = {};
    for (const t of ticketsSinceLaunch) {
      if (!t.created_at) continue;
      const day = new Date(t.created_at).toISOString().slice(0, 10);
      const tier = (tiers || []).find((tier) =>
        t.tier.toLowerCase().includes(tier.name.toLowerCase().split(" ")[0].toLowerCase())
      );
      if (!dailySales[day]) dailySales[day] = { date: day, count: 0, revenue: 0 };
      dailySales[day].count += 1;
      dailySales[day].revenue += tier?.price || 0;
    }
    const dailyBreakdown = Object.values(dailySales).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      total: totalSold,
      scanned: scannedCount,
      capacity: (tiers || []).reduce((s, t) => s + t.quantity_total, 0),
      revenue: totalRevenue.toFixed(2),
      since_launch: {
        count: ticketsSinceLaunch.length,
        revenue_subtotal: revenueSinceLaunch.toFixed(2),
        service_fees: serviceFeesTotal.toFixed(2),
        tps: tpsTotal.toFixed(2),
        tvq: tvqTotal.toFixed(2),
        total_with_taxes: totalWithTaxes.toFixed(2),
        daily: dailyBreakdown,
      },
      tiers: tierBreakdown,
      ticket_tiers: tiers,
      tickets: allTickets.map((t) => ({
        id: t.id,
        name: t.buyer_name || "—",
        email: t.buyer_email || "—",
        tier: t.tier || "—",
        status: t.status,
        scanned_at: t.scanned_at || null,
        created_at: t.created_at || null,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    console.error("[admin/stats] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: Add a ticket manually
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { p, name, email, tier, qr_code } = body;

    if (p !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name || !email || !emailRegex.test(email) || !qr_code) {
      return NextResponse.json(
        { error: "Nom, email valide et QR code requis." },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { error } = await supabase.from("tickets").upsert(
      [
        {
          id: qr_code.trim(),
          event_id: "xperimental_vol2",
          tier: tier || "Admission Générale",
          buyer_name: name.trim(),
          buyer_email: email.trim(),
          qr_code_data: qr_code.trim(),
          status: "paid",
        },
      ],
      { onConflict: "qr_code_data" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, qr_code: qr_code.trim() });
  } catch (err) {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

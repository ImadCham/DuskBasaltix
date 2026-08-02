"use client";

import { useState, useEffect, useCallback } from "react";

type TicketRecord = {
  id: string;
  name: string;
  email: string;
  tier: string;
  status: string;
  scanned_at: string | null;
  created_at: string | null;
};

type DailyData = { date: string; count: number; revenue: number };

type SinceLaunch = {
  count: number;
  revenue_subtotal: string;
  service_fees: string;
  tps: string;
  tvq: string;
  total_with_taxes: string;
  daily: DailyData[];
};

type StatsData = {
  total: number;
  scanned: number;
  capacity: number;
  revenue: string;
  since_launch: SinceLaunch;
  tiers: Record<string, { name: string; price: number; count: number; revenue: number; since_launch: number }>;
  tickets: TicketRecord[];
};

// Mini bar chart component
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs text-gray-500 w-6 text-right">{value}</span>
    </div>
  );
}

// Daily chart component
function DailyChart({ data }: { data: DailyData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-gray-700 text-sm">
        Aucune vente depuis le lancement
      </div>
    );
  }
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-2 h-24 px-1">
      {data.map((d) => {
        const h = Math.max(4, Math.round((d.count / maxCount) * 88));
        const label = new Date(d.date + "T12:00:00Z").toLocaleDateString("fr-CA", {
          month: "short",
          day: "numeric",
        });
        return (
          <div key={d.date} className="flex flex-col items-center gap-1 flex-1 min-w-0 group relative">
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 bg-noir-surface border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              <div className="font-bold">{d.count} billet{d.count > 1 ? "s" : ""}</div>
              <div className="text-gray-400">{d.revenue.toFixed(0)} $</div>
            </div>
            <div
              className="w-full rounded-t-md transition-all duration-700"
              style={{
                height: `${h}px`,
                background: "linear-gradient(180deg, #7A1F2B, #c0392b)",
              }}
            />
            <span className="text-[9px] text-gray-600 truncate w-full text-center">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [addForm, setAddForm] = useState({ name: "", email: "", tier: "Admission Générale", qr_code: "" });
  const [addMsg, setAddMsg] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "participants" | "add">("dashboard");

  const loadStats = useCallback(async (pw?: string) => {
    const p = pw || password;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats?p=${encodeURIComponent(p)}`);
      if (res.status === 401) {
        setLoginError("Mot de passe incorrect.");
        setAuthed(false);
        setLoading(false);
        return;
      }
      const json: StatsData = await res.json();
      setData(json);
      setAuthed(true);
      setLoginError("");
      setLastRefresh(new Date());
    } catch {
      setLoginError("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  }, [password]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loadStats(password);
  };

  // Auto-refresh every 2 minutes
  useEffect(() => {
    if (!authed) return;
    const id = setInterval(() => loadStats(), 120_000);
    return () => clearInterval(id);
  }, [authed, loadStats]);

  const exportCSV = () => {
    if (!data) return;
    const headers = ["#", "Nom", "Email", "Tier", "Statut", "Date achat", "Date scan"];
    const rows = data.tickets.map((t, i) => [
      i + 1,
      `"${(t.name || "").replace(/"/g, '""')}"`,
      `"${(t.email || "").replace(/"/g, '""')}"`,
      `"${(t.tier || "").replace(/"/g, '""')}"`,
      t.status,
      t.created_at ? new Date(t.created_at).toLocaleString("fr-CA") : "",
      t.scanned_at ? new Date(t.scanned_at).toLocaleString("fr-CA") : "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Xperimental_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleAddTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddMsg("");
    try {
      const res = await fetch("/api/admin/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ p: password, ...addForm }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setAddMsg("✅ Billet ajouté avec succès.");
      setAddForm({ name: "", email: "", tier: "Admission Générale", qr_code: "" });
      loadStats();
    } catch (err: unknown) {
      setAddMsg(`❌ ${err instanceof Error ? err.message : "Erreur"}`);
    } finally {
      setAddLoading(false);
    }
  };

  const filteredTickets = data?.tickets.filter((t) => {
    const q = search.toLowerCase();
    return (
      (t.name || "").toLowerCase().includes(q) ||
      (t.email || "").toLowerCase().includes(q) ||
      (t.tier || "").toLowerCase().includes(q)
    );
  }) || [];

  // LOGIN
  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "#060608" }}>
        <div className="w-full max-w-sm rounded-3xl p-10 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-12 h-12 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7A1F2B, #9b2335)" }}>
            <span className="text-xl">🎟</span>
          </div>
          <p className="text-[10px] tracking-[4px] uppercase text-gray-600 mb-2">Admin</p>
          <h1 className="font-serif text-2xl font-bold text-white mb-8">DuskBasaltix</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              autoFocus
              className="w-full rounded-xl px-4 py-4 text-white text-center font-mono tracking-widest placeholder-gray-700 focus:outline-none transition-colors"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
            {loginError && <p className="text-red-400 text-xs">{loginError}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl font-bold tracking-widest uppercase text-sm text-white transition-opacity disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #7A1F2B, #c0392b)" }}
            >
              {loading ? "Connexion..." : "Accéder au dashboard"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // Computed values
  const sl = data?.since_launch;
  const capacity = data?.capacity || 300;
  const pct = data ? Math.min(100, Math.round((data.total / capacity) * 100)) : 0;
  const launchPct = sl && capacity > 0 ? Math.min(100, Math.round((sl.count / capacity) * 100)) : 0;
  const tierColors: Record<string, string> = {
    "Early Bird": "#a78bfa",
    "Admission Générale": "#60a5fa",
    "Last Chance": "#f87171",
  };

  return (
    <main className="min-h-screen" style={{ background: "#060608" }}>
      {/* TOP BAR */}
      <header className="sticky top-0 z-40 backdrop-blur-xl px-6 py-3 flex items-center justify-between" style={{ background: "rgba(6,6,8,0.85)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: "linear-gradient(135deg, #7A1F2B, #9b2335)" }}>🎟</div>
          <div>
            <h1 className="font-serif text-sm font-bold text-white tracking-wider uppercase">DuskBasaltix — Admin</h1>
            {lastRefresh && <p className="text-[10px] text-gray-600">Actualisé à {lastRefresh.toLocaleTimeString("fr-CA")}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => loadStats()} disabled={loading} className="px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase text-gray-400 hover:text-white transition-all disabled:opacity-50" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {loading ? "⟳" : "↻ Refresh"}
          </button>
          <button onClick={exportCSV} className="px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase text-white" style={{ background: "linear-gradient(135deg, #064e3b, #10b981)" }}>
            ↓ CSV
          </button>
          <a href="/scan" className="px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase text-white" style={{ background: "linear-gradient(135deg, #7A1F2B, #9b2335)" }}>
            📷 Scanner
          </a>
        </div>
      </header>

      {/* TABS */}
      <div className="px-6 pt-4 flex gap-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {(["dashboard", "participants", "add"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-xs font-bold tracking-widest uppercase rounded-t-lg transition-all"
            style={{
              background: activeTab === tab ? "rgba(122,31,43,0.15)" : "transparent",
              color: activeTab === tab ? "#f87171" : "#555",
              borderBottom: activeTab === tab ? "2px solid #7A1F2B" : "2px solid transparent",
            }}
          >
            {tab === "dashboard" ? "📊 Dashboard" : tab === "participants" ? "👥 Participants" : "➕ Ajouter"}
          </button>
        ))}
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {loading && !data ? (
          <div className="text-center py-20 text-gray-600">Chargement...</div>
        ) : data ? (
          <>
            {/* ─── DASHBOARD TAB ─── */}
            {activeTab === "dashboard" && (
              <div className="space-y-5">
                {/* ── BANNER: DEPUIS LE LANCEMENT ── */}
                <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(122,31,43,0.25) 0%, rgba(6,6,8,0.8) 100%)", border: "1px solid rgba(122,31,43,0.3)" }}>
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, #7A1F2B, #c0392b, transparent)" }} />
                  <p className="text-[10px] tracking-[3px] uppercase text-bordeaux-light font-bold mb-3">
                    🚀 Depuis le lancement officiel — 31 juillet 2026
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-3xl font-black text-white font-serif">{sl?.count ?? 0}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Billets vendus</p>
                    </div>
                    <div>
                      <p className="text-3xl font-black text-white font-serif">{sl ? `$${parseFloat(sl.total_with_taxes).toFixed(0)}` : "$0"}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Revenu total (taxes incl.)</p>
                    </div>
                    <div>
                      <p className="text-3xl font-black text-white font-serif">{sl ? `$${parseFloat(sl.revenue_subtotal).toFixed(0)}` : "$0"}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Sous-total billets</p>
                    </div>
                    <div>
                      <p className="text-3xl font-black text-white font-serif">{launchPct}%</p>
                      <p className="text-xs text-gray-500 mt-0.5">Capacité vendue</p>
                    </div>
                  </div>
                  {/* Taxes breakdown */}
                  {sl && (sl.count > 0) && (
                    <div className="mt-4 pt-4 flex flex-wrap gap-x-6 gap-y-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <span className="text-xs text-gray-600">Frais de service : <span className="text-gray-400">${parseFloat(sl.service_fees).toFixed(2)}</span></span>
                      <span className="text-xs text-gray-600">TPS (5%) : <span className="text-gray-400">${parseFloat(sl.tps).toFixed(2)}</span></span>
                      <span className="text-xs text-gray-600">TVQ (9.975%) : <span className="text-gray-400">${parseFloat(sl.tvq).toFixed(2)}</span></span>
                    </div>
                  )}
                </div>

                {/* ── STATS GRID ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Total billets vendus", value: `${data.total}`, sub: `/ ${data.capacity} capacité`, color: "#7A1F2B" },
                    { label: "Revenus bruts", value: `$${data.revenue}`, sub: "avant taxes & frais", color: "#10b981" },
                    { label: "Scannés à l'entrée", value: `${data.scanned}`, sub: `sur ${data.total} vendus`, color: "#60a5fa" },
                    { label: "Capacité totale", value: `${pct}%`, sub: "rempli", color: "#a78bfa", showBar: true },
                  ].map(({ label, value, sub, color, showBar }) => (
                    <div key={label} className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
                      <p className="text-[10px] tracking-[2px] uppercase text-gray-600 mb-2">{label}</p>
                      <p className="text-3xl font-bold font-serif text-white">{value}</p>
                      <p className="text-xs text-gray-600 mt-1">{sub}</p>
                      {showBar && (
                        <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* ── TIER BREAKDOWN + CHART SIDE BY SIDE ── */}
                <div className="grid md:grid-cols-2 gap-5">
                  {/* Tier breakdown */}
                  <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <p className="text-[10px] tracking-[3px] uppercase text-gray-600 font-bold">Répartition par palier</p>
                    {Object.entries(data.tiers).map(([id, tier]) => (
                      <div key={id} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: tierColors[tier.name] || "#888" }} />
                            <span className="text-sm text-white font-medium">{tier.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-white">{tier.count}</span>
                            <span className="text-xs text-gray-600 ml-1">/ {data.capacity} · {tier.price.toFixed(0)}$/billet</span>
                          </div>
                        </div>
                        <MiniBar value={tier.count} max={data.capacity} color={tierColors[tier.name] || "#888"} />
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Depuis le lancement : <span className="text-gray-400">{tier.since_launch}</span></span>
                          <span>Revenu : <span className="text-gray-400">${tier.revenue.toFixed(0)}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Daily sales chart */}
                  <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] tracking-[3px] uppercase text-gray-600 font-bold">Ventes par jour (depuis lancement)</p>
                      <span className="text-xs text-gray-700">{sl?.daily?.length ?? 0} jour(s)</span>
                    </div>
                    <DailyChart data={sl?.daily || []} />
                    {sl && sl.daily && sl.daily.length > 0 && (
                      <div className="mt-4 pt-4 grid grid-cols-3 gap-3 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <div>
                          <p className="text-lg font-bold text-white">{Math.max(...sl.daily.map((d) => d.count))}</p>
                          <p className="text-[10px] text-gray-600">Meilleur jour</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-white">{(sl.count / sl.daily.length).toFixed(1)}</p>
                          <p className="text-[10px] text-gray-600">Moy. / jour</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-white">{sl.daily.length}</p>
                          <p className="text-[10px] text-gray-600">Jours actifs</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── COUNTDOWN TO EVENT ── */}
                <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  {(() => {
                    const eventDate = new Date("2026-08-14T22:00:00-04:00");
                    const now = new Date();
                    const diff = eventDate.getTime() - now.getTime();
                    if (diff <= 0) return <p className="text-green-400 font-bold">🎉 L&apos;événement a eu lieu !</p>;
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    return (
                      <div>
                        <p className="text-[10px] tracking-[3px] uppercase text-gray-600 mb-3">Temps avant l&apos;événement</p>
                        <div className="flex items-center justify-center gap-6">
                          <div><p className="text-4xl font-black text-white font-serif">{days}</p><p className="text-xs text-gray-600">jours</p></div>
                          <div className="text-2xl text-bordeaux-light">:</div>
                          <div><p className="text-4xl font-black text-white font-serif">{hours}</p><p className="text-xs text-gray-600">heures</p></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-3">Vendredi 14 août 2026 · 22h00 · CHI Restaurant Bar</p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ─── PARTICIPANTS TAB ─── */}
            {activeTab === "participants" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h2 className="font-serif text-base font-bold text-white">
                    Participants ({filteredTickets.length})
                  </h2>
                  <input
                    type="text"
                    placeholder="🔍 Filtrer par nom, email ou tier..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="rounded-xl px-4 py-2 text-white text-sm placeholder-gray-600 focus:outline-none w-64"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                </div>
                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          {["#", "Nom", "Email", "Tier", "Statut", "Date achat"].map((h) => (
                            <th key={h} className="text-left px-5 py-3 text-[10px] tracking-[2px] uppercase text-gray-600 font-medium">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTickets.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-12 text-gray-600 text-sm">
                              Aucun participant.
                            </td>
                          </tr>
                        ) : (
                          filteredTickets.map((t, i) => (
                            <tr key={t.id} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                              <td className="px-5 py-3 text-xs text-gray-700">{i + 1}</td>
                              <td className="px-5 py-3 text-sm font-semibold text-white">{t.name || "—"}</td>
                              <td className="px-5 py-3 text-xs text-gray-400">{t.email}</td>
                              <td className="px-5 py-3">
                                <span
                                  className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase"
                                  style={{
                                    background: t.tier?.toLowerCase().includes("early")
                                      ? "rgba(167,139,250,0.12)"
                                      : t.tier?.toLowerCase().includes("last")
                                      ? "rgba(248,113,113,0.12)"
                                      : "rgba(96,165,250,0.12)",
                                    color: t.tier?.toLowerCase().includes("early")
                                      ? "#a78bfa"
                                      : t.tier?.toLowerCase().includes("last")
                                      ? "#f87171"
                                      : "#60a5fa",
                                  }}
                                >
                                  {t.tier || "—"}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <span
                                  className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase"
                                  style={
                                    t.status === "scanned"
                                      ? { background: "rgba(16,185,129,0.12)", color: "#34d399" }
                                      : t.status === "cancelled"
                                      ? { background: "rgba(239,68,68,0.12)", color: "#f87171" }
                                      : { background: "rgba(255,255,255,0.04)", color: "#555", border: "1px solid rgba(255,255,255,0.06)" }
                                  }
                                >
                                  {t.status === "scanned" ? "✓ Entré" : t.status === "cancelled" ? "Annulé" : "En attente"}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-xs text-gray-500">
                                {t.created_at
                                  ? new Date(t.created_at).toLocaleString("fr-CA", { dateStyle: "short", timeStyle: "short" })
                                  : "—"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ─── ADD TICKET TAB ─── */}
            {activeTab === "add" && (
              <div className="max-w-xl">
                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <h2 className="font-serif text-base font-bold text-white">Ajouter un billet manuellement</h2>
                    <p className="text-xs text-gray-600 mt-1">Pour les invités, sponsors ou billets presse</p>
                  </div>
                  <form onSubmit={handleAddTicket} className="p-6 space-y-4">
                    <input
                      type="text"
                      placeholder="Nom complet"
                      value={addForm.name}
                      onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={addForm.email}
                      onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                    <select
                      value={addForm.tier}
                      onChange={(e) => setAddForm((p) => ({ ...p, tier: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <option>Early Bird</option>
                      <option>Admission Générale</option>
                      <option>Last Chance</option>
                    </select>
                    <input
                      type="text"
                      placeholder="QR Code UUID (ex: a1b2c3d4-...)"
                      value={addForm.qr_code}
                      onChange={(e) => setAddForm((p) => ({ ...p, qr_code: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 text-white text-sm font-mono placeholder-gray-700 focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                    {addMsg && (
                      <p className={`text-sm ${addMsg.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>
                        {addMsg}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={addLoading}
                      className="w-full py-3 rounded-xl text-sm font-bold tracking-widest uppercase text-white disabled:opacity-50 transition-opacity"
                      style={{ background: "linear-gradient(135deg, #7A1F2B, #c0392b)" }}
                    >
                      {addLoading ? "Ajout en cours..." : "Ajouter le billet"}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}

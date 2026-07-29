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

type StatsData = {
  total: number;
  scanned: number;
  capacity: number;
  revenue: string;
  tiers: Record<string, { name: string; price: number; count: number; revenue: number }>;
  tickets: TicketRecord[];
};

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
      <main className="min-h-screen bg-noir flex items-center justify-center px-4">
        <div
          className="w-full max-w-sm glass-card rounded-2xl p-10 text-center"
          style={{ border: "1px solid rgba(123,47,247,0.2)" }}
        >
          <p className="text-xs tracking-[4px] uppercase text-gray-600 mb-3">Admin</p>
          <h1 className="font-serif text-2xl font-bold text-white mb-8">
            XPERIMENTAL VOL.2
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-center font-mono tracking-widest placeholder-gray-700 focus:outline-none focus:border-violet-electric transition-colors"
            />
            {loginError && (
              <p className="text-red-400 text-xs">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl font-bold tracking-widest uppercase text-sm text-white transition-opacity disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #7A1F2B, #7B2FF7)" }}
            >
              {loading ? "Connexion..." : "Accéder au dashboard"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // DASHBOARD
  const pct = data ? Math.min(100, Math.round((data.total / data.capacity) * 100)) : 0;

  return (
    <main className="min-h-screen bg-noir">
      {/* Top bar */}
      <header className="bg-noir-surface border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur">
        <div>
          <h1 className="font-serif text-lg font-bold text-white tracking-widest uppercase">
            Admin — Xperimental Vol.2
          </h1>
          {lastRefresh && (
            <p className="text-xs text-gray-600 mt-0.5">
              Actualisé à {lastRefresh.toLocaleTimeString("fr-CA")}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => loadStats()}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase bg-white/5 text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-all disabled:opacity-50"
          >
            ↻ Refresh
          </button>
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase text-white"
            style={{ background: "linear-gradient(135deg, #064e3b, #10b981)" }}
          >
            ↓ Export CSV
          </button>
          <a
            href="/scan"
            className="px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase text-white"
            style={{ background: "linear-gradient(135deg, #7A1F2B, #7B2FF7)" }}
          >
            📷 Scanner
          </a>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {loading && !data ? (
          <div className="text-center py-20 text-gray-600">Chargement...</div>
        ) : data ? (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Billets vendus", value: `${data.total}`, sub: `/ ${data.capacity} capacité` },
                { label: "Revenus bruts", value: `$${data.revenue}`, sub: "avant taxes & frais" },
                { label: "Scannés", value: `${data.scanned}`, sub: "à la porte" },
                { label: "Capacité", value: `${pct}%`, sub: "rempli" },
              ].map(({ label, value, sub }) => (
                <div
                  key={label}
                  className="glass-card rounded-2xl p-5 relative overflow-hidden"
                  style={{ border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ background: "linear-gradient(90deg, #7A1F2B, #7B2FF7)" }}
                  />
                  <p className="text-xs tracking-[2px] uppercase text-gray-600 mb-2">{label}</p>
                  <p className="text-3xl font-bold font-serif text-white">{value}</p>
                  <p className="text-xs text-gray-600 mt-1">{sub}</p>
                  {label === "Capacité" && (
                    <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: "linear-gradient(90deg, #7A1F2B, #7B2FF7)",
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Tier breakdown */}
            <div className="grid md:grid-cols-3 gap-4">
              {Object.entries(data.tiers).map(([id, tier]) => (
                <div
                  key={id}
                  className="glass-card rounded-2xl p-5"
                  style={{ border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <p className="text-xs tracking-[2px] uppercase text-gray-500 mb-1">{tier.name}</p>
                  <p className="text-2xl font-bold font-serif text-white">{tier.count}</p>
                  <p className="text-xs text-gray-600">{tier.price.toFixed(2)}$ / billet · ${tier.revenue.toFixed(2)} total</p>
                </div>
              ))}
            </div>

            {/* Add ticket form */}
            <div
              className="glass-card rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="px-6 py-4 border-b border-white/5">
                <h2 className="font-serif text-base font-bold text-white">
                  ➕ Ajouter un billet manuellement
                </h2>
              </div>
              <form onSubmit={handleAddTicket} className="p-6">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Nom complet"
                    value={addForm.name}
                    onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-violet-electric"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={addForm.email}
                    onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-violet-electric"
                  />
                  <select
                    value={addForm.tier}
                    onChange={(e) => setAddForm((p) => ({ ...p, tier: e.target.value }))}
                    className="bg-noir-surface border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-electric"
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
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder-gray-700 focus:outline-none focus:border-violet-electric"
                  />
                </div>
                {addMsg && (
                  <p className={`text-sm mb-4 ${addMsg.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>
                    {addMsg}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-8 py-3 rounded-xl text-sm font-bold tracking-widest uppercase text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #7A1F2B, #7B2FF7)" }}
                >
                  {addLoading ? "Ajout..." : "Ajouter"}
                </button>
              </form>
            </div>

            {/* Attendees table */}
            <div
              className="glass-card rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between gap-4">
                <h2 className="font-serif text-base font-bold text-white whitespace-nowrap">
                  Participants ({filteredTickets.length})
                </h2>
                <input
                  type="text"
                  placeholder="🔍 Filtrer par nom, email ou tier..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-electric w-64"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["#", "Nom", "Email", "Tier", "Statut", "Date achat"].map((h) => (
                        <th
                          key={h}
                          className="text-left px-5 py-3 text-xs tracking-[2px] uppercase text-gray-600 font-medium"
                        >
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
                        <tr
                          key={t.id}
                          className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-5 py-3 text-xs text-gray-700">{i + 1}</td>
                          <td className="px-5 py-3 text-sm font-semibold text-white">{t.name || "—"}</td>
                          <td className="px-5 py-3 text-xs text-gray-400">{t.email}</td>
                          <td className="px-5 py-3">
                            <span
                              className="badge text-xs"
                              style={{
                                background: t.tier?.toLowerCase().includes("early")
                                  ? "rgba(123,47,247,0.15)"
                                  : t.tier?.toLowerCase().includes("last")
                                  ? "rgba(122,31,43,0.15)"
                                  : "rgba(59,130,246,0.15)",
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
                              className="badge text-xs"
                              style={
                                t.status === "scanned"
                                  ? { background: "rgba(16,185,129,0.15)", color: "#34d399" }
                                  : t.status === "cancelled"
                                  ? { background: "rgba(239,68,68,0.15)", color: "#f87171" }
                                  : { background: "rgba(30,30,30,1)", color: "#555", border: "1px solid #222" }
                              }
                            >
                              {t.status === "scanned" ? "✓ Entré" : t.status === "cancelled" ? "Annulé" : "En attente"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-500">
                            {t.created_at
                              ? new Date(t.created_at).toLocaleString("fr-CA", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })
                              : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}

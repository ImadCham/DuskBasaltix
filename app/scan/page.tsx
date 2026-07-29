"use client";

import { useState, useCallback, useEffect } from "react";

type ScanResult = {
  valid: boolean;
  reason: "OK" | "ALREADY_SCANNED" | "CANCELLED" | "INVALID";
  message: string;
  name?: string;
  tier?: string;
  scanned_at?: string;
};

export default function ScanPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [cameraError, setCameraError] = useState("");
  const [cameraStarted, setCameraStarted] = useState(false);

  // Reset result after a few seconds
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        setResult(null);
        setScanning(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const validateQR = useCallback(async (qrData: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tickets/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_code_data: qrData }),
      });
      const data: ScanResult = await res.json();
      setResult(data);
    } catch {
      setResult({
        valid: false,
        reason: "INVALID",
        message: "Erreur de connexion. Réessayez.",
      });
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Camera QR scanning
  const startCamera = useCallback(async () => {
    setCameraError("");
    setCameraStarted(false);

    try {
      // Dynamic import to avoid SSR issues
      const { Html5Qrcode } = await import("html5-qrcode").catch(() => {
        throw new Error("Scanner non disponible");
      });

      const scanner = new Html5Qrcode("qr-reader");
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        async (decodedText: string) => {
          await scanner.stop();
          setCameraStarted(false);
          setScanning(false);
          await validateQR(decodedText);
        },
        undefined
      );
      setCameraStarted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Caméra non accessible";
      setCameraError(msg);
    }
  }, [validateQR]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    await validateQR(manualInput.trim());
    setManualInput("");
  };

  const getResultStyle = () => {
    if (!result) return {};
    if (result.valid) return { background: "linear-gradient(135deg, #064e3b, #065f46)", borderColor: "#10b981" };
    if (result.reason === "ALREADY_SCANNED") return { background: "linear-gradient(135deg, #78350f, #92400e)", borderColor: "#f59e0b" };
    return { background: "linear-gradient(135deg, #7f1d1d, #991b1b)", borderColor: "#ef4444" };
  };

  const getResultIcon = () => {
    if (!result) return null;
    if (result.valid) return "✓";
    if (result.reason === "ALREADY_SCANNED") return "⚠";
    return "✗";
  };

  return (
    <main className="min-h-screen bg-noir flex flex-col">
      {/* Header */}
      <header className="py-6 px-6 flex items-center justify-between border-b border-white/5">
        <div>
          <p className="text-xs tracking-[4px] uppercase text-gray-600 mb-1">Scanner</p>
          <h1 className="font-serif text-xl font-bold text-white">
            XPERIMENTAL VOL.2
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode("camera")}
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all ${
              mode === "camera"
                ? "text-white"
                : "bg-white/5 text-gray-500"
            }`}
            style={mode === "camera" ? { background: "linear-gradient(135deg, #7A1F2B, #7B2FF7)" } : {}}
          >
            Caméra
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all ${
              mode === "manual"
                ? "text-white"
                : "bg-white/5 text-gray-500"
            }`}
            style={mode === "manual" ? { background: "linear-gradient(135deg, #7A1F2B, #7B2FF7)" } : {}}
          >
            Manuel
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Result overlay */}
        {result && (
          <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8 border-4 text-center"
            style={getResultStyle()}
          >
            <div className="text-8xl font-bold mb-6 font-serif">
              {getResultIcon()}
            </div>
            <h2 className="font-serif text-3xl font-bold text-white mb-4">
              {result.valid ? "VALIDE" : result.reason === "ALREADY_SCANNED" ? "DÉJÀ SCANNÉ" : "INVALIDE"}
            </h2>
            {result.name && (
              <p className="text-xl text-white/90 font-semibold mb-2">{result.name}</p>
            )}
            {result.tier && (
              <p className="text-sm text-white/60 mb-4">{result.tier}</p>
            )}
            {result.scanned_at && (
              <p className="text-xs text-white/50">
                Scanné le{" "}
                {new Date(result.scanned_at).toLocaleString("fr-CA", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
            <button
              onClick={() => setResult(null)}
              className="mt-8 px-8 py-3 bg-white/20 rounded-2xl text-white font-bold text-sm tracking-widest uppercase"
            >
              Scanner suivant
            </button>
          </div>
        )}

        {/* Camera mode */}
        {mode === "camera" && (
          <div className="w-full max-w-sm">
            <div className="relative">
              {/* QR reader container */}
              <div
                id="qr-reader"
                className="w-full rounded-2xl overflow-hidden bg-black"
                style={{ minHeight: "300px" }}
              />
              {/* Scan overlay frame */}
              {cameraStarted && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-64 h-64">
                    {/* Corner brackets */}
                    {["top-left", "top-right", "bottom-left", "bottom-right"].map((pos) => (
                      <div
                        key={pos}
                        className="absolute w-8 h-8 border-2"
                        style={{
                          borderColor: "#7B2FF7",
                          top: pos.includes("top") ? 0 : "auto",
                          bottom: pos.includes("bottom") ? 0 : "auto",
                          left: pos.includes("left") ? 0 : "auto",
                          right: pos.includes("right") ? 0 : "auto",
                          borderTopWidth: pos.includes("bottom") ? 0 : undefined,
                          borderBottomWidth: pos.includes("top") ? 0 : undefined,
                          borderLeftWidth: pos.includes("right") ? 0 : undefined,
                          borderRightWidth: pos.includes("left") ? 0 : undefined,
                        }}
                      />
                    ))}
                    {/* Scan line */}
                    <div
                      className="absolute left-0 right-0 h-0.5 animate-scan-line"
                      style={{ background: "linear-gradient(90deg, transparent, #7B2FF7, transparent)" }}
                    />
                  </div>
                </div>
              )}
            </div>

            {cameraError && (
              <p className="text-red-400 text-sm text-center mt-4 bg-red-900/20 border border-red-800/30 rounded-xl px-4 py-3">
                {cameraError}
              </p>
            )}

            {!cameraStarted && (
              <button
                onClick={startCamera}
                className="mt-6 w-full py-5 rounded-2xl text-sm font-bold tracking-widest uppercase text-white"
                style={{ background: "linear-gradient(135deg, #7A1F2B, #7B2FF7)" }}
              >
                {cameraStarted ? "Scanner actif" : "Démarrer la caméra"}
              </button>
            )}

            <p className="text-xs text-gray-600 text-center mt-4">
              Pointe la caméra vers le QR code du billet
            </p>
          </div>
        )}

        {/* Manual mode */}
        {mode === "manual" && (
          <div className="w-full max-w-sm">
            <p className="text-gray-400 text-sm text-center mb-6">
              Colle ou tape le code UUID du billet
            </p>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white font-mono text-sm placeholder-gray-700 focus:outline-none focus:border-violet-electric"
              />
              <button
                type="submit"
                disabled={loading || !manualInput.trim()}
                className="w-full py-5 rounded-2xl text-sm font-bold tracking-widest uppercase text-white disabled:opacity-50 transition-opacity"
                style={{ background: "linear-gradient(135deg, #7A1F2B, #7B2FF7)" }}
              >
                {loading ? "Vérification..." : "Valider le billet"}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="py-4 px-6 text-center">
        <p className="text-xs text-gray-700 tracking-wider">
          Staff DUSK EVE × BASALTE — Page de scan sécurisée
        </p>
      </div>
    </main>
  );
}

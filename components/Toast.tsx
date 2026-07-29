"use client";

import { useEffect, useState } from "react";

type ToastMessage = {
  id: string;
  type: "success" | "error" | "info";
  text: string;
};

let toastListeners: ((msg: ToastMessage) => void)[] = [];

export function showToast(text: string, type: "success" | "error" | "info" = "success") {
  const msg: ToastMessage = {
    id: Math.random().toString(),
    type,
    text,
  };
  toastListeners.forEach((fn) => fn(msg));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (msg: ToastMessage) => {
      setToasts((prev) => [...prev, msg]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== msg.id));
      }, 4000);
    };

    toastListeners.push(handleToast);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== handleToast);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-fade-in transition-all ${
            t.type === "success"
              ? "bg-noir-surface/95 border-emerald-500/50 text-white"
              : t.type === "error"
              ? "bg-noir-surface/95 border-red-500/50 text-white"
              : "bg-noir-surface/95 border-ember/50 text-white"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
              t.type === "success"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : t.type === "error"
                ? "bg-red-500/20 text-red-400 border border-red-500/40"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
            }`}
          >
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
          </div>
          <p className="text-xs font-sans font-semibold leading-snug">{t.text}</p>
        </div>
      ))}
    </div>
  );
}

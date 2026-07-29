"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="inline-flex items-center bg-noir-surface/80 p-1 rounded-xl border border-white/15 backdrop-blur-md shadow-md">
      <button
        onClick={() => setLang("fr")}
        className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider transition-all ${
          lang === "fr"
            ? "bg-bordeaux text-white shadow-md border border-bordeaux-light/50"
            : "text-gray-400 hover:text-white"
        }`}
      >
        FR
      </button>
      <button
        onClick={() => setLang("en")}
        className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider transition-all ${
          lang === "en"
            ? "bg-bordeaux text-white shadow-md border border-bordeaux-light/50"
            : "text-gray-400 hover:text-white"
        }`}
      >
        EN
      </button>
    </div>
  );
}

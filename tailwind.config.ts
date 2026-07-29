import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bordeaux: {
          DEFAULT: "#7A1F2B",
          light: "#9B2535",
          dark: "#5A1520",
        },
        violet: {
          electric: "#7B2FF7",
          dark: "#5A1ED4",
          light: "#9B5FFB",
        },
        magenta: {
          DEFAULT: "#C026D3",
          dark: "#9B1AAA",
        },
        noir: {
          DEFAULT: "#0a0a0a",
          surface: "#111111",
          elevated: "#1a1a1a",
          border: "#222222",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "dusk-basalte": "linear-gradient(135deg, #7A1F2B 0%, #7B2FF7 100%)",
        "dusk-basalte-hover": "linear-gradient(135deg, #9B2535 0%, #9B5FFB 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-up": "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "count-down": "countdown 1s ease-in-out",
        "flicker": "flicker 8s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(40px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(123, 47, 247, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(123, 47, 247, 0.6), 0 0 80px rgba(122, 31, 43, 0.3)" },
        },
        countdown: {
          "0%": { transform: "scale(1.2)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        flicker: {
          "0%, 95%, 100%": { opacity: "1" },
          "96%": { opacity: "0.8" },
          "97%": { opacity: "1" },
          "98%": { opacity: "0.7" },
          "99%": { opacity: "1" },
        },
      },
      dropShadow: {
        glow: "0 0 20px rgba(123, 47, 247, 0.5)",
        "glow-red": "0 0 20px rgba(122, 31, 43, 0.5)",
      },
    },
  },
  plugins: [],
};

export default config;

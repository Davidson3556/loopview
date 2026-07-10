import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Loop lifecycle states
        loop: {
          fail: "#fb5a74",
          fixing: "#fbbf24",
          pass: "#34d399",
          pending: "#64748b",
        },
        // Surface palette (dark-first, cool neutral)
        ink: {
          950: "#05070c",
          900: "#0a0d15",
          850: "#0e121c",
          800: "#141926",
          700: "#1d2334",
          600: "#2b3348",
          500: "#3b4560",
        },
        brand: {
          DEFAULT: "#6366f1",
          light: "#a5b4fc",
          dark: "#4f46e5",
        },
        accent: {
          cyan: "#22d3ee",
          violet: "#a78bfa",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.05) inset, 0 12px 32px -16px rgba(0,0,0,0.8)",
        elevated:
          "0 1px 0 0 rgba(255,255,255,0.06) inset, 0 24px 64px -24px rgba(0,0,0,0.85)",
        "glow-brand": "0 0 0 1px rgba(99,102,241,0.25), 0 0 28px -6px rgba(99,102,241,0.55)",
        "glow-pass": "0 0 0 1px rgba(52,211,153,0.25), 0 0 24px -6px rgba(52,211,153,0.5)",
        "glow-fail": "0 0 0 1px rgba(251,90,116,0.25), 0 0 24px -6px rgba(251,90,116,0.5)",
        "glow-fixing": "0 0 0 1px rgba(251,191,36,0.25), 0 0 24px -6px rgba(251,191,36,0.5)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to right, rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.06) 1px, transparent 1px)",
        "loop-gradient":
          "linear-gradient(90deg, #fb5a74 0%, #fbbf24 50%, #34d399 100%)",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "0.7" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        "slide-up": {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "gradient-x": {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "glow-breathe": {
          "0%,100%": { opacity: "0.5" },
          "50%": { opacity: "0.85" },
        },
        "loading-sweep": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(650%)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        twinkle: {
          "0%,100%": { opacity: "0.15" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 1.6s cubic-bezier(0.4,0,0.6,1) infinite",
        "slide-up": "slide-up 0.35s cubic-bezier(0.16,1,0.3,1)",
        "fade-in": "fade-in 0.4s ease-out",
        shimmer: "shimmer 1.6s infinite",
        float: "float 6s ease-in-out infinite",
        "gradient-x": "gradient-x 6s ease infinite",
        "glow-breathe": "glow-breathe 4s ease-in-out infinite",
        "loading-sweep": "loading-sweep 1.3s cubic-bezier(0.45,0,0.55,1) infinite",
        marquee: "marquee 34s linear infinite",
        twinkle: "twinkle 3.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

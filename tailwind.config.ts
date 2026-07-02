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
          fail: "#f43f5e", // red — test failed
          fixing: "#f59e0b", // amber — applying fix
          pass: "#22c55e", // green — test passed
          pending: "#64748b", // slate — pending/idle
        },
        // Surface palette (dark-first)
        ink: {
          950: "#080b12",
          900: "#0b0f17",
          850: "#0f1420",
          800: "#141a28",
          700: "#1c2333",
          600: "#2a3346",
        },
        brand: {
          DEFAULT: "#6366f1",
          light: "#818cf8",
          dark: "#4f46e5",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "0.8" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        "slide-up": {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 1.4s cubic-bezier(0.4,0,0.6,1) infinite",
        "slide-up": "slide-up 0.3s ease-out",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};

export default config;

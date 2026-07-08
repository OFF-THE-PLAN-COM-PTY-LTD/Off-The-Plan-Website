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
        navy: "#0E2638",
        "navy-deep": "#081827",
        "navy-mid": "#0b1f30",
        orange: "#E8722C",
        cream: "#F7F4EE",
        "cream-alt": "#fbfaf6",
        ink: "#14181d",
        "ink-light": "#f7f4ee",
        line: "rgba(20,24,29,0.1)",
        "line-dark": "rgba(255,255,255,0.08)",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        brand: ["var(--font-montserrat)", "system-ui", "sans-serif"],
        bebas: ["var(--font-bebas-neue)", "Impact", "sans-serif"],
      },
      fontSize: {
        "hero-xl": ["140px", { lineHeight: "1", letterSpacing: "-0.03em", fontWeight: "300" }],
        "hero-lg": ["80px", { lineHeight: "1.05", letterSpacing: "-0.03em", fontWeight: "300" }],
        "section-xl": ["64px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "300" }],
        "section-lg": ["44px", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "300" }],
        "card-xl": ["28px", { lineHeight: "1.25" }],
        "card-lg": ["20px", { lineHeight: "1.3" }],
        "body-lg": ["17px", { lineHeight: "1.65" }],
        "body-md": ["15px", { lineHeight: "1.55" }],
        "label-lg": ["11px", { lineHeight: "1.2", letterSpacing: "0.18em", fontWeight: "500" }],
        "label-sm": ["9px", { lineHeight: "1.2", letterSpacing: "0.14em", fontWeight: "500" }],
      },
      spacing: {
        "18": "72px",
        "30": "120px",
      },
      keyframes: {
        reveal: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        reveal: "reveal 0.6s ease-out forwards",
        "pulse-dot": "pulse-dot 1.5s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;

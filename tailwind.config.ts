import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#050505",
        "ink-soft": "#0c0c0d",
        "ink-line": "#1c1c1e",
        bone: "#f4f1ea",
        brand: {
          white: "#ffffff",
          yellow: "#ffc400",
          pink: "#00d9ff",
          cyan: "#00d9ff",
          red: "#ff3b1d",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "cursive"],
        brush: ["var(--font-brush)", "cursive"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        container: "1360px",
      },
      borderRadius: {
        sticker: "14px",
      },
      boxShadow: {
        glowPink: "0 0 40px -8px rgba(0,217,255,0.5)",
        glowCyan: "0 0 40px -8px rgba(0,217,255,0.5)",
        glowYellow: "0 0 40px -8px rgba(255,196,0,0.5)",
        card: "0 20px 60px -20px rgba(0,0,0,0.9)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pulse-soft": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease forwards",
        "spin-slow": "spin-slow 22s linear infinite",
        marquee: "marquee 26s linear infinite",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

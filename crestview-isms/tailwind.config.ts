import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
    "./src/providers/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f172a",
        surface: "#1e293b",
        primary: {
          DEFAULT: "#1d4ed8",
          foreground: "#f8fafc",
          soft: "#3b82f6"
        },
        success: "#16a34a",
        warning: "#ca8a04",
        danger: "#dc2626",
        muted: "#94a3b8"
      },
      fontFamily: {
        heading: ["var(--font-sora)", "ui-sans-serif", "system-ui"],
        sans: ["var(--font-dm-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "SFMono-Regular"]
      },
      boxShadow: {
        "blue-soft": "0 20px 60px -28px rgb(30 64 175 / 0.55)"
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" }
        },
        "pulse-slow": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.035)", opacity: "0.86" }
        }
      },
      animation: {
        fadeInUp: "fadeInUp 0.4s ease-out",
        slideInRight: "slideInRight 0.3s ease-out",
        "pulse-slow": "pulse-slow 2.8s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;

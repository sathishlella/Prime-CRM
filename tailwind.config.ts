import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "General Sans", "system-ui", "sans-serif"],
      },
      colors: {
        // Primary palette — soft blue
        brand: {
          50:  "#f0f7ff",
          100: "#e0f0ff",
          200: "#bae0ff",
          300: "#7ec8ff",
          400: "#38a9ff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        // Accent — mint / green
        mint: {
          50:  "#f0fdf8",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
        // Status colours (exact from design spec)
        status: {
          applied:     "#3b82f6",
          in_progress: "#f59e0b",
          interview:   "#10b981",
          rejected:    "#ef4444",
          offered:     "#8b5cf6",
        },
        // Neutral surface
        surface: {
          DEFAULT: "#f8faff",
          mid:     "#f0f5ff",
          purple:  "#f5f3ff",
        },
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #3b82f6, #10b981)",
        "gradient-page":  "linear-gradient(155deg, #f8faff 0%, #f0f5ff 40%, #f5f3ff 100%)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        glass:       "0 4px 24px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.02)",
        "glass-hover": "0 8px 32px rgba(0,0,0,0.07), 0 2px 6px rgba(0,0,0,0.03)",
        brand:       "0 4px 14px rgba(59,130,246,0.25)",
        "brand-lg":  "0 8px 28px rgba(59,130,246,0.30)",
      },
      backdropBlur: {
        glass: "20px",
      },
      animation: {
        "blob-a":  "blobA 20s ease-in-out infinite",
        "blob-b":  "blobB 25s ease-in-out infinite",
        "blob-c":  "blobC 17s ease-in-out infinite",
        "fade-up": "fadeUp 0.45s cubic-bezier(.4,0,.2,1) both",
        float:     "float 4s ease-in-out infinite",
        spin:      "spin 0.8s linear infinite",
        shake:     "shake 0.4s cubic-bezier(.4,0,.2,1) both",
        "count-up": "fadeUp 0.55s cubic-bezier(.4,0,.2,1) both",
      },
      keyframes: {
        blobA: {
          "0%, 100%": { borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%", transform: "translate(0,0)" },
          "33%":      { borderRadius: "30% 60% 70% 40% / 50% 60% 30% 60%", transform: "translate(20px, -15px)" },
          "66%":      { borderRadius: "50% 60% 40% 50% / 40% 50% 60% 50%", transform: "translate(-10px, 10px)" },
        },
        blobB: {
          "0%, 100%": { borderRadius: "40% 60% 60% 40% / 60% 40% 60% 40%", transform: "translate(0,0)" },
          "33%":      { borderRadius: "60% 40% 40% 60% / 40% 60% 40% 60%", transform: "translate(-15px, 20px)" },
          "66%":      { borderRadius: "50% 50% 60% 40% / 50% 40% 60% 50%", transform: "translate(10px, -8px)" },
        },
        blobC: {
          "0%, 100%": { borderRadius: "50% 50% 40% 60% / 40% 60% 50% 50%", transform: "translate(0,0)" },
          "50%":      { borderRadius: "60% 40% 60% 40% / 60% 40% 50% 60%", transform: "translate(12px, -18px)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-6px)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%":      { transform: "translateX(-6px)" },
          "40%":      { transform: "translateX(6px)" },
          "60%":      { transform: "translateX(-4px)" },
          "80%":      { transform: "translateX(4px)" },
        },
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(.4,0,.2,1)",
      },
    },
  },
  plugins: [],
};

export default config;

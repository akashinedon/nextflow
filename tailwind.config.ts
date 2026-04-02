import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Canvas background
        canvas: {
          bg: "#0a0a0f",
          dot: "#1a1a2e",
        },
        // Surface layers
        surface: {
          0: "#0d0d14",
          1: "#12121c",
          2: "#17172a",
          3: "#1e1e30",
          border: "#2a2a40",
          "border-hover": "#3d3d60",
        },
        // Accent — violet/indigo gradient
        accent: {
          DEFAULT: "#7c3aed",
          light: "#8b5cf6",
          dark: "#6d28d9",
          glow: "rgba(124, 58, 237, 0.35)",
        },
        // Node handle colors
        handle: {
          text: "#60a5fa",    // blue
          image: "#34d399",   // emerald
          video: "#f59e0b",   // amber
          number: "#f472b6",  // pink
          any: "#94a3b8",     // slate
        },
        // Status colors
        status: {
          success: "#22c55e",
          failed: "#ef4444",
          running: "#7c3aed",
          idle: "#4b5563",
          partial: "#f59e0b",
        },
      },
      backgroundImage: {
        "dot-grid":
          "radial-gradient(circle, #1f1f35 1px, transparent 1px)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "accent-gradient":
          "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
      },
      backgroundSize: {
        "dot-grid": "24px 24px",
      },
      boxShadow: {
        "node": "0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(42,42,64,0.8)",
        "node-hover": "0 4px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.4)",
        "node-running": "0 0 0 2px #7c3aed, 0 0 20px rgba(124,58,237,0.5)",
        "glow-violet": "0 0 20px rgba(124, 58, 237, 0.4)",
        "glow-sm": "0 0 8px rgba(124, 58, 237, 0.3)",
      },
      animation: {
        "pulse-glow": "pulse-glow 1.5s ease-in-out infinite",
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in-left": "slide-in-left 0.25s ease-out",
        "slide-in-right": "slide-in-right 0.25s ease-out",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": {
            boxShadow:
              "0 0 0 2px #7c3aed, 0 0 15px rgba(124,58,237,0.3)",
          },
          "50%": {
            boxShadow:
              "0 0 0 2px #8b5cf6, 0 0 30px rgba(139,92,246,0.6)",
          },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

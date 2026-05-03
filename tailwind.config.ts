import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--color-ink)",
        accent: "var(--color-accent)",
        haze: "var(--color-haze)",
        glow: "var(--color-glow)",
        surface: "var(--color-surface)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(14, 116, 144, 0.2), 0 18px 44px -28px rgba(14, 116, 144, 0.7)",
      },
    },
  },
  plugins: [],
} satisfies Config;

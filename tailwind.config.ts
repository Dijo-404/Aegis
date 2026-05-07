import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand
        purple: {
          DEFAULT: "#533afd",
          hover: "#4434d4",
          deep: "#2e2b8c",
          mid: "#665efd",
          light: "#b9b9f9",
          soft: "#d6d9fc",
          dashed: "#362baa",
        },
        navy: {
          DEFAULT: "#061b31",
          dark: "#0d253d",
          brand: "#1c1e54",
        },
        ruby: "#ea2261",
        magenta: {
          DEFAULT: "#f96bee",
          light: "#ffd7ef",
        },
        // Neutral scale
        heading: "#061b31",
        label: "#273951",
        body: "#64748d",
        // Surface
        border: {
          DEFAULT: "#e5edf5",
          purple: "#b9b9f9",
          softpurple: "#d6d9fc",
        },
        // Status
        success: {
          DEFAULT: "#15be53",
          text: "#108c3d",
        },
        lemon: "#9b6829",
      },
      fontFamily: {
        sans: [
          "Inter",
          "sohne-var",
          "SF Pro Display",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "SourceCodePro",
          "SFMono-Regular",
          "ui-monospace",
          "monospace",
        ],
      },
      fontSize: {
        "display-hero": [
          "3.5rem",
          { lineHeight: "1.03", letterSpacing: "-1.4px", fontWeight: "300" },
        ],
        "display-large": [
          "3rem",
          { lineHeight: "1.15", letterSpacing: "-0.96px", fontWeight: "300" },
        ],
        "section-heading": [
          "2rem",
          { lineHeight: "1.10", letterSpacing: "-0.64px", fontWeight: "300" },
        ],
        "subheading-lg": [
          "1.625rem",
          { lineHeight: "1.12", letterSpacing: "-0.26px", fontWeight: "300" },
        ],
        subheading: [
          "1.375rem",
          { lineHeight: "1.10", letterSpacing: "-0.22px", fontWeight: "300" },
        ],
      },
      boxShadow: {
        ambient: "rgba(23,23,23,0.06) 0px 3px 6px",
        standard: "rgba(23,23,23,0.08) 0px 15px 35px 0px",
        elevated:
          "rgba(50,50,93,0.25) 0px 30px 45px -30px, rgba(0,0,0,0.1) 0px 18px 36px -18px",
        deep: "rgba(3,3,39,0.25) 0px 14px 21px -14px, rgba(0,0,0,0.1) 0px 8px 17px -8px",
        ring: "0 0 0 2px #533afd",
        topedge: "rgba(0,55,112,0.08) 0px 1px 0px",
      },
      borderRadius: {
        micro: "1px",
        // 4 / 5 / 6 / 8 already covered via Tailwind's default rounded-{}
      },
    },
  },
  plugins: [],
} satisfies Config;

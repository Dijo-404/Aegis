import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const coopCoepHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    headers: coopCoepHeaders,
  },
  preview: {
    headers: coopCoepHeaders,
  },
  optimizeDeps: {
    exclude: ["@huggingface/transformers", "tesseract.js"],
  },
  build: {
    target: "esnext",
    chunkSizeWarningLimit: 2000,
  },
});

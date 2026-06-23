import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1200,
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@obscura/shared": path.resolve(__dirname, "../../packages/shared/src"),
      "@obscura/media-core": path.resolve(__dirname, "../../packages/media-core/src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}", "test/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: ["./test/setup.ts"],
  },
});

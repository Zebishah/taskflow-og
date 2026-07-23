import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },

  test: {
    environment: "jsdom",

    setupFiles: ["./src/test/setup.ts"],

    globals: false,

    css: true,

    clearMocks: true,

    restoreMocks: true,

    mockReset: true,

    coverage: {
      provider: "v8",

      reporter: ["text", "html"],

      reportsDirectory: "./coverage",

      include: ["src/features/tasks/**/*.{ts,tsx}"],

      exclude: ["src/**/*.test.{ts,tsx}", "src/test/**"],
    },
  },
});

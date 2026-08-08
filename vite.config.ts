/// <reference types="vitest/config" />

import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

import * as path from "node:path";

import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  define: {
    __CLIENT_VERSION__: JSON.stringify(pkg.version),
    "import.meta.vitest": "undefined",
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // Add more aliases as needed
    },
  },
  test: {
    includeSource: ["src/**/*.ts"],
    exclude: ["dist/**/*", "node_modules/**/*"],
  },
});

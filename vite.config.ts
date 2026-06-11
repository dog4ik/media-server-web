import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

import * as path from "node:path";

import pkg from "./package.json";

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  define: {
    __CLIENT_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Add more aliases as needed
    },
  },
});

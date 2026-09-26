import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    preserveSymlinks: false,
  },
  server: {
    port: 5173,
    fs: {
      allow: [path.resolve(import.meta.dirname, "../..")],
    },
  },
});

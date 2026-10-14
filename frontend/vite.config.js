
import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,

  server: {
    host: "127.0.0.1",
    proxy: {
      "/api/gifts": {
        target: "http://localhost:3001",
        changeOrigin: true
      }
    }
  },

  build: {
    outDir: "dist"
  }
});

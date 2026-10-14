import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pagesDir = path.join(__dirname, "src", "pages");

const input = {
  index: path.join(__dirname, "index.html"),
};

if (fs.existsSync(pagesDir)) {
  for (const file of fs.readdirSync(pagesDir)) {
    if (file.endsWith(".html")) {
      input[path.basename(file, ".html")] = path.join(pagesDir, file);
    }
  }
}

export default defineConfig({
  root: __dirname,

  server: {
    host: "127.0.0.1",
    proxy: {
      "/api/gifts": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: "dist",
    rollupOptions: {
      input,
    },
  },
});
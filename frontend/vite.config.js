
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "127.0.0.1",
    proxy: {
      "/api/gifts": {
        target: "http://localhost:3001",
        changeOrigin: true
      }
    }
  }
});

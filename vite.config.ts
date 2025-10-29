import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: true,
    watch: {
      usePolling: true,
      interval: 150, // 100–300 ms
    },
  },
});

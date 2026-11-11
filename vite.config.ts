import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1200,
  },
  server: {
    port: 5173,
    host: true,
    // The sandbox's inotify watcher misses edits, so the dev server serves
    // stale modules. Polling is reliable here and costs nothing in production.
    watch: { usePolling: true, interval: 400 },
  },
});

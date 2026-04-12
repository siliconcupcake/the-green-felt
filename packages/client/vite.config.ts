import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  publicDir: path.resolve(import.meta.dirname, 'public'),
  plugins: [react()],
  resolve: {
    alias: {
      '@the-green-felt/shared': path.resolve(import.meta.dirname, '../shared/src'),
      '@the-green-felt/server': path.resolve(import.meta.dirname, '../server/src'),
    },
  },
  server: {
    port: 3000,
    watch: {
      usePolling: true,
      interval: 500,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/trpc': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});

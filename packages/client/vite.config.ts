import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  publicDir: path.resolve(__dirname, 'public'),
  plugins: [react()],
  resolve: {
    alias: {
      '@the-green-felt/shared': path.resolve(__dirname, '../shared/src'),
      '@the-green-felt/server': path.resolve(__dirname, '../server/src'),
    },
  },
  server: {
    port: 3002,
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

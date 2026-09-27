import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server on 5173 by default; point VITE_API_BASE_URL (see .env.example)
// at your Node API (http://192.168.8.10:8094 on your LAN setup).
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://192.168.8.10:8094',
        changeOrigin: true,
      },
    },
  },
});

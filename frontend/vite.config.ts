import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Mirror the production nginx (frontend/nginx.conf) so dev on :5173 works.
      // Targets are the HOST-published ports of the Docker stack.
      // Backend API (+ the workshop WebSocket at /api/v1/ws/*).
      '/api': {
        target: process.env.VITE_BACKEND_URL ?? 'http://localhost:8010',
        changeOrigin: true,
        ws: true,
      },
      // Auth service — /authsvc/login -> auth-service /api/login (same as nginx).
      '/authsvc': {
        target: process.env.VITE_AUTH_PROXY_TARGET ?? 'http://localhost:8002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/authsvc/, '/api'),
      },
    },
  },
})

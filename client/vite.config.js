import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import process from 'process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
// https://vite.dev/config/
// Forced restart for mobile fixes 2
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [react(), tailwindcss()],
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // phosphor: ['@phosphor-icons/react'],
          charts: ['recharts'],
          motion: ['framer-motion']
        }
      }
    }
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4050',
        changeOrigin: true,
        secure: false,
        // SSE (Server-Sent Events) needs response buffering disabled
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.url.includes('/notifications/stream')) {
              proxyReq.setHeader('Cache-Control', 'no-cache');
              proxyReq.setHeader('Accept', 'text/event-stream');
            }
          });
        },
      }
    }
  }
})

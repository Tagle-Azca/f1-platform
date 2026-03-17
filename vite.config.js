import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    allowedHosts: ['.ngrok-free.dev', '.ngrok.io', '.ngrok-free.app'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor'))
              return 'vendor-charts'
            if (id.includes('framer-motion'))
              return 'vendor-motion'
            if (id.includes('react-dom') || id.includes('react-router') || id.includes('react/'))
              return 'vendor-react'
            return 'vendor'
          }
        },
      },
    },
  },
})
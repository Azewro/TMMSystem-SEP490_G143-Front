import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api-address': {
        target: 'https://provinces.open-api.vn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-address/, ''),
      },
      // Add proxy for main backend API
      '/api': {
        target: 'https://tmmsystem-sep490g143-production.up.railway.app',
        changeOrigin: true,
      },
    },
  },
})

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
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      // Add proxy for main backend API
      '/api': {
        target: 'https://tmmsystem-sep490g143-production.up.railway.app',
        changeOrigin: true,
      },
    },
  },
})

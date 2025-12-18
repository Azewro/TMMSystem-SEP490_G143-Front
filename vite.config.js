import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_BASE_URL || 'https://tmmsystem-sep490g143-production.up.railway.app'

  return {
    plugins: [react()],
    define: {
      // Fix for sockjs-client "global is not defined" error
      global: 'globalThis',
    },
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
          target: apiTarget,
          changeOrigin: true,
        },
      },
      // Add WebSocket proxy for real-time updates
      '/ws': {
        target: 'https://tmmsystem-sep490g143-production.up.railway.app',
        changeOrigin: true,
        ws: true, // Enable WebSocket proxying
      },
    },
  }
})

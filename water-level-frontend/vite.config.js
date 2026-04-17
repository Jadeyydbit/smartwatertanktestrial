import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/esp32': {
        target: process.env.VITE_ESP32_TARGET_URL || 'http://192.168.0.101',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/esp32/, ''),
      },
    },
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5833,
    proxy: {
      '/api': {
        target: 'http://localhost:5834',
        changeOrigin: true
      }
    }
  }
}) 
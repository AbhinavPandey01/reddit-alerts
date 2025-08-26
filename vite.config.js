import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3111,
    proxy: {
      '/api': {
        target: 'http://localhost:3999',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist'
  }
}) 
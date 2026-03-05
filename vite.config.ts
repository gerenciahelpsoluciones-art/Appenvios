import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/siigo-api': {
        target: 'https://api.siigo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/siigo-api/, ''),
      },
    },
  },
})

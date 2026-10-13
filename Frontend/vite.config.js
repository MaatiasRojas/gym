import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Todo lo que empieza con /api se manda al backend (npm run dev en la carpeta Backend).
    // Así funciona igual desde la compu y desde el celular (npm run dev -- --host).
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})

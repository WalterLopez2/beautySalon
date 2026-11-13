import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// En desarrollo, las peticiones a /api se reenvian al backend
// (`pnpm dev:backend`), asi el frontend no necesita saber su direccion.
const URL_DEL_BACKEND = process.env.BACKEND_URL ?? 'http://localhost:3000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': URL_DEL_BACKEND,
    },
  },
})

import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { politicaDeContenido } from './seguridad/politicaDeContenido.ts'

// En desarrollo, las peticiones a /api se reenvian al backend
// (`pnpm dev:backend`), asi el frontend no necesita saber su direccion.
const URL_DEL_BACKEND = process.env.BACKEND_URL ?? 'http://localhost:3000'

// Mismo valor por defecto que `URL_DE_LA_API` en src/compartido/configuracion.ts.
const URL_DE_LA_API_POR_DEFECTO = '/api'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const entorno = loadEnv(mode, import.meta.dirname)
  const urlDeLaApi = entorno.VITE_API_URL ?? URL_DE_LA_API_POR_DEFECTO

  return {
    plugins: [react(), politicaDeContenido(urlDeLaApi)],
    server: {
      proxy: {
        '/api': URL_DEL_BACKEND,
      },
    },
  }
})

// Carga `server/.env` si existe (en produccion las variables vienen del
// hosting y el archivo no esta). Usa la funcion nativa de Node, sin dotenv.

import { existsSync } from 'node:fs';

const ARCHIVO_ENV = '.env';

export function cargarArchivoEnv(): void {
  if (existsSync(ARCHIVO_ENV)) {
    process.loadEnvFile(ARCHIVO_ENV);
  }
}

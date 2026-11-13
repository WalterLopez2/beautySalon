// Lee y valida las variables de entorno UNA vez al arrancar. Si falta algo
// importante, el servidor no arranca y dice exactamente que falta, en vez de
// fallar mas tarde con un error confuso.

import type { PoolConfig } from 'pg';

export interface Configuracion {
  puerto: number;
  baseDeDatos: PoolConfig;
  secretoDeTokens: string;
  duracionDeSesionMs: number;
}

type Entorno = Record<string, string | undefined>;

const LONGITUD_MINIMA_DEL_SECRETO = 32;
const MILISEGUNDOS_POR_HORA = 60 * 60 * 1000;

export function leerConfiguracion(entorno: Entorno = process.env): Configuracion {
  return {
    puerto: leerNumero(entorno, 'PORT', 3000),
    baseDeDatos: leerConfiguracionDeBaseDeDatos(entorno),
    secretoDeTokens: leerSecretoDeTokens(entorno),
    duracionDeSesionMs: leerNumero(entorno, 'DURACION_SESION_HORAS', 12) * MILISEGUNDOS_POR_HORA,
  };
}

// Los scripts de base de datos solo necesitan esta parte.
export function leerConfiguracionDeBaseDeDatos(entorno: Entorno = process.env): PoolConfig {
  return {
    host: entorno.DB_HOST ?? 'localhost',
    port: leerNumero(entorno, 'DB_PORT', 5432),
    database: leerObligatoria(entorno, 'DB_NAME'),
    user: leerObligatoria(entorno, 'DB_USER'),
    password: entorno.DB_PASSWORD ?? '',
  };
}

function leerSecretoDeTokens(entorno: Entorno): string {
  const secreto = leerObligatoria(entorno, 'TOKEN_SECRETO');
  if (secreto.length < LONGITUD_MINIMA_DEL_SECRETO) {
    throw new Error(`TOKEN_SECRETO debe tener al menos ${LONGITUD_MINIMA_DEL_SECRETO} caracteres.`);
  }
  return secreto;
}

function leerObligatoria(entorno: Entorno, nombre: string): string {
  const valor = entorno[nombre]?.trim();
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre}. Revisa tu archivo server/.env.`);
  }
  return valor;
}

function leerNumero(entorno: Entorno, nombre: string, porDefecto: number): number {
  const crudo = entorno[nombre]?.trim();
  if (!crudo) return porDefecto;

  const valor = Number(crudo);
  if (!Number.isFinite(valor) || valor <= 0) {
    throw new Error(`La variable de entorno ${nombre} debe ser un numero positivo.`);
  }
  return valor;
}

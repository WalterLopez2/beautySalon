// Lee y valida las variables de entorno UNA vez al arrancar. Si falta algo
// importante, el servidor no arranca y dice exactamente que falta, en vez de
// fallar mas tarde con un error confuso.

import { isIP } from 'node:net';
import type { PoolConfig } from 'pg';

export interface Configuracion {
  puerto: number;
  direccion: string; // 127.0.0.1 = solo esta computadora
  baseDeDatos: PoolConfig;
  secretoDeTokens: string;
  duracionDeSesionMs: number;
  proxiesDeConfianza: number; // 0 en tu computadora; 1 o mas detras de un hosting
  soloHttps: boolean;
}

type Entorno = Record<string, string | undefined>;

const LONGITUD_MINIMA_DEL_SECRETO = 32;
const SOLO_ESTA_COMPUTADORA = '127.0.0.1';
const MILISEGUNDOS_POR_HORA = 60 * 60 * 1000;

export interface OpcionesDeArranque {
  // `pnpm start` lo activa: asi no depende de que alguien recuerde NODE_ENV.
  iniciadaParaProduccion?: boolean;
}

export function leerConfiguracion(
  entorno: Entorno = process.env,
  { iniciadaParaProduccion = false }: OpcionesDeArranque = {},
): Configuracion {
  const esProduccion = iniciadaParaProduccion || entorno.NODE_ENV?.trim().toLowerCase() === 'production';
  const proxiesDeConfianza = leerEnteroNoNegativo(entorno, 'PROXIES_DE_CONFIANZA', 0);

  return {
    puerto: leerNumero(entorno, 'PORT', 3000),
    direccion: leerDireccion(entorno),
    baseDeDatos: leerConfiguracionDeBaseDeDatos(entorno),
    secretoDeTokens: leerSecretoDeTokens(entorno),
    duracionDeSesionMs: leerNumero(entorno, 'DURACION_SESION_HORAS', 12) * MILISEGUNDOS_POR_HORA,
    proxiesDeConfianza,
    soloHttps: leerSoloHttps(entorno, proxiesDeConfianza, esProduccion),
  };
}

// Node escucha en HTTP y el HTTPS lo pone el proxy del hosting. Sin un proxy
// de confianza ninguna peticion contaria como HTTPS y se rechazarian todas:
// mejor no arrancar y decir por que.
function leerSoloHttps(entorno: Entorno, proxiesDeConfianza: number, esProduccion: boolean): boolean {
  const soloHttps = leerBooleano(entorno, 'SOLO_HTTPS', false);
  if (esProduccion && !soloHttps) {
    throw new Error('En produccion SOLO_HTTPS debe ser true. En tu computadora usa pnpm dev:backend.');
  }
  if (soloHttps && proxiesDeConfianza === 0) {
    throw new Error('SOLO_HTTPS=true necesita PROXIES_DE_CONFIANZA de 1 o mas: el HTTPS lo pone el proxy del hosting.');
  }
  return soloHttps;
}

// Cerrada por defecto: si alguien llega al puerto sin pasar por el proxy puede
// inventar su IP y fingir HTTPS con X-Forwarded-*. Abrirla es una decision.
function leerDireccion(entorno: Entorno): string {
  const direccion = entorno.DIRECCION_DE_ESCUCHA?.trim() || SOLO_ESTA_COMPUTADORA;
  if (isIP(direccion) === 0) {
    throw new Error('La variable de entorno DIRECCION_DE_ESCUCHA debe ser una direccion IP, sin puerto.');
  }
  return direccion;
}

// Los scripts de base de datos solo necesitan esta parte.
export function leerConfiguracionDeBaseDeDatos(entorno: Entorno = process.env): PoolConfig {
  return {
    host: entorno.DB_HOST ?? 'localhost',
    port: leerNumero(entorno, 'DB_PORT', 5432),
    database: leerObligatoria(entorno, 'DB_NAME'),
    user: leerObligatoria(entorno, 'DB_USER'),
    password: entorno.DB_PASSWORD ?? '',
    ssl: leerSslDeBaseDeDatos(entorno),
  };
}

// Con DB_SSL=true la conexion con PostgreSQL va cifrada (telefonos, nombres y
// citas no viajan en texto plano) y se verifica el certificado del servidor:
// sin esa verificacion, cualquiera en el camino podria hacerse pasar por la
// base de datos. Por defecto va apagado porque en tu computadora la base es
// local y no tiene certificado.
function leerSslDeBaseDeDatos(entorno: Entorno): PoolConfig['ssl'] {
  return leerBooleano(entorno, 'DB_SSL', false) ? { rejectUnauthorized: true } : false;
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
    throw new Error(`Falta la variable de entorno ${nombre}. Revisa tu archivo backend/.env.`);
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

// Solo acepta "true" o "false". Un error de tipeo ("ture", "si") detiene el
// arranque en vez de apagar una proteccion sin que nadie se entere.
function leerBooleano(entorno: Entorno, nombre: string, porDefecto: boolean): boolean {
  const crudo = entorno[nombre]?.trim().toLowerCase();
  if (!crudo) return porDefecto;
  if (crudo === 'true') return true;
  if (crudo === 'false') return false;
  throw new Error(`La variable de entorno ${nombre} debe ser true o false.`);
}

function leerEnteroNoNegativo(entorno: Entorno, nombre: string, porDefecto: number): number {
  const crudo = entorno[nombre]?.trim();
  if (!crudo) return porDefecto;

  const valor = Number(crudo);
  if (!Number.isInteger(valor) || valor < 0) {
    throw new Error(`La variable de entorno ${nombre} debe ser un entero igual o mayor a cero.`);
  }
  return valor;
}

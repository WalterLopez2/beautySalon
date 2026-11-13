// Contrasenas con scrypt (incluido en Node, sin dependencias externas).
// Nunca se guarda la contrasena: solo "scrypt$<sal>$<hash>". La sal es
// aleatoria, asi dos duenas con la misma contrasena tienen hashes distintos.

import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const derivarClave = promisify(scrypt) as (contrasena: string, sal: Buffer, longitud: number) => Promise<Buffer>;

const ALGORITMO = 'scrypt';
const BYTES_DE_SAL = 16;
const BYTES_DE_CLAVE = 64;
export const LONGITUD_MINIMA_DE_CONTRASENA = 10;

export async function cifrarContrasena(contrasena: string): Promise<string> {
  const sal = randomBytes(BYTES_DE_SAL);
  const clave = await derivarClave(contrasena, sal, BYTES_DE_CLAVE);
  return [ALGORITMO, sal.toString('hex'), clave.toString('hex')].join('$');
}

export async function verificarContrasena(contrasena: string, guardada: string): Promise<boolean> {
  const [algoritmo, salHex, claveHex] = guardada.split('$');
  if (algoritmo !== ALGORITMO || !salHex || !claveHex) return false;

  const esperada = Buffer.from(claveHex, 'hex');
  const calculada = await derivarClave(contrasena, Buffer.from(salHex, 'hex'), esperada.length);
  // Comparacion en tiempo constante: no revela cuantos bytes coincidieron.
  return timingSafeEqual(calculada, esperada);
}

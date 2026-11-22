// Lee los archivos de backend/migraciones. Va aparte del Migrador para que
// este se pueda probar sin tocar el disco.

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import type { Migracion } from './Migrador';

const CARPETA = fileURLToPath(new URL('../../../migraciones', import.meta.url));

export async function leerMigraciones(): Promise<Migracion[]> {
  const nombres = (await readdir(CARPETA)).filter((nombre) => nombre.endsWith('.sql')).sort();
  return Promise.all(nombres.map(async (nombre) => ({ nombre, sql: await readFile(join(CARPETA, nombre), 'utf8') })));
}

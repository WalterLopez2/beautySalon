// Pone la base al dia con las migraciones de backend/migraciones. No carga
// datos: servicios, horario y demas los configura la duena desde el panel. Se
// puede correr las veces que haga falta.
//
//   pnpm db:preparar

import pg from 'pg';
import { BaseDeDatosPostgres } from '../compartido/baseDeDatos/baseDeDatos';
import { leerMigraciones } from '../compartido/baseDeDatos/leerMigraciones';
import { Migrador } from '../compartido/baseDeDatos/Migrador';
import { cargarArchivoEnv } from '../compartido/entorno';
import { leerConfiguracionDeBaseDeDatos } from '../configuracion';

async function prepararBaseDeDatos(): Promise<void> {
  cargarArchivoEnv();
  const baseDeDatos = new BaseDeDatosPostgres(new pg.Pool(leerConfiguracionDeBaseDeDatos()));

  try {
    const aplicadas = await new Migrador(baseDeDatos).aplicar(await leerMigraciones());
    for (const nombre of aplicadas) console.log(`Aplicada: ${nombre}`);
    console.log('Base de datos lista.');
  } finally {
    await baseDeDatos.cerrar();
  }
}

prepararBaseDeDatos().catch((error: unknown) => {
  console.error('No se pudo preparar la base de datos:', error);
  process.exitCode = 1;
});

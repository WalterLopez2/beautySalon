// Crea las tablas (si no existen) y carga el catalogo inicial de servicios.
// Se puede correr las veces que haga falta: no borra ni duplica datos.
//
//   pnpm --filter server db:preparar

import pg from 'pg';
import { BaseDeDatosPostgres } from '../compartido/baseDeDatos/baseDeDatos';
import { RepositorioCitas } from '../compartido/citas/repositorioCitas';
import { RepositorioClientes } from '../compartido/clientes/repositorioClientes';
import { cargarArchivoEnv } from '../compartido/entorno';
import { RepositorioServicios } from '../compartido/servicios/repositorioServicios';
import { leerConfiguracionDeBaseDeDatos } from '../configuracion';
import { RepositorioUsuarias } from '../duena/autenticacion/repositorioUsuarias';
import { CATALOGO_INICIAL } from './catalogoInicial';

async function prepararBaseDeDatos(): Promise<void> {
  cargarArchivoEnv();
  const baseDeDatos = new BaseDeDatosPostgres(new pg.Pool(leerConfiguracionDeBaseDeDatos()));

  try {
    await baseDeDatos.transaccion(async (consultor) => {
      const servicios = new RepositorioServicios(consultor);

      // El orden importa: `citas` apunta a `clientes` y `servicios`.
      await new RepositorioClientes(consultor).crearTabla();
      await servicios.crearTabla();
      await new RepositorioCitas(consultor).crearTabla();
      await new RepositorioUsuarias(consultor).crearTabla();

      for (const servicio of CATALOGO_INICIAL) {
        await servicios.guardar(servicio);
      }
    });
    console.log(`Base de datos lista. Servicios cargados: ${CATALOGO_INICIAL.length}.`);
  } finally {
    await baseDeDatos.cerrar();
  }
}

prepararBaseDeDatos().catch((error: unknown) => {
  console.error('No se pudo preparar la base de datos:', error);
  process.exitCode = 1;
});

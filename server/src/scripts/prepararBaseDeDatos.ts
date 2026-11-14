// Crea las tablas que falten. No carga datos: servicios, horario y demas los
// configura la duena desde el panel. Se puede correr las veces que haga falta.
//
//   pnpm --filter server db:preparar

import pg from 'pg';
import { BaseDeDatosPostgres } from '../compartido/baseDeDatos/baseDeDatos';
import { RepositorioBloqueos } from '../compartido/bloqueos/repositorioBloqueos';
import { RepositorioCitas } from '../compartido/citas/repositorioCitas';
import { RepositorioClientes } from '../compartido/clientes/repositorioClientes';
import { cargarArchivoEnv } from '../compartido/entorno';
import { RepositorioHorario } from '../compartido/horario/repositorioHorario';
import { RepositorioServicios } from '../compartido/servicios/repositorioServicios';
import { leerConfiguracionDeBaseDeDatos } from '../configuracion';
import { RepositorioUsuarias } from '../duena/autenticacion/repositorioUsuarias';

async function prepararBaseDeDatos(): Promise<void> {
  cargarArchivoEnv();
  const baseDeDatos = new BaseDeDatosPostgres(new pg.Pool(leerConfiguracionDeBaseDeDatos()));

  try {
    await baseDeDatos.transaccion(async (consultor) => {
      // El orden importa: `citas` apunta a `clientes` y `servicios`.
      await new RepositorioClientes(consultor).crearTabla();
      await new RepositorioServicios(consultor).crearTabla();
      await new RepositorioCitas(consultor).crearTabla();
      await new RepositorioHorario(consultor).crearTablas();
      await new RepositorioBloqueos(consultor).crearTabla();
      await new RepositorioUsuarias(consultor).crearTabla();
    });
    console.log('Base de datos lista.');
  } finally {
    await baseDeDatos.cerrar();
  }
}

prepararBaseDeDatos().catch((error: unknown) => {
  console.error('No se pudo preparar la base de datos:', error);
  process.exitCode = 1;
});

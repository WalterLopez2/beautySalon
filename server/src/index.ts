// Punto de entrada: lee la configuracion, conecta PostgreSQL y levanta la API.

import pg from 'pg';
import { crearApp } from './app';
import { BaseDeDatosPostgres } from './compartido/baseDeDatos/baseDeDatos';
import { cargarArchivoEnv } from './compartido/entorno';
import { leerConfiguracion } from './configuracion';
import { crearDependencias } from './contenedor';

cargarArchivoEnv();
const configuracion = leerConfiguracion();
const baseDeDatos = new BaseDeDatosPostgres(new pg.Pool(configuracion.baseDeDatos));
const app = crearApp(crearDependencias(baseDeDatos, configuracion), {
  proxiesDeConfianza: configuracion.proxiesDeConfianza,
  soloHttps: configuracion.soloHttps,
});

const servidor = app.listen(configuracion.puerto, () => {
  console.log(`API del salon escuchando en http://localhost:${configuracion.puerto}/api`);
});

// Al detener el servidor (Ctrl+C o el hosting), termina las peticiones en
// curso y cierra las conexiones a la base de datos ordenadamente.
function apagar(): void {
  servidor.close(() => {
    void baseDeDatos.cerrar().then(() => process.exit(0));
  });
}

process.on('SIGINT', apagar);
process.on('SIGTERM', apagar);

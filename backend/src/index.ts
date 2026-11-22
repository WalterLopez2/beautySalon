// Punto de entrada: lee la configuracion, conecta PostgreSQL y levanta la API.

import pg from 'pg';
import { crearApp } from './app';
import { BaseDeDatosPostgres } from './compartido/baseDeDatos/baseDeDatos';
import { cargarArchivoEnv } from './compartido/entorno';
import { leerConfiguracion } from './configuracion';
import { crearDependencias, crearVencimientoDeCitas } from './contenedor';

const CADA_MINUTO = 60 * 1000;

cargarArchivoEnv();
const configuracion = leerConfiguracion(process.env, {
  iniciadaParaProduccion: process.argv.includes('--produccion'),
});
const baseDeDatos = new BaseDeDatosPostgres(new pg.Pool(configuracion.baseDeDatos));
const app = crearApp(crearDependencias(baseDeDatos, configuracion), {
  proxiesDeConfianza: configuracion.proxiesDeConfianza,
  soloHttps: configuracion.soloHttps,
});

const vencimiento = crearVencimientoDeCitas(baseDeDatos);

// Si falla (por ejemplo, la base esta apagada) se vuelve a intentar al minuto.
function vencerPendientes(): void {
  vencimiento.ejecutar().catch((error: Error) => {
    console.error(`No se pudieron vencer las citas pendientes: ${error.message}`);
  });
}

const { direccion, puerto } = configuracion;
const servidor = app.listen(puerto, direccion, (error) => {
  // Express 5 llama aqui tambien cuando NO pudo abrir el puerto.
  if (error) {
    console.error(`La API no pudo abrir ${direccion}, puerto ${puerto}: ${error.message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`API del salon escuchando en ${direccion}, puerto ${puerto} (rutas en /api)`);
  vencerPendientes();
  setInterval(vencerPendientes, CADA_MINUTO).unref(); // unref: no impide apagar
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

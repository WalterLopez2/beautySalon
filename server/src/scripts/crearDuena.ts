// Crea (o actualiza) la cuenta de la duena para entrar al panel.
//
// La contrasena se pasa por variable de entorno y NO como argumento, para que
// no quede guardada en el historial de la terminal:
//
//   DUENA_CONTRASENA="..." pnpm --filter server crear-duena delmy "Delmy"

import pg from 'pg';
import { BaseDeDatosPostgres } from '../compartido/baseDeDatos/baseDeDatos';
import { cargarArchivoEnv } from '../compartido/entorno';
import { leerConfiguracionDeBaseDeDatos } from '../configuracion';
import { cifrarContrasena, LONGITUD_MINIMA_DE_CONTRASENA } from '../duena/autenticacion/contrasenas';
import { RepositorioUsuarias } from '../duena/autenticacion/repositorioUsuarias';

interface DatosDeLaCuenta {
  usuario: string;
  nombre: string;
  contrasena: string;
}

function leerDatosDeLaCuenta(): DatosDeLaCuenta {
  const [usuario, nombre] = process.argv.slice(2);
  const contrasena = process.env.DUENA_CONTRASENA ?? '';

  if (!usuario || !nombre) {
    throw new Error('Uso: crear-duena <usuario> "<nombre>"  (con DUENA_CONTRASENA en el entorno)');
  }
  if (contrasena.length < LONGITUD_MINIMA_DE_CONTRASENA) {
    throw new Error(`DUENA_CONTRASENA debe tener al menos ${LONGITUD_MINIMA_DE_CONTRASENA} caracteres.`);
  }
  return { usuario, nombre, contrasena };
}

async function crearDuena(): Promise<void> {
  cargarArchivoEnv();
  const cuenta = leerDatosDeLaCuenta();
  const baseDeDatos = new BaseDeDatosPostgres(new pg.Pool(leerConfiguracionDeBaseDeDatos()));

  try {
    const usuarias = new RepositorioUsuarias(baseDeDatos);
    await usuarias.guardar(cuenta.usuario, cuenta.nombre, await cifrarContrasena(cuenta.contrasena));
    console.log(`Cuenta "${cuenta.usuario}" lista para entrar al panel.`);
  } finally {
    await baseDeDatos.cerrar();
  }
}

crearDuena().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

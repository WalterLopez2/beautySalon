// Rutas del panel de la duena. Solo `/auth/login` es publica; todo lo que
// cuelga de `/panel` pasa antes por `requiereSesion` y se responde sin cache.

import { Router } from 'express';
import type { CitaRegistrada } from '../compartido/citas/repositorioCitas';
import type { Cliente } from '../compartido/clientes/repositorioClientes';
import type { EstadoCita } from '../compartido/dominio/citas';
import { NoEncontrado } from '../compartido/errores';
import {
  leerEstadoCita,
  leerIdentificador,
  leerObjeto,
  leerRangoDeFechas,
  leerTexto,
} from '../compartido/http/entrada';
import { sinCache } from '../compartido/seguridad/cabecerasDeSeguridad';
import type { Credenciales, SesionIniciada } from './autenticacion/IniciarSesion';
import { requiereSesion, sesionActual, type VerificadorDeSesion } from './autenticacion/requiereSesion';
import type { SesionDeDuena } from './autenticacion/tokens';
import { crearRutasDeConfiguracion, type DependenciasDeConfiguracion } from './configuracion/rutas';
import { crearRutasDeBloqueos, type DependenciasDeBloqueos } from './configuracion/rutasDeBloqueos';
import { aCitaDelPanel, aClienta, aHistorialDeClienta } from './presentacion';

// Suficiente para ver un mes con sus semanas completas, sin permitir
// consultas enormes por error.
const DIAS_MAXIMOS_POR_CONSULTA = 62;

export interface DependenciasDeLaDuena {
  iniciarSesion: { ejecutar(credenciales: Credenciales, ip: string): Promise<SesionIniciada> };
  verificarSesion: VerificadorDeSesion;
  cerrarSesion: { ejecutar(sesion: SesionDeDuena): Promise<void> };
  cambiarEstadoDeCita: { ejecutar(citaId: number, estado: EstadoCita): Promise<CitaRegistrada> };
  citas: {
    listarEntre(desde: string, hasta: string): Promise<CitaRegistrada[]>;
    listarPorCliente(clienteId: number): Promise<CitaRegistrada[]>;
  };
  clientes: {
    listar(): Promise<Cliente[]>;
    obtenerPorId(id: number): Promise<Cliente | null>;
  };
  configuracion: DependenciasDeConfiguracion;
  bloqueos: DependenciasDeBloqueos;
}

export function crearRutasDeLaDuena(dependencias: DependenciasDeLaDuena): Router {
  const { iniciarSesion, verificarSesion, cerrarSesion, cambiarEstadoDeCita, citas, clientes } = dependencias;
  const rutas = Router();

  rutas.post('/auth/login', sinCache, async (peticion, respuesta) => {
    const credenciales = leerCredenciales(peticion.body);
    respuesta.json(await iniciarSesion.ejecutar(credenciales, peticion.ip ?? 'desconocida'));
  });

  rutas.use('/panel', sinCache, requiereSesion(verificarSesion));

  // ----- Sesion -----

  // Al abrir el panel, el frontend confirma que su token sigue sirviendo.
  rutas.get('/panel/sesion', (_peticion, respuesta) => {
    const { nombre, expiraEn } = sesionActual(respuesta);
    respuesta.json({ nombre, expiraEn: new Date(expiraEn).toISOString() });
  });

  rutas.post('/panel/sesion/cerrar', async (_peticion, respuesta) => {
    await cerrarSesion.ejecutar(sesionActual(respuesta));
    respuesta.status(204).end();
  });

  // ----- Configuracion del salon -----

  rutas.use('/panel', crearRutasDeConfiguracion(dependencias.configuracion));
  rutas.use('/panel', crearRutasDeBloqueos(dependencias.bloqueos));

  // ----- Agenda y clientas -----

  rutas.get('/panel/citas', async (peticion, respuesta) => {
    const { desde, hasta } = leerRangoDeFechas(peticion.query.desde, peticion.query.hasta, DIAS_MAXIMOS_POR_CONSULTA);
    const encontradas = await citas.listarEntre(desde, hasta);
    respuesta.json(encontradas.map(aCitaDelPanel));
  });

  rutas.patch('/panel/citas/:id/estado', async (peticion, respuesta) => {
    const citaId = leerIdentificador(peticion.params.id, 'id');
    const estado = leerEstadoCita(leerObjeto(peticion.body, 'el cambio').estado);
    respuesta.json(aCitaDelPanel(await cambiarEstadoDeCita.ejecutar(citaId, estado)));
  });

  rutas.get('/panel/clientas', async (_peticion, respuesta) => {
    respuesta.json((await clientes.listar()).map(aClienta));
  });

  rutas.get('/panel/clientas/:id/historial', async (peticion, respuesta) => {
    const clientaId = leerIdentificador(peticion.params.id, 'id');
    const clienta = await clientes.obtenerPorId(clientaId);
    if (!clienta) {
      throw new NoEncontrado('La clienta no existe.');
    }
    respuesta.json(aHistorialDeClienta(clienta, await citas.listarPorCliente(clientaId)));
  });

  return rutas;
}

function leerCredenciales(cuerpo: unknown): Credenciales {
  const datos = leerObjeto(cuerpo, 'inicio de sesion');
  return {
    usuario: leerTexto(datos.usuario, 'usuario'),
    // La contrasena no se recorta: los espacios pueden ser parte de ella.
    contrasena: typeof datos.contrasena === 'string' ? datos.contrasena : '',
  };
}

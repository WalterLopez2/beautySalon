// Rutas de la duena. La frontera con la vista publica es estructural:
//
// - Afuera del panel solo existe `/auth/login`.
// - Todo lo demas vive en el router del panel, que se monta en `/panel` DETRAS
//   de `requiereSesion`, en una sola linea. Una ruta nueva del panel queda
//   protegida sin que nadie tenga que acordarse de protegerla, y como la
//   sesion se revisa antes de buscar la ruta, sin token ni siquiera se puede
//   averiguar que rutas existen (todo responde 401, tambien lo inexistente).

import { Router } from 'express';
import type { CitaRegistrada } from '../compartido/citas/repositorioCitas';
import type { Cliente } from '../compartido/clientes/repositorioClientes';
import type { EstadoCita } from '../compartido/dominio/citas';
import { LARGO_MAXIMO } from '../compartido/dominio/limitesDeDatos';
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
import type { CookieDeSesion } from './autenticacion/cookieDeSesion';
import { protegerContraCsrf } from './autenticacion/protegerContraCsrf';
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

export function crearRutasDeLaDuena(dependencias: DependenciasDeLaDuena, cookie: CookieDeSesion): Router {
  const { iniciarSesion, verificarSesion } = dependencias;
  const rutas = Router();

  rutas.post('/auth/login', sinCache, protegerContraCsrf, async (peticion, respuesta) => {
    const credenciales = leerCredenciales(peticion.body);
    const { token, ...sesion } = await iniciarSesion.ejecutar(credenciales, peticion.ip ?? 'desconocida');
    cookie.guardar(respuesta, token, sesion.expiraEn);
    respuesta.json(sesion); // sin el token: solo va en la cookie
  });

  rutas.use(
    '/panel',
    sinCache,
    requiereSesion(verificarSesion, cookie),
    protegerContraCsrf,
    crearRutasDelPanel(dependencias, cookie),
  );

  return rutas;
}

// Solo se monta detras de `requiereSesion`: aqui todas las rutas ya tienen sesion.
function crearRutasDelPanel(dependencias: DependenciasDeLaDuena, cookie: CookieDeSesion): Router {
  const { cerrarSesion, cambiarEstadoDeCita, citas, clientes } = dependencias;
  const panel = Router();

  // ----- Sesion -----

  // Al abrir el panel, el frontend pregunta si su cookie sigue sirviendo.
  panel.get('/sesion', (_peticion, respuesta) => {
    const { nombre, expiraEn } = sesionActual(respuesta);
    respuesta.json({ nombre, expiraEn: new Date(expiraEn).toISOString() });
  });

  panel.post('/sesion/cerrar', async (_peticion, respuesta) => {
    await cerrarSesion.ejecutar(sesionActual(respuesta));
    cookie.borrar(respuesta);
    respuesta.status(204).end();
  });

  // ----- Configuracion del salon -----

  panel.use(crearRutasDeConfiguracion(dependencias.configuracion));
  panel.use(crearRutasDeBloqueos(dependencias.bloqueos));

  // ----- Agenda y clientas -----

  panel.get('/citas', async (peticion, respuesta) => {
    const { desde, hasta } = leerRangoDeFechas(peticion.query.desde, peticion.query.hasta, DIAS_MAXIMOS_POR_CONSULTA);
    const encontradas = await citas.listarEntre(desde, hasta);
    respuesta.json(encontradas.map(aCitaDelPanel));
  });

  panel.patch('/citas/:id/estado', async (peticion, respuesta) => {
    const citaId = leerIdentificador(peticion.params.id, 'id');
    const estado = leerEstadoCita(leerObjeto(peticion.body, 'el cambio').estado);
    respuesta.json(aCitaDelPanel(await cambiarEstadoDeCita.ejecutar(citaId, estado)));
  });

  panel.get('/clientas', async (_peticion, respuesta) => {
    respuesta.json((await clientes.listar()).map(aClienta));
  });

  panel.get('/clientas/:id/historial', async (peticion, respuesta) => {
    const clientaId = leerIdentificador(peticion.params.id, 'id');
    const clienta = await clientes.obtenerPorId(clientaId);
    if (!clienta) {
      throw new NoEncontrado('La clienta no existe.');
    }
    respuesta.json(aHistorialDeClienta(clienta, await citas.listarPorCliente(clientaId)));
  });

  return panel;
}

function leerCredenciales(cuerpo: unknown): Credenciales {
  const datos = leerObjeto(cuerpo, 'inicio de sesion');
  return {
    usuario: leerTexto(datos.usuario, 'usuario', LARGO_MAXIMO.usuario),
    // La contrasena no se recorta: los espacios pueden ser parte de ella.
    contrasena: typeof datos.contrasena === 'string' ? datos.contrasena : '',
  };
}

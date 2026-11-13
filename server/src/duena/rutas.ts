// Rutas del panel de la duena. Solo `/auth/login` es publica; todo lo que
// cuelga de `/panel` pasa antes por `requiereSesion`.

import { Router } from 'express';
import type { Cliente } from '../compartido/clientes/repositorioClientes';
import type { CitaRegistrada } from '../compartido/citas/repositorioCitas';
import type { EstadoCita } from '../compartido/dominio/citas';
import { diasEntre } from '../compartido/dominio/fechas';
import { DatosInvalidos, NoEncontrado } from '../compartido/errores';
import { leerEstadoCita, leerFecha, leerIdentificador, leerObjeto, leerTexto } from '../compartido/http/entrada';
import type { Credenciales, SesionIniciada } from './autenticacion/IniciarSesion';
import { requiereSesion } from './autenticacion/requiereSesion';
import type { EmisorDeTokens } from './autenticacion/tokens';
import { aCitaDelPanel, aClienta, aHistorialDeClienta } from './presentacion';

// Suficiente para ver un mes con sus semanas completas, sin permitir
// consultas enormes por error.
const DIAS_MAXIMOS_POR_CONSULTA = 62;

export interface DependenciasDeLaDuena {
  tokens: EmisorDeTokens;
  iniciarSesion: { ejecutar(credenciales: Credenciales): Promise<SesionIniciada> };
  cambiarEstadoDeCita: { ejecutar(citaId: number, estado: EstadoCita): Promise<CitaRegistrada> };
  citas: {
    listarEntre(desde: string, hasta: string): Promise<CitaRegistrada[]>;
    listarPorCliente(clienteId: number): Promise<CitaRegistrada[]>;
  };
  clientes: {
    listar(): Promise<Cliente[]>;
    obtenerPorId(id: number): Promise<Cliente | null>;
  };
}

export function crearRutasDeLaDuena(dependencias: DependenciasDeLaDuena): Router {
  const { tokens, iniciarSesion, cambiarEstadoDeCita, citas, clientes } = dependencias;
  const rutas = Router();

  rutas.post('/auth/login', async (peticion, respuesta) => {
    respuesta.json(await iniciarSesion.ejecutar(leerCredenciales(peticion.body)));
  });

  rutas.use('/panel', requiereSesion(tokens));

  rutas.get('/panel/citas', async (peticion, respuesta) => {
    const { desde, hasta } = leerRangoDeFechas(peticion.query.desde, peticion.query.hasta);
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

function leerRangoDeFechas(desdeCrudo: unknown, hastaCrudo: unknown): { desde: string; hasta: string } {
  const desde = leerFecha(desdeCrudo, 'desde');
  const hasta = leerFecha(hastaCrudo, 'hasta');
  const dias = diasEntre(desde, hasta);

  if (dias < 0) {
    throw new DatosInvalidos(['La fecha "desde" debe ser anterior o igual a "hasta".']);
  }
  if (dias > DIAS_MAXIMOS_POR_CONSULTA) {
    throw new DatosInvalidos([`Solo se pueden consultar hasta ${DIAS_MAXIMOS_POR_CONSULTA} dias a la vez.`]);
  }
  return { desde, hasta };
}

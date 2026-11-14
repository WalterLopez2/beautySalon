// Rutas publicas (sin inicio de sesion) que usa la pagina de la clienta.
// Cada ruta hace solo tres cosas: leer la entrada, llamar al dominio y
// responder. Express 5 pasa los errores de las funciones async al manejador.

import { Router, type Request } from 'express';
import { aCitaDTO } from '../compartido/citas/presentacion';
import type { CitaRegistrada } from '../compartido/citas/repositorioCitas';
import { esTelefonoValido, normalizarTelefono } from '../compartido/dominio/telefono';
import { DatosInvalidos } from '../compartido/errores';
import {
  leerCampos,
  leerFecha,
  leerHora,
  leerIdentificador,
  leerObjeto,
  leerTexto,
  leerTextoOpcional,
} from '../compartido/http/entrada';
import { hashDeCodigo } from '../compartido/seguridad/codigosDeConsulta';
import type { LimitadorDeIntentos } from '../compartido/seguridad/LimitadorDeIntentos';
import type { Servicio } from '../compartido/servicios/repositorioServicios';
import type { CitaAgendada, SolicitudDeCita } from './AgendarCita';
import { aAgendaPublica, type AgendaDelDiaPublica } from './presentacion';

export interface DependenciasDeLaClienta {
  consultarAgenda: { ejecutar(fecha: string): Promise<AgendaDelDiaPublica> };
  servicios: { listarActivos(): Promise<Servicio[]> };
  citas: { listarPorTelefonoYCodigo(telefono: string, codigoHash: string): Promise<CitaRegistrada[]> };
  agendarCita: { ejecutar(solicitud: SolicitudDeCita): Promise<CitaAgendada> };
  limites: {
    agendar: LimitadorDeIntentos;
    consultarHistorial: LimitadorDeIntentos;
  };
}

interface ConsultaDeHistorial {
  telefono: string;
  codigo: string;
}

export function crearRutasDeLaClienta(dependencias: DependenciasDeLaClienta): Router {
  const { consultarAgenda, servicios, citas, agendarCita, limites } = dependencias;
  const rutas = Router();

  rutas.get('/servicios', async (_peticion, respuesta) => {
    respuesta.json(await servicios.listarActivos());
  });

  rutas.get('/citas/agenda', async (peticion, respuesta) => {
    const fecha = leerFecha(peticion.query.fecha, 'fecha');
    respuesta.json(aAgendaPublica(await consultarAgenda.ejecutar(fecha)));
  });

  rutas.post('/citas', async (peticion, respuesta) => {
    limites.agendar.consumir(ipDe(peticion));
    const { cita, codigoDeConsulta } = await agendarCita.ejecutar(leerSolicitudDeCita(peticion.body));
    // Unica vez que el codigo sale del servidor: la clienta debe guardarlo.
    respuesta.status(201).json({ ...aCitaDTO(cita), codigoDeConsulta });
  });

  // POST y no GET: el telefono y el codigo no deben quedar en la URL, que
  // termina en historiales del navegador y en logs de servidores.
  rutas.post('/citas/consulta', async (peticion, respuesta) => {
    limites.consultarHistorial.consumir(ipDe(peticion));
    const { telefono, codigo } = leerConsultaDeHistorial(peticion.body);
    const historial = await citas.listarPorTelefonoYCodigo(normalizarTelefono(telefono), hashDeCodigo(codigo));
    respuesta.json(historial.map(aCitaDTO));
  });

  return rutas;
}

// Con `trust proxy` configurado, Express ya resuelve la IP real del cliente.
function ipDe(peticion: Request): string {
  return peticion.ip ?? 'desconocida';
}

function leerSolicitudDeCita(cuerpo: unknown): SolicitudDeCita {
  const solicitud = leerObjeto(cuerpo, 'la cita');

  return leerCampos<SolicitudDeCita>({
    servicioId: () => leerIdentificador(solicitud.servicioId, 'servicioId'),
    fecha: () => leerFecha(solicitud.fecha, 'fecha'),
    inicio: () => leerHora(solicitud.inicio, 'inicio'),
    contacto: () => {
      const contacto = leerObjeto(solicitud.contacto, 'contacto');
      return leerCampos({
        nombre: () => leerTexto(contacto.nombre, 'nombre'),
        telefono: () => leerTexto(contacto.telefono, 'telefono'),
        correo: () => leerTextoOpcional(contacto.correo, 'correo'),
      });
    },
  });
}

function leerConsultaDeHistorial(cuerpo: unknown): ConsultaDeHistorial {
  const datos = leerObjeto(cuerpo, 'la consulta');
  const consulta = leerCampos<ConsultaDeHistorial>({
    telefono: () => leerTexto(datos.telefono, 'telefono'),
    codigo: () => leerTexto(datos.codigo, 'codigo'),
  });
  if (!esTelefonoValido(consulta.telefono)) {
    throw new DatosInvalidos(['El telefono debe tener al menos 8 digitos.']);
  }
  return consulta;
}

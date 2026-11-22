// Rutas publicas (sin inicio de sesion) que usa la pagina de la clienta.
// Cada ruta hace solo tres cosas: leer la entrada, llamar al dominio y
// responder. Express 5 pasa los errores de las funciones async al manejador.

import { Router, type Request } from 'express';
import { aCitaDTO } from '../compartido/citas/presentacion';
import type { CitaRegistrada } from '../compartido/citas/repositorioCitas';
import { LARGO_MAXIMO } from '../compartido/dominio/limitesDeDatos';
import { esTelefonoValido, normalizarTelefono, TELEFONO_INVALIDO } from '../compartido/dominio/telefono';
import { DatosInvalidos } from '../compartido/errores';
import {
  leerCampos,
  leerCorreoOpcional,
  leerFecha,
  leerHora,
  leerIdentificador,
  leerObjeto,
  leerTexto,
} from '../compartido/http/entrada';
import { sinCache } from '../compartido/seguridad/cabecerasDeSeguridad';
import { hashDeCodigo } from '../compartido/seguridad/codigosDeConsulta';
import type { LimitadorPorIp } from '../compartido/seguridad/LimitadorPorIp';
import type { Servicio } from '../compartido/servicios/repositorioServicios';
import type { CitaAgendada, SolicitudDeCita } from './AgendarCita';
import { aAgendaPublica, type AgendaDelDiaPublica } from './presentacion';

export interface DependenciasDeLaClienta {
  consultarAgenda: { ejecutar(fecha: string): Promise<AgendaDelDiaPublica> };
  servicios: { listarActivos(): Promise<Servicio[]> };
  citas: { listarPorTelefonoYCodigo(telefono: string, codigoHash: string): Promise<CitaRegistrada[]> };
  agendarCita: { ejecutar(solicitud: SolicitudDeCita): Promise<CitaAgendada> };
  limites: {
    agendar: LimitadorPorIp;
    agendarPorFecha: LimitadorPorIp;
    consultarHistorial: LimitadorPorIp;
  };
}

interface ConsultaDeHistorial {
  telefono: string;
  codigo: string;
}

export function crearRutasDeLaClienta(dependencias: DependenciasDeLaClienta): Router {
  const { consultarAgenda, servicios, citas, agendarCita, limites } = dependencias;
  const rutas = Router();
  // Todo lo de /citas es privado o cambia a cada momento (codigo, citas, horas).
  rutas.use('/citas', sinCache);

  rutas.get('/servicios', async (_peticion, respuesta) => {
    respuesta.json(await servicios.listarActivos());
  });

  rutas.get('/citas/agenda', async (peticion, respuesta) => {
    const fecha = leerFecha(peticion.query.fecha, 'fecha');
    respuesta.json(aAgendaPublica(await consultarAgenda.ejecutar(fecha)));
  });

  rutas.post('/citas', async (peticion, respuesta) => {
    const ip = ipDe(peticion);
    limites.agendar.consumir(ip);
    const solicitud = leerSolicitudDeCita(peticion.body);
    limites.agendarPorFecha.consumir(ip, solicitud.fecha);
    const { cita, codigoDeConsulta } = await agendarCita.ejecutar(solicitud).catch((error: unknown) => {
      limites.agendarPorFecha.devolver(ip, solicitud.fecha); // el cupo del dia es para citas hechas
      throw error;
    });
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
        nombre: () => leerTexto(contacto.nombre, 'nombre', LARGO_MAXIMO.nombre),
        telefono: () => leerTexto(contacto.telefono, 'telefono', LARGO_MAXIMO.telefono),
        correo: () => leerCorreoOpcional(contacto.correo, 'correo'),
      });
    },
  });
}

function leerConsultaDeHistorial(cuerpo: unknown): ConsultaDeHistorial {
  const datos = leerObjeto(cuerpo, 'la consulta');
  const consulta = leerCampos<ConsultaDeHistorial>({
    telefono: () => leerTexto(datos.telefono, 'telefono', LARGO_MAXIMO.telefono),
    codigo: () => leerTexto(datos.codigo, 'codigo', LARGO_MAXIMO.codigo),
  });
  if (!esTelefonoValido(consulta.telefono)) {
    throw new DatosInvalidos([TELEFONO_INVALIDO]);
  }
  return consulta;
}

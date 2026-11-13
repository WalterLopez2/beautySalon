// Rutas publicas (sin inicio de sesion) que usa la pagina de la clienta.
// Cada ruta hace solo tres cosas: leer la entrada, llamar al dominio y
// responder. Express 5 pasa los errores de las funciones async al manejador.

import { Router } from 'express';
import type { CitaRegistrada, FranjaOcupada } from '../compartido/citas/repositorioCitas';
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
import type { Servicio } from '../compartido/servicios/repositorioServicios';
import type { SolicitudDeCita } from './AgendarCita';
import { aCitaDTO } from '../compartido/citas/presentacion';
import { aAgendaPublica } from './presentacion';

export interface DependenciasDeLaClienta {
  servicios: { listarActivos(): Promise<Servicio[]> };
  citas: {
    ocupadasEl(fecha: string): Promise<FranjaOcupada[]>;
    listarPorTelefono(telefono: string): Promise<CitaRegistrada[]>;
  };
  agendarCita: { ejecutar(solicitud: SolicitudDeCita): Promise<CitaRegistrada> };
}

export function crearRutasDeLaClienta({ servicios, citas, agendarCita }: DependenciasDeLaClienta): Router {
  const rutas = Router();

  rutas.get('/servicios', async (_peticion, respuesta) => {
    respuesta.json(await servicios.listarActivos());
  });

  rutas.get('/citas/agenda', async (peticion, respuesta) => {
    const fecha = leerFecha(peticion.query.fecha, 'fecha');
    respuesta.json(aAgendaPublica(fecha, await citas.ocupadasEl(fecha)));
  });

  rutas.post('/citas', async (peticion, respuesta) => {
    const cita = await agendarCita.ejecutar(leerSolicitudDeCita(peticion.body));
    respuesta.status(201).json(aCitaDTO(cita));
  });

  rutas.get('/citas', async (peticion, respuesta) => {
    const telefono = leerTexto(peticion.query.telefono, 'telefono');
    if (!esTelefonoValido(telefono)) {
      throw new DatosInvalidos(['El telefono debe tener al menos 8 digitos.']);
    }
    const historial = await citas.listarPorTelefono(normalizarTelefono(telefono));
    respuesta.json(historial.map(aCitaDTO));
  });

  return rutas;
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

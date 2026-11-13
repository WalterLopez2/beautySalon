// Caso de uso: una clienta pide una cita desde la pagina publica.
//
// Todo pasa dentro de una transaccion con el dia bloqueado: revisar que la
// hora este libre y guardar la cita es un solo paso. Asi dos clientas que
// eligen la misma hora al mismo tiempo nunca quedan las dos agendadas.

import type { Cliente, DatosCliente } from '../compartido/clientes/repositorioClientes';
import type { CitaRegistrada, FranjaOcupada, NuevaCita } from '../compartido/citas/repositorioCitas';
import { franjasSeCruzan, horaAMinutos } from '../compartido/dominio/citas';
import { cabeEnElHorario, momentoDelSalon, yaPaso, type MomentoDelSalon } from '../compartido/dominio/horario';
import { esTelefonoValido, normalizarTelefono } from '../compartido/dominio/telefono';
import { Conflicto, DatosInvalidos, NoEncontrado } from '../compartido/errores';
import type { Servicio } from '../compartido/servicios/repositorioServicios';

export interface SolicitudDeCita {
  servicioId: number;
  fecha: string; // YYYY-MM-DD
  inicio: string; // HH:MM
  contacto: DatosCliente;
}

// Solo lo que este caso de uso necesita de cada repositorio (Interface
// Segregation): en las pruebas basta con implementar estos metodos.
export interface RepositoriosDeAgendamiento {
  servicios: { obtenerActivoPorId(id: number): Promise<Servicio | null> };
  clientes: {
    buscarPorTelefono(telefono: string): Promise<Cliente | null>;
    crear(datos: DatosCliente): Promise<Cliente>;
  };
  citas: {
    bloquearDia(fecha: string): Promise<void>;
    ocupadasEl(fecha: string): Promise<FranjaOcupada[]>;
    crear(cita: NuevaCita): Promise<CitaRegistrada>;
  };
}

export type EjecutarEnTransaccion = <T>(
  trabajo: (repositorios: RepositoriosDeAgendamiento) => Promise<T>,
) => Promise<T>;

export class AgendarCita {
  private readonly enTransaccion: EjecutarEnTransaccion;
  private readonly reloj: () => MomentoDelSalon;

  constructor(enTransaccion: EjecutarEnTransaccion, reloj: () => MomentoDelSalon = momentoDelSalon) {
    this.enTransaccion = enTransaccion;
    this.reloj = reloj;
  }

  async ejecutar(solicitud: SolicitudDeCita): Promise<CitaRegistrada> {
    const inicioMin = horaAMinutos(solicitud.inicio);
    this.validarSolicitud(solicitud, inicioMin);

    return this.enTransaccion(async ({ servicios, clientes, citas }) => {
      const servicio = await servicios.obtenerActivoPorId(solicitud.servicioId);
      if (!servicio) {
        throw new NoEncontrado('El servicio elegido no existe o ya no esta disponible.');
      }

      const franja = { inicioMin, duracionMin: servicio.duracionMin };
      if (!cabeEnElHorario(franja.inicioMin, franja.duracionMin)) {
        throw new DatosInvalidos(['Esa hora queda fuera del horario de atencion del salon.']);
      }

      await citas.bloquearDia(solicitud.fecha);
      const ocupadas = await citas.ocupadasEl(solicitud.fecha);
      if (ocupadas.some((ocupada) => franjasSeCruzan(ocupada, franja))) {
        throw new Conflicto('Esa hora ya fue ocupada. Elegi otra, por favor.');
      }

      const clienta = await this.identificarClienta(clientes, solicitud.contacto);
      return citas.crear({
        clienteId: clienta.id,
        servicioId: servicio.id,
        fecha: solicitud.fecha,
        inicioMin,
        duracionMin: servicio.duracionMin,
        precio: servicio.precio,
      });
    });
  }

  private validarSolicitud(solicitud: SolicitudDeCita, inicioMin: number): void {
    const errores: string[] = [];

    if (!esTelefonoValido(solicitud.contacto.telefono)) {
      errores.push('El telefono debe tener al menos 8 digitos.');
    }
    if (yaPaso(solicitud.fecha, inicioMin, this.reloj())) {
      errores.push('La fecha y hora de la cita ya pasaron.');
    }
    if (errores.length > 0) {
      throw new DatosInvalidos(errores);
    }
  }

  // La clienta se reconoce por su telefono: si ya vino antes, se usa su
  // registro y su historial sigue completo; si no, se crea.
  private async identificarClienta(
    clientes: RepositoriosDeAgendamiento['clientes'],
    contacto: DatosCliente,
  ): Promise<Cliente> {
    const telefono = normalizarTelefono(contacto.telefono);
    const existente = await clientes.buscarPorTelefono(telefono);
    return existente ?? clientes.crear({ ...contacto, telefono });
  }
}

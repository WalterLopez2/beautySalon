// Caso de uso: orquesta el agendamiento. Vive aparte de React para poder
// probarlo con repositorios falsos y sin montar componentes.

import type { Cita } from '../../../compartido/dominio/Cita.ts'
import { ErrorDeValidacion } from '../../../compartido/dominio/ErrorDeValidacion.ts'
import type { RepositorioCitas } from './repositorioCitas.ts'
import type { SolicitudDeCita } from './SolicitudDeCita.ts'

export class SolicitudInvalida extends ErrorDeValidacion {
  constructor(errores: string[]) {
    super(errores)
    this.name = 'SolicitudInvalida'
  }
}

export class AgendarCita {
  private readonly repositorio: RepositorioCitas

  constructor(repositorio: RepositorioCitas) {
    this.repositorio = repositorio
  }

  async ejecutar(solicitud: SolicitudDeCita): Promise<Cita> {
    const errores = solicitud.errores()
    if (errores.length > 0) {
      throw new SolicitudInvalida(errores)
    }

    await this.confirmarDisponibilidad(solicitud)
    return this.repositorio.agendar(solicitud.aDTO())
  }

  // Vuelve a consultar la agenda por si otra clienta tomo la hora mientras
  // esta llenaba el formulario.
  private async confirmarDisponibilidad(solicitud: SolicitudDeCita): Promise<void> {
    const franja = solicitud.franja()
    if (!franja) {
      throw new SolicitudInvalida(['Elegi la hora de tu cita.'])
    }

    const agenda = await this.repositorio.agendaDe(solicitud.fecha)
    if (!agenda.estaDisponible(franja)) {
      throw new SolicitudInvalida(['Esa hora ya fue ocupada. Elegi otra, por favor.'])
    }
  }
}

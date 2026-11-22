// Caso de uso: orquesta el agendamiento. Vive aparte de React para poder
// probarlo con repositorios falsos y sin montar componentes.

import { ErrorDeValidacion } from '../../../compartido/dominio/ErrorDeValidacion.ts'
import type { CitaAgendada, RepositorioCitas } from './repositorioCitas.ts'
import type { PlazoDeReserva } from './PlazoDeReserva.ts'
import type { SolicitudDeCita } from './SolicitudDeCita.ts'

export class SolicitudInvalida extends ErrorDeValidacion {
  constructor(errores: string[]) {
    super(errores)
    this.name = 'SolicitudInvalida'
  }
}

export class HoraOcupada extends SolicitudInvalida {
  constructor() {
    super(['Esa hora ya fue ocupada. Elegi otra, por favor.'])
    this.name = 'HoraOcupada'
  }
}

export class AgendarCita {
  private readonly repositorio: RepositorioCitas

  constructor(repositorio: RepositorioCitas) {
    this.repositorio = repositorio
  }

  async ejecutar(solicitud: SolicitudDeCita, plazo: PlazoDeReserva): Promise<CitaAgendada> {
    const errores = solicitud.errores()
    const errorDePlazo = plazo.errorDe(solicitud.fecha)
    if (errorDePlazo) errores.unshift(errorDePlazo)
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
      throw new HoraOcupada()
    }
  }
}

// Caso de uso: la clienta consulta sus citas. No llama al servidor si faltan
// datos, para no gastarle intentos del limite por IP.

import type { Cita } from '../../../compartido/dominio/Cita.ts'
import { ErrorDeValidacion } from '../../../compartido/dominio/ErrorDeValidacion.ts'
import type { RepositorioCitas } from '../agendamiento/repositorioCitas.ts'
import type { ConsultaDeHistorial } from './ConsultaDeHistorial.ts'

export class ConsultarHistorial {
  private readonly repositorio: Pick<RepositorioCitas, 'historial'>

  constructor(repositorio: Pick<RepositorioCitas, 'historial'>) {
    this.repositorio = repositorio
  }

  async ejecutar(consulta: ConsultaDeHistorial): Promise<Cita[]> {
    const errores = consulta.errores()
    if (errores.length > 0) {
      throw new ErrorDeValidacion(errores)
    }
    return this.repositorio.historial(consulta.aDTO())
  }
}

// Caso de uso: guardar el horario de atencion que armo la duena.

import { ErrorDeValidacion } from '../../../compartido/dominio/ErrorDeValidacion.ts'
import type { HorarioSemanal } from './HorarioSemanal.ts'
import type { RepositorioHorario } from './repositorioHorario.ts'

export class HorarioInvalido extends ErrorDeValidacion {
  constructor(errores: string[]) {
    super(errores)
    this.name = 'HorarioInvalido'
  }
}

export class GuardarHorario {
  private readonly repositorio: RepositorioHorario

  constructor(repositorio: RepositorioHorario) {
    this.repositorio = repositorio
  }

  async ejecutar(horario: HorarioSemanal): Promise<HorarioSemanal> {
    const errores = horario.errores()
    if (errores.length > 0) {
      throw new HorarioInvalido(errores)
    }
    return this.repositorio.guardar(horario.aDTO())
  }
}

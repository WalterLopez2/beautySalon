// Caso de uso: guardar lo que la pagina publica muestra del salon.

import { ErrorDeValidacion } from '../../../compartido/dominio/ErrorDeValidacion.ts'
import type { BorradorDeSalon } from './BorradorDeSalon.ts'
import type { RepositorioSalon } from './repositorioSalon.ts'

export class SalonInvalido extends ErrorDeValidacion {
  constructor(errores: string[]) {
    super(errores)
    this.name = 'SalonInvalido'
  }
}

export class GuardarSalon {
  private readonly repositorio: RepositorioSalon

  constructor(repositorio: RepositorioSalon) {
    this.repositorio = repositorio
  }

  async ejecutar(borrador: BorradorDeSalon): Promise<BorradorDeSalon> {
    const errores = borrador.errores()
    if (errores.length > 0) {
      throw new SalonInvalido(errores)
    }
    return this.repositorio.guardar(borrador.aDTO())
  }
}

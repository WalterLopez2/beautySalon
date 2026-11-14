// Caso de uso: marcar un dia libre o un tramo bloqueado.

import { ErrorDeValidacion } from '../../../compartido/dominio/ErrorDeValidacion.ts'
import type { BorradorDeBloqueo } from './BorradorDeBloqueo.ts'
import type { BloqueoCreado, RepositorioBloqueos } from './repositorioBloqueos.ts'

export class BloqueoInvalido extends ErrorDeValidacion {
  constructor(errores: string[]) {
    super(errores)
    this.name = 'BloqueoInvalido'
  }
}

export class CrearBloqueo {
  private readonly repositorio: RepositorioBloqueos

  constructor(repositorio: RepositorioBloqueos) {
    this.repositorio = repositorio
  }

  async ejecutar(borrador: BorradorDeBloqueo): Promise<BloqueoCreado> {
    const errores = borrador.errores()
    if (errores.length > 0) {
      throw new BloqueoInvalido(errores)
    }
    return this.repositorio.crear(borrador.aDTO())
  }
}

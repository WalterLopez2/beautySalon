// Caso de uso: crear un servicio nuevo o guardar los cambios de uno existente.
// Valida el borrador antes de llamar a la API para dar un mensaje inmediato.

import { ErrorDeValidacion } from '../../../compartido/dominio/ErrorDeValidacion.ts'
import type { BorradorDeServicio } from './BorradorDeServicio.ts'
import type { RepositorioCatalogo } from './repositorioCatalogo.ts'
import type { ServicioDelPanel } from './ServicioDelPanel.ts'

export class ServicioInvalido extends ErrorDeValidacion {
  constructor(errores: string[]) {
    super(errores)
    this.name = 'ServicioInvalido'
  }
}

export class GuardarServicio {
  private readonly repositorio: RepositorioCatalogo

  constructor(repositorio: RepositorioCatalogo) {
    this.repositorio = repositorio
  }

  // Sin `id` crea uno nuevo; con `id` actualiza ese servicio.
  async ejecutar(borrador: BorradorDeServicio, id?: number): Promise<ServicioDelPanel> {
    const errores = borrador.errores()
    if (errores.length > 0) {
      throw new ServicioInvalido(errores)
    }

    const datos = borrador.aDTO()
    return id === undefined ? this.repositorio.crear(datos) : this.repositorio.actualizar(id, datos)
  }
}

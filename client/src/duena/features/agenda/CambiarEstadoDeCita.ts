// Caso de uso: confirmar, cancelar o marcar como atendida una cita. Revisa la
// regla antes de llamar a la API para dar un mensaje claro sin esperar al
// servidor; el backend igual la vuelve a validar.

import { ErrorDeValidacion } from '../../../compartido/dominio/ErrorDeValidacion.ts'
import type { EstadoCita } from '../../../compartido/tipos/api.ts'
import type { CitaDelPanel } from './CitaDelPanel.ts'
import type { RepositorioAgenda } from './repositorioAgenda.ts'

export class CambioDeEstadoInvalido extends ErrorDeValidacion {
  constructor(mensaje: string) {
    super([mensaje])
    this.name = 'CambioDeEstadoInvalido'
  }
}

export class CambiarEstadoDeCita {
  private readonly repositorio: RepositorioAgenda

  constructor(repositorio: RepositorioAgenda) {
    this.repositorio = repositorio
  }

  async ejecutar(item: CitaDelPanel, nuevoEstado: EstadoCita): Promise<CitaDelPanel> {
    if (!item.cita.puedePasarA(nuevoEstado)) {
      throw new CambioDeEstadoInvalido(
        `Una cita "${item.cita.etiquetaDeEstado()}" no se puede pasar a "${nuevoEstado}".`,
      )
    }
    return this.repositorio.cambiarEstado(item.id, nuevoEstado)
  }
}

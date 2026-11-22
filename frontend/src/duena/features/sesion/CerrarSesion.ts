// Caso de uso: cerrar la sesion de la duena.
//
// Solo el servidor puede borrar la cookie HttpOnly. Si no responde, la sesion
// SIGUE abierta y hay que decirlo: fingir que salio seria peligroso en una
// computadora compartida.

import { ErrorDeApi } from '../../../compartido/http/clienteHttp.ts'
import type { RepositorioSesion } from './repositorioSesion.ts'

export class CerrarSesion {
  private readonly repositorio: RepositorioSesion

  constructor(repositorio: RepositorioSesion) {
    this.repositorio = repositorio
  }

  async ejecutar(): Promise<void> {
    try {
      await this.repositorio.cerrar()
    } catch (causa) {
      if (causa instanceof ErrorDeApi && causa.esDeSesion()) return // ya estaba cerrada
      throw causa
    }
  }
}

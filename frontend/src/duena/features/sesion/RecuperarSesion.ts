// Caso de uso: al abrir el panel, preguntarle al servidor si hay sesion. El
// navegador no puede saberlo solo: la cookie es invisible para JavaScript.
// Sin conexion no se entra: no hay forma de confirmar quien es.

import { ErrorDeApi } from '../../../compartido/http/clienteHttp.ts'
import type { RepositorioSesion } from './repositorioSesion.ts'
import type { Sesion } from './Sesion.ts'

export class RecuperarSesion {
  private readonly repositorio: RepositorioSesion

  constructor(repositorio: RepositorioSesion) {
    this.repositorio = repositorio
  }

  async ejecutar(): Promise<Sesion | null> {
    try {
      return await this.repositorio.verificar()
    } catch (causa) {
      if (causa instanceof ErrorDeApi && causa.esDeSesion()) return null
      throw causa
    }
  }
}

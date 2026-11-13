// Puerto y adaptador de autenticacion.

import type { CredencialesDTO, SesionDTO } from '../../../compartido/tipos/api.ts'
import type { Http } from '../../../compartido/http/clienteHttp.ts'
import { Sesion } from './Sesion.ts'

export interface RepositorioSesion {
  iniciar(credenciales: CredencialesDTO): Promise<Sesion>
}

export class RepositorioSesionHttp implements RepositorioSesion {
  private readonly http: Http

  constructor(http: Http) {
    this.http = http
  }

  async iniciar(credenciales: CredencialesDTO): Promise<Sesion> {
    const dto = await this.http.publicar<SesionDTO>('/auth/login', credenciales)
    return Sesion.desdeDTO(dto)
  }
}

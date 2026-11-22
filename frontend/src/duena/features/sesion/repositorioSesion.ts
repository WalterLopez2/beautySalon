// Puerto y adaptador de autenticacion.

import type { Http } from '../../../compartido/http/clienteHttp.ts'
import type { CredencialesDTO, SesionDTO } from '../../../compartido/tipos/api.ts'
import { Sesion } from './Sesion.ts'

export interface RepositorioSesion {
  iniciar(credenciales: CredencialesDTO): Promise<Sesion>
  // Falla con 401 si no hay cookie o ya no sirve (vencida o revocada).
  verificar(): Promise<Sesion>
  // Revoca el token en el servidor: deja de servir aunque alguien lo copie.
  cerrar(): Promise<void>
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

  async verificar(): Promise<Sesion> {
    return Sesion.desdeDTO(await this.http.obtener<SesionDTO>('/panel/sesion'))
  }

  async cerrar(): Promise<void> {
    await this.http.publicar<void>('/panel/sesion/cerrar', {})
  }
}

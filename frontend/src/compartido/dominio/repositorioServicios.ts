// Puerto y adaptador del catalogo: la vista depende de `RepositorioServicios`,
// no de HTTP, asi que en pruebas se puede sustituir por una lista fija.

import type { ServicioDTO } from '../tipos/api.ts'
import type { Http } from '../http/clienteHttp.ts'
import { CatalogoServicios } from './CatalogoServicios.ts'

export interface RepositorioServicios {
  listar(): Promise<CatalogoServicios>
}

export class RepositorioServiciosHttp implements RepositorioServicios {
  private readonly http: Http

  constructor(http: Http) {
    this.http = http
  }

  async listar(): Promise<CatalogoServicios> {
    const dtos = await this.http.obtener<ServicioDTO[]>('/servicios')
    return CatalogoServicios.desdeDTOs(dtos)
  }
}

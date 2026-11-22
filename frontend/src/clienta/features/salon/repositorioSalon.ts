// Puerto y adaptador de la informacion publica del salon.

import type { Http } from '../../../compartido/http/clienteHttp.ts'
import type { SalonDTO } from '../../../compartido/tipos/api.ts'
import { Salon } from './Salon.ts'

export interface RepositorioSalon {
  obtener(): Promise<Salon>
}

export class RepositorioSalonHttp implements RepositorioSalon {
  private readonly http: Http

  constructor(http: Http) {
    this.http = http
  }

  async obtener(): Promise<Salon> {
    return Salon.desdeDTO(await this.http.obtener<SalonDTO>('/salon'))
  }
}

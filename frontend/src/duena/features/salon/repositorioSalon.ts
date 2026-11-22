// Puerto y adaptador de la informacion del salon en el panel.

import type { Http } from '../../../compartido/http/clienteHttp.ts'
import type { InformacionDelSalonDTO } from '../../../compartido/tipos/api.ts'
import { BorradorDeSalon } from './BorradorDeSalon.ts'

export interface RepositorioSalon {
  obtener(): Promise<BorradorDeSalon>
  guardar(informacion: InformacionDelSalonDTO): Promise<BorradorDeSalon>
}

export class RepositorioSalonHttp implements RepositorioSalon {
  private readonly http: Http

  constructor(http: Http) {
    this.http = http
  }

  async obtener(): Promise<BorradorDeSalon> {
    return BorradorDeSalon.desdeDTO(await this.http.obtener<InformacionDelSalonDTO | null>('/panel/salon'))
  }

  async guardar(informacion: InformacionDelSalonDTO): Promise<BorradorDeSalon> {
    return BorradorDeSalon.desdeDTO(await this.http.reemplazar<InformacionDelSalonDTO>('/panel/salon', informacion))
  }
}

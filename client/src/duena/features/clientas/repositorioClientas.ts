// Puerto y adaptador de clientas para el panel.

import type { ClientaDTO, HistorialDeClientaDTO } from '../../../compartido/tipos/api.ts'
import type { Http } from '../../../compartido/http/clienteHttp.ts'
import { DirectorioDeClientas } from './DirectorioDeClientas.ts'
import { HistorialDeClienta } from './HistorialDeClienta.ts'

export interface RepositorioClientas {
  listar(): Promise<DirectorioDeClientas>
  historialDe(clientaId: number): Promise<HistorialDeClienta>
}

export class RepositorioClientasHttp implements RepositorioClientas {
  private readonly http: Http

  constructor(http: Http) {
    this.http = http
  }

  async listar(): Promise<DirectorioDeClientas> {
    const dtos = await this.http.obtener<ClientaDTO[]>('/panel/clientas')
    return DirectorioDeClientas.desdeDTOs(dtos)
  }

  async historialDe(clientaId: number): Promise<HistorialDeClienta> {
    const dto = await this.http.obtener<HistorialDeClientaDTO>(`/panel/clientas/${clientaId}/historial`)
    return HistorialDeClienta.desdeDTO(dto)
  }
}

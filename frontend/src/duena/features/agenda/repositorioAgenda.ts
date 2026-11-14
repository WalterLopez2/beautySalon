// Puerto y adaptador de las citas del panel (rutas protegidas con token).

import type { Http } from '../../../compartido/http/clienteHttp.ts'
import type { CambioDeEstadoDTO, CitaDelPanelDTO, EstadoCita } from '../../../compartido/tipos/api.ts'
import { CitaDelPanel } from './CitaDelPanel.ts'

export interface RepositorioAgenda {
  // Rango cerrado [desde, hasta], fechas YYYY-MM-DD.
  citasEntre(desde: string, hasta: string): Promise<CitaDelPanel[]>
  cambiarEstado(citaId: number, estado: EstadoCita): Promise<CitaDelPanel>
}

export class RepositorioAgendaHttp implements RepositorioAgenda {
  private readonly http: Http

  constructor(http: Http) {
    this.http = http
  }

  async citasEntre(desde: string, hasta: string): Promise<CitaDelPanel[]> {
    const consulta = new URLSearchParams({ desde, hasta })
    const dtos = await this.http.obtener<CitaDelPanelDTO[]>(`/panel/citas?${consulta}`)
    return dtos.map(CitaDelPanel.desdeDTO)
  }

  async cambiarEstado(citaId: number, estado: EstadoCita): Promise<CitaDelPanel> {
    const cuerpo: CambioDeEstadoDTO = { estado }
    const dto = await this.http.actualizar<CitaDelPanelDTO>(`/panel/citas/${citaId}/estado`, cuerpo)
    return CitaDelPanel.desdeDTO(dto)
  }
}

// Puerto y adaptador del catalogo que administra la duena.

import type { Http } from '../../../compartido/http/clienteHttp.ts'
import type { DatosServicioDTO, ServicioDelPanelDTO } from '../../../compartido/tipos/api.ts'
import { ServicioDelPanel } from './ServicioDelPanel.ts'

export interface RepositorioCatalogo {
  listar(): Promise<ServicioDelPanel[]>
  crear(datos: DatosServicioDTO): Promise<ServicioDelPanel>
  actualizar(id: number, datos: DatosServicioDTO): Promise<ServicioDelPanel>
  cambiarActivo(id: number, activo: boolean): Promise<ServicioDelPanel>
}

export class RepositorioCatalogoHttp implements RepositorioCatalogo {
  private readonly http: Http

  constructor(http: Http) {
    this.http = http
  }

  async listar(): Promise<ServicioDelPanel[]> {
    const dtos = await this.http.obtener<ServicioDelPanelDTO[]>('/panel/servicios')
    return dtos.map(ServicioDelPanel.desdeDTO)
  }

  async crear(datos: DatosServicioDTO): Promise<ServicioDelPanel> {
    return ServicioDelPanel.desdeDTO(await this.http.publicar<ServicioDelPanelDTO>('/panel/servicios', datos))
  }

  async actualizar(id: number, datos: DatosServicioDTO): Promise<ServicioDelPanel> {
    return ServicioDelPanel.desdeDTO(
      await this.http.reemplazar<ServicioDelPanelDTO>(`/panel/servicios/${id}`, datos),
    )
  }

  async cambiarActivo(id: number, activo: boolean): Promise<ServicioDelPanel> {
    return ServicioDelPanel.desdeDTO(
      await this.http.actualizar<ServicioDelPanelDTO>(`/panel/servicios/${id}/activo`, { activo }),
    )
  }
}

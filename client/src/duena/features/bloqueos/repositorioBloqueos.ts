// Puerto y adaptador de dias libres y bloqueos.

import type { Http } from '../../../compartido/http/clienteHttp.ts'
import type { BloqueoCreadoDTO, BloqueoDTO, CrearBloqueoDTO } from '../../../compartido/tipos/api.ts'
import { CitaDelPanel } from '../agenda/CitaDelPanel.ts'
import { Bloqueo } from './Bloqueo.ts'

export interface BloqueoCreado {
  bloqueo: Bloqueo
  citasAfectadas: CitaDelPanel[]
}

export interface RepositorioBloqueos {
  // Los que se cruzan con el rango [desde, hasta].
  entre(desde: string, hasta: string): Promise<Bloqueo[]>
  crear(datos: CrearBloqueoDTO): Promise<BloqueoCreado>
  eliminar(id: number): Promise<void>
}

export class RepositorioBloqueosHttp implements RepositorioBloqueos {
  private readonly http: Http

  constructor(http: Http) {
    this.http = http
  }

  async entre(desde: string, hasta: string): Promise<Bloqueo[]> {
    const consulta = new URLSearchParams({ desde, hasta })
    const dtos = await this.http.obtener<BloqueoDTO[]>(`/panel/bloqueos?${consulta}`)
    return dtos.map(Bloqueo.desdeDTO)
  }

  async crear(datos: CrearBloqueoDTO): Promise<BloqueoCreado> {
    const dto = await this.http.publicar<BloqueoCreadoDTO>('/panel/bloqueos', datos)
    return {
      bloqueo: Bloqueo.desdeDTO(dto.bloqueo),
      citasAfectadas: dto.citasAfectadas.map(CitaDelPanel.desdeDTO),
    }
  }

  eliminar(id: number): Promise<void> {
    return this.http.eliminar(`/panel/bloqueos/${id}`)
  }
}

// Puerto y adaptador de citas. El caso de uso solo conoce esta interfaz.

import type { AgendaDelDiaDTO, CitaDTO, SolicitudDeCitaDTO } from '../../../compartido/tipos/api.ts'
import type { Http } from '../../../compartido/http/clienteHttp.ts'
import { AgendaDelDia } from './AgendaDelDia.ts'
import { Cita } from '../../../compartido/dominio/Cita.ts'

export interface RepositorioCitas {
  agendaDe(fecha: string): Promise<AgendaDelDia>
  agendar(solicitud: SolicitudDeCitaDTO): Promise<Cita>
  historialPorTelefono(telefono: string): Promise<Cita[]>
}

export class RepositorioCitasHttp implements RepositorioCitas {
  private readonly http: Http

  constructor(http: Http) {
    this.http = http
  }

  async agendaDe(fecha: string): Promise<AgendaDelDia> {
    const dto = await this.http.obtener<AgendaDelDiaDTO>(
      `/citas/agenda?fecha=${encodeURIComponent(fecha)}`,
    )
    return AgendaDelDia.desdeDTO(dto)
  }

  async agendar(solicitud: SolicitudDeCitaDTO): Promise<Cita> {
    const dto = await this.http.publicar<CitaDTO>('/citas', solicitud)
    return Cita.desdeDTO(dto)
  }

  async historialPorTelefono(telefono: string): Promise<Cita[]> {
    const dtos = await this.http.obtener<CitaDTO[]>(
      `/citas?telefono=${encodeURIComponent(telefono)}`,
    )
    return dtos.map(Cita.desdeDTO)
  }
}

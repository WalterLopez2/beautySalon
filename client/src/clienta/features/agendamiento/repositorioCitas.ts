// Puerto y adaptador de citas. El caso de uso solo conoce esta interfaz.

import { Cita } from '../../../compartido/dominio/Cita.ts'
import type { Http } from '../../../compartido/http/clienteHttp.ts'
import type {
  AgendaDelDiaDTO,
  CitaAgendadaDTO,
  CitaDTO,
  ConsultaDeHistorialDTO,
  SolicitudDeCitaDTO,
} from '../../../compartido/tipos/api.ts'
import { AgendaDelDia } from './AgendaDelDia.ts'

// La cita recien creada y su codigo de consulta. La vista debe mostrarle el
// codigo a la clienta: el servidor no lo vuelve a entregar.
export interface CitaAgendada {
  cita: Cita
  codigoDeConsulta: string
}

export interface RepositorioCitas {
  agendaDe(fecha: string): Promise<AgendaDelDia>
  agendar(solicitud: SolicitudDeCitaDTO): Promise<CitaAgendada>
  // Con un codigo equivocado devuelve una lista vacia.
  historial(consulta: ConsultaDeHistorialDTO): Promise<Cita[]>
}

export class RepositorioCitasHttp implements RepositorioCitas {
  private readonly http: Http

  constructor(http: Http) {
    this.http = http
  }

  async agendaDe(fecha: string): Promise<AgendaDelDia> {
    const dto = await this.http.obtener<AgendaDelDiaDTO>(`/citas/agenda?fecha=${encodeURIComponent(fecha)}`)
    return AgendaDelDia.desdeDTO(dto)
  }

  async agendar(solicitud: SolicitudDeCitaDTO): Promise<CitaAgendada> {
    const dto = await this.http.publicar<CitaAgendadaDTO>('/citas', solicitud)
    return { cita: Cita.desdeDTO(dto), codigoDeConsulta: dto.codigoDeConsulta }
  }

  // POST y no GET: el telefono y el codigo no deben quedar en la URL.
  async historial(consulta: ConsultaDeHistorialDTO): Promise<Cita[]> {
    const dtos = await this.http.publicar<CitaDTO[]>('/citas/consulta', consulta)
    return dtos.map(Cita.desdeDTO)
  }
}

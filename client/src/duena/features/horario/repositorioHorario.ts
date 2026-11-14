// Puerto y adaptador del horario del salon.

import type { Http } from '../../../compartido/http/clienteHttp.ts'
import type { GuardarHorarioDTO, HorarioSemanalDTO } from '../../../compartido/tipos/api.ts'
import { HorarioSemanal } from './HorarioSemanal.ts'

export interface RepositorioHorario {
  obtener(): Promise<HorarioSemanal>
  guardar(horario: GuardarHorarioDTO): Promise<HorarioSemanal>
}

export class RepositorioHorarioHttp implements RepositorioHorario {
  private readonly http: Http

  constructor(http: Http) {
    this.http = http
  }

  async obtener(): Promise<HorarioSemanal> {
    return HorarioSemanal.desdeDTO(await this.http.obtener<HorarioSemanalDTO>('/panel/horario'))
  }

  async guardar(horario: GuardarHorarioDTO): Promise<HorarioSemanal> {
    return HorarioSemanal.desdeDTO(await this.http.reemplazar<HorarioSemanalDTO>('/panel/horario', horario))
  }
}

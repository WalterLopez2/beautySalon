// Un dia libre o un tramo de horas en que la duena no atiende.

import { Franja } from '../../../compartido/dominio/Franja.ts'
import type { BloqueoDTO } from '../../../compartido/tipos/api.ts'
import { formatearFecha, formatearHora } from '../../../compartido/utils/formato.ts'
import { horaAMinutos } from '../../../compartido/utils/hora.ts'

export class Bloqueo {
  readonly id: number
  readonly desde: string
  readonly hasta: string
  readonly inicio: string | null
  readonly fin: string | null
  readonly motivo: string | null

  constructor(dto: BloqueoDTO) {
    this.id = dto.id
    this.desde = dto.desde
    this.hasta = dto.hasta
    this.inicio = dto.inicio
    this.fin = dto.fin
    this.motivo = dto.motivo
  }

  static desdeDTO(dto: BloqueoDTO): Bloqueo {
    return new Bloqueo(dto)
  }

  esDeDiaCompleto(): boolean {
    return this.inicio === null || this.fin === null
  }

  esDeUnSoloDia(): boolean {
    return this.desde === this.hasta
  }

  cubreLaFecha(fecha: string): boolean {
    return this.desde <= fecha && fecha <= this.hasta
  }

  // El tramo bloqueado como franja, para dibujarlo en la agenda del dia.
  franja(): Franja | null {
    if (this.esDeDiaCompleto()) return null
    const inicio = this.inicio as string
    return new Franja(inicio, horaAMinutos(this.fin as string) - horaAMinutos(inicio))
  }

  // "Del lunes 20 de diciembre al jueves 31 de diciembre, todo el dia"
  resumen(): string {
    const fechas = this.esDeUnSoloDia()
      ? formatearFecha(this.desde)
      : `Del ${formatearFecha(this.desde)} al ${formatearFecha(this.hasta)}`
    const horas = this.esDeDiaCompleto()
      ? 'todo el dia'
      : `de ${formatearHora(this.inicio as string)} a ${formatearHora(this.fin as string)}`
    return `${fechas}, ${horas}`
  }
}

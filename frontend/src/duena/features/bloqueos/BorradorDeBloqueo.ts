// Lo que la duena llena en el formulario de "bloquear". Inmutable, igual que
// los demas borradores: cada cambio devuelve uno nuevo.

import type { CrearBloqueoDTO } from '../../../compartido/tipos/api.ts'
import { esFechaValida } from '../../../compartido/utils/fecha.ts'
import { esHoraValida, horaAMinutos } from '../../../compartido/utils/hora.ts'

export interface CamposDelBloqueo {
  desde: string
  hasta: string // vacio = el mismo dia que `desde`
  todoElDia: boolean
  inicio: string
  fin: string
  motivo: string
}

export class BorradorDeBloqueo {
  readonly campos: CamposDelBloqueo

  constructor(campos: CamposDelBloqueo) {
    this.campos = campos
  }

  static para(fecha: string): BorradorDeBloqueo {
    return new BorradorDeBloqueo({ desde: fecha, hasta: '', todoElDia: true, inicio: '', fin: '', motivo: '' })
  }

  con(cambios: Partial<CamposDelBloqueo>): BorradorDeBloqueo {
    return new BorradorDeBloqueo({ ...this.campos, ...cambios })
  }

  errores(): string[] {
    const errores: string[] = []
    const { desde, todoElDia, inicio, fin } = this.campos

    if (!esFechaValida(desde)) {
      errores.push('Elegi desde que fecha no vas a atender.')
    } else if (this.hasta() < desde) {
      errores.push('La fecha final debe ser igual o posterior a la inicial.')
    }
    if (!todoElDia) {
      if (!esHoraValida(inicio) || !esHoraValida(fin)) {
        errores.push('Elegi la hora de inicio y la de fin del bloqueo.')
      } else if (horaAMinutos(inicio) >= horaAMinutos(fin)) {
        errores.push('La hora de inicio debe ser antes de la hora de fin.')
      }
    }
    return errores
  }

  estaCompleto(): boolean {
    return this.errores().length === 0
  }

  aDTO(): CrearBloqueoDTO {
    if (!this.estaCompleto()) {
      throw new Error('El bloqueo todavia tiene datos pendientes.')
    }
    const { desde, todoElDia, inicio, fin, motivo } = this.campos
    return {
      desde,
      hasta: this.hasta(),
      inicio: todoElDia ? null : inicio,
      fin: todoElDia ? null : fin,
      motivo: motivo.trim() || null,
    }
  }

  private hasta(): string {
    return esFechaValida(this.campos.hasta) ? this.campos.hasta : this.campos.desde
  }
}

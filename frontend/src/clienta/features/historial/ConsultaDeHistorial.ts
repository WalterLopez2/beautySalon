// Lo que la clienta escribe para ver sus citas. Es inmutable, igual que
// `SolicitudDeCita`: cada cambio devuelve una consulta nueva.

import type { ConsultaDeHistorialDTO } from '../../../compartido/tipos/api.ts'
import { TELEFONO_INVALIDO, esTelefonoValido } from '../../../compartido/utils/telefono.ts'

export class ConsultaDeHistorial {
  readonly telefono: string
  readonly codigo: string

  constructor(telefono: string, codigo: string) {
    this.telefono = telefono
    this.codigo = codigo
  }

  static vacia(): ConsultaDeHistorial {
    return new ConsultaDeHistorial('', '')
  }

  con(cambios: Partial<ConsultaDeHistorialDTO>): ConsultaDeHistorial {
    return new ConsultaDeHistorial(cambios.telefono ?? this.telefono, cambios.codigo ?? this.codigo)
  }

  errores(): string[] {
    const errores: string[] = []

    if (!esTelefonoValido(this.telefono)) {
      errores.push(TELEFONO_INVALIDO)
    }
    if (!this.codigo.trim()) {
      errores.push('Escribi tu codigo de consulta.')
    }
    return errores
  }

  aDTO(): ConsultaDeHistorialDTO {
    return { telefono: this.telefono.trim(), codigo: this.codigo.trim() }
  }
}

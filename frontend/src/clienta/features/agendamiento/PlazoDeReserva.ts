// Entre que dias se puede agendar y cuanto tarda en vencer una solicitud. Lo
// decide la duena en el panel y llega del servidor, con la fecha del salon.

import type { PlazoDeReservaDTO } from '../../../compartido/tipos/api.ts'
import { esFechaValida } from '../../../compartido/utils/fecha.ts'
import { formatearFecha } from '../../../compartido/utils/formato.ts'

export class PlazoDeReserva {
  readonly primeraFecha: string
  readonly ultimaFecha: string
  readonly horasParaConfirmar: number

  constructor(primeraFecha: string, ultimaFecha: string, horasParaConfirmar: number) {
    this.primeraFecha = primeraFecha
    this.ultimaFecha = ultimaFecha
    this.horasParaConfirmar = horasParaConfirmar
  }

  static desdeDTO(dto: PlazoDeReservaDTO): PlazoDeReserva {
    return new PlazoDeReserva(dto.hoy, dto.ultimaFecha, dto.horasParaConfirmar)
  }

  permite(fecha: string): boolean {
    return this.errorDe(fecha) === null
  }

  // Una fecha vacia no es un error de plazo: todavia no la eligio.
  errorDe(fecha: string): string | null {
    if (!esFechaValida(fecha)) return null
    if (fecha < this.primeraFecha) return 'La fecha de la cita no puede ser anterior a hoy.'
    if (fecha > this.ultimaFecha) return `Se puede agendar hasta el ${formatearFecha(this.ultimaFecha)}.`
    return null
  }
}

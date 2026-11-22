// El salon como lo ve la clienta: quien es y si esta recibiendo reservas.
// Todo lo escribe la duena en el panel.

import type { InformacionDelSalonDTO, SalonDTO } from '../../../compartido/tipos/api.ts'
import { PlazoDeReserva } from '../agendamiento/PlazoDeReserva.ts'

export class Salon {
  readonly nombre: string
  readonly marca: string
  readonly eslogan: string
  readonly descripcion: string
  readonly telefono: string | null
  // null = no recibe reservas en linea.
  readonly plazo: PlazoDeReserva | null

  constructor(informacion: InformacionDelSalonDTO | null, plazo: PlazoDeReserva | null) {
    this.nombre = informacion?.nombre ?? ''
    this.marca = informacion?.marca ?? this.nombre
    this.eslogan = informacion?.eslogan ?? ''
    this.descripcion = informacion?.descripcion ?? ''
    this.telefono = informacion?.telefono ?? null
    this.plazo = plazo
  }

  static desdeDTO({ informacion, reservas }: SalonDTO): Salon {
    return new Salon(informacion, reservas && PlazoDeReserva.desdeDTO(reservas))
  }

  recibeReservas(): boolean {
    return this.plazo !== null
  }

  tituloDeLaPagina(): string {
    return [this.nombre, this.eslogan].filter(Boolean).join(' · ')
  }
}

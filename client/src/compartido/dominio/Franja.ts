// Franja horaria: una hora de inicio mas una duracion. Es un objeto de valor
// (inmutable, sin identidad) y refleja la misma regla de cruce del backend.

import { formatearHora } from '../utils/formato.ts'
import { MINUTOS_POR_DIA, horaAMinutos, minutosAHora } from '../utils/hora.ts'

export class Franja {
  readonly inicio: string
  readonly duracionMin: number

  constructor(inicio: string, duracionMin: number) {
    if (!Number.isInteger(duracionMin) || duracionMin <= 0) {
      throw new Error('La duracion de la franja debe ser mayor a cero minutos.')
    }
    if (horaAMinutos(inicio) + duracionMin > MINUTOS_POR_DIA) {
      throw new Error('La franja no puede terminar despues de la medianoche.')
    }

    this.inicio = inicio
    this.duracionMin = duracionMin
  }

  inicioEnMinutos(): number {
    return horaAMinutos(this.inicio)
  }

  finEnMinutos(): number {
    return this.inicioEnMinutos() + this.duracionMin
  }

  fin(): string {
    return minutosAHora(this.finEnMinutos())
  }

  // Dos franjas se cruzan si cada una empieza antes de que la otra termine.
  seCruzaCon(otra: Franja): boolean {
    return this.inicioEnMinutos() < otra.finEnMinutos() && otra.inicioEnMinutos() < this.finEnMinutos()
  }

  empiezaAntesDe(hora: string): boolean {
    return this.inicioEnMinutos() < horaAMinutos(hora)
  }

  // "9:00 a. m. - 10:30 a. m."
  etiqueta(): string {
    return `${formatearHora(this.inicio)} - ${formatearHora(this.fin())}`
  }
}

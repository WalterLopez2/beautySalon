// Un mes del calendario de reservas: que dias se pueden elegir y por que no
// los demas. Las reglas salen del plazo y del horario que configura la duena;
// la vista solo dibuja lo que esta clase le dice.

import {
  diasDeLaSemana,
  finDelMes,
  finDeSemana,
  inicioDelMes,
  inicioDeSemana,
  sumarDias,
  sumarMeses,
} from '../../../compartido/utils/fecha.ts'
import type { HorarioDeAtencion } from '../salon/HorarioDeAtencion.ts'
import type { PlazoDeReserva } from './PlazoDeReserva.ts'

export type MotivoNoDisponible = 'pasado' | 'cerrado' | 'fuera-de-plazo'

export interface DiaDelCalendario {
  fecha: string // YYYY-MM-DD
  numero: number // 1..31
  delMes: boolean // false = relleno del mes anterior o siguiente
  esHoy: boolean
  noDisponible: MotivoNoDisponible | null // null = se puede elegir
}

export class CalendarioDelMes {
  readonly inicio: string // primer dia del mes, YYYY-MM-01
  private readonly plazo: PlazoDeReserva
  private readonly horario: HorarioDeAtencion

  constructor(fechaDelMes: string, plazo: PlazoDeReserva, horario: HorarioDeAtencion) {
    this.inicio = inicioDelMes(fechaDelMes)
    this.plazo = plazo
    this.horario = horario
  }

  // Semanas completas de lunes a domingo que cubren el mes.
  semanas(): DiaDelCalendario[][] {
    const semanas: DiaDelCalendario[][] = []
    const ultimoDomingo = finDeSemana(finDelMes(this.inicio))
    for (let lunes = inicioDeSemana(this.inicio); lunes <= ultimoDomingo; lunes = sumarDias(lunes, 7)) {
      semanas.push(diasDeLaSemana(lunes).map((fecha) => this.dia(fecha)))
    }
    return semanas
  }

  // No se navega a meses donde no hay ningun dia para reservar.
  hayMesAnterior(): boolean {
    return this.inicio > this.plazo.primeraFecha
  }

  hayMesSiguiente(): boolean {
    return sumarMeses(this.inicio, 1) <= this.plazo.ultimaFecha
  }

  mesAnterior(): CalendarioDelMes {
    return new CalendarioDelMes(sumarMeses(this.inicio, -1), this.plazo, this.horario)
  }

  mesSiguiente(): CalendarioDelMes {
    return new CalendarioDelMes(sumarMeses(this.inicio, 1), this.plazo, this.horario)
  }

  private dia(fecha: string): DiaDelCalendario {
    return {
      fecha,
      numero: Number(fecha.slice(8)),
      delMes: inicioDelMes(fecha) === this.inicio,
      esHoy: fecha === this.plazo.primeraFecha,
      noDisponible: this.motivoNoDisponible(fecha),
    }
  }

  private motivoNoDisponible(fecha: string): MotivoNoDisponible | null {
    if (fecha < this.plazo.primeraFecha) return 'pasado'
    if (fecha > this.plazo.ultimaFecha) return 'fuera-de-plazo'
    if (!this.horario.abreEl(fecha)) return 'cerrado'
    return null
  }
}

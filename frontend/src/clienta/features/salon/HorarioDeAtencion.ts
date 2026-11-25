// Los dias y horas en que atiende el salon, para mostrarlos en la pagina
// publica. Lo configura la duena en Horario; un dia que no llega esta cerrado.

import { DIAS_DE_LA_SEMANA, type DiaDeLaSemana } from '../../../compartido/dominio/DiasDeLaSemana.ts'
import type { DiaDeAtencionDTO } from '../../../compartido/tipos/api.ts'

export interface HorasDeAtencion {
  apertura: string // HH:MM
  cierre: string // HH:MM
}

export interface DiaDelHorario {
  dia: DiaDeLaSemana
  horas: HorasDeAtencion | null // null = cerrado
}

export class HorarioDeAtencion {
  private readonly horasPorDia: ReadonlyMap<number, HorasDeAtencion>

  constructor(horasPorDia: ReadonlyMap<number, HorasDeAtencion>) {
    this.horasPorDia = horasPorDia
  }

  static desdeDTO(dias: readonly DiaDeAtencionDTO[]): HorarioDeAtencion {
    return new HorarioDeAtencion(
      new Map(dias.map(({ diaSemana, apertura, cierre }) => [diaSemana, { apertura, cierre }])),
    )
  }

  // Sin ningun dia abierto no hay horario que mostrar.
  estaVacio(): boolean {
    return this.horasPorDia.size === 0
  }

  // Los siete dias, de lunes a domingo, con sus horas o cerrados.
  semana(): DiaDelHorario[] {
    return DIAS_DE_LA_SEMANA.map((dia) => ({ dia, horas: this.horasPorDia.get(dia.numero) ?? null }))
  }
}

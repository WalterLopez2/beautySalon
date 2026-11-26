// Los dias y horas en que atiende el salon, para mostrarlos en la pagina
// publica. Lo configura la duena en Horario; un dia que no llega esta cerrado.

import { DIAS_DE_LA_SEMANA, numeroDelDia, type DiaDeLaSemana } from '../../../compartido/dominio/DiasDeLaSemana.ts'
import type { DiaDeAtencionDTO } from '../../../compartido/tipos/api.ts'
import { sumarDias } from '../../../compartido/utils/fecha.ts'

export interface HorasDeAtencion {
  apertura: string // HH:MM
  cierre: string // HH:MM
}

export interface DiaDelHorario {
  dia: DiaDeLaSemana
  horas: HorasDeAtencion | null // null = cerrado
}

export interface MomentoDeApertura {
  fecha: string // YYYY-MM-DD
  hora: string // HH:MM
}

// Si el salon esta abierto en un momento dado y, si no, cuando vuelve a abrir.
export type EstadoDelSalon =
  | { abierto: true; cierre: string }
  | { abierto: false; proximaApertura: MomentoDeApertura | null }

const DIAS_POR_SEMANA = 7

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

  horasDe(fecha: string): HorasDeAtencion | null {
    return this.horasPorDia.get(numeroDelDia(fecha)) ?? null
  }

  abreEl(fecha: string): boolean {
    return this.horasDe(fecha) !== null
  }

  // Las horas HH:MM se comparan como texto: "09:30" < "18:00".
  estadoEn(fecha: string, hora: string): EstadoDelSalon {
    const horas = this.horasDe(fecha)
    if (horas && horas.apertura <= hora && hora < horas.cierre) {
      return { abierto: true, cierre: horas.cierre }
    }
    return { abierto: false, proximaApertura: this.proximaAperturaDesde(fecha, hora) }
  }

  // Hoy mas tarde, o el proximo dia que abra dentro de una semana.
  private proximaAperturaDesde(fecha: string, hora: string): MomentoDeApertura | null {
    const horasDeHoy = this.horasDe(fecha)
    if (horasDeHoy && hora < horasDeHoy.apertura) return { fecha, hora: horasDeHoy.apertura }

    for (let dias = 1; dias <= DIAS_POR_SEMANA; dias++) {
      const siguiente = sumarDias(fecha, dias)
      const horas = this.horasDe(siguiente)
      if (horas) return { fecha: siguiente, hora: horas.apertura }
    }
    return null
  }
}

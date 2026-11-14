// Horario de atencion y reglas de reserva que configura la duena: que dias
// abre, de que hora a que hora, cada cuanto ofrece turnos, en que zona horaria
// esta el salon y cuantas citas por venir puede tener una misma clienta.
// Inmutable: cada cambio devuelve un horario nuevo, listo para el estado de React.
//
// Nada viene predefinido. Un salon nuevo empieza sin dias (cerrado), sin
// intervalo y sin limite; solo la zona horaria se propone desde el navegador.

import type { DiaDeAtencionDTO, GuardarHorarioDTO, HorarioSemanalDTO } from '../../../compartido/tipos/api.ts'
import { esHoraValida, horaAMinutos } from '../../../compartido/utils/hora.ts'

export interface DiaDeLaSemana {
  numero: number // 1 = lunes ... 7 = domingo (ISO 8601, igual que el backend)
  nombre: string
}

export const DIAS_DE_LA_SEMANA: readonly DiaDeLaSemana[] = [
  { numero: 1, nombre: 'Lunes' },
  { numero: 2, nombre: 'Martes' },
  { numero: 3, nombre: 'Miercoles' },
  { numero: 4, nombre: 'Jueves' },
  { numero: 5, nombre: 'Viernes' },
  { numero: 6, nombre: 'Sabado' },
  { numero: 7, nombre: 'Domingo' },
]

export interface HorasDelDia {
  apertura: string // HH:MM
  cierre: string // HH:MM
}

interface Ajustes {
  zonaHoraria: string
  intervaloMin: number | null
  maxCitasPendientes: number | null
}

// Mismos limites que valida el backend.
const INTERVALO = { minimo: 5, maximo: 240 }
const CITAS_PENDIENTES = { minimo: 1, maximo: 50 }

export class HorarioSemanal {
  readonly zonaHoraria: string
  readonly intervaloMin: number | null
  readonly maxCitasPendientes: number | null
  readonly yaGuardado: boolean
  private readonly dias: ReadonlyMap<number, HorasDelDia>

  constructor(ajustes: Ajustes, dias: ReadonlyMap<number, HorasDelDia>, yaGuardado: boolean) {
    this.zonaHoraria = ajustes.zonaHoraria
    this.intervaloMin = ajustes.intervaloMin
    this.maxCitasPendientes = ajustes.maxCitasPendientes
    this.dias = dias
    this.yaGuardado = yaGuardado
  }

  static desdeDTO(dto: HorarioSemanalDTO): HorarioSemanal {
    const dias = new Map(dto.dias.map((dia) => [dia.diaSemana, { apertura: dia.apertura, cierre: dia.cierre }]))
    const ajustes = {
      zonaHoraria: dto.zonaHoraria ?? zonaDelNavegador(),
      intervaloMin: dto.intervaloMin,
      maxCitasPendientes: dto.maxCitasPendientes,
    }
    return new HorarioSemanal(ajustes, dias, dto.configurado)
  }

  horasDel(dia: number): HorasDelDia | null {
    return this.dias.get(dia) ?? null
  }

  abreEl(dia: number): boolean {
    return this.dias.has(dia)
  }

  cantidadDeDiasAbiertos(): number {
    return this.dias.size
  }

  // ----- Cambios (cada uno devuelve un horario nuevo) -----

  conHorasDel(dia: number, horas: HorasDelDia): HorarioSemanal {
    const dias = new Map(this.dias)
    dias.set(dia, horas)
    return this.con({}, dias)
  }

  cerradoEl(dia: number): HorarioSemanal {
    const dias = new Map(this.dias)
    dias.delete(dia)
    return this.con({}, dias)
  }

  conIntervalo(intervaloMin: number | null): HorarioSemanal {
    return this.con({ intervaloMin })
  }

  conZonaHoraria(zonaHoraria: string): HorarioSemanal {
    return this.con({ zonaHoraria })
  }

  conMaximoDeCitasPendientes(maxCitasPendientes: number | null): HorarioSemanal {
    return this.con({ maxCitasPendientes })
  }

  // ----- Validacion y envio -----

  errores(): string[] {
    const errores: string[] = []

    if (!this.zonaHoraria.trim()) {
      errores.push('Elegi la zona horaria del salon.')
    }
    if (!estaEntre(this.intervaloMin, INTERVALO)) {
      errores.push(`Elegi cada cuantos minutos ofreces turnos (entre ${INTERVALO.minimo} y ${INTERVALO.maximo}).`)
    }
    if (!estaEntre(this.maxCitasPendientes, CITAS_PENDIENTES)) {
      errores.push(
        `Elegi cuantas citas por venir puede tener una clienta (entre ${CITAS_PENDIENTES.minimo} y ${CITAS_PENDIENTES.maximo}).`,
      )
    }
    for (const dia of DIAS_DE_LA_SEMANA) {
      const horas = this.horasDel(dia.numero)
      if (horas && !sonHorasValidas(horas)) {
        errores.push(`${dia.nombre}: la hora de apertura debe ser antes de la de cierre.`)
      }
    }
    return errores
  }

  estaCompleto(): boolean {
    return this.errores().length === 0
  }

  aDTO(): GuardarHorarioDTO {
    if (this.intervaloMin === null || this.maxCitasPendientes === null || !this.estaCompleto()) {
      throw new Error('El horario todavia tiene datos pendientes.')
    }
    const dias: DiaDeAtencionDTO[] = [...this.dias.entries()]
      .sort(([a], [b]) => a - b)
      .map(([diaSemana, horas]) => ({ diaSemana, ...horas }))

    return {
      zonaHoraria: this.zonaHoraria.trim(),
      intervaloMin: this.intervaloMin,
      maxCitasPendientes: this.maxCitasPendientes,
      dias,
    }
  }

  private con(cambios: Partial<Ajustes>, dias: ReadonlyMap<number, HorasDelDia> = this.dias): HorarioSemanal {
    const ajustes: Ajustes = {
      zonaHoraria: this.zonaHoraria,
      intervaloMin: this.intervaloMin,
      maxCitasPendientes: this.maxCitasPendientes,
      ...cambios,
    }
    return new HorarioSemanal(ajustes, dias, this.yaGuardado)
  }
}

function estaEntre(valor: number | null, rango: { minimo: number; maximo: number }): boolean {
  return valor !== null && Number.isInteger(valor) && valor >= rango.minimo && valor <= rango.maximo
}

function sonHorasValidas({ apertura, cierre }: HorasDelDia): boolean {
  return esHoraValida(apertura) && esHoraValida(cierre) && horaAMinutos(apertura) < horaAMinutos(cierre)
}

// Solo una sugerencia para el primer horario; la duena puede cambiarla.
function zonaDelNavegador(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

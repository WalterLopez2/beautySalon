// Horario de atencion y reglas de reserva que configura la duena: que dias
// abre, de que hora a que hora, cada cuanto ofrece turnos, en que zona horaria
// esta el salon y todas las reglas de reserva.
// Inmutable: cada cambio devuelve un horario nuevo, listo para el estado de React.
//
// Nada viene predefinido. Un salon nuevo empieza sin dias (cerrado), sin
// reglas; solo la zona horaria se propone desde el navegador.

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

type CampoDeRegla =
  | 'intervaloMin'
  | 'maxCitasPendientes'
  | 'diasDeAnticipacion'
  | 'horasParaConfirmar'
  | 'citasPorConexionAlDia'

export interface ReglaDeReserva {
  campo: CampoDeRegla
  etiqueta: string
  ayuda: string
  minimo: number
  maximo: number
}

// El formulario y la validacion salen de esta misma lista. Los rangos son los
// bordes que acepta el backend, no valores: los valores los pone la duena.
export const REGLAS_DE_RESERVA: readonly ReglaDeReserva[] = [
  {
    campo: 'intervaloMin',
    etiqueta: 'Turnos cada (minutos)',
    ayuda: 'Cada cuanto se ofrece una hora para empezar.',
    minimo: 5,
    maximo: 240,
  },
  {
    campo: 'maxCitasPendientes',
    etiqueta: 'Maximo de citas por venir por clienta',
    ayuda: 'Cuantas citas futuras puede tener un mismo telefono.',
    minimo: 1,
    maximo: 50,
  },
  {
    campo: 'diasDeAnticipacion',
    etiqueta: 'Dias de anticipacion para reservar',
    ayuda: 'Hasta cuantos dias adelante se puede agendar.',
    minimo: 1,
    maximo: 365,
  },
  {
    campo: 'horasParaConfirmar',
    etiqueta: 'Horas que tienes para confirmar',
    ayuda: 'Despues de este plazo una solicitud vence y libera su hora. Si lo bajas, las que ya pasaron del plazo vencen enseguida.',
    minimo: 1,
    maximo: 720,
  },
  {
    campo: 'citasPorConexionAlDia',
    etiqueta: 'Citas para un mismo dia desde una conexion',
    ayuda: 'Evita que una persona llene tu agenda. Quienes usan el mismo Wi-Fi comparten este numero.',
    minimo: 1,
    maximo: 50,
  },
]

type Reglas = Record<CampoDeRegla, number | null>

interface Ajustes extends Reglas {
  zonaHoraria: string
}

export class HorarioSemanal {
  readonly zonaHoraria: string
  readonly yaGuardado: boolean
  private readonly ajustes: Ajustes
  private readonly dias: ReadonlyMap<number, HorasDelDia>

  constructor(ajustes: Ajustes, dias: ReadonlyMap<number, HorasDelDia>, yaGuardado: boolean) {
    this.zonaHoraria = ajustes.zonaHoraria
    this.ajustes = ajustes
    this.dias = dias
    this.yaGuardado = yaGuardado
  }

  static desdeDTO(dto: HorarioSemanalDTO): HorarioSemanal {
    const dias = new Map(dto.dias.map((dia) => [dia.diaSemana, { apertura: dia.apertura, cierre: dia.cierre }]))
    const ajustes: Ajustes = {
      zonaHoraria: dto.zonaHoraria ?? zonaDelNavegador(),
      intervaloMin: dto.intervaloMin,
      maxCitasPendientes: dto.maxCitasPendientes,
      diasDeAnticipacion: dto.diasDeAnticipacion,
      horasParaConfirmar: dto.horasParaConfirmar,
      citasPorConexionAlDia: dto.citasPorConexionAlDia,
    }
    return new HorarioSemanal(ajustes, dias, dto.configurado)
  }

  valorDe(campo: CampoDeRegla): number | null {
    return this.ajustes[campo]
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

  conRegla(campo: CampoDeRegla, valor: number | null): HorarioSemanal {
    return this.con({ [campo]: valor })
  }

  conZonaHoraria(zonaHoraria: string): HorarioSemanal {
    return this.con({ zonaHoraria })
  }

  // ----- Validacion y envio -----

  errores(): string[] {
    const errores: string[] = []

    if (!this.zonaHoraria.trim()) {
      errores.push('Elegi la zona horaria del salon.')
    }
    for (const regla of REGLAS_DE_RESERVA) {
      if (!estaEntre(this.valorDe(regla.campo), regla)) {
        errores.push(`${regla.etiqueta}: escribi un numero entre ${regla.minimo} y ${regla.maximo}.`)
      }
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
    if (!this.estaCompleto()) {
      throw new Error('El horario todavia tiene datos pendientes.')
    }
    // `estaCompleto` ya garantizo que ninguna regla esta vacia.
    const reglas = this.ajustes as Record<CampoDeRegla, number>
    const dias: DiaDeAtencionDTO[] = [...this.dias.entries()]
      .sort(([a], [b]) => a - b)
      .map(([diaSemana, horas]) => ({ diaSemana, ...horas }))

    return {
      zonaHoraria: this.zonaHoraria.trim(),
      intervaloMin: reglas.intervaloMin,
      maxCitasPendientes: reglas.maxCitasPendientes,
      diasDeAnticipacion: reglas.diasDeAnticipacion,
      horasParaConfirmar: reglas.horasParaConfirmar,
      citasPorConexionAlDia: reglas.citasPorConexionAlDia,
      dias,
    }
  }

  private con(cambios: Partial<Ajustes>, dias: ReadonlyMap<number, HorasDelDia> = this.dias): HorarioSemanal {
    const ajustes: Ajustes = { ...this.ajustes, ...cambios }
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

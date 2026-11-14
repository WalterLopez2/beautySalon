// Agenda de un dia: sabe que franjas estan ocupadas y calcula en que horas
// cabe un servicio. El horario NO esta en el codigo: llega del servidor, tal
// como lo configuro la duena en el panel. El backend valida de nuevo al
// guardar; esto es para que la clienta solo vea horas posibles.

import { Franja } from '../../../compartido/dominio/Franja.ts'
import type { AgendaDelDiaDTO } from '../../../compartido/tipos/api.ts'
import { esFechaValida } from '../../../compartido/utils/fecha.ts'
import { horaAMinutos, minutosAHora } from '../../../compartido/utils/hora.ts'

export interface HorarioDeAtencion {
  apertura: string // HH:MM
  cierre: string // HH:MM
  intervaloMin: number // cada cuanto se ofrece una hora de inicio
}

export class AgendaDelDia {
  readonly fecha: string
  private readonly ocupadas: readonly Franja[]
  // null = ese dia el salon no atiende (o aun no configuro su horario).
  private readonly horario: HorarioDeAtencion | null

  constructor(fecha: string, ocupadas: readonly Franja[], horario: HorarioDeAtencion | null) {
    if (!esFechaValida(fecha)) {
      throw new Error(`La fecha "${fecha}" debe tener el formato YYYY-MM-DD.`)
    }
    if (horario && horaAMinutos(horario.apertura) >= horaAMinutos(horario.cierre)) {
      throw new Error('La hora de apertura debe ser anterior a la de cierre.')
    }

    this.fecha = fecha
    this.ocupadas = ocupadas
    this.horario = horario
  }

  static desdeDTO(dto: AgendaDelDiaDTO): AgendaDelDia {
    const ocupadas = dto.ocupadas.map((franja) => new Franja(franja.inicio, franja.duracionMin))
    return new AgendaDelDia(dto.fecha, ocupadas, horarioDelDTO(dto))
  }

  estaAbierto(): boolean {
    return this.horario !== null
  }

  estaDisponible(franja: Franja): boolean {
    if (!this.horario) return false
    return (
      this.cabeEnElHorario(franja, this.horario) &&
      this.coincideConUnTurno(franja, this.horario) &&
      !this.ocupadas.some((ocupada) => ocupada.seCruzaCon(franja))
    )
  }

  // Todas las franjas donde cabe un servicio de esa duracion.
  // `apartirDe` sirve para no ofrecer horas ya pasadas cuando la fecha es hoy.
  franjasDisponiblesPara(duracionMin: number, apartirDe?: string): Franja[] {
    if (!this.horario) return []

    const disponibles: Franja[] = []
    const ultimoInicio = horaAMinutos(this.horario.cierre) - duracionMin

    for (
      let minuto = horaAMinutos(this.horario.apertura);
      minuto <= ultimoInicio;
      minuto += this.horario.intervaloMin
    ) {
      const franja = new Franja(minutosAHora(minuto), duracionMin)
      const yaPaso = apartirDe !== undefined && franja.empiezaAntesDe(apartirDe)
      if (!yaPaso && this.estaDisponible(franja)) {
        disponibles.push(franja)
      }
    }
    return disponibles
  }

  horasDisponiblesPara(duracionMin: number, apartirDe?: string): string[] {
    return this.franjasDisponiblesPara(duracionMin, apartirDe).map((franja) => franja.inicio)
  }

  sinEspacioPara(duracionMin: number, apartirDe?: string): boolean {
    return this.franjasDisponiblesPara(duracionMin, apartirDe).length === 0
  }

  private cabeEnElHorario(franja: Franja, horario: HorarioDeAtencion): boolean {
    return (
      franja.inicioEnMinutos() >= horaAMinutos(horario.apertura) &&
      franja.finEnMinutos() <= horaAMinutos(horario.cierre)
    )
  }

  // Misma regla que el backend: las citas empiezan en los turnos del salon.
  private coincideConUnTurno(franja: Franja, horario: HorarioDeAtencion): boolean {
    return (franja.inicioEnMinutos() - horaAMinutos(horario.apertura)) % horario.intervaloMin === 0
  }
}

function horarioDelDTO(dto: AgendaDelDiaDTO): HorarioDeAtencion | null {
  if (!dto.abierto || !dto.apertura || !dto.cierre || !dto.intervaloMin) return null
  return { apertura: dto.apertura, cierre: dto.cierre, intervaloMin: dto.intervaloMin }
}

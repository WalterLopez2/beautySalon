// Agenda de un dia: sabe que franjas estan ocupadas y calcula en que horas
// cabe un servicio. El backend valida de nuevo al guardar; esto es para que la
// clienta solo vea horas posibles.

import type { AgendaDelDiaDTO } from '../../../compartido/tipos/api.ts'
import { esFechaValida } from '../../../compartido/utils/fecha.ts'
import { horaAMinutos, minutosAHora } from '../../../compartido/utils/hora.ts'
import { Franja } from '../../../compartido/dominio/Franja.ts'

export interface HorarioDeAtencion {
  apertura: string // HH:MM
  cierre: string // HH:MM
  intervaloMin: number // cada cuanto se ofrece una hora de inicio
}

export const HORARIO_DEL_SALON: HorarioDeAtencion = {
  apertura: '09:00',
  cierre: '18:00',
  intervaloMin: 30,
}

export class AgendaDelDia {
  readonly fecha: string
  private readonly ocupadas: readonly Franja[]
  private readonly horario: HorarioDeAtencion

  constructor(
    fecha: string,
    ocupadas: readonly Franja[],
    horario: HorarioDeAtencion = HORARIO_DEL_SALON,
  ) {
    if (!esFechaValida(fecha)) {
      throw new Error(`La fecha "${fecha}" debe tener el formato YYYY-MM-DD.`)
    }
    if (horaAMinutos(horario.apertura) >= horaAMinutos(horario.cierre)) {
      throw new Error('La hora de apertura debe ser anterior a la de cierre.')
    }

    this.fecha = fecha
    this.ocupadas = ocupadas
    this.horario = horario
  }

  static desdeDTO(dto: AgendaDelDiaDTO, horario?: HorarioDeAtencion): AgendaDelDia {
    const ocupadas = dto.ocupadas.map((franja) => new Franja(franja.inicio, franja.duracionMin))
    return new AgendaDelDia(dto.fecha, ocupadas, horario)
  }

  estaDisponible(franja: Franja): boolean {
    return this.cabeEnElHorario(franja) && !this.ocupadas.some((o) => o.seCruzaCon(franja))
  }

  // Todas las franjas donde cabe un servicio de esa duracion.
  // `apartirDe` sirve para no ofrecer horas ya pasadas cuando la fecha es hoy.
  franjasDisponiblesPara(duracionMin: number, apartirDe = this.horario.apertura): Franja[] {
    const disponibles: Franja[] = []
    const ultimoInicio = horaAMinutos(this.horario.cierre) - duracionMin

    for (
      let minuto = horaAMinutos(this.horario.apertura);
      minuto <= ultimoInicio;
      minuto += this.horario.intervaloMin
    ) {
      const franja = new Franja(minutosAHora(minuto), duracionMin)
      if (!franja.empiezaAntesDe(apartirDe) && this.estaDisponible(franja)) {
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

  private cabeEnElHorario(franja: Franja): boolean {
    return (
      franja.inicioEnMinutos() >= horaAMinutos(this.horario.apertura) &&
      franja.finEnMinutos() <= horaAMinutos(this.horario.cierre)
    )
  }
}

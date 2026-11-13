// Resumen de ingresos de una semana (lunes a domingo). Usa la misma regla que
// `totalIngresos` del backend: solo cuentan las citas atendidas.

import type { Cita } from '../../../compartido/dominio/Cita.ts'
import { diasDeLaSemana } from '../../../compartido/utils/fecha.ts'

export interface IngresoDelDia {
  fecha: string
  total: number
  citasAtendidas: number
}

export interface ServicioVendido {
  servicioNombre: string
  veces: number
  total: number
}

export class ResumenDeIngresos {
  readonly dias: readonly string[]
  private readonly atendidas: readonly Cita[]

  // `fechaDeReferencia` puede ser cualquier dia: el resumen cubre su semana.
  constructor(fechaDeReferencia: string, citas: readonly Cita[]) {
    const dias = diasDeLaSemana(fechaDeReferencia)
    this.dias = dias
    this.atendidas = citas.filter((cita) => cita.generaIngreso() && dias.includes(cita.fecha))
  }

  desde(): string {
    return this.dias[0]
  }

  hasta(): string {
    return this.dias[this.dias.length - 1]
  }

  totalDeLaSemana(): number {
    return sumar(this.atendidas)
  }

  totalDelDia(fecha: string): number {
    return sumar(this.atendidasEl(fecha))
  }

  // Siempre siete filas, aunque un dia no haya tenido ventas (para graficar).
  porDia(): IngresoDelDia[] {
    return this.dias.map((fecha) => {
      const delDia = this.atendidasEl(fecha)
      return { fecha, total: sumar(delDia), citasAtendidas: delDia.length }
    })
  }

  promedioPorCita(): number {
    return this.atendidas.length === 0 ? 0 : this.totalDeLaSemana() / this.atendidas.length
  }

  serviciosMasVendidos(): ServicioVendido[] {
    const porServicio = new Map<string, ServicioVendido>()
    for (const cita of this.atendidas) {
      const actual = porServicio.get(cita.servicioNombre)
      porServicio.set(cita.servicioNombre, {
        servicioNombre: cita.servicioNombre,
        veces: (actual?.veces ?? 0) + 1,
        total: (actual?.total ?? 0) + cita.precio,
      })
    }
    return [...porServicio.values()].sort((a, b) => b.total - a.total)
  }

  private atendidasEl(fecha: string): Cita[] {
    return this.atendidas.filter((cita) => cita.fecha === fecha)
  }
}

function sumar(citas: readonly Cita[]): number {
  return citas.reduce((total, cita) => total + cita.precio, 0)
}

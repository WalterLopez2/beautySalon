// Las citas de un dia, como las trabaja la duena: en orden de hora, con lo
// pendiente a la vista y lo que lleva cobrado. Inmutable: al cambiar una cita
// se devuelve una agenda nueva para que React redibuje sin sorpresas.

import type { EstadoCita } from '../../../compartido/tipos/api.ts'
import { horaAMinutos } from '../../../compartido/utils/hora.ts'
import type { CitaDelPanel } from './CitaDelPanel.ts'

export class AgendaDelPanel {
  readonly fecha: string
  private readonly citas: readonly CitaDelPanel[]

  constructor(fecha: string, citas: readonly CitaDelPanel[]) {
    this.fecha = fecha
    this.citas = [...citas].sort(
      (a, b) => a.cita.franja.inicioEnMinutos() - b.cita.franja.inicioEnMinutos(),
    )
  }

  static vacia(fecha: string): AgendaDelPanel {
    return new AgendaDelPanel(fecha, [])
  }

  todas(): readonly CitaDelPanel[] {
    return this.citas
  }

  estaVacia(): boolean {
    return this.citas.length === 0
  }

  conEstado(estado: EstadoCita): CitaDelPanel[] {
    return this.citas.filter((item) => item.estado === estado)
  }

  // Lo que la duena tiene que revisar: solicitudes que nadie ha confirmado.
  porConfirmar(): CitaDelPanel[] {
    return this.conEstado('pendiente')
  }

  // Sin canceladas: es lo que de verdad va a pasar en el dia.
  activas(): CitaDelPanel[] {
    return this.citas.filter((item) => !item.cita.estaCancelada())
  }

  // La siguiente clienta confirmada que todavia no termina, a partir de HH:MM.
  proximaDesde(hora: string): CitaDelPanel | null {
    const minuto = horaAMinutos(hora)
    return (
      this.citas.find(
        (item) => item.cita.estaConfirmada() && item.cita.franja.finEnMinutos() > minuto,
      ) ?? null
    )
  }

  ingresoCobrado(): number {
    return sumarPrecios(this.citas.filter((item) => item.cita.generaIngreso()))
  }

  ingresoEsperado(): number {
    return sumarPrecios(this.citas.filter((item) => item.cita.esIngresoEsperado()))
  }

  // Reemplaza una cita (por ejemplo, despues de confirmarla) sin mutar nada.
  conCitaActualizada(actualizada: CitaDelPanel): AgendaDelPanel {
    return new AgendaDelPanel(
      this.fecha,
      this.citas.map((item) => (item.id === actualizada.id ? actualizada : item)),
    )
  }
}

function sumarPrecios(citas: readonly CitaDelPanel[]): number {
  return citas.reduce((total, item) => total + item.cita.precio, 0)
}

// Cita ya guardada, tal como la ve la clienta en su comprobante o historial.

import type { CitaDTO, EstadoCita } from '../../types/api.ts'
import { formatearFecha, formatearLempiras } from '../../utils/formato.ts'
import { Franja } from './Franja.ts'

const ETIQUETAS_DE_ESTADO: Record<EstadoCita, string> = {
  pendiente: 'Pendiente de confirmacion',
  confirmada: 'Confirmada',
  atendida: 'Atendida',
  cancelada: 'Cancelada',
}

export class Cita {
  readonly id: number
  readonly servicioNombre: string
  readonly fecha: string
  readonly franja: Franja
  readonly estado: EstadoCita
  readonly precio: number

  constructor(
    id: number,
    servicioNombre: string,
    fecha: string,
    franja: Franja,
    estado: EstadoCita,
    precio: number,
  ) {
    this.id = id
    this.servicioNombre = servicioNombre
    this.fecha = fecha
    this.franja = franja
    this.estado = estado
    this.precio = precio
  }

  static desdeDTO(dto: CitaDTO): Cita {
    return new Cita(
      dto.id,
      dto.servicioNombre,
      dto.fecha,
      new Franja(dto.inicio, dto.duracionMin),
      dto.estado,
      dto.precio,
    )
  }

  estaPendiente(): boolean {
    return this.estado === 'pendiente'
  }

  estaConfirmada(): boolean {
    return this.estado === 'confirmada'
  }

  estaCancelada(): boolean {
    return this.estado === 'cancelada'
  }

  fueAtendida(): boolean {
    return this.estado === 'atendida'
  }

  // La clienta solo puede cancelar lo que aun no se atendio.
  sePuedeCancelar(): boolean {
    return this.estaPendiente() || this.estaConfirmada()
  }

  etiquetaDeEstado(): string {
    return ETIQUETAS_DE_ESTADO[this.estado]
  }

  precioFormateado(): string {
    return formatearLempiras(this.precio)
  }

  resumen(): string {
    return `${this.servicioNombre} - ${formatearFecha(this.fecha)}, ${this.franja.etiqueta()}`
  }
}

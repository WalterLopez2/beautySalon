// Cita ya guardada, tal como la ve la clienta en su comprobante o historial.

import type { CitaDTO, EstadoCita } from '../tipos/api.ts'
import { formatearFecha, formatearLempiras } from '../utils/formato.ts'
import { Franja } from './Franja.ts'

const ETIQUETAS_DE_ESTADO: Record<EstadoCita, string> = {
  pendiente: 'Pendiente de confirmacion',
  confirmada: 'Confirmada',
  atendida: 'Atendida',
  cancelada: 'Cancelada',
}

// Ciclo de vida de una cita. Es la unica fuente de verdad sobre que cambios de
// estado se permiten; "atendida" y "cancelada" son finales.
const TRANSICIONES_PERMITIDAS: Record<EstadoCita, readonly EstadoCita[]> = {
  pendiente: ['confirmada', 'cancelada'],
  confirmada: ['atendida', 'cancelada'],
  atendida: [],
  cancelada: [],
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

  puedePasarA(estado: EstadoCita): boolean {
    return TRANSICIONES_PERMITIDAS[this.estado].includes(estado)
  }

  // Solo se cancela lo que aun no se atendio.
  sePuedeCancelar(): boolean {
    return this.puedePasarA('cancelada')
  }

  sePuedeConfirmar(): boolean {
    return this.puedePasarA('confirmada')
  }

  // La duena marca "atendida" cuando ya realizo el servicio y lo cobro.
  sePuedeMarcarAtendida(): boolean {
    return this.puedePasarA('atendida')
  }

  // Misma regla que `totalIngresos` del backend: solo lo atendido es ingreso.
  generaIngreso(): boolean {
    return this.fueAtendida()
  }

  // Lo que se espera cobrar si todo sale como esta agendado.
  esIngresoEsperado(): boolean {
    return this.estaConfirmada() || this.fueAtendida()
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

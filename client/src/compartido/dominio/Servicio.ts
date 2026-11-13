// Un servicio del catalogo (unas, pestanas, maquillaje...). Es inmutable: se
// crea validado desde el DTO y no cambia mientras la clienta navega.

import type { ServicioDTO } from '../tipos/api.ts'
import { formatearDuracion, formatearLempiras } from '../utils/formato.ts'
import { normalizarTexto } from '../utils/texto.ts'

export class Servicio {
  readonly id: number
  readonly nombre: string
  readonly descripcion: string
  readonly precio: number
  readonly duracionMin: number
  readonly categoria: string

  constructor(
    id: number,
    nombre: string,
    descripcion: string,
    precio: number,
    duracionMin: number,
    categoria: string,
  ) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('El identificador del servicio debe ser un entero positivo.')
    }
    if (!nombre.trim()) {
      throw new Error('El servicio necesita un nombre.')
    }
    if (precio < 0) {
      throw new Error('El precio del servicio no puede ser negativo.')
    }
    if (!Number.isInteger(duracionMin) || duracionMin <= 0) {
      throw new Error('La duracion del servicio debe ser mayor a cero minutos.')
    }

    this.id = id
    this.nombre = nombre.trim()
    this.descripcion = descripcion.trim()
    this.precio = precio
    this.duracionMin = duracionMin
    this.categoria = categoria.trim()
  }

  static desdeDTO(dto: ServicioDTO): Servicio {
    return new Servicio(
      dto.id,
      dto.nombre,
      dto.descripcion ?? '',
      dto.precio,
      dto.duracionMin,
      dto.categoria ?? 'General',
    )
  }

  precioFormateado(): string {
    return formatearLempiras(this.precio)
  }

  duracionFormateada(): string {
    return formatearDuracion(this.duracionMin)
  }

  esDeCategoria(categoria: string): boolean {
    return this.categoria.toLocaleLowerCase() === categoria.trim().toLocaleLowerCase()
  }

  // Se usa para el buscador del catalogo publico.
  coincideCon(texto: string): boolean {
    const busqueda = normalizarTexto(texto)
    if (!busqueda) return true

    return [this.nombre, this.descripcion, this.categoria]
      .map(normalizarTexto)
      .some((campo) => campo.includes(busqueda))
  }
}

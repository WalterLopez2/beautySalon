// Clienta registrada en el salon, tal como la ve la duena.

import type { ClientaDTO } from '../../../compartido/tipos/api.ts'
import { enlaceDeWhatsApp } from '../../../compartido/utils/whatsapp.ts'
import { normalizarTexto } from '../../../compartido/utils/texto.ts'

export class Clienta {
  readonly id: number
  readonly nombre: string
  readonly telefono: string
  readonly correo: string | null

  constructor(id: number, nombre: string, telefono: string, correo: string | null) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('El identificador de la clienta debe ser un entero positivo.')
    }

    this.id = id
    this.nombre = nombre.trim()
    this.telefono = telefono.trim()
    this.correo = correo?.trim() || null
  }

  static desdeDTO(dto: ClientaDTO): Clienta {
    return new Clienta(dto.id, dto.nombre, dto.telefono, dto.correo)
  }

  // Busca por nombre (sin importar acentos) o por cualquier parte del telefono.
  coincideCon(texto: string): boolean {
    const busqueda = normalizarTexto(texto)
    if (!busqueda) return true

    return normalizarTexto(this.nombre).includes(busqueda) || this.telefono.includes(busqueda)
  }

  // Enlace directo para escribirle por WhatsApp.
  enlaceDeWhatsApp(): string {
    return enlaceDeWhatsApp(this.telefono)
  }
}

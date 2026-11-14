// Lo que la duena escribe en el formulario de un servicio, tal como esta en
// los inputs (texto). Es inmutable: cada cambio devuelve un borrador nuevo.
// Sirve igual para crear uno nuevo o para editar uno existente.

import type { Servicio } from '../../../compartido/dominio/Servicio.ts'
import type { DatosServicioDTO } from '../../../compartido/tipos/api.ts'

export interface CamposDelServicio {
  nombre: string
  descripcion: string
  precio: string
  duracionMin: string
  categoria: string
}

export class BorradorDeServicio {
  readonly campos: CamposDelServicio

  constructor(campos: CamposDelServicio) {
    this.campos = campos
  }

  static vacio(): BorradorDeServicio {
    return new BorradorDeServicio({ nombre: '', descripcion: '', precio: '', duracionMin: '', categoria: '' })
  }

  static desdeServicio(servicio: Servicio): BorradorDeServicio {
    return new BorradorDeServicio({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      precio: String(servicio.precio),
      duracionMin: String(servicio.duracionMin),
      categoria: servicio.categoria,
    })
  }

  con(cambios: Partial<CamposDelServicio>): BorradorDeServicio {
    return new BorradorDeServicio({ ...this.campos, ...cambios })
  }

  errores(): string[] {
    const errores: string[] = []
    const precio = Number(this.campos.precio)
    const duracion = Number(this.campos.duracionMin)

    if (!this.campos.nombre.trim()) {
      errores.push('Escribi el nombre del servicio.')
    }
    if (!this.campos.precio.trim() || !Number.isFinite(precio) || precio < 0) {
      errores.push('El precio debe ser un numero igual o mayor a cero.')
    }
    if (!Number.isInteger(duracion) || duracion <= 0) {
      errores.push('La duracion debe ser un numero entero de minutos mayor a cero.')
    }
    return errores
  }

  estaCompleto(): boolean {
    return this.errores().length === 0
  }

  aDTO(): DatosServicioDTO {
    if (!this.estaCompleto()) {
      throw new Error('El servicio todavia tiene datos pendientes.')
    }
    return {
      nombre: this.campos.nombre.trim(),
      descripcion: this.campos.descripcion.trim() || null,
      precio: Number(this.campos.precio),
      duracionMin: Number(this.campos.duracionMin),
      categoria: this.campos.categoria.trim() || null,
    }
  }
}

// Coleccion de servicios con las consultas que necesita la vista publica.
// Filtrar devuelve un catalogo nuevo, asi que la lista original nunca se pierde.

import type { ServicioDTO } from '../tipos/api.ts'
import { Servicio } from './Servicio.ts'

export class CatalogoServicios {
  private readonly servicios: readonly Servicio[]

  constructor(servicios: readonly Servicio[]) {
    this.servicios = servicios
  }

  static vacio(): CatalogoServicios {
    return new CatalogoServicios([])
  }

  static desdeDTOs(dtos: readonly ServicioDTO[]): CatalogoServicios {
    return new CatalogoServicios(dtos.map(Servicio.desdeDTO))
  }

  todos(): readonly Servicio[] {
    return this.servicios
  }

  cantidad(): number {
    return this.servicios.length
  }

  estaVacio(): boolean {
    return this.servicios.length === 0
  }

  buscarPorId(id: number): Servicio | null {
    return this.servicios.find((servicio) => servicio.id === id) ?? null
  }

  // Igual que buscarPorId, pero falla cuando el id tiene que existir.
  obtenerPorId(id: number): Servicio {
    const servicio = this.buscarPorId(id)
    if (!servicio) {
      throw new Error(`No existe un servicio con el identificador ${id}.`)
    }
    return servicio
  }

  categorias(): string[] {
    return [...new Set(this.servicios.map((servicio) => servicio.categoria))].sort()
  }

  filtrarPorCategoria(categoria: string): CatalogoServicios {
    return new CatalogoServicios(
      this.servicios.filter((servicio) => servicio.esDeCategoria(categoria)),
    )
  }

  buscar(texto: string): CatalogoServicios {
    return new CatalogoServicios(this.servicios.filter((servicio) => servicio.coincideCon(texto)))
  }

  ordenadosPorPrecio(): CatalogoServicios {
    return new CatalogoServicios([...this.servicios].sort((a, b) => a.precio - b.precio))
  }
}

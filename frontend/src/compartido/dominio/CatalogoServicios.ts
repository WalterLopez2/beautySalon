// Coleccion de servicios con las consultas que necesita la vista publica.
// Filtrar devuelve un catalogo nuevo, asi que la lista original nunca se pierde.

import type { ServicioDTO } from '../tipos/api.ts'
import { Servicio } from './Servicio.ts'

export interface GrupoDeServicios {
  categoria: string
  servicios: readonly Servicio[]
}

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

  estaVacio(): boolean {
    return this.servicios.length === 0
  }

  categorias(): string[] {
    return [...new Set(this.servicios.map((servicio) => servicio.categoria))].sort()
  }

  // Un grupo por categoria, en el mismo orden que categorias().
  agrupadosPorCategoria(): GrupoDeServicios[] {
    return this.categorias().map((categoria) => ({
      categoria,
      servicios: this.filtrarPorCategoria(categoria).todos(),
    }))
  }

  filtrarPorCategoria(categoria: string): CatalogoServicios {
    return new CatalogoServicios(
      this.servicios.filter((servicio) => servicio.esDeCategoria(categoria)),
    )
  }
}

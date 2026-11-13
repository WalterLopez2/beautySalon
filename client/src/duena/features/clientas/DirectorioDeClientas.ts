// Lista de clientas con las consultas del panel. Como el catalogo de
// servicios, filtrar devuelve un directorio nuevo.

import type { ClientaDTO } from '../../../compartido/tipos/api.ts'
import { Clienta } from './Clienta.ts'

export class DirectorioDeClientas {
  private readonly clientas: readonly Clienta[]

  constructor(clientas: readonly Clienta[]) {
    this.clientas = clientas
  }

  static vacio(): DirectorioDeClientas {
    return new DirectorioDeClientas([])
  }

  static desdeDTOs(dtos: readonly ClientaDTO[]): DirectorioDeClientas {
    return new DirectorioDeClientas(dtos.map(Clienta.desdeDTO))
  }

  todas(): readonly Clienta[] {
    return this.clientas
  }

  cantidad(): number {
    return this.clientas.length
  }

  estaVacio(): boolean {
    return this.clientas.length === 0
  }

  buscar(texto: string): DirectorioDeClientas {
    return new DirectorioDeClientas(this.clientas.filter((clienta) => clienta.coincideCon(texto)))
  }

  ordenadasPorNombre(): DirectorioDeClientas {
    return new DirectorioDeClientas(
      [...this.clientas].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    )
  }
}

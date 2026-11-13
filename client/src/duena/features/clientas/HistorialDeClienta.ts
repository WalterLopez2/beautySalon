// Todo lo que la clienta ha hecho en el salon y los datos que la duena quiere
// ver de un vistazo: cuanto ha gastado, cuantas veces vino y que pide mas.

import { Cita } from '../../../compartido/dominio/Cita.ts'
import type { HistorialDeClientaDTO } from '../../../compartido/tipos/api.ts'
import { Clienta } from './Clienta.ts'

export class HistorialDeClienta {
  readonly clienta: Clienta
  private readonly citas: readonly Cita[]

  constructor(clienta: Clienta, citas: readonly Cita[]) {
    this.clienta = clienta
    this.citas = citas
  }

  static desdeDTO(dto: HistorialDeClientaDTO): HistorialDeClienta {
    return new HistorialDeClienta(Clienta.desdeDTO(dto.clienta), dto.citas.map(Cita.desdeDTO))
  }

  // La mas reciente primero, que es lo que la duena busca al abrir el historial.
  citasRecientes(): Cita[] {
    return [...this.citas].sort(compararDeMasNuevaAMasVieja)
  }

  visitas(): Cita[] {
    return this.citasRecientes().filter((cita) => cita.fueAtendida())
  }

  cantidadDeVisitas(): number {
    return this.visitas().length
  }

  totalGastado(): number {
    return this.visitas().reduce((total, cita) => total + cita.precio, 0)
  }

  ultimaVisita(): Cita | null {
    return this.visitas()[0] ?? null
  }

  cantidadDeCancelaciones(): number {
    return this.citas.filter((cita) => cita.estaCancelada()).length
  }

  servicioFavorito(): string | null {
    const vecesPorServicio = new Map<string, number>()
    for (const cita of this.visitas()) {
      vecesPorServicio.set(cita.servicioNombre, (vecesPorServicio.get(cita.servicioNombre) ?? 0) + 1)
    }

    let favorito: string | null = null
    let maximo = 0
    for (const [servicio, veces] of vecesPorServicio) {
      if (veces > maximo) {
        favorito = servicio
        maximo = veces
      }
    }
    return favorito
  }
}

function compararDeMasNuevaAMasVieja(a: Cita, b: Cita): number {
  return `${b.fecha} ${b.franja.inicio}`.localeCompare(`${a.fecha} ${a.franja.inicio}`)
}

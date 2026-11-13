// Una cita vista desde el panel: la misma `Cita` que ve la clienta, mas quien
// la pidio. Se compone en vez de heredar para no duplicar las reglas de estado.

import { Cita } from '../../../compartido/dominio/Cita.ts'
import type { CitaDelPanelDTO, EstadoCita } from '../../../compartido/tipos/api.ts'
import { Clienta } from '../clientas/Clienta.ts'

// Acciones del panel, en el orden en que se muestran los botones.
const ACCIONES_EN_ORDEN: readonly EstadoCita[] = ['confirmada', 'atendida', 'cancelada']

export class CitaDelPanel {
  readonly cita: Cita
  readonly clienta: Clienta

  constructor(cita: Cita, clienta: Clienta) {
    this.cita = cita
    this.clienta = clienta
  }

  static desdeDTO(dto: CitaDelPanelDTO): CitaDelPanel {
    return new CitaDelPanel(Cita.desdeDTO(dto), Clienta.desdeDTO(dto.clienta))
  }

  get id(): number {
    return this.cita.id
  }

  get estado(): EstadoCita {
    return this.cita.estado
  }

  // Lo que la duena puede hacer con esta cita ahora mismo.
  accionesDisponibles(): EstadoCita[] {
    return ACCIONES_EN_ORDEN.filter((estado) => this.cita.puedePasarA(estado))
  }
}

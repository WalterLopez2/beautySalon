// Un servicio como lo ve la duena: el mismo `Servicio` del catalogo publico,
// mas si esta activo o pausado. Se compone para no duplicar validaciones ni
// formatos de precio y duracion.

import { Servicio } from '../../../compartido/dominio/Servicio.ts'
import type { ServicioDelPanelDTO } from '../../../compartido/tipos/api.ts'

export class ServicioDelPanel {
  readonly servicio: Servicio
  readonly activo: boolean

  constructor(servicio: Servicio, activo: boolean) {
    this.servicio = servicio
    this.activo = activo
  }

  static desdeDTO(dto: ServicioDelPanelDTO): ServicioDelPanel {
    return new ServicioDelPanel(Servicio.desdeDTO(dto), dto.activo)
  }

  get id(): number {
    return this.servicio.id
  }

  // Pausado = no se ofrece a las clientas, pero sigue en el historial.
  estaPausado(): boolean {
    return !this.activo
  }
}

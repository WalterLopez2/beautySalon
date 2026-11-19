// Lista de servicios para elegir uno. Usa radios nativos: se pueden recorrer
// con el teclado y los lectores de pantalla los anuncian sin trabajo extra.

import type { Servicio } from '../../../compartido/dominio/Servicio.ts'

interface Props {
  servicios: readonly Servicio[]
  seleccionado: Servicio | null
  alElegir: (servicio: Servicio) => void
}

export function SelectorDeServicio({ servicios, seleccionado, alElegir }: Props) {
  return (
    <div className="opciones-servicio">
      {servicios.map((servicio) => (
        <label key={servicio.id} className="opcion-servicio">
          <input
            type="radio"
            name="servicio"
            checked={servicio.id === seleccionado?.id}
            onChange={() => alElegir(servicio)}
          />
          <span className="opcion-servicio__nombre">{servicio.nombre}</span>
          <span className="opcion-servicio__detalle">
            {servicio.duracionFormateada()} · {servicio.precioFormateado()}
          </span>
        </label>
      ))}
    </div>
  )
}

// Un servicio en la carta: nombre, una linea punteada hasta la duracion y el
// precio, y la descripcion debajo. Solo presentacion: el formato de precio y
// duracion lo da el dominio.

import type { Servicio } from '../../../compartido/dominio/Servicio.ts'

interface Props {
  servicio: Servicio
}

export function ServicioDeLaCarta({ servicio }: Props) {
  return (
    <li className="carta__servicio">
      <div className="carta__linea">
        <h4 className="carta__nombre">{servicio.nombre}</h4>
        <span className="carta__puntos" aria-hidden="true" />
        <span className="carta__detalle">
          {servicio.duracionFormateada()} · <strong className="carta__precio">{servicio.precioFormateado()}</strong>
        </span>
      </div>
      {servicio.descripcion && <p className="carta__descripcion">{servicio.descripcion}</p>}
    </li>
  )
}

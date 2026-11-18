// Tarjeta de un servicio del catalogo: nombre, descripcion, duracion y precio.
// Solo presentacion: el formato de precio y duracion lo da el dominio.

import type { Servicio } from '../../../compartido/dominio/Servicio.ts'

interface Props {
  servicio: Servicio
}

export function TarjetaDeServicio({ servicio }: Props) {
  return (
    <article className="tarjeta-servicio">
      <span className="tarjeta-servicio__categoria">{servicio.categoria}</span>
      <h3 className="tarjeta-servicio__nombre">{servicio.nombre}</h3>

      {servicio.descripcion && (
        <p className="tarjeta-servicio__descripcion">{servicio.descripcion}</p>
      )}

      <footer className="tarjeta-servicio__detalle">
        <span>{servicio.duracionFormateada()}</span>
        <strong className="tarjeta-servicio__precio">{servicio.precioFormateado()}</strong>
      </footer>
    </article>
  )
}

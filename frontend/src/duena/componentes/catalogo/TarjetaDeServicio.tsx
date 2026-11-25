// Un servicio del catalogo en el panel, con sus botones de editar y pausar.
// Un servicio pausado se ve apagado: no se ofrece, pero sigue en el historial.

import type { ServicioDelPanel } from '../../features/catalogo/ServicioDelPanel.ts'

interface Props {
  item: ServicioDelPanel
  guardando: boolean
  onEditar: () => void
  onCambiarActivo: () => void
}

export function TarjetaDeServicio({ item, guardando, onEditar, onCambiarActivo }: Props) {
  const { servicio } = item
  const pausado = item.estaPausado()

  return (
    <article className={pausado ? 'servicio-panel servicio-panel--pausado' : 'servicio-panel'}>
      <div className="servicio-panel__encabezado">
        {servicio.categoria && <p className="servicio-panel__categoria">{servicio.categoria}</p>}
        {pausado && <p className="servicio-panel__pausado">Pausado</p>}
      </div>
      <h3 className="servicio-panel__nombre">{servicio.nombre}</h3>
      {servicio.descripcion && <p className="servicio-panel__descripcion">{servicio.descripcion}</p>}
      <p className="servicio-panel__detalle">
        <span className="servicio-panel__precio">{servicio.precioFormateado()}</span>
        <span>{servicio.duracionFormateada()}</span>
      </p>

      <div className="servicio-panel__acciones">
        <button type="button" onClick={onEditar} disabled={guardando}>
          Editar
        </button>
        <button type="button" onClick={onCambiarActivo} disabled={guardando}>
          {pausado ? 'Reactivar' : 'Pausar'}
        </button>
      </div>
    </article>
  )
}

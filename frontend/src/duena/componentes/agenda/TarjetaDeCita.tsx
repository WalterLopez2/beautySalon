// Una cita de la agenda con los botones que su estado permite.

import type { EstadoCita } from '../../../compartido/tipos/api.ts'
import type { CitaDelPanel } from '../../features/agenda/CitaDelPanel.ts'

const TEXTO_DE_ACCION: Record<EstadoCita, string> = {
  pendiente: 'Volver a pendiente',
  confirmada: 'Confirmar',
  atendida: 'Marcar atendida',
  cancelada: 'Cancelar',
}

interface Props {
  item: CitaDelPanel
  enProceso: boolean
  onCambiarEstado: (estado: EstadoCita) => void
}

export function TarjetaDeCita({ item, enProceso, onCambiarEstado }: Props) {
  const { cita, clienta } = item

  return (
    <article aria-busy={enProceso}>
      <p>{cita.franja.etiqueta()}</p>
      <h3>{clienta.nombre}</h3>
      <p>{cita.servicioNombre}</p>
      <p>{cita.precioFormateado()}</p>
      <p>{cita.etiquetaDeEstado()}</p>
      <a href={clienta.enlaceDeWhatsApp()} target="_blank" rel="noreferrer">
        Escribir por WhatsApp
      </a>

      <div>
        {item.accionesDisponibles().map((estado) => (
          <button key={estado} type="button" disabled={enProceso} onClick={() => onCambiarEstado(estado)}>
            {TEXTO_DE_ACCION[estado]}
          </button>
        ))}
      </div>
    </article>
  )
}

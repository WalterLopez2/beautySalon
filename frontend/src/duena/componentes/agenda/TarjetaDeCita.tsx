// Una cita de la agenda con los botones que su estado permite. El estado se
// pasa como clase (tarjeta-cita--pendiente, --confirmada...) para que el CSS
// le de su color sin logica en la vista.

import type { EstadoCita } from '../../../compartido/tipos/api.ts'
import type { CitaDelPanel } from '../../features/agenda/CitaDelPanel.ts'

const TEXTO_DE_ACCION: Record<EstadoCita, string> = {
  pendiente: 'Volver a pendiente',
  confirmada: 'Confirmar',
  atendida: 'Marcar atendida',
  cancelada: 'Cancelar',
  vencida: 'Vencer',
}

interface Props {
  item: CitaDelPanel
  enProceso: boolean
  onCambiarEstado: (estado: EstadoCita) => void
}

export function TarjetaDeCita({ item, enProceso, onCambiarEstado }: Props) {
  const { cita, clienta } = item

  return (
    <article className={`tarjeta-cita tarjeta-cita--${item.estado}`} aria-busy={enProceso}>
      <div className="tarjeta-cita__encabezado">
        <p className="tarjeta-cita__hora">{cita.franja.etiqueta()}</p>
        <p className="tarjeta-cita__estado">{cita.etiquetaDeEstado()}</p>
      </div>

      <h3 className="tarjeta-cita__nombre">{item.nombreEscrito}</h3>
      <p className="tarjeta-cita__servicio">
        {cita.servicioNombre}
        <span className="tarjeta-cita__precio">{cita.precioFormateado()}</span>
      </p>

      {item.nombreDistintoAlDeLaFicha() && (
        <p className="tarjeta-cita__alerta">
          <strong>Ojo:</strong> ese telefono esta registrado a nombre de {clienta.nombre}.
        </p>
      )}
      {item.telefonoSinVerificar() && (
        <p className="tarjeta-cita__alerta">Telefono sin verificar: escribele por WhatsApp antes de confirmar.</p>
      )}

      <div className="tarjeta-cita__acciones">
        <a className="tarjeta-cita__whatsapp" href={clienta.enlaceDeWhatsApp()} target="_blank" rel="noreferrer">
          Escribir por WhatsApp
        </a>
        {item.accionesDisponibles().map((estado) => (
          <button
            key={estado}
            type="button"
            className={`tarjeta-cita__accion tarjeta-cita__accion--${estado}`}
            disabled={enProceso}
            onClick={() => onCambiarEstado(estado)}
          >
            {TEXTO_DE_ACCION[estado]}
          </button>
        ))}
      </div>
    </article>
  )
}

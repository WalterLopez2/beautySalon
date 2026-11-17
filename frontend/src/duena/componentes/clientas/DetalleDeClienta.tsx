// Historial de una clienta: datos de contacto, resumen y sus citas.

import { formatearFecha, formatearLempiras } from '../../../compartido/utils/formato.ts'
import { useHistorialDeClienta } from '../../hooks/useHistorialDeClienta.ts'
import { EstadoDeConsulta } from '../EstadoDeConsulta.tsx'

interface Props {
  clientaId: number
  onCerrar: () => void
}

export function DetalleDeClienta({ clientaId, onCerrar }: Props) {
  const { historial, cargando, error, recargar } = useHistorialDeClienta(clientaId)

  return (
    <aside aria-labelledby="titulo-detalle-clienta">
      <button type="button" onClick={onCerrar}>
        Cerrar
      </button>

      <EstadoDeConsulta cargando={cargando || !historial} error={error} onReintentar={recargar}>
        {historial && (
          <>
            <h3 id="titulo-detalle-clienta">{historial.clienta.nombre}</h3>
            <p>{historial.clienta.telefono}</p>
            {historial.clienta.correo && <p>{historial.clienta.correo}</p>}
            <a href={historial.clienta.enlaceDeWhatsApp()} target="_blank" rel="noreferrer">
              Escribir por WhatsApp
            </a>

            <dl>
              <dt>Visitas</dt>
              <dd>{historial.cantidadDeVisitas()}</dd>
              <dt>Total gastado</dt>
              <dd>{formatearLempiras(historial.totalGastado())}</dd>
              <dt>Ultima visita</dt>
              <dd>{historial.ultimaVisita() ? formatearFecha(historial.ultimaVisita()!.fecha) : '-'}</dd>
              <dt>Servicio favorito</dt>
              <dd>{historial.servicioFavorito() ?? '-'}</dd>
              <dt>Cancelaciones</dt>
              <dd>{historial.cantidadDeCancelaciones()}</dd>
            </dl>

            <h4>Citas</h4>
            <ul>
              {historial.citasRecientes().map((cita) => (
                <li key={cita.id}>{cita.resumen()}</li>
              ))}
            </ul>
          </>
        )}
      </EstadoDeConsulta>
    </aside>
  )
}

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
    <aside className="ficha-clienta" aria-labelledby="titulo-detalle-clienta">
      <button type="button" className="ficha-clienta__cerrar" onClick={onCerrar}>
        Cerrar
      </button>

      <EstadoDeConsulta cargando={cargando || !historial} error={error} onReintentar={recargar}>
        {historial && (
          <>
            <div className="ficha-clienta__contacto">
              <h3 id="titulo-detalle-clienta">{historial.clienta.nombre}</h3>
              <p>{historial.clienta.telefono}</p>
              {historial.clienta.correo && <p>{historial.clienta.correo}</p>}
              <a href={historial.clienta.enlaceDeWhatsApp()} target="_blank" rel="noreferrer">
                Escribir por WhatsApp
              </a>
            </div>

            <dl className="cifras">
              <div className="cifras__dato">
                <dt>Visitas</dt>
                <dd>{historial.cantidadDeVisitas()}</dd>
              </div>
              <div className="cifras__dato">
                <dt>Total gastado</dt>
                <dd>{formatearLempiras(historial.totalGastado())}</dd>
              </div>
              <div className="cifras__dato">
                <dt>Ultima visita</dt>
                <dd>{historial.ultimaVisita() ? formatearFecha(historial.ultimaVisita()!.fecha) : '-'}</dd>
              </div>
              <div className="cifras__dato">
                <dt>Servicio favorito</dt>
                <dd>{historial.servicioFavorito() ?? '-'}</dd>
              </div>
              <div className="cifras__dato">
                <dt>Cancelaciones</dt>
                <dd>{historial.cantidadDeCancelaciones()}</dd>
              </div>
            </dl>

            <h4 className="ficha-clienta__subtitulo">Citas</h4>
            <ul className="ficha-clienta__citas">
              {historial.citasRecientes().map((cita) => (
                <li key={cita.id} className="ficha-clienta__cita">
                  {cita.resumen()}
                  {historial.otroNombreEn(cita) && ` (a nombre de ${historial.otroNombreEn(cita)})`}
                </li>
              ))}
            </ul>
          </>
        )}
      </EstadoDeConsulta>
    </aside>
  )
}

// Lista de lo que falta confirmar en todos los dias, con acceso a su agenda.

import type { CitaDelPanel } from '../../features/agenda/CitaDelPanel.ts'
import { EstadoDeConsulta } from '../EstadoDeConsulta.tsx'

interface Props {
  solicitudes: readonly CitaDelPanel[]
  cargando: boolean
  error: string | null
  onReintentar: () => void
  onVerDia: (fecha: string) => void
}

export function SolicitudesPorConfirmar({ solicitudes, cargando, error, onReintentar, onVerDia }: Props) {
  return (
    <section aria-labelledby="titulo-por-confirmar">
      <h3 id="titulo-por-confirmar">Solicitudes por confirmar</h3>
      <p>Las que no confirmes dentro del plazo que pusiste en Horario liberan su hora.</p>

      <EstadoDeConsulta cargando={cargando} error={error} onReintentar={onReintentar}>
        {solicitudes.length === 0 ? (
          <p>No tienes solicitudes pendientes.</p>
        ) : (
          <ul>
            {solicitudes.map((item) => (
              <li key={item.id}>
                {item.nombreEscrito} - {item.cita.resumen()}{' '}
                <button type="button" onClick={() => onVerDia(item.cita.fecha)}>
                  Ver ese dia
                </button>
              </li>
            ))}
          </ul>
        )}
      </EstadoDeConsulta>
    </section>
  )
}

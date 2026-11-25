// Los dias y horas de atencion del salon, con el dia de hoy resaltado. Todo
// sale del horario que la duena configura en el panel.

import { numeroDelDia } from '../../compartido/dominio/DiasDeLaSemana.ts'
import { formatearHora } from '../../compartido/utils/formato.ts'
import type { HorarioDeAtencion } from '../features/salon/HorarioDeAtencion.ts'

interface Props {
  horario: HorarioDeAtencion
  hoy: string // YYYY-MM-DD, con la fecha del salon
}

export function TablaDeHorario({ horario, hoy }: Props) {
  if (horario.estaVacio()) return null
  const numeroDeHoy = numeroDelDia(hoy)

  return (
    <div className="horario-atencion">
      <h3 className="horario-atencion__titulo">Horario de atencion</h3>
      <ul className="horario-atencion__dias">
        {horario.semana().map(({ dia, horas }) => {
          const esHoy = dia.numero === numeroDeHoy
          return (
            <li
              key={dia.numero}
              className={esHoy ? 'horario-atencion__dia horario-atencion__dia--hoy' : 'horario-atencion__dia'}
              aria-current={esHoy ? 'date' : undefined}
            >
              <span>
                {dia.nombre}
                {esHoy && <span className="horario-atencion__hoy"> (hoy)</span>}
              </span>
              <span>{horas ? `${formatearHora(horas.apertura)} - ${formatearHora(horas.cierre)}` : 'Cerrado'}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

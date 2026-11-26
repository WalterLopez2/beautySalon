// Calendario del mes para elegir el dia de la cita. Que dias se pueden elegir
// lo decide `CalendarioDelMes` con el plazo y el horario de la duena; aqui
// solo se dibuja. Debajo repite la fecha en palabras para evitar confusiones.

import { useState } from 'react'
import { DIAS_DE_LA_SEMANA } from '../../../compartido/dominio/DiasDeLaSemana.ts'
import { esFechaValida } from '../../../compartido/utils/fecha.ts'
import { formatearFecha, formatearMes } from '../../../compartido/utils/formato.ts'
import { CalendarioDelMes, type DiaDelCalendario } from '../../features/agendamiento/CalendarioDelMes.ts'
import type { PlazoDeReserva } from '../../features/agendamiento/PlazoDeReserva.ts'
import type { HorarioDeAtencion } from '../../features/salon/HorarioDeAtencion.ts'

const MOTIVO_EN_PALABRAS: Record<NonNullable<DiaDelCalendario['noDisponible']>, string> = {
  pasado: 'ya paso',
  cerrado: 'el salon esta cerrado',
  'fuera-de-plazo': 'todavia no se puede reservar',
}

interface Props {
  fecha: string
  plazo: PlazoDeReserva
  horario: HorarioDeAtencion
  alElegir: (fecha: string) => void
}

export function SelectorDeFechaDeCita({ fecha, plazo, horario, alElegir }: Props) {
  // Solo se guarda que mes se esta mirando; las reglas se calculan en cada dibujo.
  const [mesVisible, setMesVisible] = useState(esFechaValida(fecha) ? fecha : plazo.primeraFecha)
  const calendario = new CalendarioDelMes(mesVisible, plazo, horario)

  return (
    <div className="calendario">
      <div className="calendario__encabezado">
        <button
          type="button"
          className="calendario__flecha"
          aria-label="Mes anterior"
          disabled={!calendario.hayMesAnterior()}
          onClick={() => setMesVisible(calendario.mesAnterior().inicio)}
        >
          ‹
        </button>
        <p className="calendario__mes" aria-live="polite">
          {formatearMes(calendario.inicio)}
        </p>
        <button
          type="button"
          className="calendario__flecha"
          aria-label="Mes siguiente"
          disabled={!calendario.hayMesSiguiente()}
          onClick={() => setMesVisible(calendario.mesSiguiente().inicio)}
        >
          ›
        </button>
      </div>

      <div className="calendario__cuadricula" role="group" aria-label="Dias del mes">
        {DIAS_DE_LA_SEMANA.map((dia) => (
          <span key={dia.numero} className="calendario__nombre-dia" aria-hidden="true">
            {dia.nombre.slice(0, 3)}
          </span>
        ))}
        {calendario.semanas().flat().map((dia) => (
          <DiaDelMes key={dia.fecha} dia={dia} elegido={dia.fecha === fecha} alElegir={alElegir} />
        ))}
      </div>

      <p className="calendario__leyenda">Los dias apagados estan cerrados o fuera del plazo de reserva.</p>
      {esFechaValida(fecha) && <p className="calendario__elegido fecha-en-palabras">{formatearFecha(fecha)}</p>}
    </div>
  )
}

interface PropsDelDia {
  dia: DiaDelCalendario
  elegido: boolean
  alElegir: (fecha: string) => void
}

function DiaDelMes({ dia, elegido, alElegir }: PropsDelDia) {
  // Los dias de relleno del mes anterior o siguiente solo ocupan su lugar.
  if (!dia.delMes) return <span aria-hidden="true" />

  const clases = ['calendario__dia', dia.esHoy && 'calendario__dia--hoy'].filter(Boolean).join(' ')
  const motivo = dia.noDisponible && `, ${MOTIVO_EN_PALABRAS[dia.noDisponible]}`

  return (
    <button
      type="button"
      className={clases}
      aria-pressed={elegido}
      aria-label={`${formatearFecha(dia.fecha)}${dia.esHoy ? ', hoy' : ''}${motivo ?? ''}`}
      disabled={dia.noDisponible !== null}
      onClick={() => alElegir(dia.fecha)}
    >
      {dia.numero}
    </button>
  )
}

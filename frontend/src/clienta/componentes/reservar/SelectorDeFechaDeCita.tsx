// Campo para elegir el dia de la cita, dentro del plazo que puso la duena. Repite
// la fecha en palabras ("martes, 18 de noviembre") para evitar confusiones.

import { esFechaValida } from '../../../compartido/utils/fecha.ts'
import { formatearFecha } from '../../../compartido/utils/formato.ts'
import type { PlazoDeReserva } from '../../features/agendamiento/PlazoDeReserva.ts'

interface Props {
  fecha: string
  plazo: PlazoDeReserva
  alElegir: (fecha: string) => void
}

export function SelectorDeFechaDeCita({ fecha, plazo, alElegir }: Props) {
  return (
    <label className="campo">
      <span className="campo__etiqueta">Dia de tu cita</span>
      <input
        type="date"
        className="campo__control"
        min={plazo.primeraFecha}
        max={plazo.ultimaFecha}
        value={fecha}
        onChange={(evento) => alElegir(evento.target.value)}
      />
      {esFechaValida(fecha) && (
        <span className="campo__ayuda fecha-en-palabras">{formatearFecha(fecha)}</span>
      )}
    </label>
  )
}

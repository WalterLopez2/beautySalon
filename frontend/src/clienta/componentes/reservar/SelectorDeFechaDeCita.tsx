// Campo para elegir el dia de la cita. No deja elegir fechas pasadas y repite
// la fecha en palabras ("martes, 18 de noviembre") para evitar confusiones.

import { esFechaValida, hoy } from '../../../compartido/utils/fecha.ts'
import { formatearFecha } from '../../../compartido/utils/formato.ts'

interface Props {
  fecha: string
  alElegir: (fecha: string) => void
}

export function SelectorDeFechaDeCita({ fecha, alElegir }: Props) {
  return (
    <label className="campo">
      <span className="campo__etiqueta">Dia de tu cita</span>
      <input
        type="date"
        className="campo__control"
        min={hoy()}
        value={fecha}
        onChange={(evento) => alElegir(evento.target.value)}
      />
      {esFechaValida(fecha) && (
        <span className="campo__ayuda fecha-en-palabras">{formatearFecha(fecha)}</span>
      )}
    </label>
  )
}

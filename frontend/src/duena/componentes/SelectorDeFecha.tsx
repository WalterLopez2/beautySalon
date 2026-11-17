// Cambiar el dia que se mira: anterior, hoy, siguiente o uno elegido.

import { hoy, sumarDias } from '../../compartido/utils/fecha.ts'
import { formatearFecha } from '../../compartido/utils/formato.ts'

interface Props {
  fecha: string
  onCambiar: (fecha: string) => void
  // Cuantos dias salta cada flecha (1 = dia, 7 = semana).
  paso?: number
}

export function SelectorDeFecha({ fecha, onCambiar, paso = 1 }: Props) {
  return (
    <div role="group" aria-label="Elegir fecha">
      <button type="button" onClick={() => onCambiar(sumarDias(fecha, -paso))}>
        Anterior
      </button>
      <button type="button" onClick={() => onCambiar(hoy())}>
        Hoy
      </button>
      <button type="button" onClick={() => onCambiar(sumarDias(fecha, paso))}>
        Siguiente
      </button>
      <input
        type="date"
        aria-label="Fecha"
        value={fecha}
        onChange={(evento) => evento.target.value && onCambiar(evento.target.value)}
      />
      <p>{formatearFecha(fecha)}</p>
    </div>
  )
}

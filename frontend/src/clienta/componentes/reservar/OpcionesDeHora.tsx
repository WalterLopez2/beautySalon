// Horas libres como botones de radio: una sola hora elegida a la vez, y se
// recorren con el teclado igual que cualquier grupo de radios.

import { formatearHora } from '../../../compartido/utils/formato.ts'

interface Props {
  horas: readonly string[]
  elegida: string
  alElegir: (hora: string) => void
}

export function OpcionesDeHora({ horas, elegida, alElegir }: Props) {
  return (
    <div className="opciones-hora">
      {horas.map((hora) => (
        <label key={hora} className="opcion-hora">
          <input
            type="radio"
            name="hora"
            className="opcion-hora__radio"
            checked={hora === elegida}
            onChange={() => alElegir(hora)}
          />
          {formatearHora(hora)}
        </label>
      ))}
    </div>
  )
}

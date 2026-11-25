// Una regla de reserva con su explicacion, para que la duena sepa que cambia.

import type { ReglaDeReserva } from '../../features/horario/HorarioSemanal.ts'

// Un input numerico vacio significa "sin valor todavia".
function aNumeroONull(texto: string): number | null {
  return texto.trim() === '' ? null : Number(texto)
}

interface Props {
  regla: ReglaDeReserva
  valor: number | null
  onCambiar: (valor: number | null) => void
}

export function CampoDeReglaDeReserva({ regla, valor, onCambiar }: Props) {
  const id = `regla-${regla.campo}`

  return (
    <div className="campo-panel">
      <label htmlFor={id}>{regla.etiqueta}</label>
      <input
        id={id}
        type="number"
        min={regla.minimo}
        max={regla.maximo}
        aria-describedby={`${id}-ayuda`}
        value={valor ?? ''}
        onChange={(e) => onCambiar(aNumeroONull(e.target.value))}
      />
      <p id={`${id}-ayuda`} className="campo-panel__ayuda">
        {regla.ayuda}
      </p>
    </div>
  )
}

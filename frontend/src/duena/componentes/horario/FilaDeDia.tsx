// Un dia de la semana en el editor de horario: abierto (con sus horas) o cerrado.

import type { DiaDeLaSemana, HorasDelDia } from '../../features/horario/HorarioSemanal.ts'

// Horas que se proponen al abrir un dia que estaba cerrado.
const HORAS_AL_ABRIR: HorasDelDia = { apertura: '', cierre: '' }

interface Props {
  dia: DiaDeLaSemana
  horas: HorasDelDia | null
  onAbrir: (horas: HorasDelDia) => void
  onCerrar: () => void
}

export function FilaDeDia({ dia, horas, onAbrir, onCerrar }: Props) {
  const id = `dia-${dia.numero}`

  return (
    <div role="group" aria-labelledby={`${id}-nombre`}>
      <span id={`${id}-nombre`}>{dia.nombre}</span>

      <label>
        <input
          type="checkbox"
          checked={horas !== null}
          onChange={(e) => (e.target.checked ? onAbrir(HORAS_AL_ABRIR) : onCerrar())}
        />
        Abierto
      </label>

      {horas && (
        <>
          <label htmlFor={`${id}-apertura`}>Abre</label>
          <input
            id={`${id}-apertura`}
            type="time"
            value={horas.apertura}
            onChange={(e) => onAbrir({ ...horas, apertura: e.target.value })}
          />
          <label htmlFor={`${id}-cierre`}>Cierra</label>
          <input
            id={`${id}-cierre`}
            type="time"
            value={horas.cierre}
            onChange={(e) => onAbrir({ ...horas, cierre: e.target.value })}
          />
        </>
      )}
    </div>
  )
}

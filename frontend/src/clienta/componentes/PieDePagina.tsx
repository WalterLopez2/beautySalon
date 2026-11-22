// Pie con los datos que la duena escribio en el panel.

import type { Salon } from '../features/salon/Salon.ts'
import { ContactoDelSalon } from './ContactoDelSalon.tsx'

interface Props {
  salon: Salon | null
}

export function PieDePagina({ salon }: Props) {
  return (
    <footer className="pie">
      {salon?.nombre && <span className="pie__marca">{salon.nombre}</span>}
      {salon?.eslogan && <p>{salon.eslogan}</p>}
      <ContactoDelSalon telefono={salon?.telefono ?? null} />
    </footer>
  )
}

// Paso de la hora: decide que mostrar segun la disponibilidad del dia. Las
// horas posibles las calcula `AgendaDelDia` con el horario que configuro la
// duena; aqui solo se traduce cada estado a un mensaje.

import type { Servicio } from '../../../compartido/dominio/Servicio.ts'
import { esFechaValida } from '../../../compartido/utils/fecha.ts'
import type { PlazoDeReserva } from '../../features/agendamiento/PlazoDeReserva.ts'
import type { DisponibilidadEnPantalla } from '../../hooks/useAgendaDelDia.ts'
import { AvisoConReintento } from '../AvisoConReintento.tsx'
import { OpcionesDeHora } from './OpcionesDeHora.tsx'

interface Props {
  servicio: Servicio | null
  fecha: string
  plazo: PlazoDeReserva
  disponibilidad: DisponibilidadEnPantalla
  horaElegida: string
  alElegir: (hora: string) => void
}

export function SelectorDeHora({ servicio, fecha, plazo, disponibilidad, horaElegida, alElegir }: Props) {
  const { horasDisponibles, salonAbierto, cargando, error, recargar } = disponibilidad

  if (!servicio || !esFechaValida(fecha)) {
    return <p className="paso__aviso">Primero elige el servicio y el dia.</p>
  }

  const errorDePlazo = plazo.errorDe(fecha)
  if (errorDePlazo) {
    return <p className="paso__aviso">{errorDePlazo}</p>
  }

  if (cargando) {
    return <p className="paso__aviso" role="status">Buscando horas libres...</p>
  }

  if (error) {
    return <AvisoConReintento mensaje={error} alReintentar={recargar} />
  }

  if (!salonAbierto) {
    return <p className="paso__aviso">Ese dia el salon no atiende. Elige otro dia, por favor.</p>
  }

  if (horasDisponibles.length === 0) {
    return <p className="paso__aviso">Ya no quedan horas libres ese dia. Prueba con otro.</p>
  }

  return <OpcionesDeHora horas={horasDisponibles} elegida={horaElegida} alElegir={alElegir} />
}

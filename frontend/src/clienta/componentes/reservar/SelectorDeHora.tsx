// Paso de la hora: consulta la disponibilidad del dia elegido y decide que
// mostrar. Las horas posibles las calcula `AgendaDelDia` con el horario que
// configuro la duena; aqui solo se traduce cada estado a un mensaje.

import type { Servicio } from '../../../compartido/dominio/Servicio.ts'
import { ultimaFechaParaAgendar } from '../../../compartido/dominio/plazoDeReserva.ts'
import { esFechaValida } from '../../../compartido/utils/fecha.ts'
import { useAgendaDelDia } from '../../hooks/useAgendaDelDia.ts'
import { OpcionesDeHora } from './OpcionesDeHora.tsx'

interface Props {
  servicio: Servicio | null
  fecha: string
  horaElegida: string
  alElegir: (hora: string) => void
}

export function SelectorDeHora({ servicio, fecha, horaElegida, alElegir }: Props) {
  const { horasDisponibles, salonAbierto, cargando, error } = useAgendaDelDia(fecha, servicio)

  if (!servicio || !esFechaValida(fecha)) {
    return <p className="paso__aviso">Primero elige el servicio y el dia.</p>
  }

  if (fecha > ultimaFechaParaAgendar()) {
    return <p className="paso__aviso">Todavia no se puede agendar para ese dia. Elige uno mas cercano.</p>
  }

  if (cargando) {
    return <p className="paso__aviso" role="status">Buscando horas libres...</p>
  }

  if (error) {
    return <p className="paso__aviso" role="alert">{error}</p>
  }

  if (!salonAbierto) {
    return <p className="paso__aviso">Ese dia el salon no atiende. Elige otro dia, por favor.</p>
  }

  if (horasDisponibles.length === 0) {
    return <p className="paso__aviso">Ya no quedan horas libres ese dia. Prueba con otro.</p>
  }

  return <OpcionesDeHora horas={horasDisponibles} elegida={horaElegida} alElegir={alElegir} />
}

// Repaso de lo elegido antes de confirmar. Solo aparece cuando ya hay
// servicio, dia y hora; el contacto no se repite.

import { esFechaValida } from '../../../compartido/utils/fecha.ts'
import type { SolicitudDeCita } from '../../features/agendamiento/SolicitudDeCita.ts'
import { DetalleDeCita } from './DetalleDeCita.tsx'

interface Props {
  solicitud: SolicitudDeCita
}

export function ResumenDeLaSolicitud({ solicitud }: Props) {
  const { servicio, fecha } = solicitud
  const franja = solicitud.franja()
  if (!servicio || !franja || !esFechaValida(fecha)) return null

  return (
    <DetalleDeCita
      servicio={servicio.nombre}
      fecha={fecha}
      horario={franja.etiqueta()}
      precio={servicio.precioFormateado()}
    />
  )
}

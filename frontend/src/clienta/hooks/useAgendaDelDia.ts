// Disponibilidad de un dia para un servicio. Si la fecha es hoy, no ofrece
// horas que ya pasaron.
//
// Cada respuesta se guarda junto con la fecha que pidio. Asi "cargando" no es
// un estado aparte que haya que mantener sincronizado: se deduce de que la
// fecha en pantalla todavia no tiene respuesta.

import { useEffect, useState } from 'react'
import { AgendaDelDia } from '../features/agendamiento/AgendaDelDia.ts'
import type { RepositorioCitas } from '../features/agendamiento/repositorioCitas.ts'
import type { Servicio } from '../../compartido/dominio/Servicio.ts'
import { contenedor } from '../contenedor.ts'
import { esFechaValida, hoy } from '../../compartido/utils/fecha.ts'
import { mensajeDeError } from '../../compartido/utils/errores.ts'
import { horaActual } from '../../compartido/utils/hora.ts'

type RespuestaDelDia =
  | { fecha: string; agenda: AgendaDelDia }
  | { fecha: string; error: string }

export interface DisponibilidadEnPantalla {
  horasDisponibles: string[]
  // false = ese dia el salon no atiende: la vista lo dice en vez de "sin horas".
  salonAbierto: boolean
  cargando: boolean
  error: string | null
}

export function useAgendaDelDia(
  fecha: string,
  servicio: Servicio | null,
  repositorio: RepositorioCitas = contenedor.repositorioCitas,
): DisponibilidadEnPantalla {
  const [respuesta, setRespuesta] = useState<RespuestaDelDia | null>(null)

  useEffect(() => {
    if (!esFechaValida(fecha)) return

    let vigente = true
    repositorio
      .agendaDe(fecha)
      .then((agenda) => {
        if (vigente) setRespuesta({ fecha, agenda })
      })
      .catch((causa: unknown) => {
        if (vigente) setRespuesta({ fecha, error: mensajeDeError(causa) })
      })

    // Si la clienta cambia de fecha, la respuesta anterior se descarta.
    return () => {
      vigente = false
    }
  }, [fecha, repositorio])

  // Solo cuenta la respuesta que corresponde a la fecha que esta en pantalla.
  const respuestaDelDia = respuesta?.fecha === fecha ? respuesta : null
  const agenda = respuestaDelDia && 'agenda' in respuestaDelDia ? respuestaDelDia.agenda : null
  const error = respuestaDelDia && 'error' in respuestaDelDia ? respuestaDelDia.error : null

  const horasDisponibles =
    agenda && servicio
      ? agenda.horasDisponiblesPara(
          servicio.duracionMin,
          fecha === hoy() ? horaActual() : undefined,
        )
      : []

  return {
    horasDisponibles,
    salonAbierto: agenda?.estaAbierto() ?? true,
    cargando: esFechaValida(fecha) && respuestaDelDia === null,
    error,
  }
}

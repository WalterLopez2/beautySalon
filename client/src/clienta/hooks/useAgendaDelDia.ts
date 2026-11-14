// Disponibilidad de un dia para un servicio. Si la fecha es hoy, no ofrece
// horas que ya pasaron.

import { useEffect, useState } from 'react'
import { AgendaDelDia } from '../features/agendamiento/AgendaDelDia.ts'
import type { RepositorioCitas } from '../features/agendamiento/repositorioCitas.ts'
import type { Servicio } from '../../compartido/dominio/Servicio.ts'
import { contenedor } from '../contenedor.ts'
import { esFechaValida, hoy } from '../../compartido/utils/fecha.ts'
import { mensajeDeError } from '../../compartido/utils/errores.ts'
import { horaActual } from '../../compartido/utils/hora.ts'

interface AgendaCargada {
  fecha: string
  agenda: AgendaDelDia
}

interface DisponibilidadEnPantalla {
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
  const [cargada, setCargada] = useState<AgendaCargada | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!esFechaValida(fecha)) return

    let vigente = true
    setCargando(true)
    setError(null)

    repositorio
      .agendaDe(fecha)
      .then((agenda) => {
        if (vigente) setCargada({ fecha, agenda })
      })
      .catch((causa: unknown) => {
        if (vigente) setError(mensajeDeError(causa))
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })

    // Si la clienta cambia de fecha, la respuesta anterior se descarta.
    return () => {
      vigente = false
    }
  }, [fecha, repositorio])

  // La agenda se usa solo si corresponde a la fecha que esta en pantalla.
  const agenda = cargada?.fecha === fecha ? cargada.agenda : null
  const horasDisponibles =
    agenda && servicio
      ? agenda.horasDisponiblesPara(
          servicio.duracionMin,
          fecha === hoy() ? horaActual() : undefined,
        )
      : []

  return { horasDisponibles, salonAbierto: agenda?.estaAbierto() ?? true, cargando, error }
}

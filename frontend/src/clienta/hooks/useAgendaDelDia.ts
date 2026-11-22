// Disponibilidad de un dia para un servicio. Que horas ya pasaron lo dice el
// servidor, con el reloj del salon y no el del celular.

import { useMemo } from 'react'
import type { Servicio } from '../../compartido/dominio/Servicio.ts'
import { useConsulta } from '../../compartido/hooks/useConsulta.ts'
import { esFechaValida } from '../../compartido/utils/fecha.ts'
import { contenedor } from '../contenedor.ts'
import type { AgendaDelDia } from '../features/agendamiento/AgendaDelDia.ts'
import type { RepositorioCitas } from '../features/agendamiento/repositorioCitas.ts'

export interface DisponibilidadEnPantalla {
  horasDisponibles: string[]
  // false = ese dia el salon no atiende: la vista lo dice en vez de "sin horas".
  salonAbierto: boolean
  cargando: boolean
  error: string | null
  recargar: () => void
}

export function useAgendaDelDia(
  fecha: string,
  servicio: Servicio | null,
  repositorio: RepositorioCitas = contenedor.repositorioCitas,
): DisponibilidadEnPantalla {
  // null = todavia no hay un dia que consultar.
  const consultar = useMemo(
    () => (esFechaValida(fecha) ? () => repositorio.agendaDe(fecha) : null),
    [fecha, repositorio],
  )
  const { datos, cargando, error, recargar } = useConsulta<AgendaDelDia | null>(consultar, null)

  // Solo cuenta la respuesta que corresponde a la fecha que esta en pantalla.
  const agenda = !cargando && datos?.fecha === fecha ? datos : null

  return {
    horasDisponibles: agenda && servicio ? agenda.horasDisponiblesPara(servicio.duracionMin) : [],
    salonAbierto: agenda?.estaAbierto() ?? true,
    cargando,
    error,
    recargar,
  }
}

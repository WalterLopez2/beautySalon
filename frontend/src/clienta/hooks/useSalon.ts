// Informacion y plazos del salon. Se pide una vez al abrir la pagina.

import { useCallback } from 'react'
import { useConsulta } from '../../compartido/hooks/useConsulta.ts'
import { contenedor } from '../contenedor.ts'
import type { RepositorioSalon } from '../features/salon/repositorioSalon.ts'
import type { Salon } from '../features/salon/Salon.ts'

export interface SalonEnPantalla {
  salon: Salon | null // null mientras carga o si fallo
  cargando: boolean
  error: string | null
  recargar: () => void
}

export function useSalon(repositorio: RepositorioSalon = contenedor.repositorioSalon): SalonEnPantalla {
  const consultar = useCallback(() => repositorio.obtener(), [repositorio])
  const { datos, cargando, error, recargar } = useConsulta<Salon | null>(consultar, null)

  return { salon: datos, cargando, error, recargar }
}

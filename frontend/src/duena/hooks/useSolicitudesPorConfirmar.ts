// Todo lo que falta confirmar, de cualquier dia. La agenda muestra un dia a la
// vez y las solicitudes vencen: sin esta lista la duena perderia citas sin verlas.

import { useCallback } from 'react'
import { contenedorDuena } from '../contenedor.ts'
import type { CitaDelPanel } from '../features/agenda/CitaDelPanel.ts'
import type { RepositorioAgenda } from '../features/agenda/repositorioAgenda.ts'
import { useConsulta } from '../../compartido/hooks/useConsulta.ts'

const SIN_SOLICITUDES: readonly CitaDelPanel[] = []

interface SolicitudesEnPantalla {
  solicitudes: readonly CitaDelPanel[]
  cargando: boolean
  error: string | null
  recargar: () => void
}

export function useSolicitudesPorConfirmar(
  repositorio: RepositorioAgenda = contenedorDuena.repositorioAgenda,
): SolicitudesEnPantalla {
  const consultar = useCallback((): Promise<readonly CitaDelPanel[]> => repositorio.pendientes(), [repositorio])
  const { datos, cargando, error, recargar } = useConsulta(consultar, SIN_SOLICITUDES)

  return { solicitudes: datos, cargando, error, recargar }
}

// Historial de la clienta seleccionada. Con `clientaId` null no consulta nada
// (por ejemplo, mientras la duena todavia no elige a nadie de la lista).

import { useCallback } from 'react'
import { contenedorDuena } from '../contenedor.ts'
import type { HistorialDeClienta } from '../features/clientas/HistorialDeClienta.ts'
import type { RepositorioClientas } from '../features/clientas/repositorioClientas.ts'
import { useConsulta } from './useConsulta.ts'

interface HistorialEnPantalla {
  historial: HistorialDeClienta | null
  cargando: boolean
  error: string | null
  recargar: () => void
}

export function useHistorialDeClienta(
  clientaId: number | null,
  repositorio: RepositorioClientas = contenedorDuena.repositorioClientas,
): HistorialEnPantalla {
  const consultar = useCallback(
    () => (clientaId === null ? Promise.resolve(null) : repositorio.historialDe(clientaId)),
    [clientaId, repositorio],
  )
  const { datos, cargando, error, recargar } = useConsulta<HistorialDeClienta | null>(
    consultar,
    null,
  )

  // No mostrar el historial de otra clienta mientras carga la nueva.
  const historial = datos?.clienta.id === clientaId ? datos : null

  return { historial, cargando, error, recargar }
}

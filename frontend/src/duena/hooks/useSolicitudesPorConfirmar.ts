// Todo lo que falta confirmar, de cualquier dia. La agenda muestra un dia a la
// vez y las solicitudes vencen: sin esta lista la duena perderia citas sin verlas.

import { useCallback } from 'react'
import { ultimaFechaParaAgendar } from '../../compartido/dominio/plazoDeReserva.ts'
import { hoy } from '../../compartido/utils/fecha.ts'
import { contenedorDuena } from '../contenedor.ts'
import type { CitaDelPanel } from '../features/agenda/CitaDelPanel.ts'
import type { RepositorioAgenda } from '../features/agenda/repositorioAgenda.ts'
import { useConsulta } from './useConsulta.ts'

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
  const consultar = useCallback(async (): Promise<readonly CitaDelPanel[]> => {
    const citas = await repositorio.citasEntre(hoy(), ultimaFechaParaAgendar())
    return citas.filter((item) => item.cita.estaPendiente())
  }, [repositorio])
  const { datos, cargando, error, recargar } = useConsulta(consultar, SIN_SOLICITUDES)

  return { solicitudes: datos, cargando, error, recargar }
}

// Agenda de un dia en el panel y las acciones sobre sus citas (confirmar,
// cancelar, marcar atendida). Las reglas viven en el dominio y el caso de uso.

import { useCallback, useState } from 'react'
import type { EstadoCita } from '../../compartido/tipos/api.ts'
import { mensajeDeError } from '../../compartido/utils/errores.ts'
import { contenedorDuena } from '../contenedor.ts'
import { AgendaDelPanel } from '../features/agenda/AgendaDelPanel.ts'
import type { CambiarEstadoDeCita } from '../features/agenda/CambiarEstadoDeCita.ts'
import type { CitaDelPanel } from '../features/agenda/CitaDelPanel.ts'
import type { RepositorioAgenda } from '../features/agenda/repositorioAgenda.ts'
import { useConsulta } from './useConsulta.ts'

interface AgendaEnPantalla {
  agenda: AgendaDelPanel
  cargando: boolean
  error: string | null
  recargar: () => void
  // Id de la cita que se esta guardando, para deshabilitar sus botones.
  citaEnProceso: number | null
  errorDeAccion: string | null
  cambiarEstado: (item: CitaDelPanel, estado: EstadoCita) => Promise<void>
}

export function useAgendaDelPanel(
  fecha: string,
  repositorio: RepositorioAgenda = contenedorDuena.repositorioAgenda,
  caso: CambiarEstadoDeCita = contenedorDuena.cambiarEstadoDeCita,
): AgendaEnPantalla {
  const consultar = useCallback(
    async () => new AgendaDelPanel(fecha, await repositorio.citasEntre(fecha, fecha)),
    [fecha, repositorio],
  )
  const { datos, cargando, error, recargar, reemplazar } = useConsulta(
    consultar,
    AgendaDelPanel.vacia(fecha),
  )
  const [citaEnProceso, setCitaEnProceso] = useState<number | null>(null)
  const [errorDeAccion, setErrorDeAccion] = useState<string | null>(null)

  // Mientras llega la agenda de otra fecha no se muestran citas de la anterior.
  const agenda = datos.fecha === fecha ? datos : AgendaDelPanel.vacia(fecha)

  async function cambiarEstado(item: CitaDelPanel, estado: EstadoCita): Promise<void> {
    setCitaEnProceso(item.id)
    setErrorDeAccion(null)
    try {
      const actualizada = await caso.ejecutar(item, estado)
      reemplazar(agenda.conCitaActualizada(actualizada))
    } catch (causa) {
      setErrorDeAccion(mensajeDeError(causa))
    } finally {
      setCitaEnProceso(null)
    }
  }

  return { agenda, cargando, error, recargar, citaEnProceso, errorDeAccion, cambiarEstado }
}

// Dias libres y bloqueos de un rango de fechas (por ejemplo, el mes que la
// duena esta mirando). Despues de crear un bloqueo expone las citas afectadas
// para que la vista le pregunte que hacer con ellas.

import { useCallback, useState } from 'react'
import { erroresDeError } from '../../compartido/utils/errores.ts'
import { contenedorDuena } from '../contenedor.ts'
import type { CitaDelPanel } from '../features/agenda/CitaDelPanel.ts'
import type { Bloqueo } from '../features/bloqueos/Bloqueo.ts'
import type { BorradorDeBloqueo } from '../features/bloqueos/BorradorDeBloqueo.ts'
import type { CrearBloqueo } from '../features/bloqueos/CrearBloqueo.ts'
import type { RepositorioBloqueos } from '../features/bloqueos/repositorioBloqueos.ts'
import { useConsulta } from './useConsulta.ts'

interface BloqueosEnPantalla {
  bloqueos: readonly Bloqueo[]
  cargando: boolean
  error: string | null
  recargar: () => void
  guardando: boolean
  errores: string[]
  // Citas que ya estaban agendadas en el ultimo bloqueo creado.
  citasAfectadas: readonly CitaDelPanel[]
  crear: (borrador: BorradorDeBloqueo) => Promise<boolean>
  eliminar: (bloqueo: Bloqueo) => Promise<boolean>
  olvidarCitasAfectadas: () => void
}

const NINGUNO: readonly Bloqueo[] = []
const NINGUNA: readonly CitaDelPanel[] = []

export function useBloqueos(
  desde: string,
  hasta: string,
  repositorio: RepositorioBloqueos = contenedorDuena.repositorioBloqueos,
  caso: CrearBloqueo = contenedorDuena.crearBloqueo,
): BloqueosEnPantalla {
  const consultar = useCallback(() => repositorio.entre(desde, hasta), [desde, hasta, repositorio])
  const { datos: bloqueos, cargando, error, recargar, reemplazar } = useConsulta(consultar, NINGUNO)
  const [guardando, setGuardando] = useState(false)
  const [errores, setErrores] = useState<string[]>([])
  const [citasAfectadas, setCitasAfectadas] = useState<readonly CitaDelPanel[]>(NINGUNA)

  async function ejecutar(accion: () => Promise<void>): Promise<boolean> {
    setGuardando(true)
    setErrores([])
    try {
      await accion()
      return true
    } catch (causa) {
      setErrores(erroresDeError(causa))
      return false
    } finally {
      setGuardando(false)
    }
  }

  const crear = (borrador: BorradorDeBloqueo) =>
    ejecutar(async () => {
      const { bloqueo, citasAfectadas: afectadas } = await caso.ejecutar(borrador)
      if (bloqueo.desde <= hasta && bloqueo.hasta >= desde) {
        reemplazar([...bloqueos, bloqueo].sort((a, b) => a.desde.localeCompare(b.desde)))
      }
      setCitasAfectadas(afectadas)
    })

  const eliminar = (bloqueo: Bloqueo) =>
    ejecutar(async () => {
      await repositorio.eliminar(bloqueo.id)
      reemplazar(bloqueos.filter((actual) => actual.id !== bloqueo.id))
    })

  return {
    bloqueos,
    cargando,
    error,
    recargar,
    guardando,
    errores,
    citasAfectadas,
    crear,
    eliminar,
    olvidarCitasAfectadas: () => setCitasAfectadas(NINGUNA),
  }
}

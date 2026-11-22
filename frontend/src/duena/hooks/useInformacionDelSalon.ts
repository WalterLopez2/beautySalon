// Editor de "Mi salon": edita sin tocar el servidor hasta que la duena guarda.

import { useCallback, useState } from 'react'
import { useConsulta } from '../../compartido/hooks/useConsulta.ts'
import { erroresDeError } from '../../compartido/utils/errores.ts'
import { contenedorDuena } from '../contenedor.ts'
import type { BorradorDeSalon, CamposDelSalon } from '../features/salon/BorradorDeSalon.ts'
import type { GuardarSalon } from '../features/salon/GuardarSalon.ts'
import type { RepositorioSalon } from '../features/salon/repositorioSalon.ts'

interface InformacionEnPantalla {
  borrador: BorradorDeSalon | null // null solo mientras carga
  cargando: boolean
  error: string | null
  recargar: () => void
  hayCambiosSinGuardar: boolean
  guardando: boolean
  seGuardo: boolean
  errores: string[]
  cambiar: (cambios: Partial<CamposDelSalon>) => void
  guardar: () => Promise<void>
}

export function useInformacionDelSalon(
  repositorio: RepositorioSalon = contenedorDuena.repositorioSalon,
  caso: GuardarSalon = contenedorDuena.guardarSalon,
): InformacionEnPantalla {
  const consultar = useCallback(() => repositorio.obtener(), [repositorio])
  const { datos, cargando, error, recargar, reemplazar } = useConsulta<BorradorDeSalon | null>(consultar, null)
  const [editado, setEditado] = useState<BorradorDeSalon | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [seGuardo, setSeGuardo] = useState(false)
  const [errores, setErrores] = useState<string[]>([])

  const borrador = editado ?? datos

  function cambiar(cambios: Partial<CamposDelSalon>): void {
    if (!borrador) return
    setEditado(borrador.con(cambios))
    setErrores([])
    setSeGuardo(false)
  }

  async function guardar(): Promise<void> {
    if (!borrador) return
    setGuardando(true)
    setErrores([])
    try {
      reemplazar(await caso.ejecutar(borrador))
      setEditado(null)
      setSeGuardo(true)
    } catch (causa) {
      setErrores(erroresDeError(causa))
    } finally {
      setGuardando(false)
    }
  }

  return {
    borrador,
    cargando,
    error,
    recargar,
    hayCambiosSinGuardar: editado !== null,
    guardando,
    seGuardo,
    errores,
    cambiar,
    guardar,
  }
}

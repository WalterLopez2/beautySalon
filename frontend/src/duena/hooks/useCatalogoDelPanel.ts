// Catalogo que administra la duena: listar, crear, editar y pausar servicios.
// Las reglas viven en BorradorDeServicio y GuardarServicio; el hook solo
// maneja la carga, el "guardando..." y los mensajes.

import { useCallback, useState } from 'react'
import { erroresDeError } from '../../compartido/utils/errores.ts'
import { contenedorDuena } from '../contenedor.ts'
import type { BorradorDeServicio } from '../features/catalogo/BorradorDeServicio.ts'
import type { GuardarServicio } from '../features/catalogo/GuardarServicio.ts'
import type { RepositorioCatalogo } from '../features/catalogo/repositorioCatalogo.ts'
import type { ServicioDelPanel } from '../features/catalogo/ServicioDelPanel.ts'
import { useConsulta } from './useConsulta.ts'

interface CatalogoDelPanelEnPantalla {
  servicios: readonly ServicioDelPanel[]
  cargando: boolean
  error: string | null
  recargar: () => void
  guardando: boolean
  errores: string[]
  // Devuelve true si se guardo, para que la vista cierre el formulario.
  guardar: (borrador: BorradorDeServicio, id?: number) => Promise<boolean>
  cambiarActivo: (servicio: ServicioDelPanel) => Promise<boolean>
}

const SIN_SERVICIOS: readonly ServicioDelPanel[] = []

export function useCatalogoDelPanel(
  repositorio: RepositorioCatalogo = contenedorDuena.repositorioCatalogo,
  caso: GuardarServicio = contenedorDuena.guardarServicio,
): CatalogoDelPanelEnPantalla {
  const consultar = useCallback(() => repositorio.listar(), [repositorio])
  const { datos: servicios, cargando, error, recargar, reemplazar } = useConsulta(consultar, SIN_SERVICIOS)
  const [guardando, setGuardando] = useState(false)
  const [errores, setErrores] = useState<string[]>([])

  // Corre una accion, refleja el servicio guardado en la lista y traduce errores.
  async function ejecutar(accion: () => Promise<ServicioDelPanel>): Promise<boolean> {
    setGuardando(true)
    setErrores([])
    try {
      reemplazar(conServicioActualizado(servicios, await accion()))
      return true
    } catch (causa) {
      setErrores(erroresDeError(causa))
      return false
    } finally {
      setGuardando(false)
    }
  }

  return {
    servicios,
    cargando,
    error,
    recargar,
    guardando,
    errores,
    guardar: (borrador, id) => ejecutar(() => caso.ejecutar(borrador, id)),
    cambiarActivo: (servicio) => ejecutar(() => repositorio.cambiarActivo(servicio.id, servicio.estaPausado())),
  }
}

// Reemplaza el servicio si ya estaba en la lista, o lo agrega si es nuevo.
function conServicioActualizado(
  servicios: readonly ServicioDelPanel[],
  guardado: ServicioDelPanel,
): readonly ServicioDelPanel[] {
  const yaEstaba = servicios.some((servicio) => servicio.id === guardado.id)
  return yaEstaba
    ? servicios.map((servicio) => (servicio.id === guardado.id ? guardado : servicio))
    : [...servicios, guardado]
}

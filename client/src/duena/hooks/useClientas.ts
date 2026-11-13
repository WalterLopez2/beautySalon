// Directorio de clientas con buscador. Se trae una sola vez y se filtra en el
// navegador: un salon tiene cientos de clientas, no millones.

import { useCallback, useState } from 'react'
import { contenedorDuena } from '../contenedor.ts'
import { DirectorioDeClientas } from '../features/clientas/DirectorioDeClientas.ts'
import type { RepositorioClientas } from '../features/clientas/repositorioClientas.ts'
import { useConsulta } from './useConsulta.ts'

interface ClientasEnPantalla {
  clientas: DirectorioDeClientas
  busqueda: string
  buscar: (texto: string) => void
  cargando: boolean
  error: string | null
  recargar: () => void
}

export function useClientas(
  repositorio: RepositorioClientas = contenedorDuena.repositorioClientas,
): ClientasEnPantalla {
  const consultar = useCallback(() => repositorio.listar(), [repositorio])
  const { datos, cargando, error, recargar } = useConsulta(consultar, DirectorioDeClientas.vacio())
  const [busqueda, setBusqueda] = useState('')

  return {
    clientas: datos.buscar(busqueda).ordenadasPorNombre(),
    busqueda,
    buscar: setBusqueda,
    cargando,
    error,
    recargar,
  }
}

// Trae el catalogo de servicios. El hook solo maneja carga y error: el filtrado
// y la busqueda son metodos de CatalogoServicios.

import { useCallback } from 'react'
import { CatalogoServicios } from '../../compartido/dominio/CatalogoServicios.ts'
import type { RepositorioServicios } from '../../compartido/dominio/repositorioServicios.ts'
import { useConsulta } from '../../compartido/hooks/useConsulta.ts'
import { contenedor } from '../contenedor.ts'

export interface CatalogoEnPantalla {
  catalogo: CatalogoServicios
  cargando: boolean
  error: string | null
  recargar: () => void
}

const SIN_SERVICIOS = CatalogoServicios.vacio()

export function useCatalogoServicios(
  repositorio: RepositorioServicios = contenedor.repositorioServicios,
): CatalogoEnPantalla {
  const consultar = useCallback(() => repositorio.listar(), [repositorio])
  const { datos, cargando, error, recargar } = useConsulta(consultar, SIN_SERVICIOS)

  return { catalogo: datos, cargando, error, recargar }
}

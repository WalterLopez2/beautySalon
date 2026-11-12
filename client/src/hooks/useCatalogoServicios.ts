// Trae el catalogo de servicios. El hook solo maneja carga y error: el filtrado
// y la busqueda son metodos de CatalogoServicios.

import { useCallback, useEffect, useState } from 'react'
import { CatalogoServicios } from '../features/services/CatalogoServicios.ts'
import type { RepositorioServicios } from '../features/services/repositorioServicios.ts'
import { contenedor } from '../services/contenedor.ts'
import { mensajeDeError } from '../utils/errores.ts'

interface CatalogoEnPantalla {
  catalogo: CatalogoServicios
  cargando: boolean
  error: string | null
  recargar: () => void
}

export function useCatalogoServicios(
  repositorio: RepositorioServicios = contenedor.repositorioServicios,
): CatalogoEnPantalla {
  const [catalogo, setCatalogo] = useState(CatalogoServicios.vacio())
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      setCatalogo(await repositorio.listar())
    } catch (causa) {
      setError(mensajeDeError(causa))
    } finally {
      setCargando(false)
    }
  }, [repositorio])

  useEffect(() => {
    void cargar()
  }, [cargar])

  return { catalogo, cargando, error, recargar: () => void cargar() }
}

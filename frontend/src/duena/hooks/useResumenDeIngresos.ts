// Resumen de ingresos de la semana que contiene `fecha` (lunes a domingo).

import { useCallback } from 'react'
import { finDeSemana, inicioDeSemana } from '../../compartido/utils/fecha.ts'
import { contenedorDuena } from '../contenedor.ts'
import type { RepositorioAgenda } from '../features/agenda/repositorioAgenda.ts'
import { ResumenDeIngresos } from '../features/ingresos/ResumenDeIngresos.ts'
import { useConsulta } from './useConsulta.ts'

interface ResumenEnPantalla {
  resumen: ResumenDeIngresos
  cargando: boolean
  error: string | null
  recargar: () => void
}

export function useResumenDeIngresos(
  fecha: string,
  repositorio: RepositorioAgenda = contenedorDuena.repositorioAgenda,
): ResumenEnPantalla {
  // Se consulta por semana: cambiar de dia dentro de la misma semana no
  // vuelve a pedir nada al servidor.
  const lunes = inicioDeSemana(fecha)

  const consultar = useCallback(async () => {
    const citas = await repositorio.citasEntre(lunes, finDeSemana(lunes))
    return new ResumenDeIngresos(lunes, citas.map((item) => item.cita))
  }, [lunes, repositorio])

  const { datos, cargando, error, recargar } = useConsulta(consultar, new ResumenDeIngresos(lunes, []))
  const resumen = datos.desde() === lunes ? datos : new ResumenDeIngresos(lunes, [])

  return { resumen, cargando, error, recargar }
}

// Editor del horario de atencion. Trae el horario guardado, deja editarlo
// sin tocar el servidor y lo guarda todo junto cuando la duena confirma.

import { useCallback, useState } from 'react'
import { erroresDeError } from '../../compartido/utils/errores.ts'
import { contenedorDuena } from '../contenedor.ts'
import type { GuardarHorario } from '../features/horario/GuardarHorario.ts'
import type { HorarioSemanal, HorasDelDia } from '../features/horario/HorarioSemanal.ts'
import type { RepositorioHorario } from '../features/horario/repositorioHorario.ts'
import { useConsulta } from './useConsulta.ts'

interface HorarioEnPantalla {
  // null solo mientras carga por primera vez.
  horario: HorarioSemanal | null
  cargando: boolean
  error: string | null
  hayCambiosSinGuardar: boolean
  guardando: boolean
  errores: string[]
  abrirDia: (dia: number, horas: HorasDelDia) => void
  cerrarDia: (dia: number) => void
  cambiarIntervalo: (minutos: number | null) => void
  cambiarZonaHoraria: (zona: string) => void
  cambiarMaximoDeCitasPendientes: (maximo: number | null) => void
  guardar: () => Promise<void>
  descartarCambios: () => void
}

export function useHorarioDelSalon(
  repositorio: RepositorioHorario = contenedorDuena.repositorioHorario,
  caso: GuardarHorario = contenedorDuena.guardarHorario,
): HorarioEnPantalla {
  const consultar = useCallback(() => repositorio.obtener(), [repositorio])
  const { datos: guardado, cargando, error, reemplazar } = useConsulta<HorarioSemanal | null>(consultar, null)
  // Los cambios viven aparte del horario guardado hasta que la duena confirma.
  const [borrador, setBorrador] = useState<HorarioSemanal | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [errores, setErrores] = useState<string[]>([])

  const horario = borrador ?? guardado

  function editar(cambio: (actual: HorarioSemanal) => HorarioSemanal): void {
    if (!horario) return
    setBorrador(cambio(horario))
    setErrores([])
  }

  async function guardar(): Promise<void> {
    if (!horario) return
    setGuardando(true)
    setErrores([])
    try {
      reemplazar(await caso.ejecutar(horario))
      setBorrador(null)
    } catch (causa) {
      setErrores(erroresDeError(causa))
    } finally {
      setGuardando(false)
    }
  }

  function descartarCambios(): void {
    setBorrador(null)
    setErrores([])
  }

  return {
    horario,
    cargando,
    error,
    hayCambiosSinGuardar: borrador !== null,
    guardando,
    errores,
    abrirDia: (dia, horas) => editar((actual) => actual.conHorasDel(dia, horas)),
    cerrarDia: (dia) => editar((actual) => actual.cerradoEl(dia)),
    cambiarIntervalo: (minutos) => editar((actual) => actual.conIntervalo(minutos)),
    cambiarZonaHoraria: (zona) => editar((actual) => actual.conZonaHoraria(zona)),
    cambiarMaximoDeCitasPendientes: (maximo) => editar((actual) => actual.conMaximoDeCitasPendientes(maximo)),
    guardar,
    descartarCambios,
  }
}

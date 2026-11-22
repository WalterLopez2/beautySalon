// Estado de "Mis citas". Vive solo en memoria: el telefono, el codigo y las
// citas no se guardan en el navegador, que puede ser compartido.

import { useState } from 'react'
import type { Cita } from '../../compartido/dominio/Cita.ts'
import type { ConsultaDeHistorialDTO } from '../../compartido/tipos/api.ts'
import { erroresDeError } from '../../compartido/utils/errores.ts'
import { contenedor } from '../contenedor.ts'
import { ConsultaDeHistorial } from '../features/historial/ConsultaDeHistorial.ts'
import type { ConsultarHistorial } from '../features/historial/ConsultarHistorial.ts'

interface MisCitasEnPantalla {
  consulta: ConsultaDeHistorial
  citas: readonly Cita[]
  // El servidor responde igual con un codigo equivocado que sin citas.
  sinResultados: boolean
  consultando: boolean
  errores: string[]
  cambiar: (cambios: Partial<ConsultaDeHistorialDTO>) => void
  consultar: () => Promise<void>
  ocultar: () => void
}

export function useMisCitas(caso: ConsultarHistorial = contenedor.consultarHistorial): MisCitasEnPantalla {
  const [consulta, setConsulta] = useState(ConsultaDeHistorial.vacia())
  const [citas, setCitas] = useState<readonly Cita[] | null>(null) // null = no ha consultado
  const [consultando, setConsultando] = useState(false)
  const [errores, setErrores] = useState<string[]>([])

  function limpiarRespuesta(): void {
    setCitas(null)
    setErrores([])
  }

  function cambiar(cambios: Partial<ConsultaDeHistorialDTO>): void {
    setConsulta(consulta.con(cambios))
    limpiarRespuesta()
  }

  async function consultar(): Promise<void> {
    limpiarRespuesta()
    setConsultando(true)
    try {
      const encontradas = await caso.ejecutar(consulta)
      setCitas(encontradas)
      // Con las citas en pantalla el codigo ya no hace falta: no se conserva.
      if (encontradas.length > 0) setConsulta(ConsultaDeHistorial.vacia())
    } catch (causa) {
      setErrores(erroresDeError(causa))
    } finally {
      setConsultando(false)
    }
  }

  return {
    consulta,
    citas: citas ?? [],
    sinResultados: citas?.length === 0,
    consultando,
    errores,
    cambiar,
    consultar,
    ocultar: limpiarRespuesta,
  }
}

// Patron comun de "traer datos y mostrarlos": carga, error, recargar y
// descartar respuestas viejas. Los hooks del panel solo dicen QUE consultar.
//
// `consultar` debe venir de `useCallback`: cuando cambia (otra fecha, otra
// clienta), se vuelve a consultar. Si es null, no se consulta nada.

import { useCallback, useEffect, useState } from 'react'
import { mensajeDeError } from '../../compartido/utils/errores.ts'

export interface Consulta<T> {
  datos: T
  cargando: boolean
  error: string | null
  recargar: () => void
  // Para reflejar un cambio ya guardado (p. ej. una cita confirmada) sin
  // volver a pedir todo al servidor.
  reemplazar: (datos: T) => void
}

// Recuerda a que consulta corresponde la ultima respuesta. Asi "cargando" se
// deduce en el render (la respuesta es de otra consulta) en vez de guardarse.
interface Respuesta<T> {
  consulta: (() => Promise<T>) | null
  version: number
  datos: T
  error: string | null
}

export function useConsulta<T>(consultar: (() => Promise<T>) | null, valorInicial: T): Consulta<T> {
  const [version, setVersion] = useState(0)
  const [respuesta, setRespuesta] = useState<Respuesta<T>>({
    consulta: null,
    version,
    datos: valorInicial,
    error: null,
  })

  useEffect(() => {
    if (!consultar) return

    let vigente = true
    consultar()
      .then((datos) => {
        if (vigente) setRespuesta({ consulta: consultar, version, datos, error: null })
      })
      .catch((causa: unknown) => {
        if (vigente) {
          setRespuesta((anterior) => ({
            consulta: consultar,
            version,
            datos: anterior.datos,
            error: mensajeDeError(causa),
          }))
        }
      })

    // Si cambian los parametros antes de que llegue la respuesta, se ignora.
    return () => {
      vigente = false
    }
  }, [consultar, version])

  const recargar = useCallback(() => setVersion((actual) => actual + 1), [])
  const reemplazar = useCallback(
    (datos: T) => setRespuesta((anterior) => ({ ...anterior, datos })),
    [],
  )

  const cargando =
    consultar !== null && (respuesta.consulta !== consultar || respuesta.version !== version)

  return {
    datos: respuesta.datos,
    cargando,
    error: cargando ? null : respuesta.error,
    recargar,
    reemplazar,
  }
}

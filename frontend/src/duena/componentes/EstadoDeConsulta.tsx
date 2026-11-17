// Lo que se muestra mientras una seccion carga o si fallo la consulta. Todas
// las secciones lo usan para no repetir el mismo bloque.

import type { ReactNode } from 'react'

interface Props {
  cargando: boolean
  error: string | null
  onReintentar?: () => void
  children: ReactNode
}

export function EstadoDeConsulta({ cargando, error, onReintentar, children }: Props) {
  if (cargando) {
    return <p role="status">Cargando...</p>
  }

  if (error) {
    return (
      <div role="alert">
        <p>{error}</p>
        {onReintentar && (
          <button type="button" onClick={onReintentar}>
            Reintentar
          </button>
        )}
      </div>
    )
  }

  return <>{children}</>
}

// Marco comun de cada paso del formulario de cita (servicio, fecha, hora,
// contacto): numero, titulo y contenido. Un fieldset agrupa los campos para
// los lectores de pantalla.

import type { ReactNode } from 'react'

interface Props {
  numero: number
  titulo: string
  children: ReactNode
}

export function PasoDelFormulario({ numero, titulo, children }: Props) {
  return (
    <fieldset className="paso">
      <legend className="paso__titulo">
        <span className="paso__numero" aria-hidden="true">
          {numero}
        </span>
        {titulo}
      </legend>
      {children}
    </fieldset>
  )
}

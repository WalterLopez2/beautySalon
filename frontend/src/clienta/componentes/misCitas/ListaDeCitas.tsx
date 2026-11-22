// Citas encontradas y un boton para quitarlas de la pantalla.

import { useEffect, useRef } from 'react'
import type { Cita } from '../../../compartido/dominio/Cita.ts'
import { DetalleDeCita } from '../DetalleDeCita.tsx'

interface Props {
  citas: readonly Cita[]
  alOcultar: () => void
}

export function ListaDeCitas({ citas, alOcultar }: Props) {
  const titulo = useRef<HTMLHeadingElement>(null)

  // El formulario desaparece: el foco pasa al resultado para que se anuncie.
  useEffect(() => {
    titulo.current?.focus()
  }, [])

  return (
    <div className="mis-citas">
      <h3 ref={titulo} tabIndex={-1} className="mis-citas__titulo">
        {citas.length === 1 ? 'Encontramos 1 cita' : `Encontramos ${citas.length} citas`}
      </h3>

      <ul className="mis-citas__lista">
        {citas.map((cita) => (
          <li key={cita.id} className="mis-citas__cita">
            <DetalleDeCita
              servicio={cita.servicioNombre}
              fecha={cita.fecha}
              horario={cita.franja.etiqueta()}
              precio={cita.precioFormateado()}
              estado={cita.etiquetaDeEstado()}
            />
          </li>
        ))}
      </ul>

      <button type="button" className="boton boton--secundario" onClick={alOcultar}>
        Ocultar mis citas
      </button>
    </div>
  )
}

// Seccion "Mis citas": muestra el formulario o, si hubo resultados, las citas.

import { useRef } from 'react'
import { useMisCitas } from '../../hooks/useMisCitas.ts'
import { SECCIONES } from '../secciones.ts'
import { FormularioDeConsulta } from './FormularioDeConsulta.tsx'
import { ListaDeCitas } from './ListaDeCitas.tsx'

export function SeccionMisCitas() {
  const misCitas = useMisCitas()
  const titulo = useRef<HTMLHeadingElement>(null)

  // Al ocultar desaparece el boton que tenia el foco: vuelve al titulo.
  function ocultar(): void {
    misCitas.ocultar()
    titulo.current?.focus()
  }

  return (
    <section id={SECCIONES.misCitas} className="seccion" aria-labelledby="titulo-mis-citas">
      <div className="contenedor">
        <h2 id="titulo-mis-citas" ref={titulo} tabIndex={-1} className="seccion__titulo">
          Mis citas
        </h2>
        <p className="seccion__introduccion">Escribe tu telefono y el codigo que recibiste al agendar.</p>

        {misCitas.citas.length > 0 ? (
          <ListaDeCitas citas={misCitas.citas} alOcultar={ocultar} />
        ) : (
          <FormularioDeConsulta
            consulta={misCitas.consulta}
            consultando={misCitas.consultando}
            errores={misCitas.errores}
            alCambiar={misCitas.cambiar}
            alConsultar={() => void misCitas.consultar()}
          />
        )}

        <p className="mis-citas__sin-resultados" role="status">
          {misCitas.sinResultados && 'No encontramos citas con esos datos. Revisa el telefono y el codigo.'}
        </p>
      </div>
    </section>
  )
}

// Lo que ve la clienta al terminar de agendar: el detalle de su cita y su
// codigo de consulta. El servidor entrega el codigo UNA sola vez, asi que se
// destaca y se pide guardarlo. No se guarda en el navegador a proposito: con
// telefono + codigo se ven las citas, y en una computadora compartida otra
// persona podria leerlo.

import { useEffect, useRef } from 'react'
import type { CitaAgendada } from '../../features/agendamiento/repositorioCitas.ts'
import { DetalleDeCita } from '../DetalleDeCita.tsx'
import { SECCIONES } from '../secciones.ts'
import { BotonDeCopiar } from './BotonDeCopiar.tsx'

interface Props {
  citaAgendada: CitaAgendada
  alAgendarOtra: () => void
}

export function ComprobanteDeCita({ citaAgendada, alAgendarOtra }: Props) {
  const { cita, codigoDeConsulta } = citaAgendada
  const titulo = useRef<HTMLHeadingElement>(null)

  // El formulario desaparece: se lleva el foco al comprobante para que los
  // lectores de pantalla anuncien que la cita quedo agendada.
  useEffect(() => {
    titulo.current?.focus()
  }, [])

  return (
    <div className="comprobante">
      <h3 ref={titulo} tabIndex={-1} className="comprobante__titulo">
        Tu cita quedo agendada
      </h3>

      <DetalleDeCita
        servicio={cita.servicioNombre}
        fecha={cita.fecha}
        horario={cita.franja.etiqueta()}
        precio={cita.precioFormateado()}
        estado={cita.etiquetaDeEstado()}
      />

      <div className="comprobante__codigo">
        <p className="comprobante__codigo-etiqueta">Tu codigo de consulta</p>
        <p className="comprobante__codigo-valor">{codigoDeConsulta}</p>
        <BotonDeCopiar texto={codigoDeConsulta} etiqueta="Copiar codigo" />
      </div>

      <p className="comprobante__aviso">
        Guardalo bien: con tu telefono y este codigo puedes ver tus citas en{' '}
        <a href={`#${SECCIONES.misCitas}`}>Mis citas</a>. No lo volveremos a mostrar ni lo
        compartas con nadie.
      </p>

      <button type="button" className="boton boton--secundario" onClick={alAgendarOtra}>
        Agendar otra cita
      </button>
    </div>
  )
}

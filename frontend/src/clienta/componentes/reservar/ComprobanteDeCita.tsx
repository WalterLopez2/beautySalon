// Lo que ve la clienta al terminar de agendar: el detalle de su cita y su
// codigo de consulta. El servidor entrega el codigo UNA sola vez, asi que se
// destaca y se pide guardarlo. No se guarda en el navegador a proposito: con
// telefono + codigo se ve la cita, y en una computadora compartida otra
// persona podria leerlo.

import { useEffect, useRef } from 'react'
import type { CitaAgendada } from '../../features/agendamiento/repositorioCitas.ts'
import { DetalleDeCita } from '../DetalleDeCita.tsx'
import { SECCIONES } from '../secciones.ts'
import { BotonDeCopiar } from './BotonDeCopiar.tsx'

interface Props {
  citaAgendada: CitaAgendada
  horasParaConfirmar: number
  alAgendarOtra: () => void
}

export function ComprobanteDeCita({ citaAgendada, horasParaConfirmar, alAgendarOtra }: Props) {
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
        Guardalo bien: con tu telefono y este codigo puedes ver esta cita en{' '}
        <a href={`#${SECCIONES.misCitas}`}>Mis citas</a>. Cada cita tiene su propio codigo. No lo
        volveremos a mostrar y no debes compartirlo con nadie.
      </p>

      <p className="comprobante__aviso">
        El salon todavia debe confirmarla. Si no lo hace en {horasParaConfirmar} {horasParaConfirmar === 1 ? 'hora' : 'horas'}, tu espacio
        puede liberarse: revisa su estado en Mis citas.
      </p>

      <button type="button" className="boton boton--secundario" onClick={alAgendarOtra}>
        Agendar otra cita
      </button>
    </div>
  )
}

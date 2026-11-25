// Seccion "Reservar": la clienta arma su cita paso a paso y la confirma. El
// estado vive en `useAgendamiento` y las reglas en `SolicitudDeCita` y en el
// caso de uso `AgendarCita`; esta seccion solo conecta cada paso con su parte
// de la solicitud y, al terminar, muestra el comprobante.

import type { FormEvent } from 'react'
import { ListaDeErrores } from '../../../compartido/componentes/ListaDeErrores.tsx'
import type { Servicio } from '../../../compartido/dominio/Servicio.ts'
import type { PlazoDeReserva } from '../../features/agendamiento/PlazoDeReserva.ts'
import { useAgendaDelDia } from '../../hooks/useAgendaDelDia.ts'
import type { CatalogoEnPantalla } from '../../hooks/useCatalogoServicios.ts'
import { useAgendamiento } from '../../hooks/useAgendamiento.ts'
import type { SalonEnPantalla } from '../../hooks/useSalon.ts'
import { AvisoConReintento } from '../AvisoConReintento.tsx'
import { ContactoDelSalon } from '../ContactoDelSalon.tsx'
import { SECCIONES } from '../secciones.ts'
import { TablaDeHorario } from '../TablaDeHorario.tsx'
import { CamposDeContacto } from './CamposDeContacto.tsx'
import { ComprobanteDeCita } from './ComprobanteDeCita.tsx'
import { PasoDelFormulario } from './PasoDelFormulario.tsx'
import { ResumenDeLaSolicitud } from './ResumenDeLaSolicitud.tsx'
import { SelectorDeFechaDeCita } from './SelectorDeFechaDeCita.tsx'
import { SelectorDeHora } from './SelectorDeHora.tsx'
import { SelectorDeServicio } from './SelectorDeServicio.tsx'

interface Props {
  catalogoEnPantalla: CatalogoEnPantalla
  salonEnPantalla: SalonEnPantalla
}

export function SeccionReservar({ catalogoEnPantalla, salonEnPantalla }: Props) {
  return (
    <section id={SECCIONES.reservar} className="seccion seccion--suave" aria-labelledby="titulo-reservar">
      <div className="contenedor">
        <h2 id="titulo-reservar" className="seccion__titulo">
          Reserva tu cita
        </h2>
        <p className="seccion__introduccion">
          Elige el servicio y el dia. Solo te mostraremos las horas que de verdad estan libres.
        </p>

        <ContenidoDeReservar catalogoEnPantalla={catalogoEnPantalla} salonEnPantalla={salonEnPantalla} />
      </div>
    </section>
  )
}

// Cada motivo para no poder reservar tiene su mensaje: un fallo no es lo
// mismo que un salon cerrado ni que un catalogo vacio.
function ContenidoDeReservar({ catalogoEnPantalla, salonEnPantalla }: Props) {
  const { catalogo } = catalogoEnPantalla
  const { salon } = salonEnPantalla

  function reintentar(): void {
    if (catalogoEnPantalla.error) catalogoEnPantalla.recargar()
    if (salonEnPantalla.error) salonEnPantalla.recargar()
  }

  if (catalogoEnPantalla.cargando || salonEnPantalla.cargando) {
    return <p className="seccion__aviso" role="status">Cargando reservas...</p>
  }

  const error = salonEnPantalla.error ?? catalogoEnPantalla.error
  if (error || !salon) {
    return <AvisoConReintento mensaje={error ?? 'No pudimos cargar las reservas.'} alReintentar={reintentar} />
  }

  if (!salon.plazo) {
    return (
      <div className="aviso">
        <p>El salon no esta recibiendo reservas en linea por ahora.</p>
        <ContactoDelSalon telefono={salon.telefono} />
      </div>
    )
  }

  if (catalogo.estaVacio()) {
    return <p className="seccion__aviso">Por ahora no hay servicios disponibles para agendar.</p>
  }

  return (
    <div className="reservar">
      <aside className="reservar__lateral">
        <TablaDeHorario horario={salon.horario} hoy={salon.plazo.primeraFecha} />
      </aside>
      <FormularioDeCita servicios={catalogo.todos()} plazo={salon.plazo} telefono={salon.telefono} />
    </div>
  )
}

interface PropsDelFormulario {
  servicios: readonly Servicio[]
  plazo: PlazoDeReserva
  telefono: string | null
}

function FormularioDeCita({ servicios, plazo, telefono }: PropsDelFormulario) {
  const agendamiento = useAgendamiento(plazo)
  const { solicitud, citaConfirmada, enviando, errores } = agendamiento
  // Vive aqui, y no en el paso de la hora, para poder refrescarla si falla el envio.
  const disponibilidad = useAgendaDelDia(plazo.permite(solicitud.fecha) ? solicitud.fecha : '', solicitud.servicio)

  function agendarOtra(): void {
    agendamiento.reiniciar()
    disponibilidad.recargar()
  }

  if (citaConfirmada) {
    return (
      <ComprobanteDeCita
        citaAgendada={citaConfirmada}
        horasParaConfirmar={plazo.horasParaConfirmar}
        alAgendarOtra={agendarOtra}
      />
    )
  }

  // `noValidate`: las reglas son las del dominio, con mensajes en espanol y
  // las mismas que revisa el backend, no las del navegador.
  function alEnviar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault()
    void agendamiento.enviar().then((horasDesactualizadas) => {
      if (horasDesactualizadas) disponibilidad.recargar()
    })
  }

  return (
    <form className="formulario-cita" noValidate onSubmit={alEnviar}>
      <PasoDelFormulario numero={1} titulo="Elige tu servicio">
        <SelectorDeServicio
          servicios={servicios}
          seleccionado={solicitud.servicio}
          alElegir={agendamiento.elegirServicio}
        />
      </PasoDelFormulario>

      <PasoDelFormulario numero={2} titulo="Elige el dia">
        <SelectorDeFechaDeCita fecha={solicitud.fecha} plazo={plazo} alElegir={agendamiento.elegirFecha} />
      </PasoDelFormulario>

      <PasoDelFormulario numero={3} titulo="Elige la hora">
        <SelectorDeHora
          servicio={solicitud.servicio}
          fecha={solicitud.fecha}
          plazo={plazo}
          disponibilidad={disponibilidad}
          horaElegida={solicitud.hora}
          alElegir={agendamiento.elegirHora}
        />
      </PasoDelFormulario>

      <PasoDelFormulario numero={4} titulo="Tus datos">
        <CamposDeContacto contacto={solicitud.contacto} alCambiar={agendamiento.cambiarContacto} />
      </PasoDelFormulario>

      <div className="formulario-cita__confirmar">
        <ResumenDeLaSolicitud solicitud={solicitud} />
        <ListaDeErrores errores={errores} />
        {errores.length > 0 && <ContactoDelSalon telefono={telefono} />}
        <button type="submit" className="boton" disabled={enviando}>
          {enviando ? 'Agendando...' : 'Confirmar mi cita'}
        </button>
      </div>
    </form>
  )
}

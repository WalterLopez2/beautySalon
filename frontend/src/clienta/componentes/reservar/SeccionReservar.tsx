// Seccion "Reservar": la clienta arma su cita paso a paso y la confirma. El
// estado vive en `useAgendamiento` y las reglas en `SolicitudDeCita` y en el
// caso de uso `AgendarCita`; esta seccion solo conecta cada paso con su parte
// de la solicitud y, al terminar, muestra el comprobante.

import type { FormEvent } from 'react'
import { ListaDeErrores } from '../../../compartido/componentes/ListaDeErrores.tsx'
import type { Servicio } from '../../../compartido/dominio/Servicio.ts'
import type { CatalogoEnPantalla } from '../../hooks/useCatalogoServicios.ts'
import { useAgendamiento } from '../../hooks/useAgendamiento.ts'
import { SECCIONES } from '../secciones.ts'
import { CamposDeContacto } from './CamposDeContacto.tsx'
import { ComprobanteDeCita } from './ComprobanteDeCita.tsx'
import { PasoDelFormulario } from './PasoDelFormulario.tsx'
import { ResumenDeLaSolicitud } from './ResumenDeLaSolicitud.tsx'
import { SelectorDeFechaDeCita } from './SelectorDeFechaDeCita.tsx'
import { SelectorDeHora } from './SelectorDeHora.tsx'
import { SelectorDeServicio } from './SelectorDeServicio.tsx'

interface Props {
  catalogoEnPantalla: CatalogoEnPantalla
}

export function SeccionReservar({ catalogoEnPantalla }: Props) {
  return (
    <section id={SECCIONES.reservar} className="seccion seccion--suave" aria-labelledby="titulo-reservar">
      <div className="contenedor">
        <h2 id="titulo-reservar" className="seccion__titulo">
          Reserva tu cita
        </h2>
        <p className="seccion__introduccion">
          Elige el servicio y el dia. Solo te mostraremos las horas que de verdad estan libres.
        </p>

        <ContenidoDeReservar {...catalogoEnPantalla} />
      </div>
    </section>
  )
}

// Si el catalogo fallo, la seccion de servicios ya ofrece reintentar; aqui
// basta con no mostrar un formulario que no se puede completar.
function ContenidoDeReservar({ catalogo, cargando, error }: CatalogoEnPantalla) {
  if (cargando) {
    return <p role="status">Cargando servicios...</p>
  }

  if (error || catalogo.estaVacio()) {
    return <p className="seccion__aviso">Por ahora no hay servicios disponibles para agendar.</p>
  }

  return <FormularioDeCita servicios={catalogo.todos()} />
}

interface PropsDelFormulario {
  servicios: readonly Servicio[]
}

function FormularioDeCita({ servicios }: PropsDelFormulario) {
  const agendamiento = useAgendamiento()
  const { solicitud, citaConfirmada, enviando, errores } = agendamiento

  if (citaConfirmada) {
    return <ComprobanteDeCita citaAgendada={citaConfirmada} alAgendarOtra={agendamiento.reiniciar} />
  }

  // `noValidate`: las reglas son las del dominio, con mensajes en espanol y
  // las mismas que revisa el backend, no las del navegador.
  function alEnviar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault()
    void agendamiento.enviar()
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
        <SelectorDeFechaDeCita fecha={solicitud.fecha} alElegir={agendamiento.elegirFecha} />
      </PasoDelFormulario>

      <PasoDelFormulario numero={3} titulo="Elige la hora">
        <SelectorDeHora
          servicio={solicitud.servicio}
          fecha={solicitud.fecha}
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
        <button type="submit" className="boton" disabled={enviando}>
          {enviando ? 'Agendando...' : 'Confirmar mi cita'}
        </button>
      </div>
    </form>
  )
}

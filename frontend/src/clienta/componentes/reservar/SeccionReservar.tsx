// Seccion "Reservar": la clienta arma su cita paso a paso. El estado vive en
// `useAgendamiento` y las reglas en `SolicitudDeCita`; esta seccion solo
// conecta cada paso con su parte de la solicitud.
//
// Pasos actuales: servicio y fecha. La hora y el contacto se agregan despues.

import type { Servicio } from '../../../compartido/dominio/Servicio.ts'
import type { CatalogoEnPantalla } from '../../hooks/useCatalogoServicios.ts'
import { useAgendamiento } from '../../hooks/useAgendamiento.ts'
import { SECCIONES } from '../secciones.ts'
import { PasoDelFormulario } from './PasoDelFormulario.tsx'
import { SelectorDeFechaDeCita } from './SelectorDeFechaDeCita.tsx'
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
  const { solicitud, elegirServicio, elegirFecha } = useAgendamiento()

  return (
    <div className="formulario-cita">
      <PasoDelFormulario numero={1} titulo="Elige tu servicio">
        <SelectorDeServicio
          servicios={servicios}
          seleccionado={solicitud.servicio}
          alElegir={elegirServicio}
        />
      </PasoDelFormulario>

      <PasoDelFormulario numero={2} titulo="Elige el dia">
        <SelectorDeFechaDeCita fecha={solicitud.fecha} alElegir={elegirFecha} />
      </PasoDelFormulario>
    </div>
  )
}

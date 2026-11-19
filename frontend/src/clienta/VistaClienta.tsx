// Punto de entrada de la vista publica (la pagina de la clienta). Solo arma
// el esqueleto de la pagina; cada seccion (catalogo, agendar, mis citas) se
// agrega como componente en `clienta/componentes` y toma sus datos de los
// hooks de `clienta/hooks`.

import { Encabezado } from './componentes/Encabezado.tsx'
import { PieDePagina } from './componentes/PieDePagina.tsx'
import { Portada } from './componentes/Portada.tsx'
import { SeccionReservar } from './componentes/reservar/SeccionReservar.tsx'
import { SeccionServicios } from './componentes/servicios/SeccionServicios.tsx'
import { useCatalogoServicios } from './hooks/useCatalogoServicios.ts'
import './VistaClienta.css'

export default function VistaClienta() {
  // El catalogo se pide una sola vez y lo comparten las secciones que lo usan.
  const catalogoEnPantalla = useCatalogoServicios()

  return (
    <div className="vista-clienta">
      <Encabezado />
      <Portada />
      <main>
        <SeccionServicios catalogoEnPantalla={catalogoEnPantalla} />
        <SeccionReservar catalogoEnPantalla={catalogoEnPantalla} />
      </main>
      <PieDePagina />
    </div>
  )
}

// Punto de entrada de la vista publica (la pagina de la clienta). Solo arma
// el esqueleto de la pagina; cada seccion (catalogo, agendar, mis citas) se
// agrega como componente en `clienta/componentes` y toma sus datos de los
// hooks de `clienta/hooks`.

import { BotonDeWhatsApp } from './componentes/BotonDeWhatsApp.tsx'
import { Encabezado } from './componentes/Encabezado.tsx'
import { PieDePagina } from './componentes/PieDePagina.tsx'
import { Portada } from './componentes/Portada.tsx'
import { SeccionMisCitas } from './componentes/misCitas/SeccionMisCitas.tsx'
import { SeccionReservar } from './componentes/reservar/SeccionReservar.tsx'
import { SeccionServicios } from './componentes/servicios/SeccionServicios.tsx'
import { useCatalogoServicios } from './hooks/useCatalogoServicios.ts'
import { useSalon } from './hooks/useSalon.ts'
import { useTituloDeLaPagina } from './hooks/useTituloDeLaPagina.ts'
// Fuentes dentro del proyecto: la CSP no permite traerlas de otro sitio.
import '@fontsource/jost/latin-300.css'
import '@fontsource/jost/latin-400.css'
import '@fontsource/jost/latin-500.css'
import '@fontsource/cormorant-garamond/latin-500.css'
import '@fontsource/pinyon-script/latin-400.css'
import './VistaClienta.css'

export default function VistaClienta() {
  // El catalogo se pide una sola vez y lo comparten las secciones que lo usan.
  const catalogoEnPantalla = useCatalogoServicios()
  const salonEnPantalla = useSalon()
  const { salon } = salonEnPantalla
  useTituloDeLaPagina(salon)

  return (
    <div className="vista-clienta">
      <Encabezado marca={salon?.marca ?? ''} />
      <Portada salonEnPantalla={salonEnPantalla} />
      <main>
        <SeccionServicios catalogoEnPantalla={catalogoEnPantalla} />
        <SeccionReservar catalogoEnPantalla={catalogoEnPantalla} salonEnPantalla={salonEnPantalla} />
        <SeccionMisCitas />
      </main>
      <PieDePagina salon={salon} />
      <BotonDeWhatsApp telefono={salon?.telefono ?? null} />
    </div>
  )
}

// Punto de entrada de la vista publica (la pagina de la clienta). Solo arma
// el esqueleto de la pagina; cada seccion (catalogo, agendar, mis citas) se
// agrega como componente en `clienta/componentes` y toma sus datos de los
// hooks de `clienta/hooks`.

import { Encabezado } from './componentes/Encabezado.tsx'
import { PieDePagina } from './componentes/PieDePagina.tsx'
import { Portada } from './componentes/Portada.tsx'
import './VistaClienta.css'

export default function VistaClienta() {
  return (
    <div className="vista-clienta">
      <Encabezado />
      <Portada />
      <main />
      <PieDePagina />
    </div>
  )
}

// Esqueleto del panel una vez dentro: encabezado, menu de secciones y la
// seccion elegida. Solo estructura y accesibilidad; el diseno visual se
// agrega despues.

import { useState } from 'react'
import { hoy } from '../../compartido/utils/fecha.ts'
import type { Sesion } from '../features/sesion/Sesion.ts'
import { MenuDelPanel } from './MenuDelPanel.tsx'
import { SECCION_INICIAL, type IdDeSeccion } from './secciones.ts'
import { SeccionAgenda } from './agenda/SeccionAgenda.tsx'
import { SeccionBloqueos } from './bloqueos/SeccionBloqueos.tsx'
import { SeccionCatalogo } from './catalogo/SeccionCatalogo.tsx'
import { SeccionClientas } from './clientas/SeccionClientas.tsx'
import { SeccionHorario } from './horario/SeccionHorario.tsx'
import { SeccionIngresos } from './ingresos/SeccionIngresos.tsx'

interface Props {
  sesion: Sesion
  aviso: string | null
  onCerrarSesion: () => void
}

export function PanelDeLaDuena({ sesion, aviso, onCerrarSesion }: Props) {
  const [seccion, setSeccion] = useState<IdDeSeccion>(SECCION_INICIAL)
  // La fecha se comparte entre agenda e ingresos: al cambiar de seccion no se pierde.
  const [fecha, setFecha] = useState(hoy())

  return (
    <div className="panel-duena">
      <header>
        <p>Hola, {sesion.nombre}</p>
        <button type="button" onClick={onCerrarSesion}>
          Cerrar sesion
        </button>
      </header>

      {aviso && <p role="alert">{aviso}</p>}
      <MenuDelPanel seccionActual={seccion} onElegir={setSeccion} />

      <main id="contenido-del-panel">
        {seccion === 'agenda' && <SeccionAgenda fecha={fecha} onCambiarFecha={setFecha} />}
        {seccion === 'clientas' && <SeccionClientas />}
        {seccion === 'catalogo' && <SeccionCatalogo />}
        {seccion === 'horario' && <SeccionHorario />}
        {seccion === 'bloqueos' && <SeccionBloqueos fecha={fecha} />}
        {seccion === 'ingresos' && <SeccionIngresos fecha={fecha} onCambiarFecha={setFecha} />}
      </main>
    </div>
  )
}

// Esqueleto del panel una vez dentro: a la izquierda el menu de secciones y la
// sesion; a la derecha la seccion elegida. Los estilos estan en VistaDuena.css.

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
import { SeccionSalon } from './salon/SeccionSalon.tsx'

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
      <header className="panel-duena__lateral">
        <p className="panel-duena__marca">Mi panel</p>
        <MenuDelPanel seccionActual={seccion} onElegir={setSeccion} />
        <div className="panel-duena__sesion">
          <p className="panel-duena__saludo">Hola, {sesion.nombre}</p>
          <button type="button" onClick={onCerrarSesion}>
            Cerrar sesion
          </button>
        </div>
      </header>

      <div className="panel-duena__cuerpo">
        {aviso && (
          <p className="panel-duena__aviso" role="alert">
            {aviso}
          </p>
        )}

        <main id="contenido-del-panel" className="panel-duena__contenido">
          {seccion === 'agenda' && <SeccionAgenda fecha={fecha} onCambiarFecha={setFecha} />}
          {seccion === 'clientas' && <SeccionClientas />}
          {seccion === 'catalogo' && <SeccionCatalogo />}
          {seccion === 'horario' && <SeccionHorario />}
          {seccion === 'bloqueos' && <SeccionBloqueos fecha={fecha} />}
          {seccion === 'salon' && <SeccionSalon />}
          {seccion === 'ingresos' && <SeccionIngresos fecha={fecha} onCambiarFecha={setFecha} />}
        </main>
      </div>
    </div>
  )
}

// Barra superior fija con la marca y los enlaces a cada seccion.
// Solo presentacion: la marca la escribe la duena en el panel.

import { ENLACES_DEL_MENU, SECCIONES } from './secciones.ts'

interface Props {
  marca: string
}

export function Encabezado({ marca }: Props) {
  return (
    <nav className="encabezado" aria-label="Principal">
      <div className="contenedor encabezado__contenido">
        <span className="encabezado__marca">{marca}</span>

        <ul className="encabezado__enlaces">
          {ENLACES_DEL_MENU.map((enlace) => (
            <li key={enlace.id}>
              <a href={`#${enlace.id}`}>{enlace.texto}</a>
            </li>
          ))}
        </ul>

        <a className="boton boton--chico" href={`#${SECCIONES.reservar}`}>
          Agendar
        </a>
      </div>
    </nav>
  )
}

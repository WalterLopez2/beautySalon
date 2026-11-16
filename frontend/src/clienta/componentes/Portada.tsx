// Primera pantalla de la pagina publica: eslogan y llamados a la accion.

import { SECCIONES } from './secciones.ts'

export function Portada() {
  return (
    <header className="portada">
      <div className="contenedor">
        <h1 className="portada__eslogan">Donde la belleza resalta tu esencia</h1>
        <p className="portada__descripcion">
          Un espacio de calma para arreglarte y salir renovada. Todo en un solo lugar y con la
          misma calidad.
        </p>
        <div className="fila">
          <a className="boton" href={`#${SECCIONES.servicios}`}>
            Ver servicios
          </a>
          <a className="boton boton--secundario" href={`#${SECCIONES.reservar}`}>
            Reservar mi cita
          </a>
        </div>
      </div>
    </header>
  )
}

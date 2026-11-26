// Primera pantalla de la pagina publica: lo que escribio la duena y los
// llamados a la accion. Si no recibe reservas, se dice aqui y no dia por dia.

import type { SalonEnPantalla } from '../hooks/useSalon.ts'
import { ContactoDelSalon } from './ContactoDelSalon.tsx'
import { EstadoDelSalonAhora } from './EstadoDelSalonAhora.tsx'
import { SECCIONES } from './secciones.ts'

const TITULO_SIN_INFORMACION = 'Reservas en linea'

interface Props {
  salonEnPantalla: SalonEnPantalla
}

export function Portada({ salonEnPantalla }: Props) {
  const { salon, cargando } = salonEnPantalla
  const cerrado = salon !== null && !salon.recibeReservas()
  const titulo = salon?.eslogan || salon?.nombre || TITULO_SIN_INFORMACION
  const estadoAhora = salon?.estadoAhora()

  return (
    <header className="portada" aria-busy={cargando}>
      <div className="contenedor">
        {/* Mientras carga no se muestra un titulo que luego cambiaria. */}
        <h1 className="portada__eslogan">{cargando ? '\u00a0' : titulo}</h1>
        {salon?.descripcion && <p className="portada__descripcion">{salon.descripcion}</p>}
        {estadoAhora && salon?.plazo && <EstadoDelSalonAhora estado={estadoAhora} hoy={salon.plazo.primeraFecha} />}

        {cerrado && (
          <div className="portada__cerrado" role="status">
            <strong>El salon no esta recibiendo reservas en linea por ahora.</strong>
            <ContactoDelSalon telefono={salon.telefono} />
          </div>
        )}

        <div className="fila">
          <a className="boton" href={`#${SECCIONES.servicios}`}>
            Ver servicios
          </a>
          {!cerrado && (
            <a className="boton boton--secundario" href={`#${SECCIONES.reservar}`}>
              Reservar mi cita
            </a>
          )}
        </div>
      </div>
    </header>
  )
}

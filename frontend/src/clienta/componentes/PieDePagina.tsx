// Pie con los datos que la duena escribio en el panel: el nombre y el eslogan,
// el horario de hoy, el WhatsApp y los enlaces a cada seccion.

import { formatearTelefono } from '../../compartido/utils/telefono.ts'
import { formatearHora } from '../../compartido/utils/formato.ts'
import { enlaceDeWhatsApp } from '../../compartido/utils/whatsapp.ts'
import type { Salon } from '../features/salon/Salon.ts'
import { ENLACES_DEL_MENU, SECCIONES } from './secciones.ts'

interface Props {
  salon: Salon | null
}

export function PieDePagina({ salon }: Props) {
  return (
    <footer className="pie">
      <div className="contenedor pie__columnas">
        <div className="pie__columna">
          {salon?.nombre && <span className="pie__marca">{salon.nombre}</span>}
          {salon?.eslogan && <p>{salon.eslogan}</p>}
        </div>

        {salon && <HorarioDeHoy salon={salon} />}

        {salon?.telefono && (
          <div className="pie__columna">
            <h2 className="pie__titulo">Contacto</h2>
            <a className="contacto" href={enlaceDeWhatsApp(salon.telefono)} target="_blank" rel="noreferrer">
              WhatsApp {formatearTelefono(salon.telefono)}
            </a>
          </div>
        )}

        <nav className="pie__columna" aria-label="Secciones">
          <h2 className="pie__titulo">La pagina</h2>
          <ul className="pie__enlaces">
            {ENLACES_DEL_MENU.map((enlace) => (
              <li key={enlace.id}>
                <a href={`#${enlace.id}`}>{enlace.texto}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  )
}

// Solo el dia de hoy; el horario completo esta en la seccion Reservar.
function HorarioDeHoy({ salon }: { salon: Salon }) {
  if (!salon.plazo || salon.horario.estaVacio()) return null
  const horas = salon.horario.horasDe(salon.plazo.primeraFecha)

  return (
    <div className="pie__columna">
      <h2 className="pie__titulo">Hoy</h2>
      <p>{horas ? `${formatearHora(horas.apertura)} - ${formatearHora(horas.cierre)}` : 'Cerrado'}</p>
      <a className="pie__enlace" href={`#${SECCIONES.reservar}`}>
        Ver el horario de la semana
      </a>
    </div>
  )
}

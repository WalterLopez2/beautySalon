// "Abierto ahora" o "Cerrado ahora" en la portada, con cuando cierra o
// cuando vuelve a abrir. El calculo vive en HorarioDeAtencion; aqui solo se
// arma la frase.

import { DIAS_DE_LA_SEMANA, numeroDelDia } from '../../compartido/dominio/DiasDeLaSemana.ts'
import { formatearHora } from '../../compartido/utils/formato.ts'
import type { EstadoDelSalon, MomentoDeApertura } from '../features/salon/HorarioDeAtencion.ts'

interface Props {
  estado: EstadoDelSalon
  hoy: string // YYYY-MM-DD, con la fecha del salon
}

export function EstadoDelSalonAhora({ estado, hoy }: Props) {
  const clases = estado.abierto ? 'estado-salon estado-salon--abierto' : 'estado-salon'

  return (
    <p className={clases}>
      <span className="estado-salon__punto" aria-hidden="true" />
      {estado.abierto
        ? `Abierto ahora · cerramos a las ${formatearHora(estado.cierre)}`
        : `Cerrado ahora${estado.proximaApertura ? ` · abrimos ${cuandoAbre(estado.proximaApertura, hoy)}` : ''}`}
    </p>
  )
}

// "hoy a las 9:00 a. m." o "el jueves a las 9:00 a. m.".
function cuandoAbre({ fecha, hora }: MomentoDeApertura, hoy: string): string {
  const aLaHora = `a las ${formatearHora(hora)}`
  if (fecha === hoy) return `hoy ${aLaHora}`
  const dia = DIAS_DE_LA_SEMANA.find(({ numero }) => numero === numeroDelDia(fecha))
  return `el ${dia?.nombre.toLowerCase()} ${aLaHora}`
}

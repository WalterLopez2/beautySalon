// Lista de los datos de una cita (servicio, dia, hora, precio y, si ya existe,
// su estado). La usan el repaso antes de confirmar y el comprobante.

import { formatearFecha } from '../../../compartido/utils/formato.ts'

interface Props {
  servicio: string
  fecha: string // YYYY-MM-DD
  horario: string // "9:00 a. m. - 10:00 a. m."
  precio: string // ya formateado
  estado?: string
}

export function DetalleDeCita({ servicio, fecha, horario, precio, estado }: Props) {
  return (
    <dl className="detalle-cita">
      <dt>Servicio</dt>
      <dd>{servicio}</dd>
      <dt>Dia</dt>
      <dd className="fecha-en-palabras">{formatearFecha(fecha)}</dd>
      <dt>Hora</dt>
      <dd>{horario}</dd>
      <dt>Precio</dt>
      <dd>{precio}</dd>
      {estado && (
        <>
          <dt>Estado</dt>
          <dd>{estado}</dd>
        </>
      )}
    </dl>
  )
}

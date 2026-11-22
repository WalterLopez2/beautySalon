// Con cuanta anticipacion se agenda. Lo usan las dos vistas: la clienta para
// elegir el dia y la duena para ver todo lo que falta confirmar. El backend
// tiene la misma regla y es la que manda.

import { hoy, sumarDias } from '../utils/fecha.ts'

export const DIAS_MAXIMOS_DE_ANTICIPACION = 60

export function ultimaFechaParaAgendar(): string {
  return sumarDias(hoy(), DIAS_MAXIMOS_DE_ANTICIPACION)
}

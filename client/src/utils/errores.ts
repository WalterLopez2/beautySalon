// Traduce cualquier excepcion a un mensaje que la clienta pueda entender.

import { SolicitudInvalida } from '../features/appointments/AgendarCita.ts'
import { ErrorDeApi } from '../services/clienteHttp.ts'

const MENSAJE_GENERICO = 'Algo salio mal. Intenta de nuevo en un momento.'

export function mensajeDeError(causa: unknown): string {
  if (causa instanceof SolicitudInvalida) {
    return causa.errores.join(' ')
  }
  if (causa instanceof ErrorDeApi) {
    return causa.esDelServidor() ? MENSAJE_GENERICO : causa.message
  }
  if (causa instanceof Error) {
    return causa.message
  }
  return MENSAJE_GENERICO
}

export function erroresDeError(causa: unknown): string[] {
  return causa instanceof SolicitudInvalida ? causa.errores : [mensajeDeError(causa)]
}

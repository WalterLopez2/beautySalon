// Traduce cualquier excepcion a un mensaje que una persona pueda entender.
// Sirve igual para la clienta y para la duena.

import { ErrorDeValidacion } from '../dominio/ErrorDeValidacion.ts'
import { ErrorDeApi } from '../http/clienteHttp.ts'

const MENSAJE_GENERICO = 'Algo salio mal. Intenta de nuevo en un momento.'
const SESION_VENCIDA = 'Tu sesion vencio. Inicia sesion de nuevo.'

export function mensajeDeError(causa: unknown): string {
  if (causa instanceof ErrorDeValidacion) {
    return causa.errores.join(' ')
  }
  if (causa instanceof ErrorDeApi) {
    if (causa.esDeSesion()) return SESION_VENCIDA
    return causa.esDelServidor() ? MENSAJE_GENERICO : causa.message
  }
  if (causa instanceof Error) {
    return causa.message
  }
  return MENSAJE_GENERICO
}

export function erroresDeError(causa: unknown): string[] {
  return causa instanceof ErrorDeValidacion ? causa.errores : [mensajeDeError(causa)]
}

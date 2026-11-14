// Formato de precios, fechas y horas para mostrar en pantalla.
// Solo se usa en la capa de vista: el dominio guarda numeros y texto crudo.

import { aFechaLocal } from './fecha.ts'
import { MINUTOS_POR_HORA, horaAMinutos } from './hora.ts'

const LOCALE = 'es-HN'

const LEMPIRAS = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'HNL',
  minimumFractionDigits: 2,
})

const FECHA_LARGA = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const HORA_CORTA = new Intl.DateTimeFormat(LOCALE, {
  hour: 'numeric',
  minute: '2-digit',
})

export function formatearLempiras(monto: number): string {
  return LEMPIRAS.format(monto)
}

export function formatearFecha(fecha: string): string {
  return FECHA_LARGA.format(aFechaLocal(fecha))
}

export function formatearHora(hora: string): string {
  const minutos = horaAMinutos(hora)
  const referencia = new Date(2000, 0, 1, Math.floor(minutos / MINUTOS_POR_HORA), minutos % MINUTOS_POR_HORA)
  return HORA_CORTA.format(referencia)
}

export function formatearDuracion(minutos: number): string {
  const horas = Math.floor(minutos / MINUTOS_POR_HORA)
  const restantes = minutos % MINUTOS_POR_HORA

  if (horas === 0) return `${restantes} min`
  if (restantes === 0) return `${horas} h`
  return `${horas} h ${restantes} min`
}

// Las horas se manejan como texto HH:MM en la interfaz y como minutos desde la
// medianoche para comparar (igual que en el backend: 9:30 = 570).

export const MINUTOS_POR_HORA = 60
export const MINUTOS_POR_DIA = 24 * MINUTOS_POR_HORA

const FORMATO_HORA = /^([01]\d|2[0-3]):([0-5]\d)$/

export function esHoraValida(hora: string): boolean {
  return FORMATO_HORA.test(hora)
}

export function horaAMinutos(hora: string): number {
  const partes = FORMATO_HORA.exec(hora)
  if (!partes) {
    throw new Error(`La hora "${hora}" debe tener el formato HH:MM.`)
  }
  return Number(partes[1]) * MINUTOS_POR_HORA + Number(partes[2])
}

export function minutosAHora(minutos: number): string {
  if (!Number.isInteger(minutos) || minutos < 0 || minutos >= MINUTOS_POR_DIA) {
    throw new Error('Los minutos del dia deben ser un entero entre 0 y 1439.')
  }
  const horas = Math.floor(minutos / MINUTOS_POR_HORA)
  return `${dosDigitos(horas)}:${dosDigitos(minutos % MINUTOS_POR_HORA)}`
}

function dosDigitos(valor: number): string {
  return String(valor).padStart(2, '0')
}

export function horaActual(): string {
  const ahora = new Date()
  return `${dosDigitos(ahora.getHours())}:${dosDigitos(ahora.getMinutes())}`
}

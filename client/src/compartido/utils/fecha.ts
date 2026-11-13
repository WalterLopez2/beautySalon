// Las fechas se manejan como texto YYYY-MM-DD para que coincidan con el backend
// y no dependan de la zona horaria del navegador.

const FORMATO_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/

export function esFechaValida(fecha: string): boolean {
  const partes = FORMATO_FECHA.exec(fecha)
  if (!partes) return false

  const [anio, mes, dia] = partes.slice(1).map(Number)
  const candidata = new Date(anio, mes - 1, dia)
  return (
    candidata.getFullYear() === anio &&
    candidata.getMonth() === mes - 1 &&
    candidata.getDate() === dia
  )
}

// Convierte YYYY-MM-DD a un Date en hora local. `new Date('2026-11-11')` se
// interpreta como UTC y en Honduras adelanta un dia; por eso se arma a mano.
export function aFechaLocal(fecha: string): Date {
  if (!esFechaValida(fecha)) {
    throw new Error(`La fecha "${fecha}" debe tener el formato YYYY-MM-DD.`)
  }
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

export function aFechaISO(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

export function hoy(): string {
  return aFechaISO(new Date())
}

export function esAnteriorAHoy(fecha: string): boolean {
  return fecha < hoy()
}

export function sumarDias(fecha: string, dias: number): string {
  const resultado = aFechaLocal(fecha)
  resultado.setDate(resultado.getDate() + dias)
  return aFechaISO(resultado)
}

const DIAS_POR_SEMANA = 7

// En el salon la semana va de lunes a domingo. `getDay()` cuenta desde el
// domingo (0), por eso se corre un dia.
export function inicioDeSemana(fecha: string): string {
  const diasDesdeElLunes = (aFechaLocal(fecha).getDay() + DIAS_POR_SEMANA - 1) % DIAS_POR_SEMANA
  return sumarDias(fecha, -diasDesdeElLunes)
}

export function finDeSemana(fecha: string): string {
  return sumarDias(inicioDeSemana(fecha), DIAS_POR_SEMANA - 1)
}

export function diasDeLaSemana(fecha: string): string[] {
  const lunes = inicioDeSemana(fecha)
  return Array.from({ length: DIAS_POR_SEMANA }, (_, dia) => sumarDias(lunes, dia))
}

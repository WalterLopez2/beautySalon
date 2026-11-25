// Los dias de la semana como los cuenta el salon: de lunes (1) a domingo (7),
// igual que ISO 8601 y el backend. Lo usan el panel (para editar el horario)
// y la pagina publica (para mostrarlo).

import { aFechaLocal } from '../utils/fecha.ts'

export interface DiaDeLaSemana {
  numero: number // 1 = lunes ... 7 = domingo
  nombre: string
}

export const DIAS_DE_LA_SEMANA: readonly DiaDeLaSemana[] = [
  { numero: 1, nombre: 'Lunes' },
  { numero: 2, nombre: 'Martes' },
  { numero: 3, nombre: 'Miercoles' },
  { numero: 4, nombre: 'Jueves' },
  { numero: 5, nombre: 'Viernes' },
  { numero: 6, nombre: 'Sabado' },
  { numero: 7, nombre: 'Domingo' },
]

const DOMINGO = 7

// "2026-11-24" (martes) -> 2. `getDay()` cuenta el domingo como 0.
export function numeroDelDia(fecha: string): number {
  return aFechaLocal(fecha).getDay() || DOMINGO
}

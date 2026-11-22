// Secciones del panel de la duena. El menu y el panel usan esta misma lista:
// un solo lugar para agregar o reordenar secciones.

export type IdDeSeccion = 'agenda' | 'clientas' | 'catalogo' | 'horario' | 'bloqueos' | 'ingresos' | 'salon'

export const SECCIONES_DEL_PANEL: ReadonlyArray<{ id: IdDeSeccion; texto: string }> = [
  { id: 'agenda', texto: 'Agenda' },
  { id: 'clientas', texto: 'Clientas' },
  { id: 'catalogo', texto: 'Servicios' },
  { id: 'horario', texto: 'Horario' },
  { id: 'bloqueos', texto: 'Dias libres' },
  { id: 'ingresos', texto: 'Ingresos' },
  { id: 'salon', texto: 'Mi salon' },
]

export const SECCION_INICIAL: IdDeSeccion = 'agenda'

// Identificadores de las secciones de la pagina publica. El menu enlaza a
// estos ids y cada seccion los usa: un solo lugar para no desincronizarlos.

export const SECCIONES = {
  servicios: 'servicios',
  reservar: 'reservar',
  misCitas: 'mis-citas',
} as const

export const ENLACES_DEL_MENU: ReadonlyArray<{ id: string; texto: string }> = [
  { id: SECCIONES.servicios, texto: 'Servicios' },
  { id: SECCIONES.reservar, texto: 'Reservar' },
  { id: SECCIONES.misCitas, texto: 'Mis citas' },
]

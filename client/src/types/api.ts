// Contratos de datos que viajan por HTTP (DTO = Data Transfer Object).
// Son la frontera con el backend: aqui no hay logica, solo la forma del JSON.
// Las clases del dominio se construyen a partir de estos tipos y nunca al reves.

export type EstadoCita = 'pendiente' | 'confirmada' | 'atendida' | 'cancelada'

export interface ServicioDTO {
  id: number
  nombre: string
  descripcion: string | null
  precio: number
  duracionMin: number
  categoria: string | null
}

export interface FranjaOcupadaDTO {
  inicio: string // HH:MM
  duracionMin: number
}

export interface AgendaDelDiaDTO {
  fecha: string // YYYY-MM-DD
  ocupadas: FranjaOcupadaDTO[]
}

export interface CitaDTO {
  id: number
  servicioId: number
  servicioNombre: string
  fecha: string // YYYY-MM-DD
  inicio: string // HH:MM
  duracionMin: number
  estado: EstadoCita
  precio: number
}

export interface ContactoDTO {
  nombre: string
  telefono: string
  correo: string | null
}

export interface SolicitudDeCitaDTO {
  servicioId: number
  fecha: string
  inicio: string
  contacto: ContactoDTO
}

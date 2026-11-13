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

// ----- Panel de la duena (rutas protegidas con token) -----

export interface CredencialesDTO {
  usuario: string
  contrasena: string
}

export interface SesionDTO {
  token: string
  nombre: string
  expiraEn: string // fecha y hora ISO 8601
}

export interface ClientaDTO {
  id: number
  nombre: string
  telefono: string
  correo: string | null
}

// La duena ve la misma cita que la clienta, mas los datos de quien la pidio.
export interface CitaDelPanelDTO extends CitaDTO {
  clienta: ClientaDTO
}

export interface CambioDeEstadoDTO {
  estado: EstadoCita
}

export interface HistorialDeClientaDTO {
  clienta: ClientaDTO
  citas: CitaDTO[]
}

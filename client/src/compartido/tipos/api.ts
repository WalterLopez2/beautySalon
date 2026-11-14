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

// El horario viene del servidor (lo configura la duena). Si `abierto` es
// false, el salon no atiende ese dia y apertura/cierre llegan en null.
export interface AgendaDelDiaDTO {
  fecha: string // YYYY-MM-DD
  abierto: boolean
  apertura: string | null // HH:MM
  cierre: string | null // HH:MM
  intervaloMin: number | null
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

// Respuesta al agendar: el codigo de consulta llega UNA sola vez. La clienta
// lo necesita (junto con su telefono) para ver sus citas despues.
export interface CitaAgendadaDTO extends CitaDTO {
  codigoDeConsulta: string
}

export interface ConsultaDeHistorialDTO {
  telefono: string
  codigo: string
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

// Respuesta de GET /panel/sesion: el token sigue sirviendo.
export interface SesionVigenteDTO {
  nombre: string
  expiraEn: string
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

// Lo que la duena llena en el formulario de un servicio.
export interface DatosServicioDTO {
  nombre: string
  descripcion: string | null
  precio: number
  duracionMin: number
  categoria: string | null
}

// En el panel se ven tambien los servicios pausados.
export interface ServicioDelPanelDTO extends DatosServicioDTO {
  id: number
  activo: boolean
}

export interface DiaDeAtencionDTO {
  diaSemana: number // 1 = lunes ... 7 = domingo
  apertura: string // HH:MM
  cierre: string // HH:MM
}

export interface HorarioSemanalDTO {
  configurado: boolean // false hasta que la duena guarda su horario por primera vez
  zonaHoraria: string | null
  intervaloMin: number | null
  maxCitasPendientes: number | null // citas por venir que puede tener una misma clienta
  dias: DiaDeAtencionDTO[] // un dia que no esta en la lista = cerrado
}

export interface GuardarHorarioDTO {
  zonaHoraria: string
  intervaloMin: number
  maxCitasPendientes: number
  dias: DiaDeAtencionDTO[]
}

// Dia libre (sin horas) o tramo bloqueado (con horas) en un rango de fechas.
export interface BloqueoDTO {
  id: number
  desde: string // YYYY-MM-DD
  hasta: string // YYYY-MM-DD, inclusive
  inicio: string | null // HH:MM; null junto con `fin` = dia completo
  fin: string | null
  motivo: string | null
}

export type CrearBloqueoDTO = Omit<BloqueoDTO, 'id'>

// Las citas que ya estaban en ese tramo no se cancelan solas: la duena decide.
export interface BloqueoCreadoDTO {
  bloqueo: BloqueoDTO
  citasAfectadas: CitaDelPanelDTO[]
}

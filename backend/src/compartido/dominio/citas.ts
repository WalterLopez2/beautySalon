// Logica de citas del salon. Las horas se manejan en minutos desde la
// medianoche (por ejemplo 9:30 = 570) para compararlas facil.

export type EstadoCita = 'pendiente' | 'confirmada' | 'atendida' | 'cancelada' | 'vencida';

// Una solicitud que la duena no confirma en este plazo libera su hora. Debe
// coincidir con `Cita.ts` del frontend.
export const HORAS_PARA_CONFIRMAR = 24;

const ESTADOS_QUE_LIBERAN: readonly EstadoCita[] = ['cancelada', 'vencida'];

export interface Cita {
  fecha: string; // formato YYYY-MM-DD
  inicio: string; // formato HH:MM
  duracionMin: number;
  estado: EstadoCita;
  precio: number;
}

export const HORA_NO_DISPONIBLE = 'Esa hora ya no esta disponible. Elegi otra, por favor.';

export function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

export interface Franja {
  inicioMin: number;
  duracionMin: number;
}

// Dos franjas se cruzan si cada una empieza antes de que la otra termine.
export function franjasSeCruzan(a: Franja, b: Franja): boolean {
  return a.inicioMin < b.inicioMin + b.duracionMin && b.inicioMin < a.inicioMin + a.duracionMin;
}

export function citasSeCruzan(a: Cita, b: Cita): boolean {
  if (a.fecha !== b.fecha) return false;
  return franjasSeCruzan(aFranja(a), aFranja(b));
}

function aFranja(cita: Cita): Franja {
  return { inicioMin: horaAMinutos(cita.inicio), duracionMin: cita.duracionMin };
}

// Las citas canceladas y las vencidas liberan el horario.
export function horarioDisponible(nueva: Cita, existentes: Cita[]): boolean {
  return !existentes
    .filter((c) => !ESTADOS_QUE_LIBERAN.includes(c.estado))
    .some((c) => citasSeCruzan(nueva, c));
}

// Solo cuentan como ingreso las citas ya atendidas.
export function totalIngresos(citas: Cita[]): number {
  return citas
    .filter((c) => c.estado === 'atendida')
    .reduce((suma, c) => suma + c.precio, 0);
}

export const ESTADOS_CITA: readonly EstadoCita[] = ['pendiente', 'confirmada', 'atendida', 'cancelada', 'vencida'];

export function esEstadoCita(valor: unknown): valor is EstadoCita {
  return ESTADOS_CITA.includes(valor as EstadoCita);
}

// Ciclo de vida de una cita (el mismo que aplica el frontend).
// "atendida", "cancelada" y "vencida" son finales. A "vencida" solo pasa el
// sistema (`VencerCitasPendientes`), nadie la pone a mano.
const TRANSICIONES_PERMITIDAS: Record<EstadoCita, readonly EstadoCita[]> = {
  pendiente: ['confirmada', 'cancelada'],
  confirmada: ['atendida', 'cancelada'],
  atendida: [],
  cancelada: [],
  vencida: [],
};

export function sePuedeCambiarDeEstado(desde: EstadoCita, hacia: EstadoCita): boolean {
  return TRANSICIONES_PERMITIDAS[desde].includes(hacia);
}

export function minutosAHora(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  return `${String(horas).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
}

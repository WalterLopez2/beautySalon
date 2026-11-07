// Logica de citas del salon. Las horas se manejan en minutos desde la
// medianoche (por ejemplo 9:30 = 570) para compararlas facil.

export type EstadoCita = 'pendiente' | 'confirmada' | 'atendida' | 'cancelada';

export interface Cita {
  fecha: string; // formato YYYY-MM-DD
  inicio: string; // formato HH:MM
  duracionMin: number;
  estado: EstadoCita;
  precio: number;
}

export function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

// Dos citas se cruzan si cada una empieza antes de que la otra termine.
export function citasSeCruzan(a: Cita, b: Cita): boolean {
  if (a.fecha !== b.fecha) return false;
  const inicioA = horaAMinutos(a.inicio);
  const finA = inicioA + a.duracionMin;
  const inicioB = horaAMinutos(b.inicio);
  const finB = inicioB + b.duracionMin;
  return inicioA < finB && inicioB < finA;
}

// Las citas canceladas liberan el horario.
export function horarioDisponible(nueva: Cita, existentes: Cita[]): boolean {
  return !existentes
    .filter((c) => c.estado !== 'cancelada')
    .some((c) => citasSeCruzan(nueva, c));
}

// Solo cuentan como ingreso las citas ya atendidas.
export function totalIngresos(citas: Cita[]): number {
  return citas
    .filter((c) => c.estado === 'atendida')
    .reduce((suma, c) => suma + c.precio, 0);
}

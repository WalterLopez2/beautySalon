// Horario de atencion y "hora del salon". El servidor puede correr en otra
// zona horaria (por ejemplo UTC en la nube); las reglas siempre usan la hora
// de Honduras para decidir que es "hoy" y que ya paso.

import { horaAMinutos } from './citas';

export const ZONA_HORARIA_DEL_SALON = 'America/Tegucigalpa';

// Igual que `HORARIO_DEL_SALON` del frontend.
export const HORARIO_DE_ATENCION = {
  aperturaMin: horaAMinutos('09:00'),
  cierreMin: horaAMinutos('18:00'),
} as const;

export function cabeEnElHorario(inicioMin: number, duracionMin: number): boolean {
  return (
    inicioMin >= HORARIO_DE_ATENCION.aperturaMin &&
    inicioMin + duracionMin <= HORARIO_DE_ATENCION.cierreMin
  );
}

export interface MomentoDelSalon {
  fecha: string; // YYYY-MM-DD
  minuto: number; // minutos desde la medianoche
}

const FORMATO_DEL_SALON = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_HORARIA_DEL_SALON,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function momentoDelSalon(ahora: Date = new Date()): MomentoDelSalon {
  const partes = Object.fromEntries(
    FORMATO_DEL_SALON.formatToParts(ahora).map((parte) => [parte.type, parte.value]),
  );
  return {
    fecha: `${partes.year}-${partes.month}-${partes.day}`,
    minuto: Number(partes.hour) * 60 + Number(partes.minute),
  };
}

// Una cita ya paso si es de un dia anterior, o de hoy a una hora que ya llego.
export function yaPaso(fecha: string, inicioMin: number, ahora: MomentoDelSalon): boolean {
  return fecha < ahora.fecha || (fecha === ahora.fecha && inicioMin <= ahora.minuto);
}

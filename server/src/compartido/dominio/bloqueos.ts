// Dias libres y horas bloqueadas que define la duena.
//
// Un bloqueo cubre un rango de fechas [desde, hasta]:
//   - sin horas: cierra esos dias completos (vacaciones, feriados).
//   - con horas: bloquea ese tramo en cada dia del rango (almuerzo, un tramite).

import { DatosInvalidos } from '../errores';
import { franjasSeCruzan, horaAMinutos, type Franja } from './citas';
import { diasEntre } from './fechas';

export interface DatosBloqueo {
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD, inclusive
  inicioMin: number | null; // null en ambos = dia completo
  finMin: number | null;
  motivo: string | null; // solo lo ve la duena
}

export interface Bloqueo extends DatosBloqueo {
  id: number;
}

// Lo minimo de una cita para saber si un bloqueo la afecta.
export interface CitaEnElCalendario {
  fecha: string;
  inicio: string; // HH:MM
  duracionMin: number;
}

// Un ano alcanza para vacaciones largas y evita rangos absurdos por error.
export const DIAS_MAXIMOS_POR_BLOQUEO = 366;

export function esDeDiaCompleto(bloqueo: DatosBloqueo): boolean {
  return bloqueo.inicioMin === null || bloqueo.finMin === null;
}

export function cubreLaFecha(bloqueo: DatosBloqueo, fecha: string): boolean {
  return bloqueo.desde <= fecha && fecha <= bloqueo.hasta;
}

// ----- Reglas que usa el agendamiento (bloqueos de UN dia) -----

export function cierraElDia(bloqueosDelDia: readonly DatosBloqueo[]): boolean {
  return bloqueosDelDia.some(esDeDiaCompleto);
}

// Los tramos bloqueados se tratan igual que horas ocupadas.
export function franjasBloqueadas(bloqueosDelDia: readonly DatosBloqueo[]): Franja[] {
  return bloqueosDelDia
    .filter((bloqueo) => !esDeDiaCompleto(bloqueo))
    .map((bloqueo) => ({
      inicioMin: bloqueo.inicioMin as number,
      duracionMin: (bloqueo.finMin as number) - (bloqueo.inicioMin as number),
    }));
}

// ----- Reglas que usa la duena al crear un bloqueo -----

export function afectaA(bloqueo: DatosBloqueo, cita: CitaEnElCalendario): boolean {
  if (!cubreLaFecha(bloqueo, cita.fecha)) return false;
  if (esDeDiaCompleto(bloqueo)) return true;

  const franjaDeLaCita = { inicioMin: horaAMinutos(cita.inicio), duracionMin: cita.duracionMin };
  return franjasSeCruzan(franjasBloqueadas([bloqueo])[0], franjaDeLaCita);
}

export function validarBloqueo(bloqueo: DatosBloqueo): void {
  const errores: string[] = [];
  const dias = diasEntre(bloqueo.desde, bloqueo.hasta);

  if (dias < 0) {
    errores.push('La fecha "hasta" debe ser igual o posterior a "desde".');
  } else if (dias >= DIAS_MAXIMOS_POR_BLOQUEO) {
    errores.push(`Un bloqueo puede cubrir como maximo ${DIAS_MAXIMOS_POR_BLOQUEO} dias.`);
  }

  const soloUnaHora = (bloqueo.inicioMin === null) !== (bloqueo.finMin === null);
  if (soloUnaHora) {
    errores.push('Para bloquear horas indica inicio y fin; para cerrar el dia completo, ninguna.');
  } else if (!esDeDiaCompleto(bloqueo) && (bloqueo.inicioMin as number) >= (bloqueo.finMin as number)) {
    errores.push('La hora de inicio del bloqueo debe ser antes de la hora de fin.');
  }

  if (errores.length > 0) {
    throw new DatosInvalidos(errores);
  }
}

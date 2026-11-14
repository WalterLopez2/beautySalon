// Reglas de horario. No hay ningun horario fijo en el codigo: la duena
// configura sus dias, horas, intervalo de turnos y zona horaria desde el
// panel, y estas funciones solo aplican lo que ella decidio.

import { DatosInvalidos } from '../errores';
import { horaAMinutos, minutosAHora } from './citas';

export interface ConfiguracionDelSalon {
  zonaHoraria: string; // IANA, por ejemplo "America/Tegucigalpa"
  intervaloMin: number; // cada cuanto se ofrece una hora de inicio
  // Cuantas citas por venir (pendientes o confirmadas) puede tener una misma
  // clienta. Evita que alguien acapare la agenda.
  maxCitasPendientes: number;
}

export interface HorarioDelDia {
  aperturaMin: number;
  cierreMin: number;
}

// 1 = lunes ... 7 = domingo (ISO 8601). Un dia sin horario esta cerrado.
export interface HorarioDeUnDia extends HorarioDelDia {
  diaSemana: number;
}

export interface HorarioSemanal {
  configuracion: ConfiguracionDelSalon;
  dias: HorarioDeUnDia[];
}

export interface MomentoDelSalon {
  fecha: string; // YYYY-MM-DD
  minuto: number; // minutos desde la medianoche
}

export const INTERVALO_MINIMO = 5;
export const INTERVALO_MAXIMO = 240;
export const MAX_CITAS_PENDIENTES_TOPE = 50;
const DIAS_POR_SEMANA = 7;

// ----- Reglas que usa el agendamiento -----

export function cabeEnElHorario(inicioMin: number, duracionMin: number, horario: HorarioDelDia): boolean {
  return inicioMin >= horario.aperturaMin && inicioMin + duracionMin <= horario.cierreMin;
}

// Las citas empiezan en los turnos que ofrece el salon: apertura, apertura +
// intervalo, etc. Asi la agenda no queda con huecos imposibles de llenar.
export function respetaElIntervalo(inicioMin: number, horario: HorarioDelDia, intervaloMin: number): boolean {
  return (inicioMin - horario.aperturaMin) % intervaloMin === 0;
}

export function diaDeLaSemana(fecha: string): number {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const domingoEsCero = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();
  return domingoEsCero === 0 ? DIAS_POR_SEMANA : domingoEsCero;
}

// "Hoy" y "ahora" en la zona del salon, aunque el servidor este en otra.
export function momentoEn(zonaHoraria: string, ahora: Date = new Date()): MomentoDelSalon {
  const formato = new Intl.DateTimeFormat('en-CA', {
    timeZone: zonaHoraria,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const partes = Object.fromEntries(formato.formatToParts(ahora).map((parte) => [parte.type, parte.value]));
  return {
    fecha: `${partes.year}-${partes.month}-${partes.day}`,
    minuto: Number(partes.hour) * 60 + Number(partes.minute),
  };
}

export function yaPaso(fecha: string, inicioMin: number, ahora: MomentoDelSalon): boolean {
  return fecha < ahora.fecha || (fecha === ahora.fecha && inicioMin <= ahora.minuto);
}

// ----- Reglas que usa la duena al guardar su horario -----

export function esZonaHorariaValida(zonaHoraria: string): boolean {
  try {
    new Intl.DateTimeFormat('es', { timeZone: zonaHoraria });
    return true;
  } catch {
    return false;
  }
}

// Revisa todo el horario y junta todos los problemas en un solo error.
export function validarHorarioSemanal({ configuracion, dias }: HorarioSemanal): void {
  const errores: string[] = [];

  if (!esZonaHorariaValida(configuracion.zonaHoraria)) {
    errores.push(`"${configuracion.zonaHoraria}" no es una zona horaria valida.`);
  }
  if (configuracion.intervaloMin < INTERVALO_MINIMO || configuracion.intervaloMin > INTERVALO_MAXIMO) {
    errores.push(`El intervalo entre turnos debe estar entre ${INTERVALO_MINIMO} y ${INTERVALO_MAXIMO} minutos.`);
  }
  if (configuracion.maxCitasPendientes < 1 || configuracion.maxCitasPendientes > MAX_CITAS_PENDIENTES_TOPE) {
    errores.push(`El maximo de citas pendientes por clienta debe estar entre 1 y ${MAX_CITAS_PENDIENTES_TOPE}.`);
  }

  const vistos = new Set<number>();
  for (const dia of dias) {
    if (!Number.isInteger(dia.diaSemana) || dia.diaSemana < 1 || dia.diaSemana > DIAS_POR_SEMANA) {
      errores.push('Cada dia debe ser un numero del 1 (lunes) al 7 (domingo).');
    } else if (vistos.has(dia.diaSemana)) {
      errores.push(`El dia ${dia.diaSemana} esta repetido.`);
    }
    if (dia.aperturaMin >= dia.cierreMin) {
      errores.push(
        `El dia ${dia.diaSemana}: la apertura (${minutosAHora(dia.aperturaMin)}) debe ser antes del cierre (${minutosAHora(dia.cierreMin)}).`,
      );
    }
    vistos.add(dia.diaSemana);
  }

  if (errores.length > 0) {
    throw new DatosInvalidos(errores);
  }
}

export function aHorarioDeUnDia(diaSemana: number, apertura: string, cierre: string): HorarioDeUnDia {
  return { diaSemana, aperturaMin: horaAMinutos(apertura), cierreMin: horaAMinutos(cierre) };
}

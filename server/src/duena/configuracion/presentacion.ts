// JSON de la configuracion del salon para el panel. Las horas viajan como
// "HH:MM", igual que en el resto de la API.

import { minutosAHora } from '../../compartido/dominio/citas';
import type { HorarioSemanal } from '../../compartido/dominio/horario';

export function aHorarioSemanalDTO(horario: HorarioSemanal | null) {
  return {
    configurado: horario !== null,
    zonaHoraria: horario?.configuracion.zonaHoraria ?? null,
    intervaloMin: horario?.configuracion.intervaloMin ?? null,
    maxCitasPendientes: horario?.configuracion.maxCitasPendientes ?? null,
    dias: (horario?.dias ?? []).map((dia) => ({
      diaSemana: dia.diaSemana,
      apertura: minutosAHora(dia.aperturaMin),
      cierre: minutosAHora(dia.cierreMin),
    })),
  };
}

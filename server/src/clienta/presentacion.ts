// Forma del JSON que recibe la pagina publica. La clienta NUNCA recibe datos
// de otras personas: la agenda solo dice que horas estan ocupadas, no por quien.

import type { FranjaOcupada } from '../compartido/citas/repositorioCitas';
import { minutosAHora } from '../compartido/dominio/citas';
import type { ConfiguracionDelSalon, HorarioDelDia } from '../compartido/dominio/horario';

export interface AgendaDelDiaPublica {
  fecha: string;
  configuracion: ConfiguracionDelSalon | null;
  horario: HorarioDelDia | null; // null = el salon no abre ese dia
  ocupadas: FranjaOcupada[];
}

// Con todo lo necesario para que el frontend calcule las horas libres sin
// conocer ningun horario de antemano.
export function aAgendaPublica({ fecha, configuracion, horario, ocupadas }: AgendaDelDiaPublica) {
  const abierto = configuracion !== null && horario !== null;

  return {
    fecha,
    abierto,
    apertura: abierto ? minutosAHora(horario.aperturaMin) : null,
    cierre: abierto ? minutosAHora(horario.cierreMin) : null,
    intervaloMin: configuracion?.intervaloMin ?? null,
    ocupadas: ocupadas.map((franja) => ({
      inicio: minutosAHora(franja.inicioMin),
      duracionMin: franja.duracionMin,
    })),
  };
}

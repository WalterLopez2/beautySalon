// Forma del JSON que recibe la pagina publica. La clienta NUNCA recibe datos
// de otras personas: la agenda solo dice que horas estan ocupadas, no por quien.

import type { FranjaOcupada } from '../compartido/citas/repositorioCitas';
import { minutosAHora } from '../compartido/dominio/citas';

export function aAgendaPublica(fecha: string, ocupadas: FranjaOcupada[]) {
  return {
    fecha,
    ocupadas: ocupadas.map((franja) => ({
      inicio: minutosAHora(franja.inicioMin),
      duracionMin: franja.duracionMin,
    })),
  };
}

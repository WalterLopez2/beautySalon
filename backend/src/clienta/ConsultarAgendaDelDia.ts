// Caso de uso: que horas puede ver la clienta para un dia. Junta el horario de
// la duena, sus bloqueos y las citas ya tomadas en una sola respuesta.
//
// Los bloqueos se muestran como horas ocupadas, sin motivo: la clienta no
// necesita saber por que la duena no atiende a esa hora.

import type { FranjaOcupada } from '../compartido/citas/repositorioCitas';
import { cierraElDia, franjasBloqueadas, type Bloqueo } from '../compartido/dominio/bloqueos';
import { diaDeLaSemana, type ConfiguracionDelSalon, type HorarioDelDia } from '../compartido/dominio/horario';
import type { AgendaDelDiaPublica } from './presentacion';

export interface FuentesDeLaAgenda {
  horario: {
    obtenerConfiguracion(): Promise<ConfiguracionDelSalon | null>;
    horarioDelDia(diaSemana: number): Promise<HorarioDelDia | null>;
  };
  bloqueos: { delDia(fecha: string): Promise<Bloqueo[]> };
  citas: { ocupadasEl(fecha: string): Promise<FranjaOcupada[]> };
}

export class ConsultarAgendaDelDia {
  private readonly fuentes: FuentesDeLaAgenda;

  constructor(fuentes: FuentesDeLaAgenda) {
    this.fuentes = fuentes;
  }

  async ejecutar(fecha: string): Promise<AgendaDelDiaPublica> {
    const { horario, bloqueos, citas } = this.fuentes;
    const [configuracion, horarioDelDia, bloqueosDelDia, ocupadas] = await Promise.all([
      horario.obtenerConfiguracion(),
      horario.horarioDelDia(diaDeLaSemana(fecha)),
      bloqueos.delDia(fecha),
      citas.ocupadasEl(fecha),
    ]);

    const diaCerrado = cierraElDia(bloqueosDelDia);
    return {
      fecha,
      configuracion,
      horario: diaCerrado ? null : horarioDelDia,
      ocupadas: diaCerrado ? [] : [...ocupadas, ...franjasBloqueadas(bloqueosDelDia)],
    };
  }
}

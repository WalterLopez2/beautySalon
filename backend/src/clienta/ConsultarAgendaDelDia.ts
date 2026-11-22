// Caso de uso: que horas puede ver la clienta para un dia. Junta el horario de
// la duena, sus bloqueos y las citas ya tomadas en una sola respuesta.
//
// Los bloqueos se muestran como horas ocupadas, sin motivo: la clienta no
// necesita saber por que la duena no atiende a esa hora.

import type { FranjaOcupada } from '../compartido/citas/repositorioCitas';
import { cierraElDia, franjasBloqueadas, type Bloqueo } from '../compartido/dominio/bloqueos';
import {
  diaDeLaSemana,
  esDemasiadoLejos,
  momentoEn,
  type ConfiguracionDelSalon,
  type HorarioDelDia,
} from '../compartido/dominio/horario';
import type { AgendaDelDiaPublica } from './presentacion';

const ULTIMO_MINUTO_DEL_DIA = 24 * 60 - 1;

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
  private readonly reloj: () => Date;

  constructor(fuentes: FuentesDeLaAgenda, reloj: () => Date = () => new Date()) {
    this.fuentes = fuentes;
    this.reloj = reloj;
  }

  async ejecutar(fecha: string): Promise<AgendaDelDiaPublica> {
    const { horario, bloqueos, citas } = this.fuentes;
    const [configuracion, horarioDelDia, bloqueosDelDia, ocupadas] = await Promise.all([
      horario.obtenerConfiguracion(),
      horario.horarioDelDia(diaDeLaSemana(fecha)),
      bloqueos.delDia(fecha),
      citas.ocupadasEl(fecha),
    ]);

    const ahora = configuracion && momentoEn(configuracion.zonaHoraria, this.reloj());
    const fueraDelPlazo =
      configuracion !== null &&
      ahora !== null &&
      (fecha < ahora.fecha || esDemasiadoLejos(fecha, ahora, configuracion.diasDeAnticipacion));
    const diaCerrado = fueraDelPlazo || cierraElDia(bloqueosDelDia);

    return {
      fecha,
      configuracion,
      // La hora en curso ya empezo: se ofrece desde el minuto siguiente.
      desdeMin: ahora?.fecha === fecha ? Math.min(ahora.minuto + 1, ULTIMO_MINUTO_DEL_DIA) : null,
      horario: diaCerrado ? null : horarioDelDia,
      ocupadas: diaCerrado ? [] : [...ocupadas, ...franjasBloqueadas(bloqueosDelDia)],
    };
  }
}

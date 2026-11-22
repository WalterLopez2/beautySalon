// Caso de uso del sistema: las solicitudes que nadie confirmo a tiempo liberan
// su hora. Asi una reserva falsa no ocupa la agenda para siempre. El plazo lo
// pone la duena. Lo corre index.ts cada minuto.

import { momentoEn, type ConfiguracionDelSalon, type MomentoDelSalon } from '../dominio/horario';

const MILISEGUNDOS_POR_HORA = 60 * 60 * 1000;

export interface DependenciasDeVencimiento {
  citas: { vencerPendientes(pedidasAntesDe: Date, ahora: MomentoDelSalon): Promise<number> };
  horario: { obtenerConfiguracion(): Promise<ConfiguracionDelSalon | null> };
}

export class VencerCitasPendientes {
  private readonly dependencias: DependenciasDeVencimiento;
  private readonly reloj: () => Date;

  constructor(dependencias: DependenciasDeVencimiento, reloj: () => Date = () => new Date()) {
    this.dependencias = dependencias;
    this.reloj = reloj;
  }

  // Devuelve cuantas vencio.
  async ejecutar(): Promise<number> {
    const { citas, horario } = this.dependencias;
    const configuracion = await horario.obtenerConfiguracion();
    if (!configuracion) return 0;

    const ahora = this.reloj();
    const pedidasAntesDe = new Date(ahora.getTime() - configuracion.horasParaConfirmar * MILISEGUNDOS_POR_HORA);
    return citas.vencerPendientes(pedidasAntesDe, momentoEn(configuracion.zonaHoraria, ahora));
  }
}

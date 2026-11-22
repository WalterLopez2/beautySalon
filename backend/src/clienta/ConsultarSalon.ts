// Caso de uso: lo que la pagina publica necesita saber del salon al abrirse.
// "Hoy" lo dice el servidor con la zona de la duena, no el reloj del celular.

import { sumarDias } from '../compartido/dominio/fechas';
import { momentoEn, type HorarioSemanal } from '../compartido/dominio/horario';
import type { InformacionDelSalon } from '../compartido/dominio/informacionDelSalon';

export interface SalonPublico {
  informacion: InformacionDelSalon | null;
  // null = no recibe reservas (sin configurar o sin ningun dia abierto).
  reservas: { hoy: string; ultimaFecha: string; horasParaConfirmar: number } | null;
}

export interface FuentesDelSalon {
  salon: { obtener(): Promise<InformacionDelSalon | null> };
  horario: { obtenerSemanal(): Promise<HorarioSemanal | null> };
}

export class ConsultarSalon {
  private readonly fuentes: FuentesDelSalon;
  private readonly reloj: () => Date;

  constructor(fuentes: FuentesDelSalon, reloj: () => Date = () => new Date()) {
    this.fuentes = fuentes;
    this.reloj = reloj;
  }

  async ejecutar(): Promise<SalonPublico> {
    const { salon, horario } = this.fuentes;
    const [informacion, semanal] = await Promise.all([salon.obtener(), horario.obtenerSemanal()]);
    if (!semanal || semanal.dias.length === 0) return { informacion, reservas: null };

    const { zonaHoraria, diasDeAnticipacion, horasParaConfirmar } = semanal.configuracion;
    const hoy = momentoEn(zonaHoraria, this.reloj()).fecha;
    return { informacion, reservas: { hoy, ultimaFecha: sumarDias(hoy, diasDeAnticipacion), horasParaConfirmar } };
  }
}

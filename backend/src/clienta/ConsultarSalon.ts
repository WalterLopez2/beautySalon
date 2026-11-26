// Caso de uso: lo que la pagina publica necesita saber del salon al abrirse.
// "Hoy" lo dice el servidor con la zona de la duena, no el reloj del celular.

import { minutosAHora } from '../compartido/dominio/citas';
import { sumarDias } from '../compartido/dominio/fechas';
import { momentoEn, type HorarioDeUnDia, type HorarioSemanal } from '../compartido/dominio/horario';
import type { InformacionDelSalon } from '../compartido/dominio/informacionDelSalon';

// Un dia en que el salon abre, con sus horas. Es informacion publica: la
// misma que la duena pondria en la puerta del local.
export interface DiaDeAtencionPublico {
  diaSemana: number; // 1 = lunes ... 7 = domingo
  apertura: string; // HH:MM
  cierre: string; // HH:MM
}

export interface SalonPublico {
  informacion: InformacionDelSalon | null;
  // null = no recibe reservas (sin configurar o sin ningun dia abierto).
  // `hoy` y `ahora` son la fecha y la hora del salon, no las del celular.
  reservas: { hoy: string; ahora: string; ultimaFecha: string; horasParaConfirmar: number } | null;
  // Solo los dias que abre, de lunes a domingo. Vacio = sin horario.
  diasDeAtencion: DiaDeAtencionPublico[];
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
    if (!semanal || semanal.dias.length === 0) return { informacion, reservas: null, diasDeAtencion: [] };

    const { zonaHoraria, diasDeAnticipacion, horasParaConfirmar } = semanal.configuracion;
    const { fecha: hoy, minuto } = momentoEn(zonaHoraria, this.reloj());
    return {
      informacion,
      reservas: {
        hoy,
        ahora: minutosAHora(minuto),
        ultimaFecha: sumarDias(hoy, diasDeAnticipacion),
        horasParaConfirmar,
      },
      diasDeAtencion: aDiasPublicos(semanal.dias),
    };
  }
}

function aDiasPublicos(dias: readonly HorarioDeUnDia[]): DiaDeAtencionPublico[] {
  return [...dias]
    .sort((a, b) => a.diaSemana - b.diaSemana)
    .map(({ diaSemana, aperturaMin, cierreMin }) => ({
      diaSemana,
      apertura: minutosAHora(aperturaMin),
      cierre: minutosAHora(cierreMin),
    }));
}

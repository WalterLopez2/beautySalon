// Caso de uso: la duena marca dias libres u horas en que no atiende.
//
// Las citas que ya estaban agendadas en ese tramo NO se cancelan solas: se
// devuelven como "afectadas" para que la duena decida (avisar a la clienta,
// reprogramar o cancelar). Cancelar sin avisar seria peor que no bloquear.

import type { CitaRegistrada } from '../../compartido/citas/repositorioCitas';
import { afectaA, validarBloqueo, type Bloqueo, type DatosBloqueo } from '../../compartido/dominio/bloqueos';

export interface DependenciasDeCrearBloqueo {
  bloqueos: { crear(datos: DatosBloqueo): Promise<Bloqueo> };
  citas: { listarEntre(desde: string, hasta: string): Promise<CitaRegistrada[]> };
}

export interface BloqueoCreado {
  bloqueo: Bloqueo;
  citasAfectadas: CitaRegistrada[];
}

export class CrearBloqueo {
  private readonly bloqueos: DependenciasDeCrearBloqueo['bloqueos'];
  private readonly citas: DependenciasDeCrearBloqueo['citas'];

  constructor({ bloqueos, citas }: DependenciasDeCrearBloqueo) {
    this.bloqueos = bloqueos;
    this.citas = citas;
  }

  async ejecutar(datos: DatosBloqueo): Promise<BloqueoCreado> {
    validarBloqueo(datos);

    const bloqueo = await this.bloqueos.crear(datos);
    const enElRango = await this.citas.listarEntre(bloqueo.desde, bloqueo.hasta);
    const citasAfectadas = enElRango.filter((cita) => sigueVigente(cita) && afectaA(bloqueo, cita));

    return { bloqueo, citasAfectadas };
  }
}

// Las atendidas ya pasaron y las canceladas ya no ocupan lugar.
function sigueVigente(cita: CitaRegistrada): boolean {
  return cita.estado === 'pendiente' || cita.estado === 'confirmada';
}

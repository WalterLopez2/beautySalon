// Caso de uso: la duena confirma, cancela o marca como atendida una cita.

import type { CitaRegistrada } from '../compartido/citas/repositorioCitas';
import { sePuedeCambiarDeEstado, type EstadoCita } from '../compartido/dominio/citas';
import { Conflicto, NoEncontrado } from '../compartido/errores';

export interface CitasParaCambiarEstado {
  obtenerPorId(id: number): Promise<CitaRegistrada | null>;
  cambiarEstado(id: number, desde: EstadoCita, hacia: EstadoCita): Promise<boolean>;
}

export class CambiarEstadoDeCita {
  private readonly citas: CitasParaCambiarEstado;

  constructor(citas: CitasParaCambiarEstado) {
    this.citas = citas;
  }

  async ejecutar(citaId: number, nuevoEstado: EstadoCita): Promise<CitaRegistrada> {
    const cita = await this.citas.obtenerPorId(citaId);
    if (!cita) {
      throw new NoEncontrado('La cita no existe.');
    }
    if (!sePuedeCambiarDeEstado(cita.estado, nuevoEstado)) {
      throw new Conflicto(`Una cita ${cita.estado} no se puede pasar a ${nuevoEstado}.`);
    }

    const cambiada = await this.citas.cambiarEstado(cita.id, cita.estado, nuevoEstado);
    if (!cambiada) {
      throw new Conflicto('La cita cambio mientras tanto. Recarga la agenda e intenta de nuevo.');
    }
    return { ...cita, estado: nuevoEstado };
  }
}

// Caso de uso: la duena define en que dias y horas atiende, cada cuanto
// ofrece turnos y en que zona horaria esta el salon.
//
// Se valida todo antes de tocar la base, y se guarda en una transaccion:
// nunca queda un horario a medias.

import { validarHorarioSemanal, type HorarioSemanal } from '../../compartido/dominio/horario';

export interface GuardadorDeHorario {
  guardarSemanal(horario: HorarioSemanal): Promise<void>;
}

export type EjecutarEnTransaccion = <T>(trabajo: (horario: GuardadorDeHorario) => Promise<T>) => Promise<T>;

export class GuardarHorario {
  private readonly enTransaccion: EjecutarEnTransaccion;

  constructor(enTransaccion: EjecutarEnTransaccion) {
    this.enTransaccion = enTransaccion;
  }

  async ejecutar(horario: HorarioSemanal): Promise<HorarioSemanal> {
    validarHorarioSemanal(horario);

    const ordenado = { ...horario, dias: [...horario.dias].sort((a, b) => a.diaSemana - b.diaSemana) };
    await this.enTransaccion((repositorio) => repositorio.guardarSemanal(ordenado));
    return ordenado;
  }
}

import { describe, expect, it } from 'vitest';
import { cabeEnElHorario, momentoDelSalon, yaPaso } from '../../src/compartido/dominio/horario';

describe('horario del salon', () => {
  it('usa la hora de Honduras aunque el servidor este en UTC', () => {
    // 02:30 UTC del 11 de noviembre = 20:30 del 10 de noviembre en Honduras (UTC-6).
    const momento = momentoDelSalon(new Date('2026-11-11T02:30:00Z'));

    expect(momento).toEqual({ fecha: '2026-11-10', minuto: 20 * 60 + 30 });
  });

  it('una cita cabe si empieza al abrir y termina justo al cerrar', () => {
    expect(cabeEnElHorario(9 * 60, 9 * 60)).toBe(true);
    expect(cabeEnElHorario(8 * 60 + 30, 60)).toBe(false);
    expect(cabeEnElHorario(17 * 60 + 30, 60)).toBe(false);
  });

  it('sabe si una cita ya paso', () => {
    const ahora = { fecha: '2026-11-10', minuto: 10 * 60 };

    expect(yaPaso('2026-11-09', 15 * 60, ahora)).toBe(true);
    expect(yaPaso('2026-11-10', 10 * 60, ahora)).toBe(true);
    expect(yaPaso('2026-11-10', 10 * 60 + 30, ahora)).toBe(false);
    expect(yaPaso('2026-11-11', 9 * 60, ahora)).toBe(false);
  });
});

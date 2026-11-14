import { describe, expect, it } from 'vitest';
import {
  cabeEnElHorario,
  diaDeLaSemana,
  momentoEn,
  respetaElIntervalo,
  validarHorarioSemanal,
  yaPaso,
  type HorarioSemanal,
} from '../../src/compartido/dominio/horario';
import { DatosInvalidos } from '../../src/compartido/errores';

const nueveASeis = { aperturaMin: 9 * 60, cierreMin: 18 * 60 };

describe('horario del salon', () => {
  it('calcula la hora en la zona del salon aunque el servidor este en UTC', () => {
    // 02:30 UTC del 11 de noviembre = 20:30 del 10 de noviembre en Honduras (UTC-6).
    const momento = momentoEn('America/Tegucigalpa', new Date('2026-11-11T02:30:00Z'));

    expect(momento).toEqual({ fecha: '2026-11-10', minuto: 20 * 60 + 30 });
  });

  it('una cita cabe si empieza al abrir y termina justo al cerrar', () => {
    expect(cabeEnElHorario(9 * 60, 9 * 60, nueveASeis)).toBe(true);
    expect(cabeEnElHorario(8 * 60 + 30, 60, nueveASeis)).toBe(false);
    expect(cabeEnElHorario(17 * 60 + 30, 60, nueveASeis)).toBe(false);
  });

  it('solo acepta horas que coinciden con los turnos', () => {
    expect(respetaElIntervalo(10 * 60, nueveASeis, 30)).toBe(true);
    expect(respetaElIntervalo(10 * 60 + 15, nueveASeis, 30)).toBe(false);
    expect(respetaElIntervalo(10 * 60 + 15, nueveASeis, 15)).toBe(true);
  });

  it('numera los dias de lunes (1) a domingo (7)', () => {
    expect(diaDeLaSemana('2026-11-09')).toBe(1);
    expect(diaDeLaSemana('2026-11-15')).toBe(7);
  });

  it('sabe si una cita ya paso', () => {
    const ahora = { fecha: '2026-11-10', minuto: 10 * 60 };

    expect(yaPaso('2026-11-09', 15 * 60, ahora)).toBe(true);
    expect(yaPaso('2026-11-10', 10 * 60, ahora)).toBe(true);
    expect(yaPaso('2026-11-10', 10 * 60 + 30, ahora)).toBe(false);
    expect(yaPaso('2026-11-11', 9 * 60, ahora)).toBe(false);
  });
});

describe('validarHorarioSemanal', () => {
  const valido: HorarioSemanal = {
    configuracion: { zonaHoraria: 'America/Tegucigalpa', intervaloMin: 30, maxCitasPendientes: 2 },
    dias: [{ diaSemana: 1, ...nueveASeis }],
  };

  it('acepta un horario correcto, incluso sin dias (salon cerrado)', () => {
    expect(() => validarHorarioSemanal(valido)).not.toThrow();
    expect(() => validarHorarioSemanal({ ...valido, dias: [] })).not.toThrow();
  });

  it('junta todos los problemas en un solo error', () => {
    const conErrores: HorarioSemanal = {
      configuracion: { zonaHoraria: 'Marte/Olympus', intervaloMin: 1, maxCitasPendientes: 0 },
      dias: [
        { diaSemana: 1, aperturaMin: 18 * 60, cierreMin: 9 * 60 },
        { diaSemana: 1, ...nueveASeis },
        { diaSemana: 8, ...nueveASeis },
      ],
    };

    try {
      validarHorarioSemanal(conErrores);
      expect.fail('deberia haber fallado');
    } catch (error) {
      expect(error).toBeInstanceOf(DatosInvalidos);
      expect((error as DatosInvalidos).errores).toHaveLength(6);
    }
  });
});

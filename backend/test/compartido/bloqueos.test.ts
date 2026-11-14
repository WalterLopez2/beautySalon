import { describe, expect, it } from 'vitest';
import {
  afectaA,
  cierraElDia,
  franjasBloqueadas,
  validarBloqueo,
  type DatosBloqueo,
} from '../../src/compartido/dominio/bloqueos';
import { DatosInvalidos } from '../../src/compartido/errores';

const vacaciones: DatosBloqueo = { desde: '2026-12-20', hasta: '2026-12-31', inicioMin: null, finMin: null, motivo: null };
const almuerzo: DatosBloqueo = { desde: '2026-11-10', hasta: '2026-11-14', inicioMin: 720, finMin: 780, motivo: null };

describe('bloqueos', () => {
  it('un bloqueo sin horas cierra el dia completo', () => {
    expect(cierraElDia([vacaciones])).toBe(true);
    expect(cierraElDia([almuerzo])).toBe(false);
  });

  it('un bloqueo con horas se convierte en una franja ocupada', () => {
    expect(franjasBloqueadas([almuerzo, vacaciones])).toEqual([{ inicioMin: 720, duracionMin: 60 }]);
  });

  it('afecta a las citas dentro de sus fechas y horas', () => {
    expect(afectaA(vacaciones, { fecha: '2026-12-24', inicio: '10:00', duracionMin: 60 })).toBe(true);
    expect(afectaA(vacaciones, { fecha: '2027-01-02', inicio: '10:00', duracionMin: 60 })).toBe(false);
    expect(afectaA(almuerzo, { fecha: '2026-11-12', inicio: '11:30', duracionMin: 60 })).toBe(true);
    expect(afectaA(almuerzo, { fecha: '2026-11-12', inicio: '11:00', duracionMin: 60 })).toBe(false);
  });

  it('acepta un bloqueo correcto', () => {
    expect(() => validarBloqueo(vacaciones)).not.toThrow();
    expect(() => validarBloqueo(almuerzo)).not.toThrow();
  });

  it.each<[string, Partial<DatosBloqueo>]>([
    ['fechas al reves', { desde: '2026-11-10', hasta: '2026-11-09' }],
    ['mas de 366 dias', { desde: '2026-01-01', hasta: '2027-01-02' }],
    ['solo hora de inicio', { inicioMin: 720, finMin: null }],
    ['inicio despues del fin', { inicioMin: 780, finMin: 720 }],
  ])('rechaza %s', (_caso, cambios) => {
    expect(() => validarBloqueo({ ...almuerzo, ...cambios })).toThrow(DatosInvalidos);
  });
});

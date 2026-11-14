import { describe, it, expect } from 'vitest';
import {
  horaAMinutos,
  citasSeCruzan,
  horarioDisponible,
  totalIngresos,
  type Cita,
} from '../../src/compartido/dominio/citas';

const base: Cita = {
  fecha: '2026-11-10',
  inicio: '09:00',
  duracionMin: 60,
  estado: 'confirmada',
  precio: 300,
};

describe('citas', () => {
  it('convierte hora a minutos', () => {
    expect(horaAMinutos('09:30')).toBe(570);
  });

  it('detecta citas que se cruzan', () => {
    const b: Cita = { ...base, inicio: '09:30', duracionMin: 30 };
    expect(citasSeCruzan(base, b)).toBe(true);
  });

  it('citas seguidas no se cruzan', () => {
    const b: Cita = { ...base, inicio: '10:00', duracionMin: 30 };
    expect(citasSeCruzan(base, b)).toBe(false);
  });

  it('citas en otra fecha no se cruzan', () => {
    const b: Cita = { ...base, fecha: '2026-11-11' };
    expect(citasSeCruzan(base, b)).toBe(false);
  });

  it('una cita cancelada libera el horario', () => {
    const cancelada: Cita = { ...base, estado: 'cancelada' };
    expect(horarioDisponible(base, [cancelada])).toBe(true);
  });

  it('suma solo los ingresos de citas atendidas', () => {
    const citas: Cita[] = [
      { ...base, estado: 'atendida', precio: 300 },
      { ...base, estado: 'pendiente', precio: 500 },
      { ...base, estado: 'atendida', precio: 200 },
    ];
    expect(totalIngresos(citas)).toBe(500);
  });
});

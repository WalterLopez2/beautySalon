import { describe, expect, it, vi } from 'vitest';
import { VencerCitasPendientes } from '../../src/compartido/citas/VencerCitasPendientes';
import { horarioDisponible, sePuedeCambiarDeEstado, type Cita } from '../../src/compartido/dominio/citas';
import type { ConfiguracionDelSalon } from '../../src/compartido/dominio/horario';

const configuracion: ConfiguracionDelSalon = { zonaHoraria: 'America/Tegucigalpa', intervaloMin: 30, maxCitasPendientes: 2 };
const AHORA = new Date('2026-11-22T20:30:00Z'); // 14:30 en Honduras

function crearCaso(guardada: ConfiguracionDelSalon | null) {
  const citas = { vencerPendientes: vi.fn(async () => 2) };
  const horario = { obtenerConfiguracion: async () => guardada };
  return { caso: new VencerCitasPendientes({ citas, horario }, () => AHORA), citas };
}

describe('VencerCitasPendientes', () => {
  it('vence lo pedido hace mas de 24 horas, con el "ahora" del salon', async () => {
    const { caso, citas } = crearCaso(configuracion);

    expect(await caso.ejecutar()).toBe(2);
    expect(citas.vencerPendientes).toHaveBeenCalledWith(new Date('2026-11-21T20:30:00Z'), {
      fecha: '2026-11-22',
      minuto: 14 * 60 + 30,
    });
  });

  it('no hace nada si el salon todavia no se configuro', async () => {
    const { caso, citas } = crearCaso(null);

    expect(await caso.ejecutar()).toBe(0);
    expect(citas.vencerPendientes).not.toHaveBeenCalled();
  });
});

describe('una cita vencida', () => {
  const cita: Cita = { fecha: '2026-12-01', inicio: '10:00', duracionMin: 60, estado: 'confirmada', precio: 1 };

  it('libera su horario', () => {
    expect(horarioDisponible(cita, [{ ...cita, estado: 'vencida' }])).toBe(true);
  });

  it('es final y nadie la pone a mano', () => {
    expect(sePuedeCambiarDeEstado('vencida', 'confirmada')).toBe(false);
    expect(sePuedeCambiarDeEstado('pendiente', 'vencida')).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { ConsultarAgendaDelDia } from '../../src/clienta/ConsultarAgendaDelDia';

// 20:30 UTC = 14:30 en Honduras.
const reloj = () => new Date('2026-11-22T20:30:00Z');

function consultar(fecha: string) {
  const caso = new ConsultarAgendaDelDia(
    {
      horario: {
        obtenerConfiguracion: async () => ({
          zonaHoraria: 'America/Tegucigalpa',
          intervaloMin: 30,
          maxCitasPendientes: 2,
          diasDeAnticipacion: 10,
          horasParaConfirmar: 8,
          citasPorConexionAlDia: 4,
        }),
        horarioDelDia: async () => ({ aperturaMin: 480, cierreMin: 1200 }),
      },
      bloqueos: { delDia: async () => [] },
      citas: { ocupadasEl: async () => [{ inicioMin: 600, duracionMin: 60 }] },
    },
    reloj,
  );
  return caso.ejecutar(fecha);
}

describe('ConsultarAgendaDelDia', () => {
  it('hoy no ofrece horas pasadas, con el reloj del salon', async () => {
    expect((await consultar('2026-11-22')).desdeMin).toBe(14 * 60 + 31);
  });

  it('otro dia se ofrece completo', async () => {
    expect((await consultar('2026-11-23')).desdeMin).toBeNull();
  });

  it.each(['2026-11-21', '2026-12-03'])('el %s esta fuera del plazo: no muestra su agenda', async (fecha) => {
    expect(await consultar(fecha)).toMatchObject({ horario: null, ocupadas: [] });
  });
});

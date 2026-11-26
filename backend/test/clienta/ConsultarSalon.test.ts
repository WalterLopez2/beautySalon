import { describe, expect, it } from 'vitest';
import { ConsultarSalon } from '../../src/clienta/ConsultarSalon';
import type { ConfiguracionDelSalon, HorarioDeUnDia } from '../../src/compartido/dominio/horario';

const configuracion: ConfiguracionDelSalon = {
  zonaHoraria: 'America/Tegucigalpa',
  intervaloMin: 30,
  maxCitasPendientes: 2,
  diasDeAnticipacion: 10,
  horasParaConfirmar: 8,
  citasPorConexionAlDia: 4,
};
const lunes: HorarioDeUnDia = { diaSemana: 1, aperturaMin: 540, cierreMin: 1080 };
// 04:30 UTC del 23 = 22:30 del 22 en Honduras.
const reloj = () => new Date('2026-11-23T04:30:00Z');

function consultar(semanal: { configuracion: ConfiguracionDelSalon; dias: HorarioDeUnDia[] } | null) {
  const caso = new ConsultarSalon(
    { salon: { obtener: async () => null }, horario: { obtenerSemanal: async () => semanal } },
    reloj,
  );
  return caso.ejecutar();
}

describe('ConsultarSalon', () => {
  it('"hoy" y "ahora" son los del salon y el plazo es el de la duena', async () => {
    expect((await consultar({ configuracion, dias: [lunes] })).reservas).toEqual({
      hoy: '2026-11-22',
      ahora: '22:30',
      ultimaFecha: '2026-12-02',
      horasParaConfirmar: 8,
    });
  });

  it('sin configurar no recibe reservas ni muestra horario', async () => {
    const salon = await consultar(null);
    expect(salon.reservas).toBeNull();
    expect(salon.diasDeAtencion).toEqual([]);
  });

  it('sin ningun dia abierto no recibe reservas', async () => {
    expect((await consultar({ configuracion, dias: [] })).reservas).toBeNull();
  });

  it('muestra los dias que abre, de lunes a domingo, con sus horas', async () => {
    const sabado: HorarioDeUnDia = { diaSemana: 6, aperturaMin: 480, cierreMin: 780 };
    expect((await consultar({ configuracion, dias: [sabado, lunes] })).diasDeAtencion).toEqual([
      { diaSemana: 1, apertura: '09:00', cierre: '18:00' },
      { diaSemana: 6, apertura: '08:00', cierre: '13:00' },
    ]);
  });
});

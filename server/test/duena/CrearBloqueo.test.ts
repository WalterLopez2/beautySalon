import { describe, expect, it, vi } from 'vitest';
import type { CitaRegistrada } from '../../src/compartido/citas/repositorioCitas';
import type { DatosBloqueo } from '../../src/compartido/dominio/bloqueos';
import type { EstadoCita } from '../../src/compartido/dominio/citas';
import { DatosInvalidos } from '../../src/compartido/errores';
import { CrearBloqueo } from '../../src/duena/configuracion/CrearBloqueo';

function cita(id: number, inicio: string, estado: EstadoCita): CitaRegistrada {
  return {
    id,
    servicioId: 1,
    servicioNombre: 'Manicura',
    fecha: '2026-11-10',
    inicio,
    duracionMin: 60,
    estado,
    precio: 250,
    clienta: { id: 7, nombre: 'Ana', telefono: '99990000', correo: null },
  };
}

function crearCaso(citasDelRango: CitaRegistrada[]) {
  const bloqueos = { crear: vi.fn(async (datos: DatosBloqueo) => ({ id: 1, ...datos })) };
  const caso = new CrearBloqueo({ bloqueos, citas: { listarEntre: async () => citasDelRango } });
  return { caso, bloqueos };
}

const almuerzo: DatosBloqueo = { desde: '2026-11-10', hasta: '2026-11-10', inicioMin: 720, finMin: 780, motivo: null };

describe('CrearBloqueo', () => {
  it('devuelve solo las citas vigentes que se cruzan con el bloqueo', async () => {
    const { caso } = crearCaso([
      cita(1, '12:30', 'confirmada'), // se cruza: afectada
      cita(2, '12:00', 'cancelada'), // se cruza, pero ya no ocupa lugar
      cita(3, '12:00', 'atendida'), // se cruza, pero ya paso
      cita(4, '10:00', 'pendiente'), // no se cruza
    ]);

    const { citasAfectadas } = await caso.ejecutar(almuerzo);

    expect(citasAfectadas.map((afectada) => afectada.id)).toEqual([1]);
  });

  it('no cancela ninguna cita por su cuenta', async () => {
    const afectada = cita(1, '12:30', 'confirmada');
    const { caso } = crearCaso([afectada]);

    await caso.ejecutar(almuerzo);

    expect(afectada.estado).toBe('confirmada');
  });

  it('no guarda un bloqueo invalido', async () => {
    const { caso, bloqueos } = crearCaso([]);

    await expect(caso.ejecutar({ ...almuerzo, finMin: null })).rejects.toBeInstanceOf(DatosInvalidos);
    expect(bloqueos.crear).not.toHaveBeenCalled();
  });
});

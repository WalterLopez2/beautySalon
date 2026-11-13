import { describe, expect, it, vi } from 'vitest';
import type { CitaRegistrada } from '../../src/compartido/citas/repositorioCitas';
import type { EstadoCita } from '../../src/compartido/dominio/citas';
import { Conflicto, NoEncontrado } from '../../src/compartido/errores';
import { CambiarEstadoDeCita } from '../../src/duena/CambiarEstadoDeCita';

function citaEn(estado: EstadoCita): CitaRegistrada {
  return {
    id: 5,
    servicioId: 1,
    servicioNombre: 'Manicura',
    fecha: '2026-11-10',
    inicio: '10:00',
    duracionMin: 60,
    estado,
    precio: 250,
    clienta: { id: 7, nombre: 'Ana', telefono: '99990000', correo: null },
  };
}

function crearCaso(cita: CitaRegistrada | null, seGuardo = true) {
  const citas = {
    obtenerPorId: vi.fn(async () => cita),
    cambiarEstado: vi.fn(async () => seGuardo),
  };
  return { caso: new CambiarEstadoDeCita(citas), citas };
}

describe('CambiarEstadoDeCita', () => {
  it('confirma una cita pendiente', async () => {
    const { caso, citas } = crearCaso(citaEn('pendiente'));

    const resultado = await caso.ejecutar(5, 'confirmada');

    expect(resultado.estado).toBe('confirmada');
    expect(citas.cambiarEstado).toHaveBeenCalledWith(5, 'pendiente', 'confirmada');
  });

  it('marca como atendida una cita confirmada', async () => {
    const { caso } = crearCaso(citaEn('confirmada'));

    await expect(caso.ejecutar(5, 'atendida')).resolves.toMatchObject({ estado: 'atendida' });
  });

  it.each<[EstadoCita, EstadoCita]>([
    ['pendiente', 'atendida'],
    ['atendida', 'cancelada'],
    ['cancelada', 'confirmada'],
  ])('no permite pasar de %s a %s', async (desde, hacia) => {
    const { caso, citas } = crearCaso(citaEn(desde));

    await expect(caso.ejecutar(5, hacia)).rejects.toBeInstanceOf(Conflicto);
    expect(citas.cambiarEstado).not.toHaveBeenCalled();
  });

  it('avisa si la cita no existe', async () => {
    const { caso } = crearCaso(null);

    await expect(caso.ejecutar(5, 'confirmada')).rejects.toBeInstanceOf(NoEncontrado);
  });

  it('avisa si otra persona cambio la cita al mismo tiempo', async () => {
    const { caso } = crearCaso(citaEn('pendiente'), false);

    await expect(caso.ejecutar(5, 'confirmada')).rejects.toBeInstanceOf(Conflicto);
  });
});

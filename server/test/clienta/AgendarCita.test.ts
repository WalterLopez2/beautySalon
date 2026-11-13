import { describe, expect, it, vi } from 'vitest';
import {
  AgendarCita,
  type RepositoriosDeAgendamiento,
  type SolicitudDeCita,
} from '../../src/clienta/AgendarCita';
import type { CitaRegistrada, FranjaOcupada, NuevaCita } from '../../src/compartido/citas/repositorioCitas';
import { Cliente } from '../../src/compartido/clientes/repositorioClientes';
import { Conflicto, DatosInvalidos, NoEncontrado } from '../../src/compartido/errores';
import type { Servicio } from '../../src/compartido/servicios/repositorioServicios';

const manicura: Servicio = {
  id: 1,
  nombre: 'Manicura',
  descripcion: null,
  precio: 250,
  duracionMin: 60,
  categoria: 'Uñas',
};

const ana = new Cliente(7, 'Ana López', '99990000', null, new Date());

// Antes de las 8:00 del 10 de noviembre: todo el dia sigue disponible.
const relojTemprano = () => ({ fecha: '2026-11-10', minuto: 8 * 60 });

const solicitud: SolicitudDeCita = {
  servicioId: 1,
  fecha: '2026-11-10',
  inicio: '10:00',
  contacto: { nombre: 'Ana López', telefono: '9999-0000', correo: null },
};

function crearEscenario({
  servicio = manicura as Servicio | null,
  ocupadas = [] as FranjaOcupada[],
  clientaExistente = null as Cliente | null,
} = {}) {
  const repositorios = {
    servicios: { obtenerActivoPorId: vi.fn(async () => servicio) },
    clientes: {
      buscarPorTelefono: vi.fn(async () => clientaExistente),
      crear: vi.fn(async () => ana),
    },
    citas: {
      bloquearDia: vi.fn(async () => {}),
      ocupadasEl: vi.fn(async () => ocupadas),
      crear: vi.fn(async (nueva: NuevaCita) => ({ id: 99, ...nueva }) as unknown as CitaRegistrada),
    },
  } satisfies RepositoriosDeAgendamiento;

  const caso = new AgendarCita((trabajo) => trabajo(repositorios), relojTemprano);
  return { caso, repositorios };
}

describe('AgendarCita', () => {
  it('agenda con el precio y la duracion del servicio, y crea a la clienta nueva', async () => {
    const { caso, repositorios } = crearEscenario();

    await caso.ejecutar(solicitud);

    expect(repositorios.clientes.crear).toHaveBeenCalledWith(
      expect.objectContaining({ telefono: '99990000' }),
    );
    expect(repositorios.citas.crear).toHaveBeenCalledWith({
      clienteId: ana.id,
      servicioId: 1,
      fecha: '2026-11-10',
      inicioMin: 600,
      duracionMin: 60,
      precio: 250,
    });
  });

  it('reutiliza a la clienta si ya existe con ese telefono', async () => {
    const { caso, repositorios } = crearEscenario({ clientaExistente: ana });

    await caso.ejecutar(solicitud);

    expect(repositorios.clientes.buscarPorTelefono).toHaveBeenCalledWith('99990000');
    expect(repositorios.clientes.crear).not.toHaveBeenCalled();
  });

  it('bloquea el dia antes de revisar la disponibilidad', async () => {
    const { caso, repositorios } = crearEscenario();

    await caso.ejecutar(solicitud);

    const bloqueo = repositorios.citas.bloquearDia.mock.invocationCallOrder[0];
    const revision = repositorios.citas.ocupadasEl.mock.invocationCallOrder[0];
    expect(bloqueo).toBeLessThan(revision);
  });

  it('rechaza una hora que se cruza con otra cita', async () => {
    const { caso, repositorios } = crearEscenario({ ocupadas: [{ inicioMin: 9 * 60 + 30, duracionMin: 60 }] });

    await expect(caso.ejecutar(solicitud)).rejects.toBeInstanceOf(Conflicto);
    expect(repositorios.citas.crear).not.toHaveBeenCalled();
  });

  it('permite una cita justo cuando termina la anterior', async () => {
    const { caso } = crearEscenario({ ocupadas: [{ inicioMin: 9 * 60, duracionMin: 60 }] });

    await expect(caso.ejecutar(solicitud)).resolves.toBeDefined();
  });

  it('rechaza un servicio que no existe', async () => {
    const { caso } = crearEscenario({ servicio: null });

    await expect(caso.ejecutar(solicitud)).rejects.toBeInstanceOf(NoEncontrado);
  });

  it('rechaza una cita que termina despues del cierre', async () => {
    const { caso } = crearEscenario();

    await expect(caso.ejecutar({ ...solicitud, inicio: '17:30' })).rejects.toBeInstanceOf(DatosInvalidos);
  });

  it('rechaza una hora que ya paso', async () => {
    const { caso, repositorios } = crearEscenario();

    await expect(caso.ejecutar({ ...solicitud, inicio: '07:00' })).rejects.toBeInstanceOf(DatosInvalidos);
    expect(repositorios.servicios.obtenerActivoPorId).not.toHaveBeenCalled();
  });

  it('rechaza un telefono demasiado corto', async () => {
    const { caso } = crearEscenario();
    const conTelefonoCorto = { ...solicitud, contacto: { ...solicitud.contacto, telefono: '123' } };

    await expect(caso.ejecutar(conTelefonoCorto)).rejects.toBeInstanceOf(DatosInvalidos);
  });
});

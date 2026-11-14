import { describe, expect, it, vi } from 'vitest';
import {
  AgendarCita,
  type RepositoriosDeAgendamiento,
  type SolicitudDeCita,
} from '../../src/clienta/AgendarCita';
import type { CitaRegistrada, FranjaOcupada, NuevaCita } from '../../src/compartido/citas/repositorioCitas';
import { Cliente } from '../../src/compartido/clientes/repositorioClientes';
import type { Bloqueo } from '../../src/compartido/dominio/bloqueos';
import type { ConfiguracionDelSalon, HorarioDelDia } from '../../src/compartido/dominio/horario';
import { Conflicto, DatosInvalidos, NoEncontrado } from '../../src/compartido/errores';
import { hashDeCodigo } from '../../src/compartido/seguridad/codigosDeConsulta';
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

// Lo que la duena configuro en el panel para este escenario.
const configuracionDelSalon: ConfiguracionDelSalon = {
  zonaHoraria: 'America/Tegucigalpa',
  intervaloMin: 30,
  maxCitasPendientes: 2,
};
const nueveASeis: HorarioDelDia = { aperturaMin: 9 * 60, cierreMin: 18 * 60 };

// 14:00 UTC = 08:00 del martes 10 de noviembre en Honduras: todo el dia esta por delante.
const relojTemprano = () => new Date('2026-11-10T14:00:00Z');

const CODIGO = 'ABCDE23456';

const solicitud: SolicitudDeCita = {
  servicioId: 1,
  fecha: '2026-11-10',
  inicio: '10:00',
  contacto: { nombre: 'Ana López', telefono: '9999-0000', correo: null },
};

function crearEscenario({
  configuracion = configuracionDelSalon as ConfiguracionDelSalon | null,
  horarioDelDia = nueveASeis as HorarioDelDia | null,
  bloqueos = [] as Bloqueo[],
  servicio = manicura as Servicio | null,
  ocupadas = [] as FranjaOcupada[],
  clientaExistente = null as Cliente | null,
  citasVigentes = 0,
} = {}) {
  const repositorios = {
    horario: {
      obtenerConfiguracion: vi.fn(async () => configuracion),
      horarioDelDia: vi.fn(async () => horarioDelDia),
    },
    bloqueos: { delDia: vi.fn(async () => bloqueos) },
    servicios: { obtenerActivoPorId: vi.fn(async () => servicio) },
    clientes: {
      buscarPorTelefono: vi.fn(async () => clientaExistente),
      crear: vi.fn(async () => ana),
    },
    citas: {
      bloquearDia: vi.fn(async () => {}),
      ocupadasEl: vi.fn(async () => ocupadas),
      crear: vi.fn(async (nueva: NuevaCita) => ({ id: 99, ...nueva }) as unknown as CitaRegistrada),
      contarVigentesPorTelefono: vi.fn(async () => citasVigentes),
    },
  } satisfies RepositoriosDeAgendamiento;

  const caso = new AgendarCita((trabajo) => trabajo(repositorios), {
    reloj: relojTemprano,
    generarCodigo: () => CODIGO,
  });
  return { caso, repositorios };
}

describe('AgendarCita', () => {
  it('agenda con el precio y la duracion del servicio, y crea a la clienta nueva', async () => {
    const { caso, repositorios } = crearEscenario();

    await caso.ejecutar(solicitud);

    expect(repositorios.clientes.crear).toHaveBeenCalledWith(expect.objectContaining({ telefono: '99990000' }));
    expect(repositorios.citas.crear).toHaveBeenCalledWith({
      clienteId: ana.id,
      servicioId: 1,
      fecha: '2026-11-10',
      inicioMin: 600,
      duracionMin: 60,
      precio: 250,
      codigoHash: hashDeCodigo(CODIGO),
    });
  });

  it('entrega el codigo de consulta a la clienta pero guarda solo su hash', async () => {
    const { caso, repositorios } = crearEscenario();

    const { codigoDeConsulta } = await caso.ejecutar(solicitud);

    expect(codigoDeConsulta).toBe(CODIGO);
    expect(JSON.stringify(repositorios.citas.crear.mock.calls)).not.toContain(CODIGO);
  });

  it('no deja pasar del maximo de citas pendientes que configuro la duena', async () => {
    const { caso, repositorios } = crearEscenario({ citasVigentes: 2 });

    await expect(caso.ejecutar(solicitud)).rejects.toThrow('Ya tienes 2 cita(s) por venir');
    expect(repositorios.citas.contarVigentesPorTelefono).toHaveBeenCalledWith('99990000', '2026-11-10');
    expect(repositorios.citas.crear).not.toHaveBeenCalled();
  });

  it('consulta el horario del dia de la semana de la cita (martes = 2)', async () => {
    const { caso, repositorios } = crearEscenario();

    await caso.ejecutar(solicitud);

    expect(repositorios.horario.horarioDelDia).toHaveBeenCalledWith(2);
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

  it('no agenda mientras la duena no configure su horario', async () => {
    const { caso } = crearEscenario({ configuracion: null });

    await expect(caso.ejecutar(solicitud)).rejects.toBeInstanceOf(Conflicto);
  });

  it('rechaza un dia en que el salon no abre', async () => {
    const { caso } = crearEscenario({ horarioDelDia: null });

    await expect(caso.ejecutar(solicitud)).rejects.toThrow('El salon no atiende ese dia.');
  });

  it('rechaza un dia que la duena marco como libre', async () => {
    const vacaciones: Bloqueo = { id: 1, desde: '2026-11-09', hasta: '2026-11-13', inicioMin: null, finMin: null, motivo: 'Vacaciones' };
    const { caso } = crearEscenario({ bloqueos: [vacaciones] });

    await expect(caso.ejecutar(solicitud)).rejects.toThrow('El salon no atiende ese dia.');
  });

  it('rechaza una hora que la duena bloqueo', async () => {
    const tramite: Bloqueo = { id: 2, desde: '2026-11-10', hasta: '2026-11-10', inicioMin: 600, finMin: 660, motivo: null };
    const { caso, repositorios } = crearEscenario({ bloqueos: [tramite] });

    await expect(caso.ejecutar(solicitud)).rejects.toBeInstanceOf(Conflicto);
    expect(repositorios.citas.crear).not.toHaveBeenCalled();
  });

  it('permite agendar fuera de las horas bloqueadas', async () => {
    const almuerzo: Bloqueo = { id: 3, desde: '2026-11-10', hasta: '2026-11-10', inicioMin: 720, finMin: 780, motivo: null };
    const { caso } = crearEscenario({ bloqueos: [almuerzo] });

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

  it('rechaza una hora que no coincide con los turnos', async () => {
    const { caso } = crearEscenario();

    await expect(caso.ejecutar({ ...solicitud, inicio: '10:15' })).rejects.toThrow('turnos');
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

import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'pg';
import {
  RepositorioClientes,
  type BaseDeDatosClientes,
  type DatosCliente,
} from '../src/clientes';

function crearRepositorioConPool(pool: Pool): RepositorioClientes {
  return new RepositorioClientes(pool);
}

const fila = {
  id: 1,
  nombre: 'Ana López',
  telefono: '9999-0000',
  correo: 'ana@example.com',
  creado_en: new Date('2026-11-11T12:00:00.000Z'),
};

function crearBaseDeDatos(
  filas: typeof fila[] = [],
  rowCount: number | null = filas.length,
) {
  const query = vi.fn(async () => ({ rows: filas, rowCount }));
  const baseDeDatos: BaseDeDatosClientes = { query };
  return { baseDeDatos, query };
}

describe('RepositorioClientes', () => {
  it('crea la tabla de clientas', async () => {
    const { baseDeDatos, query } = crearBaseDeDatos();

    await new RepositorioClientes(baseDeDatos).crearTabla();

    expect(query).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS clientes'));
  });

  it('crea una clienta con datos normalizados y parámetros SQL', async () => {
    const { baseDeDatos, query } = crearBaseDeDatos([fila]);
    const datos: DatosCliente = {
      nombre: '  Ana López ',
      telefono: ' 9999-0000 ',
      correo: ' ana@example.com ',
    };

    const cliente = await new RepositorioClientes(baseDeDatos).crear(datos);

    expect(cliente.nombre).toBe('Ana López');
    expect(cliente.creadoEn).toEqual(fila.creado_en);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO clientes'),
      ['Ana López', '9999-0000', 'ana@example.com'],
    );
  });

  it('lista clientas como instancias de Cliente', async () => {
    const { baseDeDatos } = crearBaseDeDatos([fila]);

    const clientes = await new RepositorioClientes(baseDeDatos).listar();

    expect(clientes).toHaveLength(1);
    expect(clientes[0].id).toBe(fila.id);
  });

  it('devuelve null cuando no encuentra una clienta', async () => {
    const { baseDeDatos } = crearBaseDeDatos();

    await expect(new RepositorioClientes(baseDeDatos).obtenerPorId(3)).resolves.toBeNull();
  });

  it('actualiza una clienta y busca por teléfono', async () => {
    const { baseDeDatos, query } = crearBaseDeDatos([fila]);
    const repositorio = new RepositorioClientes(baseDeDatos);

    await expect(
      repositorio.actualizar(1, {
        nombre: fila.nombre,
        telefono: fila.telefono,
        correo: fila.correo,
      }),
    ).resolves.toMatchObject({ id: 1, nombre: fila.nombre });
    await expect(repositorio.buscarPorTelefono('9999-0000')).resolves.toMatchObject({
      telefono: fila.telefono,
    });
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('indica si eliminó una clienta', async () => {
    const { baseDeDatos } = crearBaseDeDatos([], 1);

    await expect(new RepositorioClientes(baseDeDatos).eliminar(1)).resolves.toBe(true);
  });

  it('rechaza datos requeridos inválidos antes de consultar la base', async () => {
    const { baseDeDatos, query } = crearBaseDeDatos();
    const repositorio = new RepositorioClientes(baseDeDatos);

    await expect(repositorio.crear({ nombre: '  ', telefono: '9999' })).rejects.toThrow(
      'El nombre de la clienta es obligatorio.',
    );
    await expect(
      repositorio.crear({ nombre: 'Ana', telefono: '9999', correo: 'correo-inválido' }),
    ).rejects.toThrow('El correo electrónico no es válido.');
    expect(query).not.toHaveBeenCalled();
  });

  it('rechaza identificadores no válidos', async () => {
    const { baseDeDatos, query } = crearBaseDeDatos();

    await expect(new RepositorioClientes(baseDeDatos).obtenerPorId(0)).rejects.toThrow(
      'El identificador de la clienta debe ser un entero positivo.',
    );
    expect(query).not.toHaveBeenCalled();
  });
});
